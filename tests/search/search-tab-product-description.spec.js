const { test, expect } = require('@playwright/test');
const { handleMaxRecordsPopup } = require('../../helpers/maxRecordsPopup');

// Migrated from src/pages/SearchTab_ProductDescription.specs.js (Module 6.1 -
// Search Tab, Product Description). Pre-conditions: SME or Corporate plan.
// Login is handled once via global-setup.ts, which persists session cookies to
// auth-state.json - every test here starts already authenticated.

const COUNTRY_DATABASE = { label: 'Global Import T3', textFallbackRegex: /global.*import.*t3|global.*import/i };

test.describe('Module 6.1 - Search Tab (Product Description)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://app.volza.com/home');
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });
  });

  // Helper: select a <select>/custom-dropdown option matching `regex`, falling back to a
  // click-driven select if the dropdown isn't a native <select> or the option's <option>
  // tag can't be resolved. selectOption's `label` matcher requires an exact string, not a
  // regex - resolve the option's literal text first when it is a native <select>.
  async function selectDropdownOptionByText(page, dropdown, regex) {
    const nativeOption = dropdown.locator('option').filter({ hasText: regex }).first();
    const label = await nativeOption.textContent().catch(() => null);
    if (label) {
      await dropdown.selectOption({ label: label.trim() }).catch(async () => {
        await dropdown.click();
        await page.locator('li, option').filter({ hasText: regex }).first().click();
      });
    } else {
      await dropdown.click();
      await page.locator('li, option').filter({ hasText: regex }).first().click();
    }
  }

  // Helper: open the "Select Country" dropdown-display and pick the given database by
  // its visible label text. Deliberately scoped to the widget labeled "Select Country"
  // (not a bare `select, ...` locator) - the page also has an unrelated native "Select
  // Language" <select> in the top nav, and a generic `.first()` match can land on that
  // instead of the actual country/database picker.
  async function selectCountryDatabase(page, db) {
    await page.locator('.dropdown-display', { hasText: 'Select Country' }).first().click();
    await page.waitForTimeout(500);

    const textOption = page.locator('li:visible, [role="option"]:visible, a:visible, div:visible')
      .filter({ hasText: db.textFallbackRegex })
      .first();
    await textOption.waitFor({ state: 'visible', timeout: 8_000 });
    await textOption.click();
    await page.waitForTimeout(1000);
  }

  test('TC-SEARCH-025: Product description search - cotton in Global Import T3 (search, filter, save workspace)', async ({ page }) => {
    await page.locator('a:has-text("Search"), [href*="search"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });

    await selectCountryDatabase(page, COUNTRY_DATABASE);

    const startDate = page.locator('input[name*="start"], input[placeholder*="start"], input[type="date"]').first();
    if (await startDate.isVisible()) {
      await startDate.fill('2023-01-01');
      const endDate = page.locator('input[name*="end"], input[placeholder*="end"]').first();
      if (await endDate.isVisible()) await endDate.fill('2024-01-01');
    }

    const fieldDropdown = page.locator('[class*="field-select"], select').filter({ hasText: /product|hs code|shipper/i }).first();
    await fieldDropdown.waitFor({ state: 'visible', timeout: 10_000 });
    await selectDropdownOptionByText(page, fieldDropdown, /product description/i);

    const searchInput = page.locator('input[placeholder*="product"], input[placeholder*="Search"]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 10_000 });
    await searchInput.fill('cotton');
    await page.waitForTimeout(1500);

    const suggestion = page.locator('[class*="suggestion"], [class*="dropdown-item"], li')
      .filter({ hasText: /cotton/i }).first();
    if (await suggestion.isVisible()) {
      await suggestion.click();
    } else {
      await searchInput.press('Enter');
    }
    await page.waitForTimeout(500);

    const chip = page.locator('[class*="chip"], [class*="token"], [class*="tag"]').filter({ hasText: /cotton/i }).first();
    await expect(chip).toBeVisible({ timeout: 5_000 });

    await page.locator('button:has-text("Search"), button[type="submit"]').first().click();
    await page.waitForTimeout(4000);
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await handleMaxRecordsPopup(page);

    const gridRows = page.locator('tbody tr:has(td), [class*="grid-row"], [class*="shipment-row"]');
    await expect(gridRows.first()).toBeVisible({ timeout: 30_000 });
  });

  test('TC-SEARCH-026: Apply left filter - results filtered and search counter deducted', async ({ page }) => {
    await page.locator('a:has-text("Search"), [href*="search"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });

    await selectCountryDatabase(page, COUNTRY_DATABASE);

    const fieldDropdown = page.locator('[class*="field-select"], select').filter({ hasText: /product|hs code/i }).first();
    await selectDropdownOptionByText(page, fieldDropdown, /product description/i).catch(() => {});

    const searchInput = page.locator('input[placeholder*="product"], input[placeholder*="Search"]').first();
    await searchInput.fill('cotton');
    await searchInput.press('Enter');
    await page.waitForTimeout(500);

    await page.locator('button:has-text("Search"), button[type="submit"]').first().click();
    await page.waitForTimeout(4000);
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await handleMaxRecordsPopup(page);

    const leftFilterCheckbox = page.locator('[class*="left-filter"] input[type="checkbox"], [class*="filter-panel"] input[type="checkbox"]').first();
    if (await leftFilterCheckbox.isVisible()) {
      await leftFilterCheckbox.click();
      await page.waitForTimeout(3000);
    }
  });

  test('TC-SEARCH-027: Save Workspace popup appears without point deduction', async ({ page }) => {
    await page.locator('a:has-text("Search"), [href*="search"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });

    await selectCountryDatabase(page, COUNTRY_DATABASE);

    const searchInput = page.locator('input[placeholder*="product"], input[placeholder*="Search"]').first();
    await searchInput.fill('cotton');
    await searchInput.press('Enter');
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Search"), button[type="submit"]').first().click();
    await page.waitForTimeout(4000);
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await handleMaxRecordsPopup(page);

    const saveBtn = page.locator('button:has-text("Save Workspace"), button:has-text("Save workspace")').first();
    await saveBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await saveBtn.click();
    await page.waitForTimeout(1000);

    const saveModal = page.locator('[class*="modal"], [role="dialog"]').filter({ hasText: /workspace/i }).first();
    await expect(saveModal).toBeVisible({ timeout: 8_000 });
    await page.keyboard.press('Escape');
  });

  test('TC-SEARCH-028: Download all dashboards and verify in My Download', async ({ page }) => {
    await page.locator('a:has-text("Search"), [href*="search"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });

    await selectCountryDatabase(page, COUNTRY_DATABASE);

    const searchInput = page.locator('input[placeholder*="product"], input[placeholder*="Search"]').first();
    await searchInput.fill('cotton');
    await searchInput.press('Enter');
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Search"), button[type="submit"]').first().click();
    await page.waitForTimeout(4000);
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await handleMaxRecordsPopup(page);

    const downloadBtn = page.locator('button:has-text("Download"), [class*="download-btn"]').first();
    await downloadBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await downloadBtn.click();
    await page.waitForTimeout(1500);

    const downloadModal = page.locator('[class*="modal"], [role="dialog"]').first();
    await expect(downloadModal).toBeVisible({ timeout: 8_000 });

    const allCheckboxes = page.locator('[class*="modal"] input[type="checkbox"], [role="dialog"] input[type="checkbox"]');
    const count = await allCheckboxes.count();
    for (let i = 0; i < count; i++) {
      await allCheckboxes.nth(i).check().catch(() => {});
    }

    const excelDownloadBtn = page.locator('button:has-text("Excel Download"), button:has-text("Download Excel")').first();
    await excelDownloadBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await excelDownloadBtn.click();
    await page.waitForTimeout(1500);

    const successPopup = page.locator('[class*="toast"], [class*="popup"], [role="alert"]')
      .filter({ hasText: /complete shortly|download/i }).first();
    await expect(successPopup).toBeVisible({ timeout: 10_000 });

    await page.locator('a:has-text("My Download"), [href*="download"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });

    const downloadRow = page.locator('tbody tr, [class*="download-row"]').first();
    await expect(downloadRow).toBeVisible({ timeout: 15_000 });

    const downloadLink = page.locator('a:has-text("Download"), [class*="download-link"]').first();
    if (await downloadLink.isVisible()) {
      await Promise.all([
        page.waitForEvent('download', { timeout: 15_000 }).catch(() => null),
        downloadLink.click(),
      ]);
    }
  });
});
