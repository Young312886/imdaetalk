#!/usr/bin/env python3
"""
save_to_supabase.py – 수집·연산된 공고 데이터를 Supabase DB에 UPSERT

사용법:
    python scripts/save_to_supabase.py
    python scripts/save_to_supabase.py --input output/notices_final.json --dry-run

환경변수 (.env):
    SUPABASE_URL       – Supabase 프로젝트 URL
    SUPABASE_SERVICE_KEY – service_role 키 (RLS 우회용, 서버 전용)
"""

import os
import json
import argparse
from typing import List, Dict, Any, Optional, Sequence
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL        = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

INPUT_PATH = Path(__file__).parent / "output" / "notices_final.json"

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False


def get_supabase_client() -> "Client":
    if not SUPABASE_AVAILABLE:
        raise ImportError("supabase 패키지 설치 필요: pip install supabase")
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise ValueError(
            "환경변수 SUPABASE_URL, SUPABASE_SERVICE_KEY 를 .env 에 설정하세요.\n"
            "service_role 키는 Supabase 대시보드 → Settings → API 에서 확인하세요."
        )
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def notice_to_db_row(notice: Dict[str, Any]) -> Dict[str, Any]:
    """공고 데이터를 notices 테이블 스키마에 맞게 변환"""
    return {
        "id":                    notice["id"],
        "title":                 notice["title"],
        "region":                notice.get("region", ""),
        "district":              notice.get("district", ""),
        "type":                  notice.get("type", "임대"),
        "deposit":               notice.get("deposit", 0),
        "rent_fee":              notice.get("rent_fee", 0),
        "area_sqm":              notice.get("area_sqm", 0),
        "current_market_price":  notice.get("current_market_price", 0),
        "expected_profit_10y":   notice.get("expected_profit_10y", 0),
        "conversion_price":      notice.get("conversion_price", 0),
        "source_url":            notice.get("source_url", ""),
        "published_at":          notice.get("published_at", ""),
        "subscription_open":     notice.get("subscription_open") or None,
        "subscription_close":    notice.get("subscription_close") or None,
        "winner_announce":       notice.get("winner_announce") or None,
        "contract_date":         notice.get("contract_date") or None,
        # "lat":                   notice.get("lat"),
        # "lng":                   notice.get("lng"),
    }


def ai_summary_to_db_row(notice: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """AI 요약 데이터를 notice_ai_summary 테이블 스키마에 맞게 변환"""
    ai_summary = notice.get("ai_summary", [])
    if not ai_summary or len(ai_summary) < 3:
        return None

    checklist = notice.get("eligibility_checklist", [])

    return {
        "notice_id":            notice["id"],
        "summary_line1":        ai_summary[0] if len(ai_summary) > 0 else "",
        "summary_line2":        ai_summary[1] if len(ai_summary) > 1 else "",
        "summary_line3":        ai_summary[2] if len(ai_summary) > 2 else "",
        "eligibility_checklist": checklist,
    }


def upsert_batch(supabase: "Client", table: str, rows: List[Dict[str, Any]], on_conflict: str = "id", dry_run: bool = False) -> int:
    """배치 UPSERT 처리 (최대 500건씩 분할)"""
    BATCH_SIZE = 500
    total = 0

    for i in range(0, len(rows), BATCH_SIZE):
        # Type checker safe slice for List
        batch = [rows[j] for j in range(i, min(i + BATCH_SIZE, len(rows)))]
        if dry_run:
            print(f"  [DRY-RUN] {table} {len(batch)}건 건너뜀")
            total += len(batch)
        else:
            resp = supabase.table(table).upsert(batch, on_conflict=on_conflict).execute()
            total += len(batch)
            print(f"  → {table} {len(batch)}건 UPSERT 완료")

    return total


def main():
    parser = argparse.ArgumentParser(description="Supabase 데이터 저장")
    parser.add_argument("--input",   default=str(INPUT_PATH), help="입력 JSON 파일")
    parser.add_argument("--dry-run", action="store_true",     help="실제 저장 없이 검증만")
    args = parser.parse_args()

    # 입력 파일 로드
    input_path = Path(args.input)
    if not input_path.exists():
        print(f"[오류] 입력 파일 없음: {input_path}")
        print("       simulate_profit.py 를 먼저 실행하세요.")
        return

    with open(input_path, encoding="utf-8") as f:
        notices = json.load(f)

    print(f"[DB] {len(notices)}건 처리 시작 {'(DRY-RUN)' if args.dry_run else ''}\n")

    # 스키마 변환
    notice_rows  = [notice_to_db_row(n) for n in notices]
    
    ai_rows = []
    for n in notices:
        ai_row = ai_summary_to_db_row(n)
        if ai_row is not None:
            ai_rows.append(ai_row)

    print(f"  notices 행:          {len(notice_rows)}건")
    print(f"  notice_ai_summary 행: {len(ai_rows)}건\n")

    if args.dry_run:
        print("[DRY-RUN 모드] 실제 DB 저장을 건너뜁니다.")
        print("변환된 데이터 샘플 (첫 번째):")
        if notice_rows:
            print(json.dumps(notice_rows[0], ensure_ascii=False, indent=2))
        return

    # Supabase 클라이언트 생성
    try:
        supabase = get_supabase_client()
    except (ImportError, ValueError) as e:
        print(f"[오류] {e}")
        return

    # UPSERT
    n1 = upsert_batch(supabase, "notices", notice_rows, on_conflict="id")
    n2 = upsert_batch(
        supabase, "notice_ai_summary", ai_rows, on_conflict="notice_id"
    )

    print(f"\n✅ 저장 완료 — notices: {n1}건, notice_ai_summary: {n2}건")


if __name__ == "__main__":
    main()
