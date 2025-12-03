import { test, expect } from '@playwright/test';

test.describe('Capstone Topic Explorer - Full Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  // 커스텀 드롭다운 열기 헬퍼 함수
  const openCountryDropdown = async (page: import('@playwright/test').Page) => {
    const searchInput = page.getByPlaceholder('Search country...');
    if (await searchInput.isVisible()) {
      return;
    }

    const countryLabel = page.getByText('Country of Interest');
    const dropdown = countryLabel.locator('..').locator('.relative').first();
    await dropdown.click();
    await expect(searchInput).toBeVisible({ timeout: 5000 });
  };

  // 국가 선택 헬퍼 함수
  const selectCountry = async (
    page: import('@playwright/test').Page,
    countryName: string
  ) => {
    await openCountryDropdown(page);
    await page.getByPlaceholder('Search country...').fill(countryName);
    await page.locator('.max-h-60').getByText(countryName).first().click();
  };

  // 로그인 헬퍼 함수
  const login = async (page: import('@playwright/test').Page, studentId: string) => {
    // 로그인 버튼이 보일 때까지 대기
    const loginButton = page.getByRole('button', { name: 'Login' });
    await expect(loginButton).toBeVisible({ timeout: 10000 });
    await loginButton.click();
    await page.getByPlaceholder('e.g., 202412345').fill(studentId);
    await page.getByRole('button', { name: 'Login' }).last().click();
    // My Page 링크로 로그인 확인 (mobile에서도 동작)
    await expect(page.getByRole('link', { name: 'My Page' })).toBeVisible({ timeout: 10000 });
  };

  test('메인 페이지 로드 및 기본 요소 확인', async ({ page }) => {
    await expect(page.getByText('Capstone Project Topic Explorer')).toBeVisible();
    await expect(page.getByText('Step 1: Define Your Scope')).toBeVisible();
  });

  test('로그인 후 완전한 4단계 플로우', async ({ page }) => {
    // 이 테스트는 AI API 호출이 필요하므로 타임아웃 증가
    test.setTimeout(120000);

    // 로그인
    await login(page, '321000059');

    // Step 1: 국가 선택 및 관심 분야 입력
    await selectCountry(page, 'South Korea');
    await page
      .getByPlaceholder(
        'e.g., Digital Healthcare, Sustainable Energy Policy, Education Reform, Urban Development...'
      )
      .fill('Digital Healthcare');

    // Step 2로 이동
    await page.getByRole('button', { name: 'Generate Policy Issues' }).click();

    // 로딩 확인 (AI 응답 대기 - 최대 60초)
    await expect(page.getByText('Generating Issues...')).toBeVisible();
    await expect(page.getByText('Step 2')).toBeVisible({ timeout: 60000 });

    // Step 2: 정책 이슈 목록 확인 및 선택 - heading role로 구체적으로 선택
    await expect(
      page.getByRole('heading', { name: /Step 2.*Identify Key Policy Issues/i })
    ).toBeVisible();

    // issue 카드는 "Importance" 텍스트를 포함하는 카드로 찾기
    const issueCards = page.locator('.space-y-3 > div').filter({ hasText: 'Importance' });
    await expect(issueCards.first()).toBeVisible({ timeout: 10000 });

    // 첫 번째 이슈 선택
    await issueCards.first().click();
    await page.getByRole('button', { name: /Generate.*Topics/i }).click();

    // Step 3: 주제 목록 대기
    await expect(page.getByText('Step 3')).toBeVisible({ timeout: 60000 });
    await expect(
      page.getByRole('heading', { name: /Step 3.*Explore Capstone Topics/i })
    ).toBeVisible();

    // 첫 번째 주제 선택 및 분석 - cursor-pointer 클래스를 가진 카드 클릭
    const topicCards = page.locator('.space-y-3.mb-6 > div.cursor-pointer');
    await expect(topicCards.first()).toBeVisible({ timeout: 10000 });
    await topicCards.first().click();
    await page.getByRole('button', { name: /Get Detailed Analysis/i }).click();

    // Step 4: 상세 분석 대기
    await expect(page.getByText('Step 4')).toBeVisible({ timeout: 60000 });
    await expect(
      page.getByRole('heading', { name: /Step 4.*Detailed Topic Analysis/i })
    ).toBeVisible();

    // 분석 결과 확인
    await expect(page.getByText('Rationale')).toBeVisible();
    await expect(page.getByText('Key Policy Questions')).toBeVisible();
    await expect(page.getByText('Recommended Methodologies')).toBeVisible();
  });

  test('Back 버튼 동작', async ({ page }) => {
    // 이 테스트는 AI API 호출이 필요하므로 타임아웃 증가
    test.setTimeout(90000);

    // 로그인
    await login(page, '321000059');

    // Step 1 입력
    await selectCountry(page, 'South Korea');
    await page
      .getByPlaceholder(
        'e.g., Digital Healthcare, Sustainable Energy Policy, Education Reform, Urban Development...'
      )
      .fill('Environment Policy');

    // Step 2로 이동
    await page.getByRole('button', { name: 'Generate Policy Issues' }).click();
    await expect(page.getByText('Step 2')).toBeVisible({ timeout: 60000 });

    // Back to Step 1
    await page.getByRole('button', { name: /Back/i }).click();
    await expect(page.getByText('Step 1: Define Your Scope')).toBeVisible();

    // 이전 입력값 유지 확인
    await expect(
      page.getByPlaceholder(
        'e.g., Digital Healthcare, Sustainable Energy Policy, Education Reform, Urban Development...'
      )
    ).toHaveValue('Environment Policy');
  });

  test('비로그인 상태에서 Generate 버튼 비활성화', async ({ page }) => {
    // 로그아웃 상태 확인
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();

    // 국가 및 관심분야 입력
    await selectCountry(page, 'South Korea');
    await page
      .getByPlaceholder(
        'e.g., Digital Healthcare, Sustainable Energy Policy, Education Reform, Urban Development...'
      )
      .fill('Test Interest');

    // Generate 버튼이 비활성화되어 있는지 확인
    const generateButton = page.getByRole('button', { name: 'Generate Policy Issues' });
    await expect(generateButton).toBeDisabled();

    // 로그인 안내 메시지 확인
    await expect(page.getByText(/Please login/i)).toBeVisible();
  });
});
