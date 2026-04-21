#!/usr/bin/env python3
"""
extract_unstructured.py – 공고문 비정형 데이터 추출 자동화 파이프라인

워크플로우:
  1. notices_raw.json 의 각 공고에서 attachments[].url 수집
  2. 파일 다운로드 → 확장자 분기 처리
       PDF  → Gemini File API 직접 업로드
       HWP  → pyhwp 로 텍스트 추출 후 Gemini에 전달
  3. Gemini API 호출 → 지정된 JSON 스키마로 정형화
  4. notices_raw.json 에 추출 결과 병합 → notices_extracted.json 저장

사용법:
    python scripts/extract_unstructured.py
    python scripts/extract_unstructured.py --input output/notices_raw.json --limit 5

환경변수 (.env):
    GEMINI_API_KEY  – Google Gemini API 키
"""

import os
import json
import time
import tempfile
import argparse
import requests
from pathlib import Path
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

# ─── 설정 ──────────────────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = "gemini-2.0-flash"  # Flash: 빠르고 비용 효율적

INPUT_PATH = Path(__file__).parent / "output" / "notices_raw.json"
OUTPUT_PATH = Path(__file__).parent / "output" / "notices_extracted.json"
DOWNLOAD_DIR = Path(__file__).parent / "output" / "attachments"

REQUEST_DELAY = 1.0  # Gemini API 과부하 방지

# Gemini의 응답에서 추출할 데이터 스키마 (시스템 프롬프트에 주입)
EXTRACTION_SCHEMA = {
    "notice_name": "string | 공고문 제목",
    "housing_type": "string | 주택 유형 (행복주택, 국민임대, 영구임대 등)",
    "application_start_date": "string | 청약 접수 시작일 (YYYY-MM-DD)",
    "application_end_date": "string | 청약 접수 마감일 (YYYY-MM-DD)",
    "winner_announce_date": "string | 당첨자 발표일 (YYYY-MM-DD)",
    "contract_date": "string | 계약일 (YYYY-MM-DD)",
    "move_in_date": "string | 입주 예정일 (YYYY-MM-DD 또는 YYYY년 MM월)",
    "supply_area_sqm": "number | 전용면적 (㎡)",
    "supply_households": "number | 공급 세대수",
    "deposit": "number | 임대보증금 (만원 단위. 단위 없이 숫자만)",
    "monthly_rent": "number | 월임대료 (만원 단위. 단위 없이 숫자만)",
    "income_limit_pct": "number | 소득 기준 (도시근로자 월평균 소득 대비 %, 예: 100)",
    "asset_limit_won": "number | 자산 기준 (억원. 없으면 null)",
    "priority_groups": "list[string] | 우선순위 대상 그룹 (예: 신혼부부, 1인청년 등)",
    "special_conditions": "list[string] | 특이사항 또는 지원 자격 주요 조건",
    "region": "string | 공급 위치 (시/도)",
    "district": "string | 공급 위치 (시/군/구)",
}


# ─── 의존성 체크 ────────────────────────────────────────────────────────────────

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

try:
    import pyhwp  # noqa: F401
    PYHWP_AVAILABLE = True
except ImportError:
    PYHWP_AVAILABLE = False


# ─── 파일 다운로드 ──────────────────────────────────────────────────────────────

def download_file(url: str, dest_dir: Path) -> Optional[Path]:
    """URL에서 파일을 다운로드하고 로컬 경로를 반환."""
    try:
        headers = {"User-Agent": "Mozilla/5.0 (compatible; ImdaeTalk/1.0)"}
        resp = requests.get(url, headers=headers, timeout=30, stream=True)
        resp.raise_for_status()

        # 파일명 추출 (헤더 또는 URL 기반)
        cd = resp.headers.get("Content-Disposition", "")
        if "filename=" in cd:
            fname = cd.split("filename=")[-1].strip().strip('"').strip("'")
        else:
            fname = Path(url.split("?")[0]).name or "notice_file"

        dest_dir.mkdir(parents=True, exist_ok=True)
        dest_path = dest_dir / fname

        with open(dest_path, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)

        return dest_path
    except Exception as e:
        print(f"    [다운로드 실패] {url}: {e}")
        return None


