# MASTER PROMPT: Capstone Topic Explorer v2.0 전체 구현

## 프로젝트 개요
GKS 장학생을 위한 캡스톤 프로젝트 주제 탐색 AI 웹서비스입니다.
기존 MVP(index.html)를 Next.js 14 풀스택 앱으로 마이그레이션합니다.

**기술 스택**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase, OpenAI API (GPT-4o), Vercel

---

## 🎯 한 번에 구현할 전체 기능 (6가지 개선사항)

1. **UN 193개국 선택** - South Korea 우선, 알파벳순 정렬
2. **API 보안** - Gemini API 키를 서버 사이드로 이동
3. **간편 로그인** - 9자리 학번만으로 로그인 (회원가입/인증 없음)
4. **My Page** - Step 4 분석 결과 저장/조회/삭제
5. **Data Sources 검증** - 웹 검색으로 실제 존재하는 데이터 소스만 표시
6. **Key References 검증** - 실제 학술 자료만 표시

---

## 📁 생성할 폴더/파일 구조

```
src/
├── app/
│   ├── layout.tsx                    # RootLayout + AuthProvider
│   ├── page.tsx                      # 메인 페이지 (4단계 플로우)
│   ├── my-page/
│   │   ├── page.tsx                  # 저장된 분석 목록
│   │   └── [id]/page.tsx             # 저장된 분석 상세
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts        # POST - 학번 로그인
│       │   ├── logout/route.ts       # POST - 로그아웃
│       │   └── session/route.ts      # GET - 세션 확인
│       ├── openai/
│       │   ├── issues/route.ts       # POST - 정책 이슈 생성
│       │   ├── topics/route.ts       # POST - 주제 생성
│       │   └── analysis/route.ts     # POST - 상세 분석
│       ├── search/
│       │   ├── data-sources/route.ts # POST - 데이터 소스 검증
│       │   └── references/route.ts   # POST - 참고문헌 검증
│       ├── saved-topics/
│       │   ├── route.ts              # GET(목록), POST(저장)
│       │   └── [id]/route.ts         # GET(상세), DELETE(삭제)
│       └── countries/route.ts        # GET - 193개국 목록
├── components/
│   ├── auth/
│   │   ├── AuthProvider.tsx          # Context + 세션 관리
│   │   └── LoginModal.tsx            # 학번 입력 모달
│   ├── common/
│   │   ├── Header.tsx                # 로그인/로그아웃, My Page 링크
│   │   ├── ProgressBar.tsx           # 4단계 진행 표시
│   │   ├── CountrySelect.tsx         # UN 193개국 드롭다운
│   │   ├── Loader.tsx                # 로딩 스피너
│   │   └── ImportantNotice.tsx       # 경고 박스
│   ├── steps/
│   │   ├── Step1Scope.tsx            # 국가 + 관심 분야
│   │   ├── Step2Issues.tsx           # 정책 이슈 목록
│   │   ├── Step3Topics.tsx           # 주제 목록
│   │   └── Step4Analysis.tsx         # 상세 분석 + 검증 표시
│   └── my-page/
│       └── SavedTopicCard.tsx        # 저장된 분석 카드
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # 브라우저 클라이언트
│   │   └── server.ts                 # 서버 클라이언트
│   ├── openai.ts                     # OpenAI API 호출 (GPT-4o)
│   ├── search.ts                     # Serper API 검색/검증
│   ├── auth.ts                       # 세션 쿠키 관리
│   └── validation.ts                 # Zod 스키마
├── data/
│   ├── un-countries.ts               # UN 193개국 데이터
│   └── trusted-sources.ts            # 신뢰할 수 있는 데이터 소스 목록
├── hooks/
│   ├── useAuth.ts                    # 인증 훅
│   └── useSavedTopics.ts             # 저장된 분석 관리 훅
└── types/
    └── index.ts                      # 공통 타입 정의
```

