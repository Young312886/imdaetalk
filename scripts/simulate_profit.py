#!/usr/bin/env python3
"""
simulate_profit.py – 시세 차익 시뮬레이션 계산기 (v2)

① MOLIT 실거래가 APIs로 동일 지역 아파트 실거래 평균 시세를 산출합니다.
  - 아파트 매매 실거래가 (15126469)
  - 아파트 전월세 실거래가 (15126474)
② 실거래 데이터가 없으면 지역별 기준 시세(상수)로 폴백합니다.
③ 10년 뒤 예상 시세 · 분양전환가 · 예상 순수익을 계산합니다.

사용법:
    python scripts/simulate_profit.py
    python scripts/simulate_profit.py --input output/notices_extracted.json

환경변수 (.env):
    PUBLIC_DATA_API_KEY  – 공공데이터포털 서비스 인증키
"""

import os
import json
import time
import argparse
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from dotenv import load_dotenv

import requests

load_dotenv()

PUBLIC_DATA_API_KEY = os.getenv("PUBLIC_DATA_API_KEY", "")

INPUT_PATH = Path(__file__).parent / "output" / "notices_extracted.json"
OUTPUT_PATH = Path(__file__).parent / "output" / "notices_final.json"

# ─── 계산 상수 ────────────────────────────────────────────────────────────────

ANNUAL_APPRECIATION_RATE = 0.05   # 연평균 5% 상승 가정
YEARS = 10
APPRECIATION_FACTOR = (1 + ANNUAL_APPRECIATION_RATE) ** YEARS  # ≈ 1.6289

CONVERSION_DISCOUNT_BY_TYPE = {
    "행복주택": 0.70, "국민임대": 0.65, "영구임대": 0.60,
    "장기전세": 0.80, "공공분양": 0.85, "분양전환": 0.72,
    "default": 0.70,
}

# 폴백: 지역별 ㎡당 기준 시세 (만원, 2025 기준 중위값)
FALLBACK_PRICE_PER_SQM = {
    "서울": 1500, "경기": 700, "부산": 600, "인천": 650,
    "대구": 500, "광주": 450, "대전": 500, "세종": 600,
    "강원": 350, "충북": 380, "충남": 380, "전북": 350,
    "전남": 320, "경북": 380, "경남": 430, "제주": 600,
    "default": 450,
}

REQUEST_DELAY = 0.5


# ─── 법정동 코드 매핑 (시도 기준 5자리 코드) ────────────────────────────────────

REGION_LAWD_CD = {
    "서울": "11", "부산": "26", "대구": "27", "인천": "28",
    "광주": "29", "대전": "30", "울산": "31", "세종": "36",
    "경기": "41", "강원": "51", "충북": "43", "충남": "44",
    "전북": "52", "전남": "46", "경북": "47", "경남": "48", "제주": "50",
}


# ─── MOLIT 실거래가 API ──────────────────────────────────────────────────────────

def _get_ym_list(months_back: int = 6) -> List[str]:
    """최근 N개월의 YYYYMM 문자열 리스트 반환."""
    today = datetime.today()
    result = []
    for i in range(months_back):
        d = today - timedelta(days=30 * i)
        result.append(d.strftime("%Y%m"))
    return result


def fetch_molit_trade_prices(lawd_cd: str, ym: str) -> List[Dict]:
    """국토교통부 아파트 매매 실거래가 조회 (15126469)."""
    url = "http://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade"
    params = {
        "serviceKey": PUBLIC_DATA_API_KEY,
        "LAWD_CD": lawd_cd,
        "DEAL_YMD": ym,
        "numOfRows": 100,
        "pageNo": 1,
    }
    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        # 응답이 XML인 경우 처리
        if resp.headers.get("Content-Type", "").startswith("text/xml"):
            return _parse_molit_xml(resp.text)
        return resp.json().get("response", {}).get("body", {}).get("items", {}).get("item", [])
    except Exception as e:
        print(f"    [MOLIT 매매] {lawd_cd}/{ym} 오류: {e}")
        return []


