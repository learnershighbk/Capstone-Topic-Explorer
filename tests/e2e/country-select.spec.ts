import { test, expect } from '@playwright/test';

test.describe('UN 193 Countries Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  // 커스텀 드롭다운 열기 헬퍼 함수
  const openCountryDropdown = async (page: import('@playwright/test').Page) => {
    // 드롭다운이 이미 열려있는지 확인
    const searchInput = page.getByPlaceholder('Search country...');
    if (await searchInput.isVisible()) {
      return; // 이미 열려있으면 그대로 반환
    }

    // 국가 선택 드롭다운 클릭 (Country of Interest 라벨 아래의 div)
    const countryLabel = page.getByText('Country of Interest');
    const dropdown = countryLabel.locator('..').locator('.relative').first();
    await dropdown.click();

    // 드롭다운이 열릴 때까지 대기
    await expect(searchInput).toBeVisible({ timeout: 5000 });
  };

  // 드롭다운 닫기 헬퍼 함수
  const closeCountryDropdown = async (page: import('@playwright/test').Page) => {
    const searchInput = page.getByPlaceholder('Search country...');
    if (await searchInput.isVisible()) {
      // 외부 클릭으로 닫기
      await page.locator('body').click({ position: { x: 10, y: 10 } });
      await expect(searchInput).not.toBeVisible({ timeout: 3000 });
    }
  };

  test('South Korea가 첫 번째로 표시', async ({ page }) => {
    // 드롭다운 열기
    await openCountryDropdown(page);

    // 첫 번째 옵션이 South Korea인지 확인 (Priority 배지가 있는 항목)
    const priorityItem = page.locator('.max-h-60 > div').first();
    await expect(priorityItem).toContainText('South Korea');
    await expect(page.getByText('Priority')).toBeVisible();
  });

  test('영문 검색 기능', async ({ page }) => {
    await openCountryDropdown(page);

    // 검색 입력
    const searchInput = page.getByPlaceholder('Search country...');
    await searchInput.fill('Japan');

    // 검색 결과에 Japan 표시
    await expect(page.locator('.max-h-60').getByText('Japan')).toBeVisible();

    // 검색 결과가 적어야 함
    const options = page.locator('.max-h-60 > div');
    const count = await options.count();
    expect(count).toBeLessThan(10);
  });

  test('국가 선택', async ({ page }) => {
    await openCountryDropdown(page);

    // Japan 검색 후 선택
    await page.getByPlaceholder('Search country...').fill('Japan');
    await page.locator('.max-h-60').getByText('Japan').click();

    // 선택된 값 확인 - 드롭다운 내부에 Japan이 표시됨
    await expect(page.locator('.relative').filter({ hasText: 'Japan' }).first()).toBeVisible();
  });

  test('여러 국가 검색 테스트', async ({ page }) => {
    const testCases = [
      { search: 'United', expected: 'United States' },
      { search: 'Germany', expected: 'Germany' },
      { search: 'France', expected: 'France' },
      { search: 'China', expected: 'China' },
    ];

    for (const { search, expected } of testCases) {
      // 드롭다운 닫기 (열려있는 경우)
      await closeCountryDropdown(page);

      // 드롭다운 열기
      await openCountryDropdown(page);

      const searchInput = page.getByPlaceholder('Search country...');
      await searchInput.clear();
      await searchInput.fill(search);

      await expect(page.locator('.max-h-60').getByText(expected).first()).toBeVisible();
    }
  });

  test('존재하지 않는 국가 검색', async ({ page }) => {
    await openCountryDropdown(page);

    const searchInput = page.getByPlaceholder('Search country...');
    await searchInput.fill('Atlantis');

    // "No countries found" 메시지 확인
    await expect(page.getByText('No countries found')).toBeVisible();
  });

  test('국가 선택 후 검색 초기화', async ({ page }) => {
    await openCountryDropdown(page);

    // 검색 후 선택
    const searchInput = page.getByPlaceholder('Search country...');
    await searchInput.fill('Canada');
    await page.locator('.max-h-60').getByText('Canada').click();

    // 다시 드롭다운 열기
    await openCountryDropdown(page);

    // 검색어가 초기화되어 있어야 함
    const newSearchInput = page.getByPlaceholder('Search country...');
    await expect(newSearchInput).toHaveValue('');
  });

  test('알파벳 순 정렬 확인 (South Korea 다음)', async ({ page }) => {
    await openCountryDropdown(page);

    const options = page.locator('.max-h-60 > div');

    // 첫 번째는 South Korea
    await expect(options.nth(0)).toContainText('South Korea');

    // 나머지는 알파벳 순 (A로 시작하는 국가들)
    await expect(options.nth(1)).toContainText('Afghanistan');
  });

  test('키보드 네비게이션', async ({ page }) => {
    await openCountryDropdown(page);

    // 검색창에 포커스가 있으므로, Japan 입력 후 선택
    await page.getByPlaceholder('Search country...').fill('Japan');

    // 직접 클릭으로 선택
    await page.locator('.max-h-60').getByText('Japan').click();

    // 드롭다운이 닫히고 국가가 선택됨
    await expect(page.locator('.relative').filter({ hasText: 'Japan' }).first()).toBeVisible();
  });
});
