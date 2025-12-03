import { test, expect } from '@playwright/test';

test.describe('UN 193 Countries Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('South Korea가 첫 번째로 표시', async ({ page }) => {
    // 드롭다운 열기
    await page.locator('[role="combobox"]').first().click();

    // 첫 번째 옵션이 South Korea인지 확인
    const options = page.locator('[role="option"]');
    await expect(options.first()).toContainText('South Korea');
  });

  test('영문 검색 기능', async ({ page }) => {
    await page.locator('[role="combobox"]').first().click();

    // 검색 입력
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('Japan');

    // 검색 결과에 Japan 표시
    await expect(page.getByText('Japan')).toBeVisible();

    // South Korea는 필터링되어 안 보임
    const options = page.locator('[role="option"]');
    const count = await options.count();
    expect(count).toBeLessThan(10);
  });

  test('국가 선택', async ({ page }) => {
    await page.locator('[role="combobox"]').first().click();

    // Japan 선택
    await page.getByText('Japan').click();

    // 선택된 값 확인
    await expect(page.locator('[role="combobox"]').first()).toContainText('Japan');
  });

  test('여러 국가 검색 테스트', async ({ page }) => {
    const testCases = [
      { search: 'United', expected: 'United States' },
      { search: 'Germany', expected: 'Germany' },
      { search: 'France', expected: 'France' },
      { search: 'China', expected: 'China' },
    ];

    for (const { search, expected } of testCases) {
      await page.locator('[role="combobox"]').first().click();

      const searchInput = page.getByPlaceholder(/search/i);
      await searchInput.clear();
      await searchInput.fill(search);

      await expect(page.getByText(expected).first()).toBeVisible();

      // 드롭다운 닫기
      await page.keyboard.press('Escape');
    }
  });

  test('존재하지 않는 국가 검색', async ({ page }) => {
    await page.locator('[role="combobox"]').first().click();

    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('Atlantis');

    // 검색 결과 없음 또는 빈 목록
    const options = page.locator('[role="option"]');
    const count = await options.count();
    expect(count).toBe(0);
  });

  test('국가 선택 후 검색 초기화', async ({ page }) => {
    await page.locator('[role="combobox"]').first().click();

    // 검색 후 선택
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('Canada');
    await page.getByText('Canada').click();

    // 다시 드롭다운 열기
    await page.locator('[role="combobox"]').first().click();

    // 검색어가 초기화되어 있어야 함
    const newSearchInput = page.getByPlaceholder(/search/i);
    await expect(newSearchInput).toHaveValue('');
  });

  test('알파벳 순 정렬 확인 (South Korea 다음)', async ({ page }) => {
    await page.locator('[role="combobox"]').first().click();

    const options = page.locator('[role="option"]');

    // 첫 번째는 South Korea
    await expect(options.nth(0)).toContainText('South Korea');

    // 나머지는 알파벳 순 (A로 시작하는 국가들)
    await expect(options.nth(1)).toContainText('Afghanistan');
  });

  test('키보드 네비게이션', async ({ page }) => {
    await page.locator('[role="combobox"]').first().click();

    // 아래 화살표로 이동
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');

    // Enter로 선택
    await page.keyboard.press('Enter');

    // 드롭다운이 닫히고 국가가 선택됨
    await expect(page.locator('[role="combobox"]').first()).not.toContainText(
      'Select a country'
    );
  });
});
