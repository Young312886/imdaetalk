#!/usr/bin/env python3
"""
save_to_supabase.py – 수집·연산된 공고 데이터를 Supabase DB에 UPSERT (v2)

처리하는 테이블:
  - notices              : 공고 기본 정보 + 시세 시뮬레이션 결과
  - notice_ai_summary    : AI 요약 + 자격 체크리스트
  - notice_attachments   : 첨부파일 목록 (선택)

사용법:
    python scripts/save_to_supabase.py
    python scripts/save_to_supabase.py --input output/notices_final.json --dry-run

환경변수 (.env):
    SUPABASE_URL         – Supabase 프로젝트 URL
    SUPABASE_SERVICE_KEY – service_role 키 (RLS 우회용)
"""

import os
import json
import argparse
from typing import List, Dict, Any, Optional
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

INPUT_PATH = Path(__file__).parent / "output" / "notices_final.json"

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False


# ─── Supabase 클라이언트 ─────────────────────────────────────────────────────────

def get_supabase_client() -> "Client":
    if not SUPABASE_AVAILABLE:
        raise ImportError("supabase 패키지 설치 필요: pip install supabase")
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise ValueError(
            "환경변수 SUPABASE_URL, SUPABASE_SERVICE_KEY 를 .env 에 설정하세요.\n"
            "service_role 키는 Supabase 대시보드 → Settings → API 에서 확인하세요."
        )
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


# ─── notices 테이블 매핑 ─────────────────────────────────────────────────────────

def notice_to_db_row(notice: Dict[str, Any]) -> Dict[str, Any]:
    """공고 데이터를 notices 테이블 스키마에 맞게 변환 (v2)."""

    def _clean_date(val) -> Optional[str]:
        """None 또는 빈 문자열을 None으로 통일."""
        return val if val and str(val).strip() else None

    return {
        "id":                    notice["id"],
        "title":                 notice.get("title", ""),
        "region":                notice.get("region", ""),
        "district":              notice.get("district", ""),
        "type":                  notice.get("type", "임대"),

        # 공급 정보 (② API)
        "area_sqm":              notice.get("area_sqm", 0),
        "supply_households":     notice.get("supply_households", 0),
        "deposit":               notice.get("deposit", 0),
        "rent_fee":              notice.get("rent_fee", 0),
        "standard_deposit":      notice.get("standard_deposit") or notice.get("deposit", 0),

        # 시세/시뮬레이션 결과
        "current_market_price":  notice.get("current_market_price", 0),
        "current_jeonse_price":  notice.get("current_jeonse_price"),
        "future_market_price":   notice.get("future_market_price", 0),
        "expected_profit_10y":   notice.get("expected_profit_10y", 0),
        "conversion_price":      notice.get("conversion_price", 0),
        "profit_rate_pct":       notice.get("profit_rate_pct", 0),
        "price_source":          notice.get("price_source", "fallback"),

        # 일정 (③ API + Gemini 보완)
        "source_url":            notice.get("source_url", ""),
        "published_at":          _clean_date(notice.get("published_at")),
        "subscription_open":     _clean_date(notice.get("subscription_open")),
        "subscription_close":    _clean_date(notice.get("subscription_close")),
        "winner_announce":       _clean_date(notice.get("winner_announce")),
        "contract_date":         _clean_date(notice.get("contract_date")),
        "move_in_date":          _clean_date(notice.get("move_in_date")),

        # 위경도
        "lat":                   notice.get("lat"),
        "lng":                   notice.get("lng"),
    }


# ─── notice_ai_summary 테이블 매핑 ───────────────────────────────────────────────

