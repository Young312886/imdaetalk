# 임대톡 Git 워크플로우 가이드

## 브랜치 구조

```
main        ← 프로덕션 (Vercel 자동 배포)
develop     ← 개발 통합 브랜치
feat/*      ← 기능 개발 브랜치
fix/*       ← 버그 수정 브랜치
chore/*     ← 문서/설정/리팩터링
```

## 기능 개발 흐름 (표준)

```bash
# 1. develop 브랜치에서 새 기능 브랜치 생성
git checkout develop
git checkout -b feat/main-feed

# 2. 개발 완료 후 커밋
git add .
git commit -m "feat: 메인 피드 카드 리스트 구현 (#phase4)"

# 3. GitHub에 push
git push -u origin feat/main-feed

# 4. GitHub에서 develop으로 PR 생성 & Merge
# 5. 배포 준비 완료 시 develop → main PR Merge
```

## 커밋 메시지 컨벤션

| 타입 | 용도 | 예시 |
|------|------|------|
| `feat` | 새 기능 | `feat: NoticeCard 컴포넌트 추가` |
| `fix` | 버그 수정 | `fix: 로그인 리다이렉트 오류 수정` |
| `chore` | 설정/문서 | `chore: .gitignore 업데이트` |
| `style` | UI/CSS 변경 | `style: 차익 배지 컬러 수정` |
| `refactor` | 리팩터링 | `refactor: Supabase 쿼리 헬퍼 분리` |
| `test` | 테스트 | `test: 시뮬레이션 계산 로직 테스트` |

## Phase별 브랜치 계획

| Phase | 브랜치명 |
|-------|----------|
| Phase 0: 초기화 | `chore/project-setup` |
| Phase 1: 레이아웃 | `feat/layout-components` |
| Phase 2: Supabase | `feat/supabase-auth-db` |
| Phase 3: 로그인 | `feat/auth-login-page` |
| Phase 4: 메인 피드 | `feat/main-feed` |
| Phase 5: 상세 페이지 | `feat/detail-page` |
| Phase 6: 마이페이지 | `feat/mypage` |
| Phase 7: 지도 뷰 | `feat/map-view` |

## 현재 저장소 상태

- **Remote:** https://github.com/Young312886/imdaetalk
- **기본 브랜치:** `main` (Vercel 배포 대상)
- **개발 브랜치:** `develop` (현재 작업 기준)
