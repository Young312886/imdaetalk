#!/usr/bin/env python3
"""
fetch_lh.py – LH 공공임대 분양전환 공고 수집 스크립트 (v2)

사용하는 API:
  1. 분양임대공고문 조회        (15058530) → 공고 목록, notice_id, notice_name
  2. 분양임대공고별 공급정보    (15056765) → area_sqm, supply_households, deposit, rent
  3. 분양임대공고별 상세정보    (15057999) → 청약 일정 (application/winner dates)
  4. 청약센터 공지사항별 상세정보 (15058449) → 첨부파일 다운로드 URL

사용법:
    python scripts/fetch_lh.py
    python scripts/fetch_lh.py --region 서울 --limit 20

환경변수 (.env):
    PUBLIC_DATA_API_KEY  – 공공데이터포털 서비스 인증키
    VWORLD_API_KEY       – VWorld 지오코딩 API 키
"""

import os
import json
import time
import argparse
import requests
from typing import Optional, List, Dict, Any
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from urllib.parse import unquote

load_dotenv()

# ─── 설정 ──────────────────────────────────────────────────────────────────────
PUBLIC_DATA_API_KEY = unquote(os.getenv("PUBLIC_DATA_API_KEY", "").strip())
VWORLD_API_KEY = unquote(os.getenv("VWORLD_API_KEY", "").strip())

OUTPUT_PATH = Path(__file__).parent / "output" / "notices_raw.json"

# LH API 엔드포인트
API_NOTICE_LIST = "http://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1"
API_SUPPLY_INFO = "http://apis.data.go.kr/B552555/lhLeaseNoticeSplInfo1/getLeaseNoticeSplInfo1"
API_DETAIL_INFO = "http://apis.data.go.kr/B552555/lhLeaseNoticeDtlInfo1/getLeaseNoticeDtlInfo1"
API_ATTACH_INFO = "http://apis.data.go.kr/B552555/lhNoticeDtlInfo1/getLhNoticeDtlInfo1"

REGION_MAP = {
    "서울": "11", "경기": "41", "부산": "26", "인천": "28",
    "대구": "27", "광주": "29", "대전": "30", "세종": "36",
    "강원": "51", "충북": "43", "충남": "44", "전북": "52",
    "전남": "46", "경북": "47", "경남": "48", "제주": "50",
}

TYPE_MAP = {
    "060": "행복주택", "061": "국민임대", "062": "영구임대",
    "063": "장기전세", "064": "공공분양", "065": "분양전환",
}

REQUEST_DELAY = 0.3  # API 과부하 방지 딜레이 (초)


# ─── 헬퍼 ──────────────────────────────────────────────────────────────────────

def _get(url: str, params: dict, timeout: int = 15) -> Optional[dict]:
    """공통 GET 요청 래퍼. 오류 시 None 반환."""
    try:
        resp = requests.get(url, params=params, timeout=timeout)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"  [API 오류] {url}: {e}")
        return None


def _to_int(val: Any, multiplier: int = 10000) -> int:
    try:
        return int(float(str(val).replace(",", "")) * multiplier)
    except (ValueError, TypeError):
        return 0


def _to_date(val: Any) -> Optional[str]:
    """'YYYYMMDD' 또는 'YYYY-MM-DD' 형식 → 'YYYY-MM-DD', 없으면 None."""
    s = str(val).strip() if val else ""
    if len(s) == 8 and s.isdigit():
        return f"{s[:4]}-{s[4:6]}-{s[6:]}"
    if len(s) == 10 and s[4] == "-":
        return s
    return None


# ─── VWorld 지오코딩 ────────────────────────────────────────────────────────────

def geocode_address(address: str) -> dict:
    """VWorld API를 사용해 주소를 위경도 좌표로 변환."""
    if not address or not VWORLD_API_KEY:
        return {"lat": None, "lng": None}

    data = _get("http://api.vworld.kr/req/address", {
        "service": "address", "request": "getcoord", "version": "2.0",
        "crs": "epsg:4326", "address": address, "refine": "true",
        "simple": "false", "format": "json", "type": "road",
        "key": VWORLD_API_KEY
    }, timeout=5)

    if data and data.get("response", {}).get("status") == "OK":
        coords = data["response"]["result"]["point"]
        return {"lat": float(coords["y"]), "lng": float(coords["x"])}
    return {"lat": None, "lng": None}


# ─── Step 1: 공고 목록 수집 ─────────────────────────────────────────────────────

