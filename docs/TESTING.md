# Testing Strategy & E2E Tests

## 개요

Capstone Topic Explorer v2.0의 테스트 전략 및 E2E 테스트 가이드입니다.

---

## 테스트 계층

```
┌─────────────────────────────────────────┐
│           E2E Tests (Playwright)        │  ← 사용자 관점 전체 플로우
├─────────────────────────────────────────┤
│       Integration Tests (Vitest)        │  ← API 라우트, DB 연동
├─────────────────────────────────────────┤
│         Unit Tests (Vitest)             │  ← 개별 함수, 컴포넌트
└─────────────────────────────────────────┘
```

---

## 테스트 도구

| 종류 | 도구 | 용도 |
|------|------|------|
| Unit/Integration | Vitest | 빠른 단위/통합 테스트 |
| E2E | Playwright | 브라우저 기반 전체 플로우 |
| Component | React Testing Library | 컴포넌트 렌더링/인터랙션 |
| API | Supertest (선택) | API 라우트 테스트 |

---

## 설치 및 설정

### 1. 패키지 설치

```bash
# Vitest + React Testing Library
npm install -D vitest @vitejs/plugin-react jsdom
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Playwright
npm install -D @playwright/test
npx playwright install
```

### 2. Vitest 설정

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['**/e2e/**', 'node_modules'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules', 'tests']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

### 3. Vitest Setup

```typescript
// tests/setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn()
  }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams()
}));

// Mock fetch
global.fetch = vi.fn();
```

### 4. Playwright 설정

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
});
```

### 5. package.json 스크립트

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

---

## E2E 테스트 시나리오

### 전체 플로우 테스트

```typescript
// tests/e2e/full-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Capstone Topic Explorer - Full Flow', () => {
  
  test('완전한 주제 탐색 플로우', async ({ page }) => {
    // Step 1: 메인 페이지 접속
    await page.goto('/');
    await expect(page.getByText('Capstone Project Topic Explorer')).toBeVisible();
    
    // Important Notice 확인 및 닫기
    await expect(page.getByText('Important Notice')).toBeVisible();
    await page.getByRole('button', { name: '×' }).click();
    
    // Step 1: 국가 선택 및 관심 분야 입력
    await page.getByRole('combobox').click();
    await page.getByText('South Korea').first().click();
    await page.getByPlaceholder('e.g., Public Health').fill('Digital Healthcare');
    
    // Step 2로 이동
    await page.getByRole('button', { name: 'Find Policy Issues' }).click();
    
    // 로딩 확인
    await expect(page.getByText('AI is analyzing')).toBeVisible();
    
    // Step 2: 정책 이슈 목록 대기 및 선택
    await expect(page.getByText('Identify Key Policy Issues')).toBeVisible({ timeout: 30000 });
    
    // 첫 번째 이슈 선택
    const firstIssue = page.locator('.issue-card').first();
    await expect(firstIssue).toBeVisible();
    await firstIssue.click();
    
    // Step 3: 주제 목록 대기
    await expect(page.getByText('Explore Capstone Topics')).toBeVisible({ timeout: 30000 });
    
    // 첫 번째 주제 분석
    const firstTopic = page.locator('.topic-card').first();
    await firstTopic.getByRole('button', { name: 'Analyze this Topic' }).click();
    
    // Step 4: 상세 분석 대기
    await expect(page.getByText('Detailed Topic Analysis')).toBeVisible({ timeout: 30000 });
    
    // 분석 결과 확인
    await expect(page.getByText('Rationale')).toBeVisible();
    await expect(page.getByText('Key Policy Questions')).toBeVisible();
    await expect(page.getByText('Recommended Methodologies')).toBeVisible();
    await expect(page.getByText('Potential Data Sources')).toBeVisible();
    await expect(page.getByText('Key References')).toBeVisible();
  });

  test('Show 5 More Topics 기능', async ({ page }) => {
    await page.goto('/');
    
    // Step 1 → Step 2 → Step 3 빠르게 진행 (fixture 사용 권장)
    await page.getByPlaceholder('e.g., Public Health').fill('Education Policy');
    await page.getByRole('button', { name: 'Find Policy Issues' }).click();
    
    await page.locator('.issue-card').first().click({ timeout: 30000 });
    
    // Step 3에서 주제 개수 확인
    await expect(page.locator('.topic-card')).toHaveCount(5, { timeout: 30000 });
    
    // Show 5 More 클릭
    await page.getByRole('button', { name: 'Show 5 More Topics' }).click();
    
    // 10개로 증가 확인
    await expect(page.locator('.topic-card')).toHaveCount(10, { timeout: 30000 });
  });

  test('Back 버튼 동작', async ({ page }) => {
    await page.goto('/');
    
    // Step 1 → Step 2
    await page.getByPlaceholder('e.g., Public Health').fill('Environment');
    await page.getByRole('button', { name: 'Find Policy Issues' }).click();
    await expect(page.getByText('Identify Key Policy Issues')).toBeVisible({ timeout: 30000 });
    
    // Back to Step 1
    await page.getByRole('button', { name: '← Back' }).click();
    await expect(page.getByText('Define Your Scope')).toBeVisible();
    
    // 이전 입력값 유지 확인
    await expect(page.getByPlaceholder('e.g., Public Health')).toHaveValue('Environment');
  });
});
```

### 인증 테스트

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  
  test('학번 로그인 성공', async ({ page }) => {
    await page.goto('/');
    
    // 로그인 버튼 클릭
    await page.getByRole('button', { name: '로그인' }).click();
    
    // 모달 확인
    await expect(page.getByText('학번 9자리를 입력')).toBeVisible();
    
    // 학번 입력
    await page.getByPlaceholder('예: 202412345').fill('202412345');
    await page.getByRole('button', { name: '로그인' }).click();
    
    // 로그인 성공 확인
    await expect(page.getByText('202412345')).toBeVisible();
    await expect(page.getByText('My Page')).toBeVisible();
  });

  test('잘못된 학번 형식 에러', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '로그인' }).click();
    
    // 8자리 입력
    await page.getByPlaceholder('예: 202412345').fill('20241234');
    await page.getByRole('button', { name: '로그인' }).click();
    
    // 에러 메시지 확인
    await expect(page.getByText('9자리 숫자')).toBeVisible();
  });

  test('로그아웃', async ({ page }) => {
    // 먼저 로그인
    await page.goto('/');
    await page.getByRole('button', { name: '로그인' }).click();
    await page.getByPlaceholder('예: 202412345').fill('202412345');
    await page.getByRole('button', { name: '로그인' }).click();
    
    await expect(page.getByText('202412345')).toBeVisible();
    
    // 로그아웃
    await page.getByRole('button', { name: '로그아웃' }).click();
    
    // 로그아웃 확인
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();
    await expect(page.getByText('My Page')).not.toBeVisible();
  });
});
```

