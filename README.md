# Capstone Topic Explorer v2.0 - 개발 문서

## 📋 개요

GKS 장학생을 위한 캡스톤 프로젝트 주제 탐색 도구의 v2.0 개발 문서입니다.

이 문서들은 Cursor AI + SuperNext/Ruler 템플릿 환경에서 최적화되어 있으며, Supabase와 Vercel을 사용한 개발 워크플로우에 맞춰져 있습니다.

---

## 📁 폴더 구조

```
capstone-topic-explorer/
├── README.md                    # 이 파일
├── doc/                         # 기술 문서
│   ├── PROJECT_OVERVIEW.md      # 프로젝트 개요
│   ├── DATABASE_SCHEMA.md       # 데이터베이스 스키마
│   ├── API_DESIGN.md            # API 엔드포인트 설계
│   ├── AUTH_FLOW.md             # 간편 로그인 흐름
│   ├── UN_COUNTRIES.md          # UN 193개국 데이터
│   ├── SECURITY.md              # API 보안 가이드
│   ├── FEATURE_MYPAGE.md        # My Page 기능 명세
│   └── ANTI_HALLUCINATION.md    # 할루시네이션 방지 전략
├── prompts/                     # AI 프롬프트
│   ├── 00_OVERVIEW.md           # 프롬프트 개요
│   ├── 01_PROJECT_INIT.md       # 프로젝트 초기화
│   ├── 02_UN_COUNTRIES.md       # UN 회원국 기능
│   ├── 03_AUTH_SYSTEM.md        # 인증 시스템
│   ├── 04_API_ROUTES.md         # API 라우트 보안
│   ├── 05_MYPAGE_FEATURE.md     # My Page 기능
│   ├── 06_ANTI_HALLUCINATION.md # 할루시네이션 방지
│   ├── 07_STEP_COMPONENTS.md    # Step 컴포넌트 마이그레이션
│   └── 08_DEPLOYMENT.md         # Vercel 배포
└── claude/
    └── agents/                  # Cursor AI 에이전트 정의
        ├── 00_OVERVIEW.md       # 에이전트 개요
        ├── fullstack-developer.md
        ├── frontend-developer.md
        ├── backend-developer.md
        ├── security-reviewer.md
        └── code-reviewer.md
```

---

## 🚀 개선사항 요약

| # | 개선사항 | 관련 문서 |
|---|----------|-----------|
| 1 | UN 193개국 선택 (한국 우선) | doc/UN_COUNTRIES.md |
| 2 | API 보안 강화 | doc/SECURITY.md |
| 3 | 9자리 학번 간편 로그인 | doc/AUTH_FLOW.md |
| 4 | My Page (저장된 분석 조회) | doc/FEATURE_MYPAGE.md |
| 5 | Data Sources 할루시네이션 방지 | doc/ANTI_HALLUCINATION.md |
| 6 | Key References 할루시네이션 방지 | doc/ANTI_HALLUCINATION.md |

---

## 🔧 기술 스택

| 구분 | 기술 |
|------|------|
| IDE | Cursor AI |
| 템플릿 | SuperNext + Ruler |
| 프레임워크 | Next.js 14+ (App Router) |
| 언어 | TypeScript |
| 스타일링 | Tailwind CSS |
| 데이터베이스 | Supabase (PostgreSQL) |
| AI API | Google Gemini |
| 검색 API | Serper (Google Search) |
| 배포 | Vercel |

---

## 📖 사용 방법

### 1. 문서 읽기

개발 전 다음 문서들을 순서대로 읽어보세요:

1. `doc/PROJECT_OVERVIEW.md` - 전체 그림 파악
2. `doc/DATABASE_SCHEMA.md` - DB 구조 이해
3. `doc/API_DESIGN.md` - API 설계 확인

### 2. 프롬프트 실행

Cursor AI에서 프롬프트를 순서대로 실행하세요:

```
01 → 02 → 03 → 04 → 05 → 06 → 07 → 08
```

각 프롬프트 파일의 내용을 Cursor AI의 Chat 또는 Composer에 붙여넣고 실행합니다.

### 3. 에이전트 활용

복잡한 작업은 적절한 에이전트를 활용하세요:

- **풀스택 개발**: `claude/agents/fullstack-developer.md`
- **프론트엔드**: `claude/agents/frontend-developer.md`
- **백엔드**: `claude/agents/backend-developer.md`
- **보안 검토**: `claude/agents/security-reviewer.md`
- **코드 리뷰**: `claude/agents/code-reviewer.md`

---

## 📌 주요 체크리스트

### 개발 전

- [ ] Supabase 프로젝트 생성
- [ ] 환경 변수 설정 (.env.local)
- [ ] Gemini API 키 발급
- [ ] Serper API 키 발급 (선택)

### 개발 중

- [ ] API 키가 클라이언트에 노출되지 않는지 확인
- [ ] 입력 검증이 모든 API에 적용되는지 확인
- [ ] 인증이 필요한 API에 세션 확인이 있는지 확인

### 배포 전

- [ ] Vercel 환경 변수 설정
- [ ] Supabase URL Configuration 설정
- [ ] 전체 플로우 테스트

---

## 📅 작업 일정 제안

| 일차 | 작업 | 프롬프트 |
|------|------|----------|
| 1일 | 프로젝트 초기화, DB 설정 | 01 |
| 2일 | UN 회원국, 인증 시스템 | 02, 03 |
| 3일 | API 라우트 보안화 | 04 |
| 4일 | My Page 기능 | 05 |
| 5일 | 할루시네이션 방지 | 06 |
| 6일 | Step 컴포넌트 마이그레이션 | 07 |
| 7일 | 배포 및 테스트 | 08 |

---

## 🆘 문제 해결

### API 키 관련

- API 키 노출 시: 즉시 키 재발급 후 환경 변수 업데이트
- Rate limit 초과 시: 재시도 로직 확인, 필요시 할당량 증가

### 인증 관련

- 로그인 안 됨: 쿠키 설정 확인 (httpOnly, secure)
- 세션 유지 안 됨: 쿠키 maxAge 확인

### 배포 관련

- 빌드 실패: 타입 에러 확인, 환경 변수 확인
- API 오류: Vercel 환경 변수 설정 확인

---

## 📞 연락처

문서에 대한 질문이나 개선 제안이 있으시면 알려주세요.

---

*이 문서는 2024년 기준으로 작성되었습니다.*
