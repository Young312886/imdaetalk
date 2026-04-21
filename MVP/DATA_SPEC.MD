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

### 1-2. SH 서울주택도시공사 (서울 열린데이터광장) & 추가 부동산 API

| API 서비스명 | 엔드포인트 | 데이터 | 비고 |
|---|---|---|---|
| **서울시 SH공사 임대주택 공급계획 정보** | `openapi.seoul.go.kr:8088/{API_KEY}/json/SBHouseInfo/1/5/` | 서울 지역 임대주택 공고 | REST/JSON |
| **서울시 영구임대주택 정보 (대안)** | `openapi.seoul.go.kr:8088/{API_KEY}/json/tbYgmnPublicRntHouse/1/5/` | 영구임대주택 위치 및 세대수 | REST/JSON |
| **추가 부동산 정보 API (도입 필요)** | 미정 (예: 네이버 부동산 크롤링, 프롭테크 API) | 보증금, 월세, 전용면적, 청약일정 | SH API의 핵심 데이터 누락(보증금, 일정 등) 보완용 |

**신청 URL:** http://data.seoul.go.kr/dataList/OA-15549/S/1/datasetView.do

**🚨 SH API 한계점 및 보완 전략:**
현재 SH공사의 `tbYgmnPublicRntHouse` 및 관련 API들은 '공고명, 보증금, 월세, 전용면적, 청약 마감일' 등 자산 시뮬레이션과 사용자 알림에 필수적인 핵심 데이터를 제공하지 않습니다. 따라서 이를 보완하기 위해 외부 부동산 API 연동 또는 크롤링 파이프라인 구축이 필수적인 추가 과제로 지정되었습니다.

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

## 1-5. 🚀 [확장] 대체 데이터 수집 전략 (Alternative Sourcing)

SH공사 API의 한계(보증금, 월세, 모집일정 누락)와 실거래가 파악을 위해 도입 가능한 다각적인 데이터 수집 방안입니다.

### A. 공고 상세 정보 (보증금, 월세, 일정, 면적) 확보 방안
1. **웹 크롤링 (Web Scraping - 권장)**
   - **대상:** SH공사 청약센터 공지사항 및 서울주거포털
   - **도구:** Python `Playwright` (동적 페이지 렌더링 지원) 또는 `BeautifulSoup`
   - **장점:** 공식 홈페이지의 가장 정확한 최신 데이터를 직접 파싱.
2. **마이홈(MyHome) 포털 API 연동**
   - **대상:** 국토교통부 마이홈(myhome.go.kr) OpenAPI
   - **특징:** LH, SH, GH 등 전국의 모든 공공임대 정보를 취합하여 제공하는 포털. SH의 데이터가 이곳을 통해 제공될 경우 단일 API로 수집 가능.
3. **PDF/HWP 공고문 AI 파싱 (Advanced)**
   - **방법:** 공고글에 첨부된 한글(HWP)이나 PDF 문서를 다운로드한 뒤, OCR/문서 파서와 LLM(Ollama)을 결합해 표(Table) 안에 있는 보증금과 면적 데이터를 정형화(JSON)하여 추출.

### B. 주변 시세 (Market Price) 확보 방안
1. **네이버 부동산 비공식 모바일 API (가장 정확함)**
   - **엔드포인트:** `m.land.naver.com/complex/getComplexArticleList...`
   - **방법:** `User-Agent` 헤더를 포함하여 요청. 공고 주소의 위경도로 가장 가까운 단지(`hscpNo`)를 찾고, 해당 단지의 현재 매물(호가) 및 실거래가를 가져옴.
   - **주의:** 비공식 API이므로 Rate Limit(요청 제한) 우회를 위한 지연(delay) 및 프록시 설정 필요.
2. **국토교통부 실거래가 API (공식, 후행성)**
   - **특징:** 위 1-4에서 언급된 공식 API. 법정동 코드(`LAWD_CD`)로 조회.
   - **단점:** 거래 신고 기간(최대 30일)으로 인해 현재 호가(시장가) 반영이 늦고, 특정 면적(sqm)에 딱 맞는 데이터를 필터링하는 로직이 까다로움.
3. **KB부동산 시세 / 직방 데이터 연동 (대안)**
   - **특징:** KB부동산이나 직방의 모바일 웹/앱 API 엔드포인트를 분석하여 데이터 수집. 네이버 부동산에 대한 훌륭한 백업 소스로 활용 가능.
4. **한국부동산원(R-ONE) 주택가격동향조사 통계**
   - **용도:** 개별 단지의 가격이 없을 때, "강서구 아파트 평균 매매가" 같은 지역구 단위의 거시적 평당 단가를 가져와 대체값으로 사용.

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