### My Page 테스트

```typescript
// tests/e2e/my-page.spec.ts
import { test, expect } from '@playwright/test';

test.describe('My Page', () => {
  
  // 각 테스트 전 로그인
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '로그인' }).click();
    await page.getByPlaceholder('예: 202412345').fill('202412345');
    await page.getByRole('button', { name: '로그인' }).click();
    await expect(page.getByText('202412345')).toBeVisible();
  });

  test('비어있는 My Page 표시', async ({ page }) => {
    await page.goto('/my-page');
    
    await expect(page.getByText('My Saved Topics')).toBeVisible();
    await expect(page.getByText('저장된 분석 결과가 없습니다')).toBeVisible();
  });

  test('분석 저장 후 My Page에서 확인', async ({ page }) => {
    // 전체 플로우 진행
    await page.goto('/');
    await page.getByPlaceholder('e.g., Public Health').fill('Climate Policy');
    await page.getByRole('button', { name: 'Find Policy Issues' }).click();
    
    await page.locator('.issue-card').first().click({ timeout: 30000 });
    await page.locator('.topic-card').first()
      .getByRole('button', { name: 'Analyze this Topic' }).click({ timeout: 30000 });
    
    // 분석 결과 대기
    await expect(page.getByText('Rationale')).toBeVisible({ timeout: 30000 });
    
    // 저장
    await page.getByRole('button', { name: 'Save to My Page' }).click();
    await expect(page.getByText('저장되었습니다')).toBeVisible();
    
    // My Page에서 확인
    await page.goto('/my-page');
    await expect(page.locator('.saved-topic-card')).toHaveCount(1);
  });

  test('저장된 분석 삭제', async ({ page }) => {
    // 저장된 항목이 있다고 가정 (seed data 또는 이전 테스트)
    await page.goto('/my-page');
    
    // 삭제 버튼 클릭
    page.on('dialog', dialog => dialog.accept());  // confirm 대화상자 수락
    await page.getByRole('button', { name: 'Delete' }).first().click();
    
    // 삭제 확인
    await expect(page.getByText('저장된 분석 결과가 없습니다')).toBeVisible();
  });

  test('비로그인 상태에서 My Page 접근 시 로그인 유도', async ({ page }) => {
    // 로그아웃
    await page.getByRole('button', { name: '로그아웃' }).click();
    
    // My Page 직접 접근
    await page.goto('/my-page');
    
    // 로그인 유도 메시지
    await expect(page.getByText('로그인이 필요합니다')).toBeVisible();
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();
  });
});
```

