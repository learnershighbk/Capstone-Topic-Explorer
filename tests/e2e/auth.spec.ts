import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('학번 로그인 성공 (9자리)', async ({ page }) => {
    // 로그인 버튼 클릭
    await page.getByRole('button', { name: 'Login' }).click();

    // 모달 확인
    await expect(page.getByText(/Student ID/i)).toBeVisible();

    // 학번 입력
    await page.getByPlaceholder(/student.*id/i).fill('321000059');
    await page.getByRole('button', { name: 'Login' }).last().click();

    // 로그인 성공 확인
    await expect(page.getByText('321000059')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: 'My Page' })).toBeVisible();
  });

  test('잘못된 학번 형식 에러 - 8자리', async ({ page }) => {
    await page.getByRole('button', { name: 'Login' }).click();

    // 8자리 입력
    await page.getByPlaceholder(/student.*id/i).fill('32100005');
    await page.getByRole('button', { name: 'Login' }).last().click();

    // 에러 메시지 확인
    await expect(page.getByText(/9.*digit/i)).toBeVisible();
  });

  test('잘못된 학번 형식 에러 - 문자 포함', async ({ page }) => {
    await page.getByRole('button', { name: 'Login' }).click();

    // 문자가 포함된 입력
    await page.getByPlaceholder(/student.*id/i).fill('32100abc9');
    await page.getByRole('button', { name: 'Login' }).last().click();

    // 에러 메시지 확인
    await expect(page.getByText(/9.*digit/i)).toBeVisible();
  });

  test('로그아웃', async ({ page }) => {
    // 먼저 로그인
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByPlaceholder(/student.*id/i).fill('321000059');
    await page.getByRole('button', { name: 'Login' }).last().click();

    await expect(page.getByText('321000059')).toBeVisible({ timeout: 10000 });

    // 로그아웃
    await page.getByRole('button', { name: 'Logout' }).click();

    // 로그아웃 확인
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'My Page' })).not.toBeVisible();
  });

  test('세션 유지 - 페이지 새로고침 후에도 로그인 상태 유지', async ({ page }) => {
    // 로그인
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByPlaceholder(/student.*id/i).fill('321000059');
    await page.getByRole('button', { name: 'Login' }).last().click();

    await expect(page.getByText('321000059')).toBeVisible({ timeout: 10000 });

    // 페이지 새로고침
    await page.reload();

    // 로그인 상태 유지 확인
    await expect(page.getByText('321000059')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: 'My Page' })).toBeVisible();
  });

  test('로그인 모달 닫기', async ({ page }) => {
    // 로그인 버튼 클릭
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByText(/Student ID/i)).toBeVisible();

    // ESC 키로 모달 닫기 또는 외부 클릭
    await page.keyboard.press('Escape');

    // 모달이 닫혔는지 확인
    await expect(page.getByPlaceholder(/student.*id/i)).not.toBeVisible();
  });
});
