# 집스텝 데이터 파이프라인 스크립트

공공임대 청약 공고 데이터를 자동으로 수집·요약·저장하는 Python 스크립트 모음입니다.

---

## 실행 순서

```bash
# 1단계: LH/SH API에서 공고 수집
python scripts/fetch_lh.py --region 서울 --limit 50

# 2단계: AI 3줄 요약 + 자격 판별  (Ollama 없으면 규칙 기반 자동 실행)
python scripts/summarize_ai.py --no-ollama

# 3단계: 시세 차익 시뮬레이션
python scripts/simulate_profit.py

# 4단계: Supabase DB UPSERT
python scripts/save_to_supabase.py
```

> **한 번에 실행:**
> ```bash
> python scripts/fetch_lh.py && python scripts/summarize_ai.py --no-ollama && python scripts/simulate_profit.py && python scripts/save_to_supabase.py
> ```

---

## 환경 설정

### 1. 패키지 설치

```bash
pip install requests python-dotenv supabase ollama
```

### 2. `.env` 파일 (scripts/ 루트 또는 프로젝트 루트)

```env
# LH 공공데이터포털 API 키
# https://www.data.go.kr → "LH 임대주택 입주자 모집" 검색 후 활용 신청
LH_API_KEY=your_lh_api_key

# SH 서울주택도시공사 API 키 (선택)
SH_API_KEY=your_sh_api_key

# Supabase (service_role 키 — RLS 우회용, 절대 프론트에 노출 금지)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Ollama 설치 (AI 요약 사용 시)

```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3   # 모델 다운로드 (~4GB)
ollama serve         # 별도 터미널에서 실행

# 이후 summarize_ai.py 를 --no-ollama 없이 실행
python scripts/summarize_ai.py
```

---

## 스크립트별 설명

| 스크립트 | 입력 | 출력 |
|---------|------|------|
| `fetch_lh.py` | LH API | `output/notices_raw.json` |
| `summarize_ai.py` | `notices_raw.json` | `output/notices_with_ai.json` |
| `simulate_profit.py` | `notices_with_ai.json` | `output/notices_final.json` |
| `save_to_supabase.py` | `notices_final.json` | Supabase DB (notices, notice_ai_summary) |

### 주요 옵션

```bash
# fetch_lh.py
--region 서울   # 지역 필터
--limit 100     # 최대 수집 건수
--sh            # SH 공고 추가 수집

# summarize_ai.py
--no-ollama         # Ollama 없이 규칙 기반 요약
--model llama3.1    # 다른 Ollama 모델 사용

# save_to_supabase.py
--dry-run       # 실제 저장 없이 변환 결과 확인
```

---

## 데이터 흐름

```
LH Open API ─┐
SH Open API  ─┴─► fetch_lh.py ─► notices_raw.json
                                       │
                     summarize_ai.py ◄─┘
                          │
                   notices_with_ai.json
                          │
                  simulate_profit.py ◄─── 지역별 시세 상수
                          │
                   notices_final.json
                          │
                 save_to_supabase.py
                          │
                    Supabase DB
                  ┌────────────────┐
                  │ notices         │
                  │ notice_ai_summary│
                  └────────────────┘
```