### UN 국가 선택 테스트

```typescript
// tests/e2e/country-select.spec.ts
import { test, expect } from '@playwright/test';

test.describe('UN 193 Countries Selection', () => {
  
  test('South Korea가 첫 번째로 표시', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('combobox').click();
    
    // 첫 번째 옵션이 South Korea인지 확인
    const firstOption = page.locator('[role="option"]').first();
    await expect(firstOption).toContainText('South Korea');
  });

  test('국가 검색 기능', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('combobox').click();
    await page.getByPlaceholder('Search country').fill('Japan');
    
    // 검색 결과에 Japan만 표시
    await expect(page.locator('[role="option"]')).toHaveCount(1);
    await expect(page.getByText('Japan')).toBeVisible();
  });

  test('한글 검색 지원', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('combobox').click();
    await page.getByPlaceholder('Search country').fill('방글라데시');
    
    await expect(page.getByText('Bangladesh')).toBeVisible();
  });

  test('193개국 모두 로드', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('combobox').click();
    
    // 스크롤하여 모든 옵션 로드
    const options = page.locator('[role="option"]');
    await expect(options).toHaveCount(193);
  });
});
```

### 할루시네이션 방지 테스트

```typescript
// tests/e2e/verification.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Data Source & Reference Verification', () => {
  
  test('검증된 데이터 소스 표시', async ({ page }) => {
    // Step 4까지 진행
    await page.goto('/');
    await page.getByPlaceholder('e.g., Public Health').fill('Healthcare');
    await page.getByRole('button', { name: 'Find Policy Issues' }).click();
    await page.locator('.issue-card').first().click({ timeout: 30000 });
    await page.locator('.topic-card').first()
      .getByRole('button', { name: 'Analyze this Topic' }).click({ timeout: 30000 });
    
    // 분석 결과 대기
    await expect(page.getByText('Potential Data Sources')).toBeVisible({ timeout: 30000 });
    
    // 검증 로딩 표시
    await expect(page.getByText('Verifying data sources')).toBeVisible();
    
    // 검증 완료 후 ✓ Verified 배지 확인
    await expect(page.getByText('✓ Verified')).toBeVisible({ timeout: 60000 });
    
    // 검증된 소스에 클릭 가능한 링크 존재
    const verifiedLink = page.locator('.verified-source a').first();
    await expect(verifiedLink).toHaveAttribute('href', /^https?:\/\//);
  });

  test('미검증 소스 경고 표시', async ({ page }) => {
    // Step 4까지 진행 (위와 동일)
    // ...
    
    // AI Suggestions (Not Verified) 섹션 확인
    const unverifiedSection = page.locator('.unverified-suggestions');
    if (await unverifiedSection.isVisible()) {
      await expect(unverifiedSection.getByText('⚠️')).toBeVisible();
      await expect(unverifiedSection.getByText('Not Verified')).toBeVisible();
    }
  });
});
```

---

## Unit/Integration 테스트

### API 라우트 테스트

```typescript
// tests/api/auth.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { NextRequest } from 'next/server';

// Supabase mock
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null })
        })
      }),
      insert: () => Promise.resolve({ data: { student_id: '202412345' }, error: null }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: null })
      })
    })
  })
}));

describe('POST /api/auth/login', () => {
  
  it('유효한 학번으로 로그인 성공', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ studentId: '202412345' })
    });
    
    const response = await loginHandler(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.studentId).toBe('202412345');
  });

  it('잘못된 학번 형식 에러', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ studentId: '1234' })
    });
    
    const response = await loginHandler(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('9 digits');
  });

  it('문자가 포함된 학번 에러', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ studentId: '2024abc45' })
    });
    
    const response = await loginHandler(request);
    
    expect(response.status).toBe(400);
  });
});
```

### 유틸리티 함수 테스트

