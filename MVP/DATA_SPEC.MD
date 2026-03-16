# 임대톡 공공데이터 API 명세 & 데이터 파이프라인 설계

> 마지막 업데이트: 2026-03-16  
> 기반: 공공데이터포털(data.go.kr), 국토교통부, LH, SH공사, VWorld

---

## 1. 활용 공공 API 목록

### 1-1. LH 한국토지주택공사 APIs (공공데이터포털)

| API 서비스명 | 엔드포인트 | 데이터 | 비고 |
|---|---|---|---|
| **분양임대공고문 조회** | `apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1` | 공고 목록, 유형, 지역, 기간 | REST/JSON |
| **분양임대공고별 공급정보** | `apis.data.go.kr/B551012/lhLeaseDetailInfo1` | 주택형, 공급세대수, 보증금/임대료 | REST/JSON |

**신청 URL:** https://www.data.go.kr/tcs/dss/selectDataSetList.do?keyword=한국토지주택공사

**주요 요청 파라미터 (fetch_lh.py 적용):**
```
serviceKey   : 발급받은 인증키 (URL 인코딩 필요)
PG_SZ        : 페이지당 결과 수 (기본값: 50)
PAGE         : 페이지 번호
CNP_CD       : 지역코드 (11=서울, 41=경기 ...)
```

---

### 1-2. SH 서울주택도시공사 (서울 열린데이터광장)

| API 서비스명 | 엔드포인트 | 데이터 | 비고 |
|---|---|---|---|
| **서울시 SH공사 임대주택 공급계획 정보** | `openapi.seoul.go.kr:8088/{API_KEY}/json/SBHouseInfo/1/5/` | 서울 지역 임대주택 공고 | REST/JSON |

**신청 URL:** http://data.seoul.go.kr/dataList/OA-15549/S/1/datasetView.do

---

### 1-3. VWorld 지오코딩 API (위경도 변환)

| API 서비스명 | 엔드포인트 | 데이터 | 비고 |
|---|---|---|---|
| **주소검색 API (2.0)** | `api.vworld.kr/req/address` | 주소 기반 위경도 좌표(lat, lng) | REST/JSON |

**신청 URL:** http://www.vworld.kr/dev/v4dv_addrguide2_s001.do

---

### 1-4. 국토교통부 API (실거래가 – 시세 시뮬레이션 핵심)

| API 서비스명 | 엔드포인트 | 데이터 | 비고 |
|---|---|---|---|
| **아파트 전월세 실거래가** | `apis.data.go.kr/1613000/RTMSDataSvcAptRent` | 법정동별 전월세 실거래 | REST/XML→JSON |
| **아파트 매매 실거래가** | `apis.data.go.kr/1613000/RTMSDataSvcAptTrade` | 법정동별 매매 실거래가 | REST/XML→JSON |

---

## 2. 데이터 파이프라인 아키텍처 (Python Scripts)

| 스크립트 | 입력 | 출력 | 주요 역할 |
|---|---|---|---|
| `fetch_lh.py` | LH/SH OpenAPI | `notices_raw.json` | 데이터 수집 및 VWorld 위경도 변환 |
| `summarize_ai.py` | `notices_raw.json` | `notices_with_ai.json` | Ollama(llama3) 기반 요약 및 자격 판별 |
| `simulate_profit.py` | `notices_with_ai.json` | `notices_final.json` | 10년 뒤 예상 차익 및 분양전환가 시뮬레이션 |
| `save_to_supabase.py` | `notices_final.json` | Supabase DB | `notices`, `notice_ai_summary` 테이블 UPSERT |

---

## 3. 데이터베이스 스키마 (notices 테이블)

```sql
CREATE TABLE public.notices (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title                text NOT NULL,
  region               text,
  district             text,
  type                 text,   -- 행복주택, 국민임대 등
  deposit              bigint,
  rent_fee             int,
  area_sqm             numeric,
  current_market_price bigint,
  expected_profit_10y  bigint,
  conversion_price     bigint,
  source_url           text,
  published_at         date,
  subscription_open    date,
  subscription_close   date,
  winner_announce      date,
  contract_date        date,
  lat                  numeric, -- 위도
  lng                  numeric, -- 경도
  created_at           timestamptz DEFAULT now()
);
```

---

## 4. 시세 시뮬레이션 계산식

- **10년 후 예상 시세**: `현재 시세 * 1.6289` (연평균 5% 복리 가정)
- **분양전환가 할인율**: 유형별 차등 적용 (행복주택 70%, 국민임대 65%, 공공분양 85% 등)
- **예상 순수익**: `예상 시세 - 분양전환가`

---

## 5. 환경 변수 전체 목록 (.env)

```env
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
PUBLIC_DATA_API_KEY=...
SEOUL_OPEN_API_KEY=...
VWORLD_API_KEY=...
OLLAMA_BASE_URL=http://localhost:11434
```
