# Claude Agents Overview

## 개요

Capstone Topic Explorer 프로젝트에서 Cursor AI의 Agent 모드를 활용하기 위한 에이전트 정의 파일들입니다.

---

## 에이전트 파일 목록

| 파일 | 역할 | 설명 |
|------|------|------|
| [fullstack-developer.md](./fullstack-developer.md) | 풀스택 개발 | 전체 프로젝트 개발 및 통합 |
| [frontend-developer.md](./frontend-developer.md) | 프론트엔드 | React 컴포넌트 및 UI 개발 |
| [backend-developer.md](./backend-developer.md) | 백엔드 | API 라우트 및 데이터베이스 |
| [security-reviewer.md](./security-reviewer.md) | 보안 검토 | API 보안 및 취약점 점검 |
| [code-reviewer.md](./code-reviewer.md) | 코드 리뷰 | 코드 품질 및 개선 제안 |

---

## 사용 방법

### Cursor AI Agent 모드에서 사용

1. Cursor AI의 Agent 모드 활성화
2. 해당 에이전트 파일의 내용을 컨텍스트로 제공
3. 작업 요청

### 예시

```
@fullstack-developer.md

UN 193개국 선택 기능을 구현해줘.
doc/UN_COUNTRIES.md를 참고해서 작업해.
```

---

## 에이전트 역할 분담

### 새 기능 개발 시

```
1. fullstack-developer: 전체 구조 설계
2. frontend-developer: UI 컴포넌트 개발
3. backend-developer: API 및 DB 구현
4. code-reviewer: 코드 품질 검토
5. security-reviewer: 보안 검토
```

### 버그 수정 시

```
1. fullstack-developer: 문제 분석 및 수정
2. code-reviewer: 수정 코드 검토
```

### 배포 전

```
1. security-reviewer: 보안 취약점 점검
2. code-reviewer: 최종 코드 검토
```

---

## 프로젝트 컨텍스트

모든 에이전트는 다음 프로젝트 정보를 알고 있어야 합니다:

- **프로젝트**: Capstone Topic Explorer v2.0
- **대상**: GKS 장학생의 캡스톤 주제 탐색 지원
- **기술 스택**: Next.js 14+, TypeScript, Tailwind CSS, Supabase, Vercel
- **AI**: Google Gemini API
- **템플릿**: SuperNext + Ruler

---

## 관련 문서 참조

에이전트 작업 시 다음 문서들을 참고하세요:

- `doc/PROJECT_OVERVIEW.md` - 프로젝트 개요
- `doc/DATABASE_SCHEMA.md` - 데이터베이스 스키마
- `doc/API_DESIGN.md` - API 설계
- `doc/AUTH_FLOW.md` - 인증 흐름
- `doc/SECURITY.md` - 보안 가이드
- `doc/UN_COUNTRIES.md` - UN 회원국 데이터
- `doc/FEATURE_MYPAGE.md` - My Page 기능
- `doc/ANTI_HALLUCINATION.md` - 할루시네이션 방지
