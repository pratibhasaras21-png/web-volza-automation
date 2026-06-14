import { Page, Locator } from '@playwright/test';

export class SearchPage {
  readonly page: Page;
  readonly searchTab: Locator;
  readonly countryDropdown: Locator;
  readonly countryInput: Locator;
  readonly periodDropdown: Locator;
  readonly productKeywordInput: Locator;
  readonly searchButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.searchTab = page.locator('a:has-text("Search"), button:has-text("Search"), nav a:has-text("Search")').first();

    // The country selector container — clicking it opens the searchable dropdown
    this.countryDropdown = page.locator('.select__control, [class*="select-container"], [class*="country"]').first();

    // Text input that appears inside the dropdown for filtering
    this.countryInput = page.locator('.select__input input, [class*="select"] input[type="text"]').first();

    // Period dropdown (shows "Last 30 Days" by default)
    this.periodDropdown = page.locator('select, [class*="period"], .dropdown').filter({ hasText: /Last/i }).first();

    // Tag-style input for product keywords
    this.productKeywordInput = page.locator('input[placeholder*="Add new tag"], input[placeholder*="tag"], .tags-input input').first();

    this.searchButton = page.locator('button:has-text("Search")').last();
  }

  async goto(): Promise<void> {
    await this.page.goto('https://app.volza.com/home');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async clickSearchTab(): Promise<void> {
    // Wait for the nav to settle after redirect from login
    await this.page.waitForTimeout(2000);
    const searchNav = this.page.locator('nav a, .nav-link, [role="tab"]').filter({ hasText: /^Search$/i }).first();
    await searchNav.waitFor({ state: 'visible', timeout: 15_000 });
    await searchNav.click();
    await this.page.waitForTimeout(1000);
  }

  async selectCountry(countryText: string): Promise<void> {
    // Click the country Select control to open the dropdown
    const selectControl = this.page.locator('.select__control').first();
    await selectControl.waitFor({ state: 'visible', timeout: 15_000 });
    await selectControl.click();

    // Type in the filter input that appears
    const filterInput = this.page.locator('.select__input input').first();
    await filterInput.waitFor({ state: 'visible', timeout: 5_000 });
    await filterInput.fill('afg');
    await this.page.waitForTimeout(800);

    // Click the matching option
    const option = this.page.locator('.select__option, [class*="option"]').filter({ hasText: countryText }).first();
    await option.waitFor({ state: 'visible', timeout: 8_000 });
    await option.click();
    await this.page.waitForTimeout(500);
  }

  async selectPeriod(periodLabel: string): Promise<void> {
    // Period is typically a native <select> or a custom dropdown
    const nativeSelect = this.page.locator('select').filter({ hasText: /Last/i }).first();
    const isNative = await nativeSelect.count() > 0;

    if (isNative) {
      await nativeSelect.selectOption({ label: periodLabel });
    } else {
      // Custom dropdown — click to open then pick option
      const periodControl = this.page.locator('[class*="period"], .dropdown').filter({ hasText: /Last/i }).first();
      await periodControl.click();
      await this.page.waitForTimeout(500);
      await this.page.locator('[class*="option"], li').filter({ hasText: periodLabel }).first().click();
    }
    await this.page.waitForTimeout(500);
  }

  async enterProductKeyword(keyword: string): Promise<void> {
    // The tags input — type the keyword then press Enter to create the tag
    const tagsInput = this.page.locator('input[placeholder*="Add new tag"], input[placeholder*="tag"]').first();
    await tagsInput.waitFor({ state: 'visible', timeout: 10_000 });
    await tagsInput.click();
    await tagsInput.fill(keyword);
    await tagsInput.press('Enter');
    await this.page.waitForTimeout(500);
  }

  async clickSearch(): Promise<void> {
    const btn = this.page.locator('button:has-text("Search")').last();
    await btn.waitFor({ state: 'visible', timeout: 10_000 });
    await btn.click();
    // Wait for results page to load
    await this.page.waitForLoadState('domcontentloaded', { timeout: 30_000 });
    await this.page.waitForTimeout(2000);
  }
}