# ─── HWP 텍스트 추출 ────────────────────────────────────────────────────────────

def extract_hwp_text(hwp_path: Path) -> Optional[str]:
    """pyhwp를 사용해 HWP 파일에서 텍스트를 추출."""
    if not PYHWP_AVAILABLE:
        print("    [경고] pyhwp 미설치. pip install pyhwp 로 설치하세요.")
        return None
    try:
        import subprocess
        result = subprocess.run(
            ["python", "-m", "hwp5", "txt", str(hwp_path)],
            capture_output=True, text=True, timeout=30, encoding="utf-8"
        )
        if result.returncode == 0:
            return result.stdout
        print(f"    [HWP 파싱 오류] {result.stderr[:200]}")
        return None
    except Exception as e:
        print(f"    [HWP 텍스트 추출 실패] {e}")
        return None


# ─── Gemini 호출 ────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = f"""당신은 대한민국 공공주택 공고문 분석 전문가입니다.
첨부된 공고문(PDF 또는 텍스트)을 분석하여, 아래 JSON 스키마의 각 항목에 해당하는 값을 정확히 추출하세요.

[JSON 스키마]
{json.dumps(EXTRACTION_SCHEMA, ensure_ascii=False, indent=2)}

[출력 규칙]
- 반드시 순수 JSON만 출력하세요. 마크다운 코드블록(```)을 사용하지 마세요.
- 값을 찾을 수 없으면 null을 사용하세요.
- 날짜는 YYYY-MM-DD 형식으로 통일하세요.
- 금액은 단위 없이 숫자만 입력하세요 (만원 단위).
"""


def call_gemini_with_pdf(pdf_path: Path) -> Optional[Dict]:
    """PDF를 Gemini File API로 업로드하여 구조화된 데이터 추출."""
    if not GEMINI_AVAILABLE:
        return None
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(
            model_name=GEMINI_MODEL,
            system_instruction=SYSTEM_PROMPT,
        )

        print(f"    [Gemini] PDF 업로드 중: {pdf_path.name}")
        uploaded = genai.upload_file(str(pdf_path), mime_type="application/pdf")

        response = model.generate_content(
            [uploaded, "위 공고문에서 JSON 스키마에 맞게 정보를 추출해주세요."],
            generation_config={"temperature": 0.1},
        )
        return _parse_gemini_response(response.text)
    except Exception as e:
        print(f"    [Gemini PDF 오류] {e}")
        return None


def call_gemini_with_text(text: str) -> Optional[Dict]:
    """텍스트(HWP 추출 결과)를 Gemini에 전달하여 구조화된 데이터 추출."""
    if not GEMINI_AVAILABLE:
        return None
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(
            model_name=GEMINI_MODEL,
            system_instruction=SYSTEM_PROMPT,
        )

        prompt = f"아래 공고문 텍스트에서 JSON 스키마에 맞게 정보를 추출해주세요.\n\n---\n{text[:30000]}"
        response = model.generate_content(
            prompt,
            generation_config={"temperature": 0.1},
        )
        return _parse_gemini_response(response.text)
    except Exception as e:
        print(f"    [Gemini 텍스트 오류] {e}")
        return None


def _parse_gemini_response(text: str) -> Optional[Dict]:
    """Gemini 응답에서 JSON 파싱."""
    raw = text.strip()
    # 코드블록 제거 (모델이 규칙을 어길 경우 대비)
    if "```" in raw:
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.split("```")[0]
    try:
        return json.loads(raw.strip())
    except json.JSONDecodeError as e:
        print(f"    [JSON 파싱 실패] {e}")
        return None


# ─── 공고 1건 처리 ──────────────────────────────────────────────────────────────

def process_notice(notice: Dict, dest_dir: Path) -> Dict:
    """공고 1건의 첨부파일을 처리하여 Gemini 추출 결과를 병합."""
    attachments: List[Dict] = notice.get("attachments", [])
    extracted: Optional[Dict] = None

    if not attachments:
        print("    첨부파일 없음 – 스킵")
        notice["gemini_extracted"] = None
        return notice

    # PDF 우선 처리, 없으면 HWP 시도
    pdf_attachments = [a for a in attachments if a.get("ext") in (".pdf", ".PDF")]
    hwp_attachments = [a for a in attachments if a.get("ext") in (".hwp", ".HWP", ".hwpx")]
    targets = pdf_attachments or hwp_attachments

    for att in targets[:1]:  # 첫 번째 문서만 처리 (비용/시간 절약)
        url = att.get("url", "")
        if not url:
            continue

        print(f"    다운로드: {att.get('name', url)[:50]}")
        local_path = download_file(url, dest_dir)
        if not local_path:
            continue

        ext = local_path.suffix.lower()
        if ext == ".pdf":
            print("    [PDF] Gemini File API 호출")
            extracted = call_gemini_with_pdf(local_path)
        elif ext in (".hwp", ".hwpx"):
            print("    [HWP] 텍스트 추출 후 Gemini 호출")
            text = extract_hwp_text(local_path)
            if text:
                extracted = call_gemini_with_text(text)
            else:
                print("    HWP 텍스트 추출 실패 – 스킵")

        if extracted:
            break  # 첫 성공 시 종료

    notice["gemini_extracted"] = extracted

    # 추출 성공 시 핵심 필드 자동 보정 (API 데이터에 없으면 Gemini 결과로 보완)
    if extracted:
        def _merge(key_notice: str, key_gemini: str):
            if not notice.get(key_notice) and extracted.get(key_gemini):
                notice[key_notice] = extracted[key_gemini]

        _merge("subscription_open", "application_start_date")
        _merge("subscription_close", "application_end_date")
        _merge("winner_announce", "winner_announce_date")
        _merge("contract_date", "contract_date")
        _merge("move_in_date", "move_in_date")
        if not notice.get("deposit") and extracted.get("deposit"):
            notice["deposit"] = int(extracted["deposit"]) * 10000
        if not notice.get("rent_fee") and extracted.get("monthly_rent"):
            notice["rent_fee"] = int(extracted["monthly_rent"]) * 10000
        if not notice.get("area_sqm") and extracted.get("supply_area_sqm"):
            notice["area_sqm"] = float(extracted["supply_area_sqm"])

    return notice


# ─── 메인 ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="공고문 비정형 데이터 추출기 (Gemini)")
    parser.add_argument("--input", default=str(INPUT_PATH), help="입력 JSON")
    parser.add_argument("--output", default=str(OUTPUT_PATH), help="출력 JSON")
    parser.add_argument("--limit", type=int, default=0, help="처리 공고 수 제한 (0=전체)")
    parser.add_argument("--no-gemini", action="store_true", help="Gemini 호출 없이 파일만 다운로드")
    args = parser.parse_args()

    if not GEMINI_API_KEY and not args.no_gemini:
        print("[오류] .env 에 GEMINI_API_KEY 를 설정하세요.")
        return

    if not GEMINI_AVAILABLE and not args.no_gemini:
        print("[오류] google-generativeai 패키지 미설치.")
        print("       pip install google-generativeai  로 설치하세요.")
        return

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"[오류] 입력 파일 없음: {input_path}")
        print("       fetch_lh.py 를 먼저 실행하세요.")
        return

    with open(input_path, encoding="utf-8") as f:
        notices = json.load(f)

    total = len(notices)
    targets = notices[:args.limit] if args.limit else notices
    print(f"\n[비정형 추출] 총 {total}건 중 {len(targets)}건 처리 시작\n")

    dest_dir = DOWNLOAD_DIR
    results = []

    for i, notice in enumerate(targets, 1):
        print(f"[{i}/{len(targets)}] {notice.get('title', '')[:40]}")
        updated = process_notice(notice, dest_dir)
        results.append(updated)
        if i < len(targets):
            time.sleep(REQUEST_DELAY)

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    success = sum(1 for n in results if n.get("gemini_extracted"))
    print(f"\n✅ 완료 → {out_path}")
    print(f"   Gemini 추출 성공: {success}/{len(results)}건")


if __name__ == "__main__":
    main()