```typescript
// tests/lib/validation.test.ts
import { describe, it, expect } from 'vitest';
import { 
  issuesRequestSchema, 
  topicsRequestSchema,
  analysisRequestSchema 
} from '@/lib/validation';

describe('Validation Schemas', () => {
  
  describe('issuesRequestSchema', () => {
    it('유효한 입력 통과', () => {
      const result = issuesRequestSchema.safeParse({
        country: 'South Korea',
        interest: 'Digital Healthcare'
      });
      
      expect(result.success).toBe(true);
    });

    it('짧은 interest 거부', () => {
      const result = issuesRequestSchema.safeParse({
        country: 'South Korea',
        interest: 'AI'  // 2글자
      });
      
      expect(result.success).toBe(false);
    });

    it('빈 country 거부', () => {
      const result = issuesRequestSchema.safeParse({
        country: '',
        interest: 'Healthcare'
      });
      
      expect(result.success).toBe(false);
    });
  });
});
```

### 컴포넌트 테스트

```typescript
// tests/components/CountrySelect.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CountrySelect } from '@/components/common/CountrySelect';

describe('CountrySelect', () => {
  
  it('기본 placeholder 표시', () => {
    render(<CountrySelect value="" onChange={vi.fn()} />);
    
    expect(screen.getByText('Select a country')).toBeInTheDocument();
  });

  it('선택된 국가 표시', () => {
    render(<CountrySelect value="South Korea" onChange={vi.fn()} />);
    
    expect(screen.getByText('South Korea')).toBeInTheDocument();
  });

  it('드롭다운 열기/닫기', async () => {
    const user = userEvent.setup();
    render(<CountrySelect value="" onChange={vi.fn()} />);
    
    // 드롭다운 열기
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByPlaceholder('Search country')).toBeInTheDocument();
    
    // 드롭다운 닫기
    await user.click(document.body);
    expect(screen.queryByPlaceholder('Search country')).not.toBeInTheDocument();
  });

  it('국가 선택 시 onChange 호출', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CountrySelect value="" onChange={onChange} />);
    
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('Japan'));
    
    expect(onChange).toHaveBeenCalledWith('Japan');
  });

  it('검색 필터링', async () => {
    const user = userEvent.setup();
    render(<CountrySelect value="" onChange={vi.fn()} />);
    
    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByPlaceholder('Search country'), 'Jap');
    
    expect(screen.getByText('Japan')).toBeInTheDocument();
    expect(screen.queryByText('South Korea')).not.toBeInTheDocument();
  });
});
```

---

## CI/CD 통합

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:run
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        if: always()

  e2e-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      
      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## 테스트 실행 명령어

```bash
# Unit/Integration 테스트
npm run test              # watch 모드
npm run test:run          # 1회 실행
npm run test:coverage     # 커버리지 포함
npm run test:ui           # Vitest UI

# E2E 테스트
npm run test:e2e          # headless 모드
npm run test:e2e:headed   # 브라우저 표시
npm run test:e2e:ui       # Playwright UI
npm run test:e2e:debug    # 디버그 모드

# 특정 테스트만 실행
npx vitest run auth       # auth 관련 unit 테스트
npx playwright test auth  # auth 관련 e2e 테스트
```

---

## 테스트 커버리지 목표

| 영역 | 목표 커버리지 |
|------|---------------|
| API Routes | 90%+ |
| Utility Functions | 95%+ |
| Components | 80%+ |
| E2E Critical Paths | 100% |

---

## 테스트 데이터 관리

### Seed Data

```typescript
// tests/fixtures/seed.ts
export const testStudents = [
  { student_id: '202412345', created_at: new Date().toISOString() },
  { student_id: '202412346', created_at: new Date().toISOString() }
];

export const testAnalyses = [
  {
    student_id: '202412345',
    country: 'South Korea',
    interest: 'Digital Healthcare',
    selected_issue: 'Telemedicine Regulation',
    topic_title: 'Regulatory Framework for Telemedicine',
    analysis_data: { /* ... */ }
  }
];
```

### 테스트 DB 초기화

```typescript
// tests/helpers/db.ts
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { testStudents, testAnalyses } from '../fixtures/seed';

export async function seedTestData() {
  const supabase = createServerSupabaseClient();
  
  await supabase.from('students').upsert(testStudents);
  await supabase.from('saved_analyses').upsert(testAnalyses);
}

export async function cleanupTestData() {
  const supabase = createServerSupabaseClient();
  
  await supabase.from('saved_analyses').delete().like('student_id', '20241234%');
  await supabase.from('students').delete().like('student_id', '20241234%');
}
```
