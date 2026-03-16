#!/usr/bin/env python3
"""
simulate_profit.py – 시세 차익 시뮬레이션 계산기

공공임대 분양전환 시 10년 뒤 예상 순수익을 계산합니다.

계산 공식:
  • 주변 시세 상승률: 연평균 5% 복리 (10년 → 약 62.9% 상승)
  • 분양전환가: 현재 시세의 65~75% (유형별 차등)
  • 예상 순수익 = 10년 후 시세 - 분양전환가

사용법:
    python scripts/simulate_profit.py
    python scripts/simulate_profit.py --input output/notices_with_ai.json

환경변수:
    없음 (독립 실행 가능)
"""

import json
import argparse
from pathlib import Path

INPUT_PATH  = Path(__file__).parent / "output" / "notices_with_ai.json"
OUTPUT_PATH = Path(__file__).parent / "output" / "notices_final.json"

# ─── 계산 상수 ────────────────────────────────────────────────────────────────

# 연평균 주변 시세 상승률 (5% 복리, 10년)
ANNUAL_APPRECIATION_RATE = 0.05
YEARS = 10

# 10년 복리 계수
APPRECIATION_FACTOR = (1 + ANNUAL_APPRECIATION_RATE) ** YEARS  # ≈ 1.6289

# 유형별 분양전환가 할인율 (시세 대비)
CONVERSION_DISCOUNT_BY_TYPE = {
    "행복주택":  0.70,  # 시세의 70% 분양전환
    "국민임대":  0.65,  # 65%
    "영구임대":  0.60,  # 60%
    "장기전세":  0.80,  # 80%
    "공공분양":  0.85,  # 85%
    "분양전환":  0.72,  # 72%
    "default":   0.70,
}


# ─── 시세 추정 ────────────────────────────────────────────────────────────────

# 지역별 ㎡당 기준 시세 (단위: 만원, 2024 기준 중위값)
MARKET_PRICE_PER_SQM = {
    "서울": 1500,   # 약 1,500만원/㎡
    "경기": 700,
    "부산": 600,
    "인천": 650,
    "대구": 500,
    "광주": 450,
    "대전": 500,
    "세종": 600,
    "default": 500,
}


def estimate_market_price(notice: dict) -> int:
    """면적 × 지역별 시세로 현재 주변 시세를 추정합니다."""
    area = notice.get("area_sqm", 0) or 0
    region = notice.get("region", "")
    price_per_sqm = MARKET_PRICE_PER_SQM.get(region, MARKET_PRICE_PER_SQM["default"])
    # 단위: 만원 → 원
    return int(area * price_per_sqm * 10_000)


def simulate(notice: dict) -> dict:
    """공고 1건에 대해 시세 차익 시뮬레이션을 수행합니다."""
    notice_type = notice.get("type", "")

    # 1) 현재 시세 (이미 데이터가 있으면 재사용, 없으면 추정)
    current_market = notice.get("current_market_price") or estimate_market_price(notice)
    if current_market == 0:
        current_market = estimate_market_price(notice)

    # 2) 10년 후 예상 시세
    future_market = int(current_market * APPRECIATION_FACTOR)

    # 3) 분양전환가 (할인율 적용)
    discount_rate = CONVERSION_DISCOUNT_BY_TYPE.get(
        notice_type, CONVERSION_DISCOUNT_BY_TYPE["default"]
    )
    conversion_price = int(future_market * discount_rate)

    # 4) 순수익 = 미래 시세 - 분양전환가
    expected_profit_10y = future_market - conversion_price

    # 5) 상승 여력 (%)
    profit_rate_pct = round((expected_profit_10y / current_market) * 100) if current_market else 0

    notice.update({
        "current_market_price":  current_market,
        "expected_profit_10y":   expected_profit_10y,
        "conversion_price":      conversion_price,
        "future_market_price":   future_market,
        "profit_rate_pct":       profit_rate_pct,
    })
    return notice


def main():
    parser = argparse.ArgumentParser(description="시세 차익 시뮬레이터")
    parser.add_argument("--input",  default=str(INPUT_PATH),  help="입력 JSON (notices_with_ai.json)")
    parser.add_argument("--output", default=str(OUTPUT_PATH), help="출력 JSON")
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        # summarize_ai.py 결과가 없으면 fetch_lh.py 결과를 직접 사용
        fallback = Path(__file__).parent / "output" / "notices_raw.json"
        if fallback.exists():
            print(f"[경고] {input_path.name} 없음 → {fallback.name} 사용")
            input_path = fallback
        else:
            print(f"[오류] 입력 파일이 없습니다: {input_path}")
            return

    with open(input_path, encoding="utf-8") as f:
        notices = json.load(f)

    print(f"[시뮬] {len(notices)}건 계산 시작\n")

    for i, notice in enumerate(notices, 1):
        simulate(notice)
        profit_eok = notice["expected_profit_10y"] / 1_0000_0000
        print(f"  [{i}] {notice['title'][:25]:<25} → 예상 차익 {profit_eok:.1f}억원")

    # 차익 높은 순 정렬
    notices.sort(key=lambda x: x.get("expected_profit_10y", 0), reverse=True)

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(notices, f, ensure_ascii=False, indent=2)

    print(f"\n✅ 시뮬레이션 완료 → {out_path}")
    top = notices[0] if notices else None
    if top:
        print(f"   🏆 최고 차익: {top['title'][:25]} — {top['expected_profit_10y']/1_0000_0000:.1f}억원")


if __name__ == "__main__":
    main()
