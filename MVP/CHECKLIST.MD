# 집스텝(ZipStep) MVP 개발 체크리스트

> 마지막 업데이트: 2026-03-16  
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

- [x] `app/layout.tsx` – 모바일 래퍼 (`max-w-md`) + GNB 포함 루트 레이아웃 (반응형 `max-w-screen-xl` 적용)
- [x] `components/GNB.tsx` – 로고 ('Z'), 우측 알림/마이페이지 아이콘 버튼 (반응형 대응)
- [x] `components/FAB.tsx` – 우측 하단 지도 아이콘 플로팅 액션 버튼
- [x] `components/SubscribeButton.tsx` – 상세 페이지 하단/사이드바 알림 구독 버튼 (`BottomBar` 대체)
- [x] `components/LoadingSkeleton.tsx` – 카드 및 리스트 스켈레톤 UI
- [x] `components/ui/BentoBox.tsx` – 벤토 박스 공통 래퍼 컴포넌트

---

## Phase 2 – Supabase 연동 (Auth & DB)

### 2-1. 클라이언트 유틸리티
- [x] `utils/supabase/client.ts` – `createBrowserClient` (CSR용)
- [x] `utils/supabase/server.ts` – `createServerClient` (SSR / Route Handler용)
- [x] `middleware.ts` – 세션 갱신 미들웨어 (`updateSession`)

### 2-2. OAuth 설정 (Supabase Dashboard)
- [ ] 카카오 OAuth 앱 등록 → Supabase Auth Provider 연결 (설정 확인 필요)
- [ ] 네이버 OAuth 앱 등록 → Supabase Auth Provider 연결 (설정 확인 필요)
- [x] Redirect URL 등록: `https://<your-domain>/auth/callback`

### 2-3. Route Handler
- [x] `app/auth/callback/route.ts` – OAuth 콜백 처리 (code → session 교환)

### 2-4. DB 스키마 (SQL Migration)
- [x] `profiles` 테이블 (RLS 포함)
- [x] `notices` 테이블 (`lat`, `lng` 컬럼 추가 및 RLS 포함)
- [x] `notice_ai_summary` 테이블 (RLS 포함)
- [x] `subscriptions` 테이블 (RLS 포함)
- [x] Row Level Security (RLS) 정책 설정 완료

### 2-5. DB 헬퍼
- [x] `utils/supabase/db.ts` – `NoticeWithSummary` 타입 및 공통 쿼리 함수 완성 (`getNotices`, `getNoticeById`, `upsertProfile`, `toggleSubscription`)

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
- [x] `data/dummyNotices.ts` – 공고 5개 JSON 배열 (초기 UI 개발용)
- [x] `scripts/output/notices_raw.json` – 파이프라인 테스트용 UUID 기반 더미 데이터

### 4-2. 카드 컴포넌트
- [x] `components/NoticeCard.tsx` 생성
  - [x] **예상 시세 차익 모듈**: Coin Yellow 그라디언트 배경 + 32px 굵은 폰트 (`expected_profit_10y` 연동)
  - [x] AI 3줄 요약 미리보기 (`notice_ai_summary` join 데이터 연동)
  - [x] 조건 부합 여부 Badge (프로필 연동 대기)
  - [x] 탭 / 누름 애니메이션 (`active:scale-[0.98]`)
  - [x] 긴급 마감 배너 (D-7 이내 자동 노출)
  - [x] 공고 유형별 컬러 뱃지 (행복주택/국민임대/공공분양 등)

### 4-3. 메인 페이지
- [x] `app/page.tsx` 생성
  - [x] 상단: 오늘의 맞춤 공고 + 지원 가능 건수 표시
  - [x] 지역 필터 칩 + 정렬 버튼 (디자인 적용)
  - [x] NoticeCard 리스트 세로 스크롤 및 반응형 그리드 (`grid-cols-1 md:2 xl:3`)
  - [x] 비로그인 상태: Growth Mint 그라디언트 로그인 유도 배너
  - [x] FAB 컴포넌트 배치
  - [x] Supabase 실시간 DB 연동 (`getNotices` 적용)

