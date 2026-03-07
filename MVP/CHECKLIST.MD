# 집스텝(ZipStep) MVP 개발 체크리스트

> 마지막 업데이트: 2026-03-07  
> 기반 문서: PRD.MD / IA.MD / TECH SPEC.MD

---

## Phase 0 – 프로젝트 초기화

- [x] Next.js 14 (App Router) 프로젝트 생성
  ```bash
  npx create-next-app@latest imdaetalk \
    --typescript --tailwind --eslint --app \
    --src-dir=false --import-alias='@/*'
  ```
- [x] `.env.local` 파일 생성 및 환경 변수 정의
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_KAKAO_APP_KEY` (카카오 REST API 키)
  - `NEXT_PUBLIC_NAVER_CLIENT_ID`
- [x] 추가 패키지 설치 (`@supabase/ssr`, `@supabase/supabase-js`, `lucide-react`)
- [x] `shadcn/ui` 초기화 및 컴포넌트 추가
- [x] Pretendard 폰트 설정 (`globals.css` CDN import)
- [x] 글로벌 CSS 커스텀 토큰 정의 (`app/globals.css`)
  - Primary (Growth Mint): `--primary: #00D09E` 
  - Accent (Coin Yellow): `--profit: #FFD54F`
  - Surface: `--card: #FFFFFF`, `--surface: hsl(210,20%,97%)`
  - Bento Box 스타일 유틸리티 (`.bento-box`, `.card-hover`, `.glass`)

---

## Phase 1 – 공통 레이아웃 & 공유 컴포넌트

- [x] `app/layout.tsx` – 모바일 래퍼 + GNB 포함 루트 레이아웃 (→ 웹앱 반응형 전환 예정)
- [x] `components/GNB.tsx` – 로고, 우측 알림/마이페이지 아이콘 버튼
- [x] `components/FAB.tsx` – 우측 하단 지도 아이콘 플로팅 액션 버튼
- [ ] `components/BottomBar.tsx` – 상세 페이지 하단 고정 바 (슬롯 props 방식)
- [ ] `components/LoadingSkeleton.tsx` – 카드 스켈레톤 (shimmer 애니메이션)
- [x] `components/ui/BentoBox.tsx` – 벤토 박스 공통 래퍼 컴포넌트

---

## Phase 2 – Supabase 연동 (Auth & DB)

### 2-1. 클라이언트 유틸리티
- [x] `utils/supabase/client.ts` – `createBrowserClient` (CSR용)
- [x] `utils/supabase/server.ts` – `createServerClient` (SSR / Route Handler용)
- [x] `middleware.ts` – 세션 갱신 미들웨어 (`updateSession`)

### 2-2. OAuth 설정 (Supabase Dashboard)
- [ ] 카카오 OAuth 앱 등록 → Supabase Auth Provider 연결
- [ ] 네이버 OAuth 앱 등록 → Supabase Auth Provider 연결
- [ ] Redirect URL 등록: `https://<your-domain>/auth/callback`

### 2-3. Route Handler
- [x] `app/auth/callback/route.ts` – OAuth 콜백 처리 (code → session 교환)

### 2-4. DB 스키마 (SQL Migration)
- [ ] `profiles` 테이블
  ```sql
  id uuid PRIMARY KEY REFERENCES auth.users,
  name text, age int, region text,
  no_house_years int, subscription_count int,
  monthly_income int, email text,
  alert_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
  ```
- [ ] `notices` 테이블
  ```sql
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL, region text,
  deposit bigint, rent_fee int,
  area_sqm numeric, current_market_price bigint,
  expected_profit_10y bigint, conversion_price bigint,
  source_url text, published_at date,
  subscription_open date, subscription_close date,
  winner_announce date, contract_date date
  ```
- [ ] `notice_ai_summary` 테이블
  ```sql
  notice_id uuid REFERENCES notices PRIMARY KEY,
  summary_line1 text, summary_line2 text, summary_line3 text,
  eligibility_checklist jsonb
  ```
- [ ] `subscriptions` 테이블
  ```sql
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles,
  notice_id uuid REFERENCES notices,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, notice_id)
  ```
- [ ] Row Level Security (RLS) 정책 설정

### 2-5. DB 헬퍼
- [ ] `utils/supabase/db.ts` – `Database` 타입 제네릭 + 공통 쿼리 함수 (getNotices, getNoticeById, upsertProfile, toggleSubscription)

---

## Phase 3 – 인증 페이지 (`/auth/login`)

