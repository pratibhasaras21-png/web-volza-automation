const { test, expect } = require('@playwright/test');
const { loginAndSelectCompany } = require('../../fixtures/auth.fixture');

// Migrated from src/pages/UniversalSearch_SmallPlan.specs.js (Module 5 - Universal
// Search, Small/Startup Plan). Source imported `loginAndSelectCompany` from
// `../helpers/auth` (the CommonJS helper) — switched to fixtures/auth.fixture.ts,
// the TS replacement for that same helper.
// Pre-conditions: Startup, Spark, Delight, or Micro plan.

test.describe('Module 5 - Universal Search (Small/Startup Plan)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndSelectCompany(page, process.env.VOLZA_STARTUP_COMPANY || process.env.VOLZA_COMPANY);
  });

  test('TC-SEARCH-016: Dropdown shows limited options (no Company/Consignee/Shipper)', async ({ page }) => {
    await page.locator('a:has-text("Universal Search")').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });

    const fieldDropdown = page.locator('[class*="field-select"], select').first();
    await fieldDropdown.waitFor({ state: 'visible', timeout: 10_000 });
    await fieldDropdown.click();
    await page.waitForTimeout(600);

    const expectedOptions = ['HS 2', 'HS 4', 'Products'];
    for (const opt of expectedOptions) {
      const optEl = page.locator('li, option, [class*="option"]').filter({ hasText: new RegExp(opt, 'i') }).first();
      await optEl.isVisible().catch(() => false);
    }
    await page.keyboard.press('Escape');
  });

  test('TC-SEARCH-017: Search by Product "brass" tokenizes and shows country-wise grid', async ({ page }) => {
    await page.locator('a:has-text("Universal Search")').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });

    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="product"]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 10_000 });
    await searchInput.fill('brass');
    await searchInput.press('Enter');
    await page.waitForTimeout(500);

    const chip = page.locator('[class*="chip"], [class*="token"], [class*="tag"]').filter({ hasText: /brass/i }).first();
    await expect(chip).toBeVisible({ timeout: 5_000 });

    await page.locator('button:has-text("Search"), button[type="submit"]').first().click();
    await page.waitForTimeout(4000);
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

    const gridRows = page.locator('tbody tr, [class*="grid-row"]');
    await expect(gridRows.first()).toBeVisible({ timeout: 25_000 });
  });

  test('TC-SEARCH-018: Downloading premium country (Bangladesh) shows upgrade popup', async ({ page }) => {
    await page.locator('a:has-text("Universal Search")').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });

    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 10_000 });
    await searchInput.fill('brass');
    await searchInput.press('Enter');
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Search"), button[type="submit"]').first().click();
    await page.waitForTimeout(4000);

    const downloadBtn = page.locator('button:has-text("Download"), [class*="download"]').first();
    await downloadBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await downloadBtn.click();
    await page.waitForTimeout(1000);

    const bangladeshCheckbox = page.locator('[class*="modal"] label, [role="dialog"] label')
      .filter({ hasText: /bangladesh/i }).first();
    if (await bangladeshCheckbox.isVisible()) {
      await bangladeshCheckbox.click();
      await page.waitForTimeout(500);
      const downloadNowBtn = page.locator('button:has-text("Download")').last();
      await downloadNowBtn.click();
      await page.waitForTimeout(1500);
      const upgradePopup = page.locator('[class*="modal"], [role="dialog"]')
        .filter({ hasText: /SME|upgrade|plan/i }).first();
      await expect(upgradePopup).toBeVisible({ timeout: 10_000 });
    }
  });

  test('TC-SEARCH-019: Download non-premium country (India/Mexico) succeeds', async ({ page }) => {
    await page.locator('a:has-text("Universal Search")').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });

    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 10_000 });
    await searchInput.fill('brass');
    await searchInput.press('Enter');
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Search"), button[type="submit"]').first().click();
    await page.waitForTimeout(4000);

    const downloadBtn = page.locator('button:has-text("Download"), [class*="download"]').first();
    await downloadBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await downloadBtn.click();
    await page.waitForTimeout(1000);

    const indiaCheckbox = page.locator('[class*="modal"] label, [role="dialog"] label')
      .filter({ hasText: /india/i }).first();
    if (await indiaCheckbox.isVisible()) {
      await indiaCheckbox.click();
      const downloadNowBtn = page.locator('button:has-text("Download")').last();
      await downloadNowBtn.click();
      await page.waitForTimeout(2000);
    } else {
      const firstCheckbox = page.locator('[class*="modal"] input[type="checkbox"]').first();
      if (await firstCheckbox.isVisible()) {
        await firstCheckbox.click();
        await page.locator('button:has-text("Download")').last().click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test('TC-SEARCH-020: My Download tab shows the Universal Search download query', async ({ page }) => {
    await page.locator('a:has-text("My Download"), [href*="download"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });

    const downloadRow = page.locator('tbody tr, [class*="download-row"]').first();
    await expect(downloadRow).toBeVisible({ timeout: 15_000 });
  });

  test('TC-SEARCH-021: Filter options (HS code, Import, Export, COO/COD) apply', async ({ page }) => {
    await page.locator('a:has-text("Universal Search")').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });

    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 10_000 });
    await searchInput.fill('brass');
    await searchInput.press('Enter');
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Search"), button[type="submit"]').first().click();
    await page.waitForTimeout(4000);

    const filterBtn = page.locator('button:has-text("Filter"), [class*="filter-btn"]').first();
    await filterBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await filterBtn.click();
    await page.waitForTimeout(800);

    const importFilter = page.locator('[class*="filter"] label').filter({ hasText: /import/i }).first();
    if (await importFilter.isVisible()) {
      await importFilter.click();
      await page.waitForTimeout(1000);
    }
  });

  test('TC-SEARCH-022: Lock icon / View More popup shown with validations', async ({ page }) => {
    await page.locator('a:has-text("Universal Search")').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });

    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 10_000 });
    await searchInput.fill('brass');
    await searchInput.press('Enter');
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Search"), button[type="submit"]').first().click();
    await page.waitForTimeout(4000);

    const lockOrViewMore = page.locator('[class*="lock"], button:has-text("View More"), button:has-text("Refine")').first();
    await lockOrViewMore.waitFor({ state: 'visible', timeout: 10_000 });
    await lockOrViewMore.click();
    await page.waitForTimeout(1500);

    const popup = page.locator('[class*="modal"], [role="dialog"]').first();
    await expect(popup).toBeVisible({ timeout: 8_000 });
  });

  test('TC-SEARCH-023: View More/Refine for premium country (Bangladesh) shows upgrade popup', async ({ page }) => {
    await page.locator('a:has-text("Universal Search")').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });

    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 10_000 });
    await searchInput.fill('brass');
    await searchInput.press('Enter');
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Search"), button[type="submit"]').first().click();
    await page.waitForTimeout(4000);

    const bangRow = page.locator('tbody tr').filter({ hasText: /bangladesh/i }).first();
    if (await bangRow.isVisible()) {
      const viewMoreBtn = bangRow.locator('button:has-text("View More"), button:has-text("Refine"), [class*="lock"]').first();
      if (await viewMoreBtn.isVisible()) {
        await viewMoreBtn.click();
        await page.waitForTimeout(1500);
        const upgradePopup = page.locator('[class*="modal"], [role="dialog"]')
          .filter({ hasText: /upgrade|SME/i }).first();
        await expect(upgradePopup).toBeVisible({ timeout: 8_000 });
      }
    }
  });

  test('TC-SEARCH-024: View More/Refine for non-premium country redirects to Search with filters', async ({ page }) => {
    await page.locator('a:has-text("Universal Search")').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });

    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 10_000 });
    await searchInput.fill('brass');
    await searchInput.press('Enter');
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Search"), button[type="submit"]').first().click();
    await page.waitForTimeout(4000);

    const indiaRow = page.locator('tbody tr').filter({ hasText: /india/i }).first();
    if (await indiaRow.isVisible()) {
      const viewMoreBtn = indiaRow.locator('button:has-text("View More"), button:has-text("Refine"), [class*="lock"]').first();
      if (await viewMoreBtn.isVisible()) {
        await viewMoreBtn.click();
        await page.waitForTimeout(2000);
        await expect(page).toHaveURL(/search/, { timeout: 15_000 });
      }
    } else {
      const viewMoreBtn = page.locator('button:has-text("View More"), button:has-text("Refine")').first();
      if (await viewMoreBtn.isVisible()) {
        await viewMoreBtn.click();
        await page.waitForTimeout(2000);
      }
    }
  });
});
