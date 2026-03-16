#!/usr/bin/env python3
"""
fetch_lh.py – LH/SH 공공임대 분양전환 공고 수집 스크립트
공공데이터포털 LH 임대주택 매입임대주택 입주자 모집 공고 API 연동

사용법:
    python scripts/fetch_lh.py
    python scripts/fetch_lh.py --region 서울 --limit 20

환경변수 (.env):
    LH_API_KEY  – 공공데이터포털 서비스 인증키
"""

import os
import json
import argparse
import requests
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ─── 설정 ──────────────────────────────────────────────
PUBLIC_DATA_API_KEY = os.getenv("PUBLIC_DATA_API_KEY", "YOUR_API_KEY_HERE")
BASE_URL = "http://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1"
SH_BASE_URL = "http://openapi.seoul.go.kr:8088"
SH_API_KEY = os.getenv("SEOUL_OPEN_API_KEY", "YOUR_SH_API_KEY")
VWORLD_API_KEY = os.getenv("VWORLD_API_KEY", "YOUR_VWORLD_API_KEY")

OUTPUT_PATH = Path(__file__).parent / "output" / "notices_raw.json"

REGION_MAP = {
    "서울": "11",
    "경기": "41",
    "부산": "26",
    "인천": "28",
    "대구": "27",
    "광주": "29",
    "대전": "30",
    "세종": "36",
}

TYPE_MAP = {
    "060": "행복주택",
    "061": "국민임대",
    "062": "영구임대",
    "063": "장기전세",
    "064": "공공분양",
    "065": "분양전환",
}


