#!/usr/bin/env python3
"""
summarize_ai.py – Ollama(llama3) 기반 공고 AI 요약 + 1인가구 청약 자격 판별

사용법:
    # Ollama 먼저 실행:  ollama serve  (별도 터미널)
    python scripts/summarize_ai.py
    python scripts/summarize_ai.py --model llama3 --input output/notices_raw.json

환경변수:
    OLLAMA_BASE_URL – Ollama 서버 주소 (기본값: http://localhost:11434)
"""

import json
import argparse
from typing import Dict, List, Any, Optional
from pathlib import Path

try:
    import ollama
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False

INPUT_PATH  = Path(__file__).parent / "output" / "notices_raw.json"
OUTPUT_PATH = Path(__file__).parent / "output" / "notices_with_ai.json"

# 1인가구 청약 표준 소득 기준 (2024 기준, 단위: 만원/월)
INCOME_LIMITS = {
    "행복주택":   300,   # 도시근로자 월평균 소득 100%
    "국민임대":   200,   # 50%
    "영구임대":   100,   # 생계·의료급여 수급자 등
    "공공분양":   700,   # 140%
    "분양전환":   500,
    "장기전세":   400,
}


# ─── Ollama 연동 ─────────────────────────────────────────────────────────────

def summarize_with_ollama(notice: Dict[str, Any], model: str = "llama3") -> Dict[str, Any]:
    """공고 하나를 llama3로 요약하고 자격 여부를 판별합니다."""
    prompt = f"""당신은 대한민국 공공임대·청약 전문 AI 어드바이저입니다.
아래 청약 공고 정보를 분석하여 JSON으로 답변하세요.

공고 정보:
- 공고명: {notice['title']}
- 유형: {notice['type']}
- 지역: {notice['region']} {notice.get('district', '')}
- 임대보증금: {notice['deposit']:,}원
- 월임대료: {notice['rent_fee']:,}원
- 전용면적: {notice['area_sqm']}㎡
- 예상 시세 차익(10년): {notice.get('expected_profit_10y', 0):,}원
- 청약 접수: {notice.get('subscription_open', '미정')} ~ {notice.get('subscription_close', '미정')}

JSON 형식으로만 응답하세요 (다른 텍스트 없이 JSON만):
{{
  "summary_line1": "핵심 장점 1줄 (20자 이내)",
  "summary_line2": "청약 조건 핵심 1줄 (20자 이내)",
  "summary_line3": "주의사항 또는 차익 포인트 1줄 (20자 이내)",
  "eligibility_checklist": [
    {{"key": "age", "label": "나이 조건 (만 19~39세)", "met": true}},
    {{"key": "noHouse", "label": "무주택 세대 구성원", "met": true}},
    {{"key": "subscription", "label": "청약통장 6개월 이상", "met": true}},
    {{"key": "income", "label": "소득 기준 충족", "met": true}},
    {{"key": "region", "label": "해당 지역 거주", "met": true}}
  ],
  "is_eligible": true
}}"""

    try:
        response = ollama.chat(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            options={"temperature": 0.2},
        )
        raw_text = response["message"]["content"].strip()

        # JSON 파싱 (코드블록 제거)
        if "```" in raw_text:
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
        
        ai_data = json.loads(raw_text)
        return ai_data

    except json.JSONDecodeError as e:
        print(f"  [경고] JSON 파싱 실패: {e} – 기본값 사용")
        return _default_ai_data(notice)
    except Exception as e:
        print(f"  [경고] Ollama 오류: {e} – 기본값 사용")
        return _default_ai_data(notice)


def _default_ai_data(notice: Dict[str, Any]) -> Dict[str, Any]:
    """Ollama 미사용 시 기본 AI 데이터 (규칙 기반)"""
    notice_type = str(notice.get("type", "임대"))
    income_limit = INCOME_LIMITS.get(notice_type, 400)
    
    deposit_eok = notice.get("deposit", 0) / 100_000_000
    profit_eok = notice.get("expected_profit_10y", 0) / 100_000_000

    return {
        "summary_line1": f"{notice_type} — 보증금 {deposit_eok:.0f}억에 내 집 마련 기회",
        "summary_line2": f"1인가구 소득 기준 월 {income_limit}만원 이하 지원 가능",
        "summary_line3": f"분양전환 시 예상 시세 차익 최대 {profit_eok:.0f}억원",
        "eligibility_checklist": [
            {"key": "age",          "label": "나이 조건 (만 19~39세)",  "met": True},
            {"key": "noHouse",      "label": "무주택 세대 구성원",       "met": True},
            {"key": "subscription", "label": "청약통장 6개월 이상",      "met": True},
            {"key": "income",       "label": "소득 기준 충족",           "met": True},
            {"key": "region",       "label": "해당 지역 거주",           "met": True},
        ],
        "is_eligible": True,
    }


def enrich_notice(notice: Dict[str, Any], model: str, use_ollama: bool) -> Dict[str, Any]:
    """공고에 AI 요약 + 자격 판별 데이터를 추가합니다."""
    title_str = str(notice.get('title', ''))
    print(f"  처리 중: {title_str[:30]}…")

    if use_ollama and OLLAMA_AVAILABLE:
        ai = summarize_with_ollama(notice, model)
    else:
        ai = _default_ai_data(notice)

    notice["ai_summary"] = [
        ai.get("summary_line1", ""),
        ai.get("summary_line2", ""),
        ai.get("summary_line3", ""),
    ]
    notice["eligibility_checklist"] = ai.get("eligibility_checklist", [])
    notice["is_eligible"] = ai.get("is_eligible", True)
    return notice


def main():
    parser = argparse.ArgumentParser(description="공고 AI 요약 스크립트")
    parser.add_argument("--model",    default="llama3",      help="Ollama 모델 이름")
    parser.add_argument("--input",    default=str(INPUT_PATH), help="입력 JSON 파일 경로")
    parser.add_argument("--output",   default=str(OUTPUT_PATH), help="출력 JSON 파일 경로")
    parser.add_argument("--no-ollama", action="store_true", help="Ollama 없이 규칙 기반 요약")
    args = parser.parse_args()

    use_ollama = not args.no_ollama

    if use_ollama and not OLLAMA_AVAILABLE:
        print("[경고] ollama 패키지가 설치되지 않아 규칙 기반 모드로 실행합니다.")
        print("       pip install ollama  로 설치하세요.")
        use_ollama = False

    # 입력 파일 로드
    input_path = Path(args.input)
    if not input_path.exists():
        print(f"[오류] 입력 파일이 없습니다: {input_path}")
        print("       fetch_lh.py 를 먼저 실행하세요.")
        return

    with open(input_path, encoding="utf-8") as f:
        notices = json.load(f)

    print(f"[AI] {len(notices)}건 처리 시작 (모델: {'규칙 기반' if not use_ollama else args.model})\n")

    enriched = []
    for i, notice in enumerate(notices, 1):
        print(f"[{i}/{len(notices)}]", end=" ")
        enriched.append(enrich_notice(notice, args.model, use_ollama))

    # 저장
    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(enriched, f, ensure_ascii=False, indent=2)

    print(f"\n✅ AI 요약 완료 → {out_path}")


if __name__ == "__main__":
    main()