---

## Phase 5 – 상세 페이지 (`/detail/[id]`)

- [x] `app/detail/[id]/page.tsx` – 서버 컴포넌트 (Supabase 세션 확인)
- [x] **DB 연동**: `getNoticeById`를 통한 실시간 데이터 렌더링 완성

### 5-1. Hero 섹션
- [x] 큼지막한 타이포그래피 + 차익 금액 그라디언트 텍스트 (`expected_profit_10y` 기반)
- [x] 부제: 현재 시세 대비 상승 여력 % 표시

### 5-2. 시뮬레이션 카드 (자산 성장 시뮬레이터)
- [x] 계산 근거 4행 테이블 벤토 박스 (현재 시세 → 10년 뒤 예상 → 분양전환가 → 순수익)
- [x] PC 사이드바 / 모바일 하단 반응형 레이아웃 분리 적용

### 5-3. AI 3줄 요약 섹션 (`💡 AI 핵심 브리핑`)
- [x] 배경 카드에 넘버드 Badge (1, 2, 3) + 요약 텍스트 (`notice_ai_summary` 연동)

### 5-4. 내 조건 부합 여부 섹션 (`🎯 내 가점 체크`)
- [x] 체크리스트 UI (AI가 생성한 `eligibility_checklist` 연동)
- [x] 로그인 상태: CheckCircle2 / AlertCircle 아이콘
- [x] 비로그인: 자물쇠 + 로그인 유도 배너

### 5-5. 청약 일정표 (`📅 일정 타임라인`)
- [x] 세로 타임라인 UI (완료/진행중/예정 상태별 컬러)

### 5-6. 하단 고정 액션바
- [x] '공고 원문' 버튼 → `source_url` 외부 링크
- [x] `SubscribeButton` 컴포넌트 연동 (로그인 체크 및 구독 토글 로직 포함)

---

## Phase 6 – 마이페이지 (`/mypage`)

- [x] `app/mypage/page.tsx` – 로그인 보호 (`redirect` to `/auth/login` if no session)
- [x] `components/ProfileForm.tsx` – 1인 가구 가점 계산기 폼
  - [x] 필드: 나이, 무주택기간, 청약통장 납입 횟수, 월 소득, 거주 지역
  - [x] 저장 시 `profiles` 테이블 UPSERT
  - [x] 저장 완료 토스트: "폼말 저장됨! 이제 맞춤 공고만 골라드릴게요 🎯"
- [x] 구독 중인 공고 리스트 (`subscriptions` JOIN `notices` 조회)
- [x] 글로벌 이메일 알림 ON/OFF 토글 (`components/AlertToggle.tsx` 클라이언트 액션)
- [x] `app/auth/signout/route.ts` 로그아웃 Route Handler

---

## Phase 7 – 지도 뷰 (선택 출시)

- [ ] 지도 라이브러리 선택 (카카오맵 SDK 또는 네이버 Maps API)
- [ ] `app/map/page.tsx` 또는 `/` 내 슬라이딩 모달로 지도 뷰 구현
- [ ] 공고 위치 마커 표시
- [ ] 마커 클릭 시 미니 팝업 카드 (단지명 + 예상 차익 + 상세보기 링크)
- [ ] FAB 클릭 시 지도/피드 뷰 전환 애니메이션

---

## Phase 8 – 데이터 파이프라인 스크립트 (Python)

- [x] **기반 구축**: `.env` 및 패키지 의존성 (`supabase`, `requests` 등) 설정 완료
- [x] (A) 파이썬 수집 스크립트 작성 (`scripts/fetch_lh.py`)
  - [x] LH OpenAPI 연동 (OpenAPI 키 및 VWorld 지오코딩 연동)
  - [x] SH OpenAPI 연동 (서울 열린데이터광장)
- [x] (B) AI 요약 & 자격 조건 추출 (`scripts/summarize_ai.py`)
  - [x] Ollama(llama3) 연동 및 규칙 기반 fallback 로직 구현
  - [x] 공고 본문 기준 1인가구 청약 자격(소득/자산/나이) 판별
