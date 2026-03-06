# 임대톡 공공데이터 API 명세 & 데이터 파이프라인 설계

> 마지막 업데이트: 2026-03-06  
> 기반: 공공데이터포털(data.go.kr), 국토교통부, LH, SH공사

---

## 1. 활용 공공 API 목록

### 1-1. LH 한국토지주택공사 APIs (공공데이터포털)

| API 서비스명 | 엔드포인트 | 데이터 | 비고 |
|---|---|---|---|
| **분양임대공고문 조회** | `apis.data.go.kr/B551012/lhLeaseNoticeInfo1` | 공고 목록, 유형, 지역, 기간 | REST/JSON |
| **분양임대공고별 공급정보** | `apis.data.go.kr/B551012/lhLeaseDetailInfo1` | 주택형, 공급세대수, 보증금/임대료 | REST/JSON |
| **청약센터 공지사항 목록** | `apis.data.go.kr/B551012/lhLeaseNoticeList1` | 공지사항 제목, 등록일, 담당부서 | REST/JSON |

**신청 URL:** https://www.data.go.kr/tcs/dss/selectDataSetList.do?keyword=한국토지주택공사

**공통 요청 파라미터:**
```
serviceKey   : 발급받은 인증키 (URL 인코딩 필요)
page         : 페이지 번호 (기본값: 1)
perPage      : 페이지당 결과 수 (최대: 100)
```

**공고문 조회 추가 파라미터:**
```
PAN_SS   : 공고 검색어
CNP_CD   : 지역코드 (11=서울, 41=경기, 26=부산 ...)
UPP_AIS_TP_CD : 공고 유형 (01=임대, 02=분양, 03=사전청약)
```

**응답 예시 (JSON):**
```json
{
  "currentCount": 10,
  "matchCount": 152,
  "data": [
    {
      "PAN_ID": "LH2024-001",
      "PAN_NM": "마곡지구 행복주택 입주자 모집공고",
      "CNP_CD_NM": "서울특별시",
      "PAN_SS": "2024-01-15",
      "CLSG_DT": "2024-01-20",
      "AIS_TP_CD_NM": "공공임대",
      "DTL_URL": "https://apply.lh.or.kr/lhapply/..."
    }
  ]
}
```

---

### 1-2. 국토교통부 API (실거래가 – 시세 시뮬레이션 핵심)

| API 서비스명 | 엔드포인트 | 데이터 | 비고 |
|---|---|---|---|
| **아파트 전월세 실거래가** | `apis.data.go.kr/1613000/RTMSDataSvcAptRent` | 법정동별 전월세 실거래 | REST/XML→JSON 변환 필요 |
| **아파트 매매 실거래가** | `apis.data.go.kr/1613000/RTMSDataSvcAptTrade` | 법정동별 매매 실거래가 | REST/XML→JSON 변환 필요 |
| **오피스텔 전월세** | `apis.data.go.kr/1613000/RTMSDataSvcOffiRent` | 소형 오피스텔 임대 시세 | REST/XML |

**신청 URL:** https://www.data.go.kr/data/15058017/openapi.do

**요청 파라미터:**
```
serviceKey : 인증키
LAWD_CD    : 법정동 코드 5자리 (예: 11500 = 서울 강서구)
DEAL_YMD   : 계약년월 YYYYMM (예: 202401)
numOfRows  : 결과 수 (기본 10, 최대 999)
```

**⚠️ 주의:** 응답이 XML 형식이므로 Python에서 `xmltodict` 또는 `xml.etree.ElementTree`로 파싱 후 JSON 변환 필요

**법정동 코드 참조:** https://www.data.go.kr/data/15063424/fileData.do

---

### 1-3. SH서울주택도시공사 (크롤링 방식)

> SH공사는 청약 모집공고를 공식 API로 제공하지 않음. → Playwright 크롤링 적용

| 데이터 출처 | URL | 방식 | 데이터 |
|---|---|---|---|
| **서울주거포털** | `housing.seoul.go.kr` | Playwright 크롤링 | 행복주택, 장기전세 공고 |
| **SH공사 홈페이지** | `www.i-sh.co.kr` | Playwright 크롤링 | 재개발임대, 사전청약 |
| **서울 열린데이터광장** | `data.seoul.go.kr` | REST API ✅ | 공급계획 현황 데이터 |

**서울 열린데이터광장 행복주택 API:**
```
https://data.seoul.go.kr/dataList/OA-15549/S/1/datasetView.do
엔드포인트: http://openapi.seoul.go.kr:8088/{API_KEY}/json/HappyHouseList/1/100/
```

---

### 1-4. 주택청약종합저축 가이드 (마이페이지 가점 계산 참조)

| 항목 | 점수 기준 | 비고 |
|---|---|---|
| 무주택 기간 | 1~32점 (1년 미만=2점, 15년 이상=32점) | 만 30세 이상 또는 혼인 시 기산 |
| 부양가족 수 | 0~35점 (1명=5점, 6명 이상=35점) | 직계존속 포함 |
| 청약통장 가입 기간 | 1~17점 (6개월 미만=1점, 15년 이상=17점) | |
| **합계 최고** | **84점** | |

> 💡 1인 가구(부양가족 0명) 기준 최대 = 32 + 0 + 17 = **49점**

---

## 2. 데이터 파이프라인 아키텍처