- [x] `app/auth/login/page.tsx` 생성
  - [x] 집스텝 로고 (Z 이니셜) + 슬로건 ("돈 되는 청약을 쉽게 찾아드려요 💸")
  - [x] 카카오 로그인 버튼 (배경 #FEE500, 아이콘 SVG)
  - [x] 네이버 로그인 버튼 (배경 #03C75A, N 이니셜)
  - [x] `supabase.auth.signInWithOAuth({ provider: 'kakao' | 'naver' })` 연결
  - [x] 로그인 성공 후 `/` 또는 이전 페이지로 리다이렉트

---

## Phase 4 – 메인 피드 (`/`)

### 4-1. 더미 데이터
- [x] `data/dummyNotices.ts` – 공고 5개 JSON 배열
  - 필드: `id, title, region, district, type, ai_summary[3], deposit, rent_fee, expected_profit, is_eligible, area_sqm, current_market_price, conversion_price, subscription_open, subscription_close, winner_announce, contract_date, source_url, published_at`
  - 예시 공고: 마곡 행복주택, 수서 역세권 청년주택, 고덕 강일 공공임대 등

### 4-2. 카드 컴포넌트
- [x] `components/NoticeCard.tsx` 생성
  - [x] **예상 시세 차익 모듈**: Coin Yellow 그라디언트 배경 + 32px 굵은 폰트
  - [x] AI 3줄 요약 미리보기 (1줄만 노출, `line-clamp-1`)
  - [x] 조건 부합 여부 Badge (`is_eligible`: ✅ 지원 가능 🎯 / ❌ 조건 확인 🥲)
  - [x] 탭 / 누름 애니메이션 (`active:scale-[0.98]`)
  - [x] 긴급 마감 배너 (D-7 이내 자동 노출)
  - [x] 공고 유형별 컬러 뱃지 (행복주택/국민임대/공공분양 등)

### 4-3. 메인 페이지
- [x] `app/page.tsx` 생성
  - [x] 상단: 오늘의 맞춤 공고 + 지원 가능 건수 표시
  - [x] 지역 필터 칩 + 정렬 버튼 (최신순 / 차익 높은 순)
  - [x] NoticeCard 리스트 세로 스크롤 렌더링
  - [x] 비로그인 상태: Growth Mint 그라디언트 로그인 유도 배너
  - [x] FAB 컴포넌트 배치
  - [ ] 로딩 시 스켈레톤 UI (미구현)

---

## Phase 5 – 상세 페이지 (`/detail/[id]`)

- [x] `app/detail/[id]/page.tsx` – 서버 컴포넌트 (Supabase 세션 확인)

### 5-1. Hero 섹션
- [x] 큼지막한 타이포그래피 + 차익 금액 그라디언트 텍스트 (`text-5xl font-black text-gradient-profit`)
- [x] 부제: 현재 시세 대비 상승 여력 % 표시

### 5-2. 시뮬레이션 카드 (자산 성장 시뮬레이터)
- [x] 계산 근거 4행 테이블 벤토 박스 (현재 시세 → 10년 뒤 예상 → 분양전환가 → 순수익)

### 5-3. AI 3줄 요약 섹션 (`💡 AI 핵심 브리핑`)
- [x] 배경 카드에 넘버드 Badge (1, 2, 3) + 요약 텍스트

### 5-4. 내 조건 부합 여부 섹션 (`🎯 내 가점 체크`)
- [x] 체크리스트 UI (5개 항목: 나이, 무주택, 청약통장, 소득, 지역)
- [x] 로그인 상태: CheckCircle2 / AlertCircle 아이콘
- [x] 비로그인: 자물쇠 + 로그인 유도 배너

### 5-5. 청약 일정표 (`📅 일정 타임라인`)
- [x] 세로 타임라인 UI (완료/진행중/예정 상태별 컬러)

### 5-6. 하단 고정 액션바
- [x] '공고 원문' 버튼 → `source_url` 외부 링크
- [x] '알림 구독하기' 버튼 (→ Supabase 연동 미완성)
  - [ ] 비로그인 클릭 시 `/auth/login` 리다이렉트 로직 미연결

---

## Phase 6 – 마이페이지 (`/mypage`)

- [x] `app/mypage/page.tsx` – 로그인 보호 (`redirect` to `/auth/login` if no session)
- [x] `components/ProfileForm.tsx` – 1인 가구 가점 계산기 폼
  - [x] 필드: 나이, 무주택기간, 청약통장 납입 횟수, 월 소득, 거주 지역
  - [x] 저장 시 `profiles` 테이블 UPSERT
  - [x] 저장 완료 토스트: "폼말 저장됨! 이제 맞춤 공고만 골라드릴게요 🎯"
- [x] 구독 중인 공고 리스트 (`subscriptions` JOIN `notices` 조회)
- [x] 이메일 알림 ON/OFF 토글 UI (alert_enabled 표시)
- [x] `app/auth/signout/route.ts` 로그아웃 Route Handler
- [x] `utils/supabase/db.ts` – DB 쿼리 헬퍼 전체 (getNotices, getNoticeById, upsertProfile, toggleSubscription)
- [x] `supabase/schema.sql` – DB 스키마 + RLS + 인덱스 + 신규유저 트리거

---

## Phase 7 – 지도 뷰 (선택 출시)

- [ ] 지도 라이브러리 선택 (카카오맵 SDK 또는 네이버 Maps API)
- [ ] `app/map/page.tsx` 또는 `/` 내 슬라이딩 모달로 지도 뷰 구현
- [ ] 공고 위치 마커 표시
- [ ] 마커 클릭 시 미니 팝업 카드 (단지명 + 예상 차익 + 상세보기 링크)
- [ ] FAB 클릭 시 지도/피드 뷰 전환 애니메이션

---

## Phase 8 – 데이터 파이프라인 스크립트 (Python)

- [ ] `scripts/crawler/lh_crawler.py` – LH청약센터 HTML 크롤러 (Playwright)
- [ ] `scripts/crawler/sh_crawler.py` – SH공사 공고 크롤러
- [ ] `scripts/ai_summary/summarizer.py` – Ollama(Llama-3 / EEVE) 호출, 3줄 요약 생성
- [ ] `scripts/simulator/profit_calculator.py` – TECH SPEC 3.2 공식 구현
  ```python
  future_price = current_price * (1 + annual_rate) ** 10
  conversion_price = (construction_cost + future_appraisal) / 2
  expected_profit = future_price - conversion_price
  ```
- [ ] Supabase Edge Function 스텁: `supabase/functions/send-alert/index.ts`

---

## Phase 9 – 알림 / 이메일 (성장 단계)

- [ ] Resend 또는 SendGrid 계정 연결
- [ ] 이메일 템플릿 HTML 작성 (조건 부합 공고 알림)
- [ ] Supabase Edge Function `send-alert` 완성 (내 조건 매칭 로직 포함)
- [ ] 주 1회 뉴스레터 스케줄링 (Supabase pg_cron 또는 Vercel Cron Jobs)
- [ ] 구독/수신 거부 링크 처리

---

## Phase 10 – 품질 & 배포

- [ ] **SEO**: `app/layout.tsx` 메타데이터 완성 (title, description, OG, Twitter Card)
- [ ] **접근성**: 색상 대비 WCAG AA 기준 확인, `aria-label` 점검
- [ ] **반응형**: 375px(모바일), 768px(태블릿) 레이아웃 검증
- [ ] **환경 변수**: Vercel 대시보드에 모든 env 등록
- [ ] **RLS 재확인**: 모든 Supabase 테이블 Row Level Security 정책 점검
- [ ] **Lighthouse 점수**: Performance ≥85, Accessibility ≥90, SEO ≥90
- [ ] **GitHub → Vercel CI/CD**: main 브랜치 push 시 자동 배포 확인
- [ ] `vercel.json` 설정 (보안 헤더, 404 리다이렉트 등)
- [ ] 스테이징 환경에서 E2E 흐름 전체 검증
  - [ ] 로그인 → 조건 입력 → 메인 피드 → 상세 → 알림 구독 → 마이페이지

---

## MVP 출시 기준 요약

| 단계 | 포함 Phase | 상태 |
|------|-----------|------|
| **MVP Core** | Phase 0–5 | 🟡 진행 중 (UI 완성, Auth/DB 미연결) |
| **리브랜딩** | 집스텝 전환 + 웹앱 전환 | 🟡 진행 중 |
| **MVP Plus** | Phase 6 마이페이지 | 🔲 미시작 |
| **Growth** | Phase 7–9 (실데이터 + 알림) | 🔲 미시작 |
| **Launch Ready** | Phase 10 (배포/품질) | 🔲 미시작 |

---

*이 체크리스트는 PRD.MD, IA.MD, TECH SPEC.MD를 기반으로 하며, 개발 진행에 따라 지속 업데이트하세요.*