def fetch_molit_rent_prices(lawd_cd: str, ym: str) -> List[Dict]:
    """국토교통부 아파트 전월세 실거래가 조회 (15126474)."""
    url = "http://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent"
    params = {
        "serviceKey": PUBLIC_DATA_API_KEY,
        "LAWD_CD": lawd_cd,
        "DEAL_YMD": ym,
        "numOfRows": 100,
        "pageNo": 1,
    }
    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        if resp.headers.get("Content-Type", "").startswith("text/xml"):
            return _parse_molit_xml(resp.text)
        return resp.json().get("response", {}).get("body", {}).get("items", {}).get("item", [])
    except Exception as e:
        print(f"    [MOLIT 전월세] {lawd_cd}/{ym} 오류: {e}")
        return []


def _parse_molit_xml(xml_text: str) -> List[Dict]:
    """MOLIT API XML 응답 파싱 (기본 처리)."""
    import xml.etree.ElementTree as ET
    try:
        root = ET.fromstring(xml_text)
        items = root.find(".//items")
        if items is None:
            return []
        return [{child.tag: child.text for child in item} for item in items.findall("item")]
    except Exception:
        return []


# ─── 시세 산출 ─────────────────────────────────────────────────────────────────

def _parse_price(val) -> Optional[int]:
    """문자열/숫자 → 정수 (단위: 원). 쉼표 포함 만원 단위 문자열 처리."""
    try:
        cleaned = str(val).replace(",", "").replace(" ", "")
        return int(float(cleaned)) * 10000  # 만원 → 원
    except (ValueError, TypeError):
        return None


def get_real_market_price(region: str, area_sqm: float, months_back: int = 6) -> Optional[int]:
    """
    MOLIT 실거래가 기반으로 해당 지역/면적의 평균 매매 시세를 반환 (원 단위).
    비슷한 면적(±20%) 거래만 필터링하여 평균 산출.
    """
    lawd_cd = REGION_LAWD_CD.get(region)
    if not lawd_cd or not area_sqm:
        return None

    prices_per_sqm = []
    for ym in _get_ym_list(months_back):
        time.sleep(REQUEST_DELAY)
        items = fetch_molit_trade_prices(lawd_cd, ym)
        for item in items:
            raw_area = item.get("excluUseAr") or item.get("전용면적", 0)
            raw_price = item.get("dealAmount") or item.get("거래금액", 0)
            try:
                item_area = float(str(raw_area).replace(",", ""))
                item_price = _parse_price(raw_price)
                if item_area and item_price:
                    # 면적 ±20% 범위 필터
                    if area_sqm * 0.8 <= item_area <= area_sqm * 1.2:
                        prices_per_sqm.append(item_price / item_area)
            except (ValueError, TypeError):
                continue

        if len(prices_per_sqm) >= 5:  # 충분한 샘플 확보 시 조기 종료
            break

    if prices_per_sqm:
        avg_per_sqm = sum(prices_per_sqm) / len(prices_per_sqm)
        return int(avg_per_sqm * area_sqm)
    return None


def get_jeonse_market_price(region: str, area_sqm: float) -> Optional[int]:
    """MOLIT 전세 실거래가 기반 평균 전세가 반환 (원 단위)."""
    lawd_cd = REGION_LAWD_CD.get(region)
    if not lawd_cd or not area_sqm:
        return None

    prices = []
    for ym in _get_ym_list(3):
        time.sleep(REQUEST_DELAY)
        items = fetch_molit_rent_prices(lawd_cd, ym)
        for item in items:
            # 전세만 필터 (월세=0)
            rent = str(item.get("monthlyRent") or item.get("월세금액", "1")).replace(",", "")
            if rent not in ("0", ""):
                continue
            raw_area = item.get("excluUseAr") or item.get("전용면적", 0)
            raw_deposit = item.get("deposit") or item.get("보증금액", 0)
            try:
                item_area = float(str(raw_area).replace(",", ""))
                item_deposit = _parse_price(raw_deposit)
                if item_area and item_deposit and area_sqm * 0.8 <= item_area <= area_sqm * 1.2:
                    prices.append(item_deposit)
            except (ValueError, TypeError):
                continue
        if len(prices) >= 5:
            break

    return int(sum(prices) / len(prices)) if prices else None