```
┌──────────────────────────────────────────────────┐
│              데이터 수집 레이어                     │
│                                                    │
│  [LH API]          [국토교통부 API]   [SH 크롤러]  │
│  공고 목록/상세     아파트 실거래가     서울주거포털  │
│       │                  │                 │       │
└───────┼──────────────────┼─────────────────┼───────┘
        │                  │                 │
        ▼                  ▼                 ▼
┌──────────────────────────────────────────────────┐
│            Python 처리 레이어 (scripts/)           │
│                                                    │
│  1. 데이터 정규화/정제 (normalize.py)               │
│  2. 시세 시뮬레이션 계산 (profit_calc.py)           │
│  3. AI 3줄 요약 생성 (summarizer.py / Ollama)      │
│  4. Supabase 업서트 (upserter.py)                  │
└──────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────┐
│            Supabase PostgreSQL DB                 │
│                                                    │
│  notices + notice_ai_summary + profiles           │
└──────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────┐
│          Next.js App (임대톡 프론트엔드)            │
│                                                    │
│  서버 컴포넌트에서 Supabase 직접 쿼리               │
│  Route Handler로 외부 API 프록시 (키 보호)         │
└──────────────────────────────────────────────────┘
```

---

## 3. 데이터 수집 스케줄 (Cron)

| 작업 | 주기 | 방법 | 우선순위 |
|---|---|---|---|
| LH 공고 목록 수집 | 매일 오전 9시 | GitHub Actions Cron + Python 스크립트 | P1 |
| 국토교통부 실거래가 수집 | 월 1회 (월말) | GitHub Actions Cron | P1 |
| SH 공고 크롤링 | 매일 오전 9시 | GitHub Actions Cron + Playwright | P1 |
| AI 3줄 요약 생성 | 신규 공고 감지 시 | Supabase Edge Function Trigger | P2 |
| 이메일 알림 발송 | 신규 공고 작성 직후 | Supabase Edge Function | P2 |
| 주간 뉴스레터 | 매주 월요일 오전 8시 | Supabase pg_cron | P3 |

---

## 4. 분양전환가 시뮬레이션 공식 (구체화)

> TECH SPEC 3.2 기반으로 파라미터 구체화

```python
def calculate_expected_profit(
    current_market_price: int,    # 현재 주변 시세 (만 원)
    annual_rise_rate: float,      # 최근 3년 연평균 상승률 (예: 0.05 = 5%)
    macro_weight: float,          # 매크로 가중치 (기본값: 0.01 = 낙관 시나리오)
    construction_cost: int,       # 건설원가 (만 원, LH 공고문에서 추출)
    years: int = 10               # 시뮬레이션 기간 (기본 10년)
) -> dict:
    # 10년 뒤 예상 시세
    future_price = current_market_price * (1 + annual_rise_rate + macro_weight) ** years
    
    # 10년 뒤 감정가 (보수적으로 현재 시세의 80% 상승 가정)
    future_appraisal = current_market_price * (1 + annual_rise_rate * 0.8) ** years
    
    # 예상 분양전환가
    conversion_price = (construction_cost + future_appraisal) / 2
    
    # 최종 예상 차익
    expected_profit = future_price - conversion_price
    
    return {
        "current_market_price": current_market_price,
        "future_price": round(future_price),
        "conversion_price": round(conversion_price),
        "expected_profit": round(expected_profit),
        "scenario": "낙관적" if macro_weight > 0 else "보수적"
    }
```

**상승률 데이터 소스:**
- 국토교통부 실거래가 API에서 최근 36개월 데이터를 가져와 연환산 수익률 계산
- 지역별 분리 계산 (파라미터: `LAWD_CD` = 법정동 코드)

---

## 5. 환경 변수 전체 목록

```env
# ─ Supabase ─────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  ← 서버 전용 (절대 클라이언트 노출 금지)

# ─ 공공데이터포털 (data.go.kr) ─────────────────
PUBLIC_DATA_API_KEY=Base64인코딩된인증키
# LH 공고 API + 국토교통부 실거래가 API 동일 키 사용

# ─ 서울 열린데이터광장 ───────────────────────────
SEOUL_OPEN_API_KEY=your_key_here

# ─ 카카오 소셜 로그인 ────────────────────────────
KAKAO_CLIENT_ID=your_kakao_rest_api_key
KAKAO_CLIENT_SECRET=your_kakao_client_secret  ← Supabase OAuth 설정용

# ─ 네이버 소셜 로그인 ────────────────────────────
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret

# ─ 이메일 발송 (Resend) ──────────────────────────
RESEND_API_KEY=re_xxxx

# ─ AI 엔진 (Ollama, 로컬/서버) ───────────────────
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b  # 또는 EEVE-Korean-10.8B

# ─ 카카오맵 (지도 뷰) ────────────────────────────
NEXT_PUBLIC_KAKAO_MAP_APP_KEY=your_js_key_here
```

---

## 6. MVP 데이터 전략 (단계별)

| 단계 | 데이터 소스 | 목표 |
|---|---|---|
| **MVP 초기 (지금)** | 하드코딩 더미 데이터 5개 | UI/UX 검증 |
| **MVP v0.2** | LH 공공 API 연동 (실제 공고) | 실데이터 확인 |
| **MVP v0.3** | 국토교통부 실거래가 → 시뮬레이션 자동화 | 차익 계산 자동화 |
| **성장 단계** | 국토교통부 API + LH API + SH 크롤러 + AI 요약 | 전체 파이프라인 |

> 💡 **아이디어 제안:** 공공데이터포털 API는 발급까지 최대 24시간 소요될 수 있으므로, 지금 바로 [data.go.kr](https://www.data.go.kr)에서 아래 2개 API를 신청해 두는 것을 권장합니다.
> 1. `한국토지주택공사_분양임대공고문 조회 서비스`
> 2. `국토교통부_아파트 전월세 실거래가 자료`
