# 집스텝 (ZipStep) 🏠

> **무주택 1인 가구가 내 집 마련과 자산 증식을 향해 밟는 첫 스텝.**

복잡한 공공임대/분양 공고를 AI가 3줄로 요약하고, 10년 뒤 예상 시세 차익까지 계산해드리는 **핀테크 청약 계산기 웹앱**입니다.

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| 🤖 **AI 공고 요약** | 어려운 공고문을 3줄로 압축 |
| 💸 **시세 차익 시뮬레이터** | 10년 뒤 예상 수익 자동 계산 |
| 🎯 **내 가점 체크** | 나이·소득·무주택 조건 자동 매칭 |
| 📅 **청약 일정 타임라인** | 모집~계약까지 한눈에 |
| 🔔 **맞춤 알림 구독** | 조건 맞는 공고 알림 수신 |

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) + TypeScript |
| 스타일링 | Tailwind CSS + shadcn/ui |
| 폰트 | Pretendard |
| 백엔드/인증 | Supabase (Auth + PostgreSQL + RLS) |
| 배포 | Vercel |

---

## 현재 개발 진행 상황

```
✅ Phase 0  프로젝트 초기화 (Next.js, Supabase, shadcn/ui)
✅ Phase 1  공통 레이아웃 & GNB/FAB/BentoBox 컴포넌트
✅ Phase 2  Supabase 클라이언트 유틸리티 & Auth 콜백 라우터
✅ Phase 4  메인 피드 (더미 데이터 + NoticeCard + 반응형 그리드)
✅ Phase 5  상세 페이지 (Hero + AI 요약 + 가점 체크 + 타임라인 + 시뮬레이터)
🟡 Phase 2  Supabase DB 스키마 & OAuth 연동 (진행 예정)
🟡 Phase 3  로그인 페이지 (카카오/네이버 OAuth UI)
🔲 Phase 6  마이페이지 (1인 가구 가점 계산기)
🔲 Phase 8  데이터 파이프라인 (LH/SH 크롤러 + AI 요약 스크립트)
🔲 Phase 10 배포 & 품질 (SEO, Lighthouse, CI/CD)
```

---

## 로컬 실행 방법

```bash
# 1. 의존성 설치
cd imdaetalk
npm install

# 2. 환경 변수 설정 (.env.local)
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# 3. 개발 서버 실행
npm run dev
# → http://localhost:3000
```

---

## 프로젝트 구조

```
imdaetalk/
├── app/
│   ├── layout.tsx          # 루트 레이아웃 + SEO 메타데이터
│   ├── page.tsx            # 메인 피드 (반응형 카드 그리드)
│   ├── detail/[id]/        # 공고 상세 페이지 (2컬럼 레이아웃)
│   └── auth/               # 로그인 & OAuth 콜백
├── components/
│   ├── GNB.tsx             # 글로벌 네비게이션 바
│   ├── NoticeCard.tsx      # 공고 카드 컴포넌트
│   └── ui/                 # shadcn/ui 래퍼
├── data/
│   └── dummyNotices.ts     # 더미 공고 데이터
└── utils/supabase/         # Supabase 클라이언트 유틸리티
```

---

## MVP 문서

- [📋 CHECKLIST](./MVP/CHECKLIST.MD) — 개발 체크리스트
- [📐 PRD](./MVP/PRD.MD) — 제품 요구사항 정의서
- [🏗️ TECH SPEC](./MVP/TECH%20SPEC.MD) — 기술 스펙
- [📊 DATA SPEC](./MVP/DATA_SPEC.MD) — 데이터 스펙

---

*집스텝 팀 · 2026*