def fetch_notice_list(region: Optional[str] = None, limit: int = 50) -> List[Dict]:
    """① 분양임대공고문 조회 서비스 (15058530)"""
    params = {"serviceKey": PUBLIC_DATA_API_KEY, "PG_SZ": limit, "PAGE": 1}
    if region and region in REGION_MAP:
        params["CNP_CD"] = REGION_MAP[region]

    data = _get(API_NOTICE_LIST, params)
    if not data:
        return []

    items = data[1].get("dsList", []) if isinstance(data, list) and len(data) > 1 else []
    print(f"[①공고목록] {len(items)}건 수집")
    return items


# ─── Step 2: 공급정보 수집 ──────────────────────────────────────────────────────

def fetch_supply_info(notice_id: str) -> List[Dict]:
    """② 분양임대공고별 공급정보 조회 (15056765) → 주택형별 면적/세대수/보증금/월임대료"""
    data = _get(API_SUPPLY_INFO, {
        "serviceKey": PUBLIC_DATA_API_KEY,
        "PAN_ID": notice_id,
    })
    if not data:
        return []

    items = data[1].get("dsList", []) if isinstance(data, list) and len(data) > 1 else []
    return items


def _parse_supply(items: List[Dict]) -> Dict:
    """공급정보 리스트에서 1인가구 기준 가장 작은 면적 유형을 선택."""
    if not items:
        return {}

    # 전용면적 오름차순 정렬 → 1인 가구에 적합한 소형 타입 우선
    sorted_items = sorted(items, key=lambda x: float(x.get("LDVS_AREA", 0) or 0))
    rep = sorted_items[0]

    return {
        "area_sqm": float(rep.get("LDVS_AREA", 0) or 0),
        "supply_households": int(rep.get("TOT_SUPLY_HSHLDCO", 0) or 0),
        "deposit": _to_int(rep.get("LS_GMY", 0)),       # 임대보증금 (만원→원)
        "rent_fee": _to_int(rep.get("LS_RFE", 0)),      # 월임대료 (만원→원)
        "standard_deposit": _to_int(rep.get("LS_GMY", 0)),
    }


# ─── Step 3: 상세정보 수집 ──────────────────────────────────────────────────────

def fetch_detail_info(notice_id: str) -> Dict:
    """③ 분양임대공고별 상세정보 조회 (15057999) → 청약일정, 단지 주소 등"""
    data = _get(API_DETAIL_INFO, {
        "serviceKey": PUBLIC_DATA_API_KEY,
        "PAN_ID": notice_id,
    })
    if not data:
        return {}

    items = data[1].get("dsList", []) if isinstance(data, list) and len(data) > 1 else []
    if not items:
        return {}

    d = items[0]
    return {
        "application_start_date": _to_date(d.get("RCRIT_PBLANC_DE")),   # 청약공고일
        "application_end_date": _to_date(d.get("PRZWNER_PRESNATN_DE")), # 당첨자 발표일
        "winner_announce": _to_date(d.get("PRZWNER_PRESNATN_DE")),
        "contract_date": _to_date(d.get("CNTRCT_DE")),                  # 계약일
        "move_in_date": _to_date(d.get("MVN_DE")),                      # 입주 예정일
        "address": d.get("BSNS_MBY_NM", ""),                            # 사업지 주소
    }


# ─── Step 4: 첨부파일 URL 수집 ──────────────────────────────────────────────────

def fetch_attachment_info(notice_id: str) -> List[Dict]:
    """④ LH 청약센터 공지사항별 상세정보 (15058449) → 공고문 첨부파일 URL 목록"""
    data = _get(API_ATTACH_INFO, {
        "serviceKey": PUBLIC_DATA_API_KEY,
        "BBS_ID": notice_id,  # 공지사항 ID (PAN_ID와 동일 가능성 높음)
    })
    if not data:
        return []

    # 첨부파일 리스트는 'L_ATC_FL_INFO' 또는 'dsList' 내부에 위치
    items = []
    if isinstance(data, list) and len(data) > 1:
        items = data[1].get("dsList", [])
    elif isinstance(data, dict):
        items = data.get("L_ATC_FL_INFO", [])

    attachments = []
    for item in items:
        url = item.get("ATC_FL_URL") or item.get("FILE_URL") or item.get("DTL_URL", "")
        name = item.get("ATC_FL_NM") or item.get("FILE_NM", "")
        if url:
            attachments.append({
                "name": name,
                "url": url,
                "ext": Path(name).suffix.lower() if name else "",
            })

    return attachments


