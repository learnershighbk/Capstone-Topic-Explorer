# Prompts Overview

## 개요

Capstone Topic Explorer에서 사용하는 AI 프롬프트 모음입니다. 각 프롬프트는 Cursor AI에서 복사하여 사용하거나 코드 생성 시 참고할 수 있습니다.

---

## 프롬프트 파일 목록

| 파일 | 용도 | 설명 |
|------|------|------|
| [01_PROJECT_INIT.md](./01_PROJECT_INIT.md) | 프로젝트 초기 설정 | Next.js + Supabase + Vercel 프로젝트 생성 |
| [02_UN_COUNTRIES.md](./02_UN_COUNTRIES.md) | UN 회원국 데이터 | 193개국 데이터 파일 및 컴포넌트 생성 |
| [03_AUTH_SYSTEM.md](./03_AUTH_SYSTEM.md) | 간편 로그인 | 학번 기반 인증 시스템 구현 |
| [04_API_ROUTES.md](./04_API_ROUTES.md) | API 라우트 | Gemini API 서버 사이드 라우트 구현 |
| [05_MYPAGE_FEATURE.md](./05_MYPAGE_FEATURE.md) | My Page | 저장된 분석 조회 기능 구현 |
| [06_ANTI_HALLUCINATION.md](./06_ANTI_HALLUCINATION.md) | 할루시네이션 방지 | 데이터 소스/참고문헌 검증 기능 |
| [07_STEP_COMPONENTS.md](./07_STEP_COMPONENTS.md) | Step 컴포넌트 | Step 1-4 UI 컴포넌트 마이그레이션 |
| [08_DEPLOYMENT.md](./08_DEPLOYMENT.md) | 배포 | Vercel 배포 설정 |

---

## 사용 방법

### Cursor AI에서 사용

1. 프롬프트 파일을 열고 전체 내용을 복사
2. Cursor AI의 Chat 또는 Composer에 붙여넣기
3. 필요한 경우 컨텍스트 파일 추가
4. 실행

### 순서

프로젝트를 처음부터 구축할 경우 번호 순서대로 실행하는 것을 권장합니다:

```
01 → 02 → 03 → 04 → 05 → 06 → 07 → 08
```

### 부분 적용

특정 기능만 추가할 경우:
- UN 회원국만: `02_UN_COUNTRIES.md`
- 인증만: `03_AUTH_SYSTEM.md`
- API 보안만: `04_API_ROUTES.md`
- My Page만: `05_MYPAGE_FEATURE.md`

---

## 템플릿 호환성

이 프롬프트들은 다음 환경에 최적화되어 있습니다:

- **IDE**: Cursor AI
- **템플릿**: SuperNext + Ruler
- **프레임워크**: Next.js 14+ (App Router)
- **스타일링**: Tailwind CSS
- **데이터베이스**: Supabase
- **배포**: Vercel

---

## 주의사항

1. 프롬프트 실행 전 관련 문서(`doc/` 폴더)를 먼저 확인하세요.
2. 환경 변수 설정이 필요한 경우 `.env.local.example`을 참고하세요.
3. 데이터베이스 마이그레이션은 Supabase 대시보드에서 직접 실행하세요.
4. API 키는 절대 코드에 하드코딩하지 마세요.
