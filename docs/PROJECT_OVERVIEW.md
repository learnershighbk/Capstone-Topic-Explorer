# Capstone Project Topic Explorer - 프로젝트 개요

## 서비스 소개

**Capstone Project Topic Explorer**는 GKS(Global Korea Scholarship) 장학생들이 캡스톤 프로젝트 주제를 탐색하고 선정하는 과정을 지원하는 AI 기반 웹 서비스입니다.

### 현재 서비스 흐름 (4단계)

```
Step 1: Define Your Scope
    ↓ (국가 선택 + 관심 분야 입력)
Step 2: Identify Key Policy Issues
    ↓ (AI가 생성한 10개 정책 이슈 중 선택)
Step 3: Explore Capstone Topics
    ↓ (선택한 이슈에 대한 5개 주제 제안, 추가 생성 가능)
Step 4: Detailed Topic Analysis
    (선택한 주제에 대한 상세 분석 제공)
```

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| IDE | Cursor AI |
| 템플릿 | SuperNext + Ruler |
| 프론트엔드 | Next.js (TypeScript) + Tailwind CSS |
| 백엔드 | Next.js API Routes |
| 데이터베이스 | Supabase (PostgreSQL) |
| 인증 | Supabase Auth (학번 기반 간편 로그인) |
| AI API | OpenAI API (GPT-4o) |
| 배포 | Vercel |

---

## 개선 사항 요약

### 1. UN 193개 회원국 선택 기능
- **현재**: 8개국만 하드코딩 (Bangladesh, India, Indonesia 등)
- **개선**: UN 193개 회원국 전체 선택 가능
- **정렬**: South Korea 최상단, 나머지 알파벳순

### 2. API 보안 강화
- **현재**: 클라이언트 사이드에 API 키 노출
- **개선**: 서버 사이드 API 라우트를 통한 보안 처리

### 3. 간편 로그인 시스템
- **현재**: 인증 없음
- **개선**: 9자리 학번만으로 로그인/로그아웃
- **특징**: 회원가입/인증 절차 없음

### 4. My Page 기능
- **현재**: 분석 결과 저장 불가
- **개선**: 선택한 주제별 분석 결과 저장 및 조회

### 5. Data Sources 할루시네이션 방지
- **현재**: AI가 생성한 데이터 소스 (검증 없음)
- **개선**: 웹 검색을 통한 실제 데이터 소스 제공

### 6. Key References 할루시네이션 방지
- **현재**: AI가 생성한 참고문헌 (검증 없음)
- **개선**: 웹 검색을 통한 실제 학술 자료 제공

---

## 프로젝트 구조 (예상)

```
capstone-topic-explorer/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # 메인 페이지
│   │   ├── my-page/
│   │   │   └── page.tsx               # My Page
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts     # 학번 로그인
│   │   │   │   └── logout/route.ts    # 로그아웃
│   │   │   ├── openai/
│   │   │   │   ├── issues/route.ts    # 정책 이슈 생성
│   │   │   │   ├── topics/route.ts    # 주제 생성
│   │   │   │   └── analysis/route.ts  # 상세 분석
│   │   │   ├── search/
│   │   │   │   ├── data-sources/route.ts   # 데이터 소스 검색
│   │   │   │   └── references/route.ts     # 참고문헌 검색
│   │   │   └── saved-topics/
│   │   │       └── route.ts           # 저장된 주제 CRUD
│   │   └── layout.tsx
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginModal.tsx
│   │   │   └── AuthProvider.tsx
│   │   ├── steps/
│   │   │   ├── Step1Scope.tsx
│   │   │   ├── Step2Issues.tsx
│   │   │   ├── Step3Topics.tsx
│   │   │   └── Step4Analysis.tsx
│   │   ├── common/
│   │   │   ├── Header.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── CountrySelect.tsx
│   │   └── my-page/
│   │       └── SavedTopicCard.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   └── server.ts
│   │   ├── openai.ts
│   │   └── search.ts
│   ├── data/
│   │   └── un-countries.ts            # UN 193개국 데이터
│   ├── types/
│   │   └── index.ts
│   └── hooks/
│       ├── useAuth.ts
│       └── useSavedTopics.ts
├── .env.local
└── supabase/
    └── migrations/
```

---

## 관련 문서

| 문서 | 설명 |
|------|------|
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | Supabase 데이터베이스 스키마 |
| [API_DESIGN.md](./API_DESIGN.md) | API 엔드포인트 설계 |
| [AUTH_FLOW.md](./AUTH_FLOW.md) | 간편 로그인 흐름 |
| [UN_COUNTRIES.md](./UN_COUNTRIES.md) | UN 193개국 데이터 |
| [SECURITY.md](./SECURITY.md) | API 보안 가이드 |
| [FEATURE_MYPAGE.md](./FEATURE_MYPAGE.md) | My Page 기능 명세 |
| [ANTI_HALLUCINATION.md](./ANTI_HALLUCINATION.md) | 할루시네이션 방지 전략 |

---

## 버전 정보

- **v1.0 (MVP)**: 단일 HTML 파일, 클라이언트 사이드 전용
- **v2.0 (개선)**: Next.js 기반, 서버 사이드 API, 인증, 데이터 저장
