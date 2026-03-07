# 집스텝 Git 워크플로우 가이드

## 브랜치 구조

```
main        ← 프로덕션 (Vercel 자동 배포)
develop     ← 개발 통합 브랜치
feat/*      ← 기능 개발 브랜치
fix/*       ← 버그 수정 브랜치
chore/*     ← 문서/설정/리팩터링
```

## 🚨 기능 완료 시 GitHub 업로드 원칙

> **기능 단위 완료마다 반드시 커밋 & 푸시**

```bash
# 1. 작업 브랜치에서 변경사항 스테이징
git add -A

# 2. 커밋 (Conventional Commits 형식)
#    PowerShell 특수문자 이슈 → 메시지 파일 사용 권장
git commit -F .git_commit_msg.txt

# 3. 현재 브랜치로 푸시
git push origin <브랜치명>

# 4. 기능 완성 시 develop → PR → main
```

> **PowerShell 커밋 팁**: 괄호`()`, 슬래시`/`, 한글 포함 메시지는  
> `.git_commit_msg.txt` 파일에 작성 후 `git commit -F` 사용

## 커밋 메시지 컨벤션

| 타입 | 용도 | 예시 |
|------|------|------|
| `feat` | 새 기능 | `feat: add login page with Kakao OAuth` |
| `fix` | 버그 수정 | `fix: fix login redirect error` |
| `chore` | 설정/문서 | `chore: update CHECKLIST.MD` |
| `style` | UI/CSS 변경 | `style: update profit badge color` |
| `refactor` | 리팩터링 | `refactor: extract supabase query helpers` |

## Phase별 브랜치 계획

| Phase | 브랜치명 | 상태 |
|-------|----------|------|
| Phase 0: 초기화 | `chore/project-setup` | ✅ 완료 |
| Phase 1-5: UI 기초 + 리브랜딩 | `chore/project-setup` | ✅ 완료 |
| Phase 2: Supabase DB & OAuth | `feat/supabase-auth-db` | 🔲 예정 |
| Phase 3: 로그인 페이지 | `feat/auth-login-page` | 🔲 예정 |
| Phase 6: 마이페이지 | `feat/mypage` | 🔲 예정 |
| Phase 8: 데이터 파이프라인 | `feat/data-pipeline` | 🔲 예정 |
| Phase 10: 배포 & SEO | `chore/deploy-quality` | 🔲 예정 |

## 현재 저장소 상태

- **Remote:** https://github.com/Young312886/imdaetalk
- **기본 브랜치:** `main` (Vercel 배포 대상)
- **현재 작업 브랜치:** `chore/project-setup`
- **마지막 커밋:** `feat: rebrand to ZipStep and responsive web app layout`