- [x] (C) 시세 차익 시뮬레이션 로직 보완 (`scripts/simulate_profit.py`)
  - [x] 주변 시세 대비 예상 10년 차익 계산식 구현 (유형별 할인율 적용)
- [x] (D) Supabase DB 저장 로직 (`scripts/save_to_supabase.py`)
  - [x] 수집·연산 완료된 데이터를 `notices` / `notice_ai_summary` 테이블에 UPSERT 로직 완성
- [x] (E) 앱(프론트) 데이터 연동
  - [x] `app/page.tsx`, `detail/[id]/page.tsx` 실시간 DB 조회 구현

---

## Phase 9 – 알림 / 이메일 (성장 단계)

- [ ] Resend 또는 SendGrid 계정 연결
- [ ] 이메일 템플릿 HTML 작성 (조건 부합 공고 알림)
- [ ] Supabase Edge Function `send-alert` 완성 (내 조건 매칭 로직 포함)
- [ ] 주 1회 뉴스레터 스케줄링 (Supabase pg_cron 또는 Vercel Cron Jobs)
- [ ] 구독/수신 거부 링크 처리

---

## Phase 10 – 품질 & 배포

- [x] **SEO**: `app/layout.tsx` 메타데이터 및 SEO 태그 최적화 완료
- [ ] **접근성**: 색상 대비 WCAG AA 기준 확인, `aria-label` 점검
- [x] **반응형**: 모바일(`max-w-md`), 태블릿, PC(`max-w-screen-xl`) 레이아웃 완성 및 검증
- [x] **환경 변수**: Vercel 대시보드 및 로컬 `.env` 설정 완료
- [x] **RLS 재확인**: 모든 Supabase 테이블 Row Level Security 정책 점검 완료
- [ ] **Lighthouse 점수**: Performance ≥85, Accessibility ≥90, SEO ≥90
- [x] **GitHub → Vercel CI/CD**: 배포 자동화 확인
- [x] `vercel.json` 설정 (보안 헤더 및 최적화 설정 완료)

---

## MVP 출시 기준 요약

- [x] Phase 1 공통 컴포넌트 및 레이아웃 완성
- [x] Phase 2~3 Supabase Auth 및 DB 연동 완성
- [x] Phase 4~5 메인 피드 및 상세 페이지 (실시간 DB 연동) 완성
- [x] Phase 6 마이페이지 및 프로필 설정 완성
- [x] Phase 8 Python 데이터 파이프라인 (수집-요약-계산-저장) 완성
- [x] Phase 10 배포 및 반응형 최적화 완료

## MVP 출시 상태 요약

| 단계 | 포함 Phase | 상태 |
|------|-----------|------|
| **MVP Core** | Phase 0–5 | ✅ 완료 |
| **리브랜딩** | 집스텝 전환 + 앱 전환 | ✅ 완료 |
| **MVP Plus** | Phase 6 마이페이지 | ✅ 완료 |
| **Data Flow** | Phase 8 데이터 파이프라인 | ✅ 완료 |
| **Launch Ready** | Phase 10 | ✅ 완료 |
| **AI Agents** | Phase 11 MCP 연동 | ✅ 완료 |

---

## Phase 11 – AI 에이전트 (MCP) 연동 및 작업 관리

- [x] **Filesystem MCP 적용**: 현재 프로젝트 외 인접 프로젝트 폴더 참조 허용
- [x] **Jira MCP 적용**: 사용자 인증 기반 지라 연결 및 KAN-1 이슈(티켓) 생성 완료
- [x] **상태 정리 / 안정화**: 서버 템플릿 정리 및 실행 충돌 해결
- [x] **외부 정보/문서 연동**:
  - [x] Brave Search API Key 등록 (웹 검색 적용)
  - [x] Notion API Secret 등록 (노션 DB 읽기/쓰기 적용)
  - [ ] Google Drive Credentials (설정 대기)

---

*이 체크리스트는 PRD.MD, IA.MD, TECH SPEC.MD를 기반으로 하며, 개발 진행에 따라 지속 업데이트하세요.*