---

## 🗄️ Supabase 테이블 스키마

### students 테이블
```sql
CREATE TABLE students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(9) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT student_id_format CHECK (student_id ~ '^[0-9]{9}$')
);
```

### saved_analyses 테이블
```sql
CREATE TABLE saved_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(9) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    country VARCHAR(100) NOT NULL,
    interest VARCHAR(500) NOT NULL,
    selected_issue TEXT NOT NULL,
    issue_importance_score DECIMAL(3,1),
    issue_frequency_score DECIMAL(3,1),
    topic_title TEXT NOT NULL,
    analysis_data JSONB NOT NULL,
    verified_data_sources JSONB,
    verified_references JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔐 환경 변수 (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
SERPER_API_KEY=
```

---

## 📝 핵심 구현 요구사항

### 1. UN 193개국 (src/data/un-countries.ts)
- 전체 193개국 배열 (영문명)
- South Korea가 항상 첫 번째
- 나머지는 알파벳순 정렬
- 검색 기능 (영문, 한글 지원)

### 2. API 보안 (src/app/api/openai/*)
- OpenAI API 키는 서버에서만 사용
- 클라이언트는 `/api/openai/*` 호출
- Rate limit 대응 재시도 로직 (최대 5회, 지수 백오프)
- 모델: gpt-4o (또는 gpt-4o-mini)

### 3. 간편 로그인 (src/lib/auth.ts)
- 쿠키명: `capstone_session`
- 값: 학번 (9자리)
- 만료: 7일
- 설정: httpOnly, secure (production), sameSite: 'lax'

### 4. My Page (src/app/my-page/*)
- 로그인 필수 (미로그인 시 로그인 유도)
- 저장된 분석 카드 목록 (국가, 주제, 날짜)
- 클릭 시 상세 페이지
- 삭제 기능 (confirm 후)

### 5. 할루시네이션 방지 (src/lib/search.ts)
- AI가 생성한 Data Sources를 Serper API로 검증
- 검증된 소스: ✓ Verified (녹색) + 클릭 가능 링크
- 미검증 소스: ⚠️ Unverified (노란색) + 참고용 표시
- 신뢰 소스 DB (World Bank, UN Data, OECD, WHO, KOSIS 등)

### 6. Step 4 UI (src/components/steps/Step4Analysis.tsx)
섹션 순서:
1. Topic Title (파란색 배경)
2. Rationale (Relevance, Feasibility, Impact)
3. Key Policy Questions (각 질문에 Google Scholar 링크)
4. Recommended Methodologies
5. Potential Data Sources (검증 상태 표시)
6. Key References (검증 상태 표시)
7. External Links (Google Scholar, Perplexity, Gemini, ChatGPT, Claude)
8. Save to My Page 버튼 (로그인 시에만)

---

## 🎨 스타일 가이드

### 색상
- Primary: blue-600 (#2563eb)
- Success: green-600 (#16a34a)
- Warning: yellow-500 (#eab308)
- Error: red-500 (#ef4444)

### 컴포넌트 패턴
```tsx
// 카드
<div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">

// Primary 버튼
<button className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50">

// 입력 필드
<input className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
```

---

## ⚡ 실행 명령

위의 모든 요구사항을 한 번에 구현해주세요:

1. 모든 폴더와 파일 생성
2. 타입 정의 (src/types/index.ts)
3. Supabase 클라이언트 설정
4. UN 193개국 데이터
5. 인증 시스템 (Context, API, 쿠키)
6. OpenAI API 라우트 (보안 + 재시도, GPT-4o 사용)
7. 검색/검증 API
8. 저장된 분석 API
9. 모든 컴포넌트 (Header, ProgressBar, Steps, MyPage)
10. 메인 페이지 상태 관리
11. My Page 라우트

기존 index.html의 UI/UX를 최대한 유지하면서 React 컴포넌트로 변환하세요.
