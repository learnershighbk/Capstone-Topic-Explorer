import { test, expect } from '@playwright/test';

test.describe('Capstone Topic Explorer - Full Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('메인 페이지 로드 및 기본 요소 확인', async ({ page }) => {
    await expect(page.getByText('Capstone Project Topic Explorer')).toBeVisible();
    await expect(page.getByText('Step 1: Define Your Scope')).toBeVisible();
  });

  test('로그인 후 완전한 4단계 플로우', async ({ page }) => {
    // 로그인
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByPlaceholder(/student.*id/i).fill('321000059');
    await page.getByRole('button', { name: 'Login' }).last().click();
    await expect(page.getByText('321000059')).toBeVisible({ timeout: 10000 });

    // Step 1: 국가 선택 및 관심 분야 입력
    await page.locator('[role="combobox"]').first().click();
    await page.getByText('South Korea').first().click();
    await page.getByPlaceholder(/e\.g\.,.*Digital Healthcare/i).fill('Digital Healthcare');

    // Step 2로 이동
    await page.getByRole('button', { name: 'Generate Policy Issues' }).click();

    // 로딩 확인 (AI 응답 대기 - 최대 60초)
    await expect(page.getByText('Generating Issues...')).toBeVisible();
    await expect(page.getByText('Step 2')).toBeVisible({ timeout: 60000 });

    // Step 2: 정책 이슈 목록 확인 및 선택
    await expect(page.getByText('Identify Key Policy Issues')).toBeVisible();
    const issueCards = page.locator('[class*="issue"]').filter({ hasText: /importance/i });
    await expect(issueCards.first()).toBeVisible({ timeout: 10000 });

    // 첫 번째 이슈 선택
    await issueCards.first().click();
    await page.getByRole('button', { name: /Generate.*Topics/i }).click();

    // Step 3: 주제 목록 대기
    await expect(page.getByText('Step 3')).toBeVisible({ timeout: 60000 });
    await expect(page.getByText('Explore Capstone Topics')).toBeVisible();

    // 첫 번째 주제 선택 및 분석
    const topicCards = page.locator('[class*="topic"]');
    await topicCards.first().click();
    await page.getByRole('button', { name: /Generate.*Analysis/i }).click();

    // Step 4: 상세 분석 대기
    await expect(page.getByText('Step 4')).toBeVisible({ timeout: 60000 });
    await expect(page.getByText('Detailed Topic Analysis')).toBeVisible();

    // 분석 결과 확인
    await expect(page.getByText('Rationale')).toBeVisible();
    await expect(page.getByText('Key Policy Questions')).toBeVisible();
    await expect(page.getByText('Recommended Methodologies')).toBeVisible();
  });

  test('Back 버튼 동작', async ({ page }) => {
    // 로그인
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByPlaceholder(/student.*id/i).fill('321000059');
    await page.getByRole('button', { name: 'Login' }).last().click();
    await expect(page.getByText('321000059')).toBeVisible({ timeout: 10000 });

    // Step 1 입력
    await page.locator('[role="combobox"]').first().click();
    await page.getByText('South Korea').first().click();
    await page.getByPlaceholder(/e\.g\.,.*Digital Healthcare/i).fill('Environment Policy');

    // Step 2로 이동
    await page.getByRole('button', { name: 'Generate Policy Issues' }).click();
    await expect(page.getByText('Step 2')).toBeVisible({ timeout: 60000 });

    // Back to Step 1
    await page.getByRole('button', { name: /Back/i }).click();
    await expect(page.getByText('Step 1: Define Your Scope')).toBeVisible();

    // 이전 입력값 유지 확인
    await expect(page.getByPlaceholder(/e\.g\.,.*Digital Healthcare/i)).toHaveValue(
      'Environment Policy'
    );
  });

  test('비로그인 상태에서 Generate 버튼 비활성화', async ({ page }) => {
    // 로그아웃 상태 확인
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();

    // 국가 및 관심분야 입력
    await page.locator('[role="combobox"]').first().click();
    await page.getByText('South Korea').first().click();
    await page.getByPlaceholder(/e\.g\.,.*Digital Healthcare/i).fill('Test Interest');

    // Generate 버튼이 비활성화되어 있는지 확인
    const generateButton = page.getByRole('button', { name: 'Generate Policy Issues' });
    await expect(generateButton).toBeDisabled();

    // 로그인 안내 메시지 확인
    await expect(page.getByText(/Please login/i)).toBeVisible();
  });
});
