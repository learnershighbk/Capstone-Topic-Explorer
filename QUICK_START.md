# 🚀 Quick Start Guide - 한 번에 전체 구현하기

## 방법 1: Cursor AI Agent 모드 (권장)

### Step 1: 프로젝트 생성 및 패키지 설치

터미널에서 실행:

```bash
# 프로젝트 생성
npx create-next-app@latest capstone-topic-explorer --typescript --tailwind --eslint --app --src-dir --use-npm
cd capstone-topic-explorer

# 패키지 설치
npm install @supabase/supabase-js @supabase/ssr zod lucide-react

# 문서 복사 (압축 해제한 폴더에서)
cp -r ../capstone-docs/doc ./doc
cp -r ../capstone-docs/prompts ./prompts

# .env.local 생성
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
GEMINI_API_KEY=your-gemini-key
SERPER_API_KEY=your-serper-key
EOF

# Cursor AI로 열기
cursor .
```

### Step 2: Cursor AI에서 한 번에 구현

1. **Cursor AI 열기** → `Cmd+I` (Mac) 또는 `Ctrl+I` (Windows)로 Composer 열기

2. **Agent 모드 활성화** → Composer 하단에서 "Agent" 선택

3. **마스터 프롬프트 입력**:

```
@prompts/MASTER_PROMPT.md 파일을 읽고 전체 프로젝트를 구현해줘.

추가 참고 문서:
- @doc/PROJECT_OVERVIEW.md
- @doc/DATABASE_SCHEMA.md  
- @doc/API_DESIGN.md
- @doc/AUTH_FLOW.md
- @doc/UN_COUNTRIES.md
- @doc/SECURITY.md
- @doc/FEATURE_MYPAGE.md
- @doc/ANTI_HALLUCINATION.md

기존 MVP UI는 @/mnt/user-data/uploads/index.html 를 참고해.
```

4. **실행** → Enter 누르고 Agent가 자동으로 모든 파일 생성

---

## 방법 2: 더 짧은 명령어

Composer에서 바로:

```
doc 폴더의 모든 문서와 prompts/MASTER_PROMPT.md를 참고해서 
Capstone Topic Explorer v2.0 전체를 한 번에 구현해줘.

핵심 요구사항:
1. Next.js 14 App Router + TypeScript + Tailwind
2. UN 193개국 선택 (South Korea 우선)
3. 9자리 학번 간편 로그인 (쿠키 기반)
4. Gemini API 서버 사이드 보안
5. My Page (분석 저장/조회/삭제)
6. Data Sources & References 웹 검색 검증
7. Supabase 연동

모든 컴포넌트, API 라우트, 유틸리티를 생성해줘.
```

---

## 방법 3: Claude에게 코드 생성 요청 후 복사

Claude (이 대화)에서:

```
MASTER_PROMPT.md의 요구사항대로 전체 코드를 생성해줘.
파일별로 나눠서 보여줘.
```

→ 생성된 코드를 Cursor AI에서 파일로 저장

---

## 구현 후 확인사항

### 1. Supabase 테이블 생성

Supabase SQL Editor에서 `doc/DATABASE_SCHEMA.md`의 SQL 실행

### 2. 환경 변수 확인

`.env.local`에 실제 API 키 입력

### 3. 개발 서버 실행

```bash
npm run dev
```

### 4. 테스트

- http://localhost:3000 접속
- Step 1~4 플로우 테스트
- 로그인/로그아웃 테스트
- My Page 저장/조회 테스트

---

## 예상 소요 시간

| 방법 | 소요 시간 |
|------|----------|
| 단계별 프롬프트 (9개) | 2~3시간 |
| **마스터 프롬프트 (1개)** | **20~30분** |

---

## 트러블슈팅

### Agent가 중간에 멈추면?

```
계속 진행해줘. 
아직 생성하지 않은 파일들을 완성해줘.
```

### 타입 에러가 발생하면?

```
타입 에러를 수정해줘.
src/types/index.ts를 확인하고 누락된 타입을 추가해.
```

### API 연동 문제?

```
.env.local 환경 변수가 제대로 로드되는지 확인하고,
API 라우트에서 환경 변수 사용 부분을 점검해줘.
```