# ─── 통합 파싱 ──────────────────────────────────────────────────────────────────

def enrich_notice(raw: dict) -> dict:
    """공고 1건에 대해 supply/detail/attachment 정보를 취합하여 풍부한 레코드 반환."""
    notice_id = raw.get("PAN_ID", "")
    notice_name = raw.get("PAN_NM", "공고 없음")

    print(f"  ┌ {notice_name[:35]}")

    # 지역 파싱
    rgs_nm = raw.get("CNP_NM", "")
    parts = rgs_nm.split(" ") if rgs_nm else []
    region = parts[0] if parts else ""
    district = parts[1] if len(parts) > 1 else ""

    # ② 공급정보
    time.sleep(REQUEST_DELAY)
    supply_items = fetch_supply_info(notice_id)
    supply = _parse_supply(supply_items)
    print(f"  │  공급정보: 면적 {supply.get('area_sqm', 0)}㎡, {supply.get('supply_households', 0)}세대")

    # ③ 상세정보
    time.sleep(REQUEST_DELAY)
    detail = fetch_detail_info(notice_id)
    address = detail.get("address") or rgs_nm
    print(f"  │  일정: 청약 {detail.get('application_start_date', '미정')} / 발표 {detail.get('winner_announce', '미정')}")

    # ④ 첨부파일
    time.sleep(REQUEST_DELAY)
    attachments = fetch_attachment_info(notice_id)
    print(f"  └  첨부파일: {len(attachments)}건")

    # 위경도 변환
    coords = geocode_address(address)

    # 임시 시세 추정 (simulate_profit.py에서 MOLIT 데이터로 대체)
    deposit = supply.get("deposit", 0)
    current_market_price = int(deposit * 1.5) if deposit else 0

    return {
        # 기본 식별자
        "id": notice_id,
        "title": notice_name,
        "region": region,
        "district": district,
        "type": TYPE_MAP.get(raw.get("UPP_AIS_TP_CD", ""), raw.get("UPP_AIS_TP_NM", "임대")),
        "source_url": raw.get("DTL_URL", "https://apply.lh.or.kr"),

        # ② 공급정보
        "area_sqm": supply.get("area_sqm", 0),
        "supply_households": supply.get("supply_households", 0),
        "deposit": supply.get("deposit", 0),
        "rent_fee": supply.get("rent_fee", 0),
        "standard_deposit": supply.get("standard_deposit", 0),

        # ③ 일정 정보
        "published_at": _to_date(raw.get("PAN_DT")) or datetime.today().strftime("%Y-%m-%d"),
        "subscription_open": detail.get("application_start_date"),
        "subscription_close": detail.get("application_end_date"),
        "winner_announce": detail.get("winner_announce"),
        "contract_date": detail.get("contract_date"),
        "move_in_date": detail.get("move_in_date"),

        # 위경도
        "lat": coords["lat"],
        "lng": coords["lng"],

        # ④ 첨부파일 목록 (extract_unstructured.py에서 활용)
        "attachments": attachments,

        # 시세/시뮬 (나중에 simulate_profit.py에서 MOLIT 데이터로 업데이트)
        "current_market_price": current_market_price,
        "expected_profit_10y": 0,
        "conversion_price": 0,

        # AI 요약 (나중에 채워짐)
        "ai_summary": [],
        "is_eligible": None,
    }


# ─── 메인 ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="LH 공고 수집기 v2")
    parser.add_argument("--region", default=None, help="지역 필터 (예: 서울)")
    parser.add_argument("--limit", type=int, default=30, help="최대 수집 공고 수")
    parser.add_argument("--no-geocode", action="store_true", help="위경도 변환 생략")
    args = parser.parse_args()

    if not PUBLIC_DATA_API_KEY:
        print("[오류] .env 에 PUBLIC_DATA_API_KEY 를 설정하세요.")
        return

    print(f"\n[LH 공고 수집] 지역={args.region or '전체'}, 한도={args.limit}건\n")

    # ① 공고 목록
    notice_list = fetch_notice_list(region=args.region, limit=args.limit)
    if not notice_list:
        print("[오류] 공고 목록을 가져오지 못했습니다.")
        return

    # 상세 정보 취합
    notices = []
    for i, raw in enumerate(notice_list, 1):
        print(f"\n[{i}/{len(notice_list)}]")
        notices.append(enrich_notice(raw))

    # 파일 저장
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(notices, f, ensure_ascii=False, indent=2)

    print(f"\n✅ 총 {len(notices)}건 저장 완료 → {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
