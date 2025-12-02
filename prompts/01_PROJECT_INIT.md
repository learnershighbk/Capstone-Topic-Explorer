# Prompt: Project Initialization

## 목적
Next.js + Supabase + Vercel 기반 Capstone Topic Explorer v2.0 프로젝트 초기 설정

---

## 프롬프트

```
프로젝트를 다음 스펙으로 초기화해줘:

## 프로젝트 정보
- 이름: capstone-topic-explorer
- 설명: A Guided Tool for GKS Global Network Scholarship Students to explore capstone project topics

## 기술 스택
- Framework: Next.js 14+ (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- Database: Supabase (PostgreSQL)
- Deployment: Vercel
- AI: Google Gemini API

## 폴더 구조
src/
├── app/
│   ├── page.tsx                    # 메인 페이지 (4단계 플로우)
│   ├── my-page/
│   │   ├── page.tsx               # 저장된 분석 목록
│   │   └── [id]/page.tsx          # 상세 분석 조회
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts     # 학번 로그인
│   │   │   ├── logout/route.ts    # 로그아웃
│   │   │   └── session/route.ts   # 세션 확인
│   │   ├── gemini/
│   │   │   ├── issues/route.ts    # 정책 이슈 생성
│   │   │   ├── topics/route.ts    # 주제 생성
│   │   │   └── analysis/route.ts  # 상세 분석
│   │   ├── search/
│   │   │   ├── data-sources/route.ts   # 데이터 소스 검증
│   │   │   └── references/route.ts     # 참고문헌 검증
│   │   ├── saved-topics/
│   │   │   ├── route.ts           # GET(목록), POST(저장)
│   │   │   └── [id]/route.ts      # GET(상세), DELETE(삭제)
│   │   └── countries/route.ts     # UN 193개국 목록
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── auth/
│   │   ├── LoginModal.tsx
│   │   └── AuthProvider.tsx
│   ├── steps/
│   │   ├── Step1Scope.tsx
│   │   ├── Step2Issues.tsx
│   │   ├── Step3Topics.tsx
│   │   └── Step4Analysis.tsx
│   ├── common/
│   │   ├── Header.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── CountrySelect.tsx
│   │   └── Loader.tsx
│   └── my-page/
│       └── SavedTopicCard.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── gemini.ts
│   ├── search.ts
│   ├── auth.ts
│   └── validation.ts
├── data/
│   ├── un-countries.ts            # UN 193개국 데이터
│   └── trusted-sources.ts         # 신뢰할 수 있는 데이터 소스
├── types/
│   └── index.ts
└── hooks/
    ├── useAuth.ts
    └── useSavedTopics.ts

## 환경 변수 템플릿 (.env.local.example)
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini
GEMINI_API_KEY=your-gemini-api-key

# Search API (for verification)
SERPER_API_KEY=your-serper-api-key

## 필수 패키지
- @supabase/ssr
- @supabase/supabase-js
- zod (validation)
- lucide-react (icons)

## 초기 파일 생성
1. 위 폴더 구조대로 빈 파일들 생성
2. .env.local.example 파일 생성
3. .gitignore에 .env.local 추가 확인
4. TypeScript 타입 정의 파일 (types/index.ts) 기본 구조 작성
```

---

## 예상 결과

프로젝트 초기화 후 다음이 준비되어야 함:
- [ ] Next.js 14 App Router 프로젝트
- [ ] TypeScript 설정 완료
- [ ] Tailwind CSS 설정 완료
- [ ] Supabase 클라이언트 설정 파일
- [ ] 폴더 구조 생성
- [ ] 환경 변수 템플릿

---

## 다음 단계

→ `02_UN_COUNTRIES.md` 실행