def ai_summary_to_db_row(notice: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """AI 요약 + Gemini 추출 데이터를 notice_ai_summary 테이블로 변환."""
    ai_summary = notice.get("ai_summary", [])
    gemini_extracted = notice.get("gemini_extracted") or {}
    checklist = notice.get("eligibility_checklist", [])

    if not ai_summary and not gemini_extracted:
        return None

    return {
        "notice_id":              notice["id"],
        "summary_line1":          ai_summary[0] if len(ai_summary) > 0 else "",
        "summary_line2":          ai_summary[1] if len(ai_summary) > 1 else "",
        "summary_line3":          ai_summary[2] if len(ai_summary) > 2 else "",
        "eligibility_checklist":  checklist,
        # Gemini 추출 구조화 데이터
        "income_limit_pct":       gemini_extracted.get("income_limit_pct"),
        "asset_limit_won":        gemini_extracted.get("asset_limit_won"),
        "priority_groups":        gemini_extracted.get("priority_groups", []),
        "special_conditions":     gemini_extracted.get("special_conditions", []),
    }


# ─── notice_attachments 테이블 매핑 ──────────────────────────────────────────────

def attachment_to_db_rows(notice: Dict[str, Any]) -> List[Dict[str, Any]]:
    """첨부파일 목록을 notice_attachments 테이블 행으로 변환."""
    rows = []
    for att in notice.get("attachments", []):
        if not att.get("url"):
            continue
        rows.append({
            "notice_id":  notice["id"],
            "file_name":  att.get("name", ""),
            "file_url":   att["url"],
            "file_ext":   att.get("ext", ""),
        })
    return rows


# ─── UPSERT 배치 처리 ────────────────────────────────────────────────────────────

def upsert_batch(
    supabase: "Client",
    table: str,
    rows: List[Dict[str, Any]],
    on_conflict: str = "id",
    dry_run: bool = False,
) -> int:
    """최대 500건씩 배치 UPSERT. dry_run 시 스킵."""
    BATCH_SIZE = 500
    total = 0
    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i: i + BATCH_SIZE]
        if dry_run:
            print(f"  [DRY-RUN] {table} {len(batch)}건 건너뜀")
        else:
            supabase.table(table).upsert(batch, on_conflict=on_conflict).execute()
            print(f"  → {table} {len(batch)}건 UPSERT 완료")
        total += len(batch)
    return total


# ─── 메인 ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Supabase 데이터 저장 v2")
    parser.add_argument("--input", default=str(INPUT_PATH), help="입력 JSON 파일")
    parser.add_argument("--dry-run", action="store_true", help="실제 저장 없이 검증만")
    parser.add_argument("--save-attachments", action="store_true", help="첨부파일 메타데이터도 저장")
    args = parser.parse_args()

    # 입력 파일 폴백
    input_path = Path(args.input)
    if not input_path.exists():
        for fallback in [
            Path(__file__).parent / "output" / "notices_final.json",
            Path(__file__).parent / "output" / "notices_extracted.json",
            Path(__file__).parent / "output" / "notices_with_ai.json",
            Path(__file__).parent / "output" / "notices_raw.json",
        ]:
            if fallback.exists():
                print(f"[경고] {input_path.name} 없음 → {fallback.name} 사용")
                input_path = fallback
                break
        else:
            print(f"[오류] 입력 파일 없음: {input_path}")
            return

    with open(input_path, encoding="utf-8") as f:
        notices = json.load(f)

    print(f"[DB] {len(notices)}건 처리 {'(DRY-RUN)' if args.dry_run else ''}\n")

    # 스키마 변환
    notice_rows = [notice_to_db_row(n) for n in notices]
    ai_rows = [r for n in notices if (r := ai_summary_to_db_row(n)) is not None]
    att_rows = [row for n in notices for row in attachment_to_db_rows(n)]

    print(f"  notices 행:            {len(notice_rows)}건")
    print(f"  notice_ai_summary 행:  {len(ai_rows)}건")
    print(f"  notice_attachments 행: {len(att_rows)}건\n")

    if args.dry_run:
        print("[DRY-RUN] 변환된 데이터 샘플 (첫 번째 notices 행):")
        if notice_rows:
            print(json.dumps(notice_rows[0], ensure_ascii=False, indent=2, default=str))
        return

    # Supabase 저장
    try:
        supabase = get_supabase_client()
    except (ImportError, ValueError) as e:
        print(f"[오류] {e}")
        return

    n1 = upsert_batch(supabase, "notices", notice_rows, on_conflict="id")
    n2 = upsert_batch(supabase, "notice_ai_summary", ai_rows, on_conflict="notice_id")
    n3 = 0
    if args.save_attachments and att_rows:
        n3 = upsert_batch(supabase, "notice_attachments", att_rows, on_conflict="file_url")

    print(f"\n✅ 저장 완료 — notices: {n1}건 / ai_summary: {n2}건 / attachments: {n3}건")


if __name__ == "__main__":
    main()
