import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('학번 로그인 성공 (9자리)', async ({ page }) => {
    // 로그인 버튼 클릭
    await page.getByRole('button', { name: 'Login' }).click();

    // 모달 확인 - 라벨 텍스트로 확인
    await expect(page.getByLabel('Student ID')).toBeVisible();

    // 학번 입력 - 실제 placeholder 사용
    await page.getByPlaceholder('e.g., 202412345').fill('321000059');
    await page.getByRole('button', { name: 'Login' }).last().click();

    // 로그인 성공 확인 - My Page 링크로 확인 (mobile에서도 동작)
    await expect(page.getByRole('link', { name: 'My Page' })).toBeVisible({ timeout: 10000 });
  });

  test('잘못된 학번 형식 에러 - 8자리', async ({ page }) => {
    await page.getByRole('button', { name: 'Login' }).click();

    // 8자리 입력
    await page.getByPlaceholder('e.g., 202412345').fill('32100005');

    // 9자리가 아니면 Login 버튼이 비활성화됨
    const loginButton = page.locator('button[type="submit"]');
    await expect(loginButton).toBeDisabled();
  });

  test('잘못된 학번 형식 에러 - 문자 포함', async ({ page }) => {
    await page.getByRole('button', { name: 'Login' }).click();

    // 문자가 포함된 입력 - 숫자만 입력되도록 필터링되므로 실제로는 321009만 입력됨 (6자리)
    await page.getByPlaceholder('e.g., 202412345').fill('32100abc9');

    // 9자리가 아니면 Login 버튼이 비활성화됨
    const loginButton = page.locator('button[type="submit"]');
    await expect(loginButton).toBeDisabled();
  });

  test('로그아웃', async ({ page }) => {
    // 먼저 로그인
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByPlaceholder('e.g., 202412345').fill('321000059');
    await page.getByRole('button', { name: 'Login' }).last().click();

    // My Page 링크로 로그인 확인
    await expect(page.getByRole('link', { name: 'My Page' })).toBeVisible({ timeout: 10000 });

    // 로그아웃
    await page.getByRole('button', { name: 'Logout' }).click();

    // 로그아웃 확인
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'My Page' })).not.toBeVisible();
  });

  test('세션 유지 - 페이지 새로고침 후에도 로그인 상태 유지', async ({ page }) => {
    // 로그인
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByPlaceholder('e.g., 202412345').fill('321000059');
    await page.getByRole('button', { name: 'Login' }).last().click();

    await expect(page.getByRole('link', { name: 'My Page' })).toBeVisible({ timeout: 10000 });

    // 페이지 새로고침
    await page.reload();

    // 로그인 상태 유지 확인
    await expect(page.getByRole('link', { name: 'My Page' })).toBeVisible({ timeout: 10000 });
  });

  test('로그인 모달 닫기', async ({ page }) => {
    // 로그인 버튼 클릭
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByLabel('Student ID')).toBeVisible();

    // Cancel 버튼으로 모달 닫기
    await page.getByRole('button', { name: 'Cancel' }).click();

    // 모달이 닫혔는지 확인
    await expect(page.getByPlaceholder('e.g., 202412345')).not.toBeVisible();
  });
});
