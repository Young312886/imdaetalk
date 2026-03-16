# 임대톡(Talk) MVP Tech Spec

## 3.1 기술 스택
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Lucide React
- **Backend & DB (BaaS):** Supabase (PostgreSQL, Auth, SSR)
- **Data Pipeline (Python 3.13):**
  - `requests`, `python-dotenv`: API 연동 및 환경 설정
  - `supabase-py`: DB UPSERT 처리
  - `ollama-python`: Llama3 기반 AI 요약 연동
- **Deploy (배포):**
  - **Frontend:** Vercel (GitHub CI/CD)
  - **Data Pipeline:** GitHub Actions 또는 로컬 스케줄러

## 3.2 핵심 로직: '분양전환가 시뮬레이션' 수식
- **주변 시세 추정:** 지역별 ㎡당 기준 시세 (서울 1500만, 경기 700만 등) × 전용면적
- **10년 뒤 예상 시세:** `현재 시세 * 1.05^10` (약 1.63배)
- **유형별 분양전환가:** 시세 대비 할인율 적용 (60% ~ 85%)
- **최종 예상 차익:** `10년 뒤 시세 - 분양전환가`

## 3.3 아키텍처 특징
- **Server Component 중심**: Supabase 직접 쿼리를 통한 성능 최적화 및 보안 강화
- **Responsive Design**: 모바일 전용 `max-w-md` 래퍼와 데스크탑 `grid` 레이아웃 공존
- **Bento Box UI**: 정보를 직관적인 카드 형태로 모듈화하여 가독성 증대
- **Data Integrity**: `notice_ai_summary`를 별도 테이블로 분리하여 AI 데이터 확장성 확보
