# Prompt: Testing Setup & E2E Tests

## 목적
Vitest + Playwright 기반 테스트 환경 구축 및 E2E 테스트 작성

---

## 프롬프트

```
프로젝트에 테스트 환경을 구축하고 주요 E2E 테스트를 작성해줘.

## 요구사항

### 1. 테스트 도구 설치

```bash
# Unit/Integration Tests
npm install -D vitest @vitejs/plugin-react jsdom
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event

# E2E Tests
npm install -D @playwright/test
npx playwright install
```

### 2. 설정 파일 생성

#### vitest.config.ts
- environment: jsdom
- globals: true
- @ alias 설정
- coverage 설정 (v8)

#### playwright.config.ts
- baseURL: http://localhost:3000
- projects: chromium, firefox, mobile
- webServer: npm run dev 자동 실행
- screenshot/video on failure

#### tests/setup.ts
- @testing-library/jest-dom 임포트
- next/navigation mock
- global fetch mock

### 3. 폴더 구조

```
tests/
├── setup.ts                 # Vitest 설정
├── fixtures/
│   └── seed.ts             # 테스트 데이터
├── helpers/
│   └── db.ts               # DB 유틸리티
├── api/                    # API 라우트 테스트
│   ├── auth.test.ts
│   ├── gemini.test.ts
│   └── saved-topics.test.ts
├── components/             # 컴포넌트 테스트
│   ├── CountrySelect.test.tsx
│   ├── LoginModal.test.tsx
│   └── ProgressBar.test.tsx
├── lib/                    # 유틸리티 테스트
│   ├── validation.test.ts
│   └── auth.test.ts
└── e2e/                    # E2E 테스트
    ├── full-flow.spec.ts
    ├── auth.spec.ts
    ├── my-page.spec.ts
    ├── country-select.spec.ts
    └── verification.spec.ts
```

### 4. E2E 테스트 시나리오

#### full-flow.spec.ts
- 완전한 4단계 플로우 (Step 1 → 2 → 3 → 4)
- Show 5 More Topics 기능
- Back 버튼 동작

#### auth.spec.ts
- 학번 로그인 성공 (9자리)
- 잘못된 형식 에러
- 로그아웃
- 세션 유지

#### my-page.spec.ts
- 빈 My Page 표시
- 분석 저장 후 목록 표시
- 저장된 분석 삭제
- 비로그인 시 접근 차단

#### country-select.spec.ts
- South Korea 첫 번째 표시
- 영문 검색
- 한글 검색
- 193개국 로드 확인

#### verification.spec.ts
- 검증 로딩 상태 표시
- ✓ Verified 배지 표시
- 검증된 소스 링크 동작
- ⚠️ 미검증 경고 표시

### 5. Unit 테스트

#### API Routes
- 유효한 입력 처리
- 잘못된 입력 에러 반환
- 인증 필요 라우트 검증
- DB 에러 처리

#### Validation Schemas
- 학번 형식 (9자리 숫자)
- country, interest 최소/최대 길이
- 필수 필드 검증

#### Components
- Props에 따른 렌더링
- 이벤트 핸들러 호출
- 상태 변화

### 6. package.json scripts

```json
{
  "test": "vitest",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage",
  "test:ui": "vitest --ui",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:headed": "playwright test --headed"
}
```

### 7. GitHub Actions CI

```yaml
# .github/workflows/test.yml
- Unit tests 실행
- E2E tests 실행 (환경 변수 필요)
- Playwright report 아티팩트 업로드
```

## 테스트 커버리지 목표
- API Routes: 90%+
- Utility Functions: 95%+
- Components: 80%+
- E2E Critical Paths: 100%

## 주의사항
- E2E 테스트는 실제 API 호출 (Gemini)이 발생하므로 CI에서는 mock 고려
- 테스트 데이터는 실제 DB와 분리 (테스트용 student_id 패턴 사용)
- Playwright 타임아웃은 AI 응답 시간 고려하여 충분히 설정 (30초+)
```

---

## 예상 결과

1. `vitest.config.ts`
2. `playwright.config.ts`
3. `tests/setup.ts`
4. `tests/e2e/*.spec.ts` (5개 파일)
5. `tests/api/*.test.ts` (3개 파일)
6. `tests/components/*.test.tsx` (3개 파일)
7. `tests/lib/*.test.ts` (2개 파일)
8. `.github/workflows/test.yml`

---

## 테스트 실행

```bash
# 개발 중 Unit 테스트
npm run test

# PR 전 전체 테스트
npm run test:run && npm run test:e2e

# 디버깅
npm run test:e2e:headed   # 브라우저 표시
npm run test:e2e:ui       # Playwright UI
```

---

## 다음 단계

테스트 통과 후 → `08_DEPLOYMENT.md` 실행