def geocode_address(address: str) -> dict:
    """VWorld API를 사용해 주소를 위경도 좌표로 변환"""
    if not address or VWORLD_API_KEY == "YOUR_VWORLD_API_KEY":
        return {"lat": None, "lng": None}
    
    url = "http://api.vworld.kr/req/address"
    params = {
        "service": "address",
        "request": "getcoord",
        "version": "2.0",
        "crs": "epsg:4326",
        "address": address,
        "refine": "true",
        "simple": "false",
        "format": "json",
        "type": "road",
        "key": VWORLD_API_KEY
    }
    
    try:
        resp = requests.get(url, params=params, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        if data.get("response", {}).get("status") == "OK":
            coords = data["response"]["result"]["point"]
            return {"lat": float(coords["y"]), "lng": float(coords["x"])}
    except Exception as e:
        print(f"[VWorld] 위경도 변환 실패 ({address}): {e}")
    return {"lat": None, "lng": None}


def fetch_lh_notices(region: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
    """LH 임대주택 입주자 모집 공고 API 조회"""
    params = {
        "serviceKey": PUBLIC_DATA_API_KEY,
        "PG_SZ": limit,
        "PAGE": 1,
    }
    if region and region in REGION_MAP:
        params["CNP_CD"] = REGION_MAP[region]

    try:
        resp = requests.get(BASE_URL, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        items = data[1].get("dsList", []) if len(data) > 1 else []
        if not items:
            print(f"[LH] 데이터 없음. 응답: {data}")
        print(f"[LH] {len(items)}건 수집 완료")
        return items
    except Exception as e:
        print(f"[LH] API 오류: {e}")
        if 'resp' in locals():
            print(f"[LH] 응답 내용: {resp.text[:500]}")
        return []


def parse_lh_notice(raw: dict) -> dict:
    """LH API 응답 → 앱 스키마 변환"""
    today = datetime.today()
    
    # 보증금·월세 정수 변환 (단위: 만원)
    def to_int(val: Any, multiplier: int = 10000) -> int:
        try:
            return int(float(str(val).replace(",", "")) * multiplier)
        except (ValueError, TypeError):
            return 0

    deposit = to_int(raw.get("LS_GMY", 0))            # 임대보증금 (만원)
    rent_fee = to_int(raw.get("LS_RFE", 0))           # 월임대료 (만원)
    area_sqm = float(raw.get("LS_AREA", 0) or 0)      # 전용면적 (㎡)

    # 예상 시세: 보증금 * 1.5
    current_market_price = int(deposit * 1.5) if deposit else 0
    expected_profit_10y = int(current_market_price * 0.63) 
    conversion_price = int(current_market_price * 0.75) 

    # 지역 파싱
    rgs_nm = raw.get("CNP_NM", "")
    parts = rgs_nm.split(" ") if rgs_nm else []
    region = parts[0] if parts else ""
    district = parts[1] if len(parts) > 1 else ""

    coords = geocode_address(rgs_nm)

    return {
        "id": raw.get("PAN_ID", f"lh_{raw.get('PAN_NM', '')}"),
        "title": raw.get("PAN_NM", "공고 없음"),
        "region": region,
        "district": district,
        "type": TYPE_MAP.get(raw.get("UPP_AIS_TP_CD", ""), raw.get("UPP_AIS_TP_NM", "임대")),
        "deposit": deposit,
        "rent_fee": rent_fee,
        "area_sqm": area_sqm,
        "current_market_price": current_market_price,
        "expected_profit_10y": expected_profit_10y,
        "conversion_price": conversion_price,
        "source_url": raw.get("DTL_URL", "https://apply.lh.or.kr"),
        "published_at": raw.get("PAN_DT", today.strftime("%Y-%m-%d")),
        "subscription_open": raw.get("PAN_DT", ""),
        "subscription_close": raw.get("CLSG_DT", ""),
        "winner_announce": "",
        "contract_date": "",
        "lat": coords["lat"],
        "lng": coords["lng"],
        "ai_summary": [],
        "is_eligible": None,
    }


def fetch_sh_notices(limit: int = 20) -> List[Dict[str, Any]]:
    """서울주택도시공사(SH) OpenAPI – 서울시 임대주택 공고"""
    url = f"{SH_BASE_URL}/{SH_API_KEY}/json/SBHouseInfo/1/{limit}/"
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        if "RESULT" in data and "ERROR" in data["RESULT"].get("CODE", ""):
            print(f"[SH] API 서버 상태 에러: {data['RESULT']}")
            return []
            
        items = data.get("SBHouseInfo", {}).get("row", [])
        print(f"[SH] {len(items)}건 수집 완료")
        return items
    except Exception as e:
        print(f"[SH] API 연동 실패: {e}")
        return []


def parse_sh_notice(raw: dict) -> dict:
    """SH API 응답 → 앱 스키마 변환"""
    today = datetime.today()
    district = raw.get("SBSC_ADDR", "").split(" ")[1] if raw.get("SBSC_ADDR") else ""
    coords = geocode_address(raw.get("SBSC_ADDR", "서울"))

    return {
        "id": f"sh_{raw.get('HOUSE_CD', '')}",
        "title": raw.get("SBSC_HOUSE_NM", "SH 공고"),
        "region": "서울",
        "district": district,
        "type": raw.get("HOUSE_SECT_NM", "임대"),
        "deposit": 0,
        "rent_fee": 0,
        "area_sqm": 0.0,
        "current_market_price": 0,
        "expected_profit_10y": 0,
        "conversion_price": 0,
        "source_url": raw.get("DETAIL_URL", "https://www.i-sh.co.kr"),
        "published_at": today.strftime("%Y-%m-%d"),
        "subscription_open": raw.get("RCPT_BGNDE", ""),
        "subscription_close": raw.get("RCPT_ENDDE", ""),
        "winner_announce": "",
        "contract_date": "",
        "lat": coords["lat"],
        "lng": coords["lng"],
        "ai_summary": [],
        "is_eligible": None,
    }


def main():
    parser = argparse.ArgumentParser(description="LH/SH 공고 수집기")
    parser.add_argument("--region", default=None, help="지역 필터 (예: 서울)")
    parser.add_argument("--limit", type=int, default=50, help="최대 수집 건수")
    parser.add_argument("--sh", action="store_true", help="SH 공고도 수집")
    args = parser.parse_args()

    notices = []

    # LH 수집
    lh_raw = fetch_lh_notices(region=args.region, limit=args.limit)
    for item in lh_raw:
        notices.append(parse_lh_notice(item))

    # SH 수집 (옵션)
    if args.sh:
        sh_raw = fetch_sh_notices(limit=20)
        for item in sh_raw:
            notices.append(parse_sh_notice(item))

    # 중복 제거 (id 기준)
    seen = set()
    unique = []
    for n in notices:
        if n["id"] not in seen:
            seen.add(n["id"])
            unique.append(n)

    # 파일 저장
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(unique, f, ensure_ascii=False, indent=2)

    print(f"\n✅ 총 {len(unique)}건 저장 완료 → {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
