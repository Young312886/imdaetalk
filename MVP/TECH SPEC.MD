# 임대톡(Talk) MVP Tech Spec

## 3.1 기술 스택
- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui (빠른 고퀄리티 UI 컴포넌트)
- **Backend & DB (BaaS):** Supabase (PostgreSQL DB, Auth, Edge Functions)
- **Data Pipeline (별도 서버/스크립트):** Python (FastAPI, Selenium/Playwright - 크롤링용)
- **AI Engine (비동기 처리):** Docker + Ollama (Llama-3-8b 또는 EEVE 모델)
- **Deploy (배포):**
  - **Frontend:** GitHub 연동 ➔ Vercel (자동 CI/CD)
  - **Backend/DB:** Supabase 클라우드

## 3.2 핵심 로직: '분양전환가 시뮬레이션' 수식 (백엔드 처리)
> 💡 개발 시 기준이 될 가설 공식입니다.

- **현재 주변 시세 도출:** 반경 1km 내 유사 평형(30~40㎡) 평균 실거래가
- **10년 뒤 예상 시세:** `현재 시세 * (1 + (최근 3년 연평균 상승률 + 매크로 가중치))^10`
- **예상 분양전환가:** `(건설원가 + 10년 뒤 예상 감정가) / 2`
- **최종 예상 차익:** `10년 뒤 예상 시세 - 예상 분양전환가`