def estimate_fallback_price(region: str, area_sqm: float) -> int:
    """실거래 데이터 없을 때 지역별 기준 시세로 추정."""
    price_per_sqm = FALLBACK_PRICE_PER_SQM.get(region, FALLBACK_PRICE_PER_SQM["default"])
    return int(area_sqm * price_per_sqm * 10000)  # 만원 → 원


# ─── 시뮬레이션 ────────────────────────────────────────────────────────────────

def simulate(notice: dict, use_molit: bool = True) -> dict:
    """공고 1건에 대해 시세 차익 시뮬레이션 수행."""
    notice_type = notice.get("type", "")
    area_sqm = float(notice.get("area_sqm") or 0)
    region = notice.get("region", "")

    # 1) 현재 시세 결정
    current_market = notice.get("current_market_price") or 0

    if not current_market:
        if use_molit and area_sqm and region:
            print(f"    [MOLIT] {region} {area_sqm}㎡ 실거래가 조회 중...")
            current_market = get_real_market_price(region, area_sqm) or 0
            if current_market:
                print(f"    → 실거래 평균: {current_market:,}원")
            else:
                print("    → 실거래 데이터 없음, 기준 시세로 대체")

        if not current_market and area_sqm:
            current_market = estimate_fallback_price(region, area_sqm)
            print(f"    → 기준 시세: {current_market:,}원")

    # 전세가도 조회 (정보 보완)
    jeonse_price = None
    if use_molit and area_sqm and region:
        jeonse_price = get_jeonse_market_price(region, area_sqm)

    # 2) 10년 후 예상 시세
    future_market = int(current_market * APPRECIATION_FACTOR) if current_market else 0

    # 3) 분양전환가
    discount_rate = CONVERSION_DISCOUNT_BY_TYPE.get(
        notice_type, CONVERSION_DISCOUNT_BY_TYPE["default"]
    )
    conversion_price = int(future_market * discount_rate) if future_market else 0

    # 4) 예상 순수익
    expected_profit_10y = future_market - conversion_price if future_market else 0

    # 5) 수익률 (%)
    profit_rate_pct = (
        round((expected_profit_10y / current_market) * 100)
        if current_market else 0
    )

    notice.update({
        "current_market_price": current_market,
        "current_jeonse_price": jeonse_price,
        "future_market_price": future_market,
        "conversion_price": conversion_price,
        "expected_profit_10y": expected_profit_10y,
        "profit_rate_pct": profit_rate_pct,
        "price_source": "molit" if use_molit and jeonse_price else "fallback",
    })
    return notice


# ─── 메인 ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="시세 차익 시뮬레이터 v2 (MOLIT 실거래가 연동)")
    parser.add_argument("--input", default=str(INPUT_PATH), help="입력 JSON")
    parser.add_argument("--output", default=str(OUTPUT_PATH), help="출력 JSON")
    parser.add_argument("--no-molit", action="store_true", help="MOLIT API 호출 없이 기준 시세만 사용")
    args = parser.parse_args()

    use_molit = not args.no_molit and bool(PUBLIC_DATA_API_KEY)

    input_path = Path(args.input)
    if not input_path.exists():
        # 폴백: notices_raw.json 사용
        for fallback in [
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

    print(f"[시뮬] {len(notices)}건, MOLIT={'ON' if use_molit else 'OFF'}\n")

    for i, notice in enumerate(notices, 1):
        print(f"[{i}/{len(notices)}] {notice.get('title', '')[:30]}")
        simulate(notice, use_molit=use_molit)
        profit_eok = notice["expected_profit_10y"] / 1_0000_0000
        print(f"  → 예상 차익: {profit_eok:.2f}억원 ({notice.get('profit_rate_pct', 0)}%)\n")

    notices.sort(key=lambda x: x.get("expected_profit_10y", 0), reverse=True)

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(notices, f, ensure_ascii=False, indent=2)

    print(f"✅ 시뮬레이션 완료 → {out_path}")
    if notices:
        top = notices[0]
        print(f"   🏆 {top.get('title', '')[:30]} — {top['expected_profit_10y']/1_0000_0000:.1f}억원")


if __name__ == "__main__":
    main()
