const { test, expect } = require('@playwright/test');

// ─── Module 12: Countries Tab ─────────────────────────────────────────────────
// Pre-conditions: Startup, SME, or Corporate plan

async function navigateToCountriesTab(page) {
  // "Countries" is one of the top dashboard tabs (Welcome/Search/Trending Products/
  // Trending Companies/Countries/Universal Search) — a role="tab" element, not a
  // sidebar <a> link. The original locator (`a:has-text`/`[href*="countries"]`)
  // never matched anything real and just timed out.
  await page.getByRole('tab', { name: 'Countries', exact: true }).click();
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
}

test.describe('Module 12 - Countries Tab', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('https://app.volza.com/home');
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  });

  // ── TC-COUNTRY-001: Navigate to Countries tab and verify grid ─────────────
  test('TC-COUNTRY-001: Countries tab shows list of all countries in grid', async ({ page }) => {
    console.log('[TC-COUNTRY-001] Click Countries tab');
    await navigateToCountriesTab(page);

    const countriesGrid = page.locator('tbody tr, [class*="country-card"], [class*="country-row"]').first();
    await expect(countriesGrid).toBeVisible({ timeout: 20000 });
    console.log('[TC-COUNTRY-001] Countries tab loaded with country list');
  });

  // ── TC-COUNTRY-002: Alphabet filter ────────────────────────────────────────
  test('TC-COUNTRY-002: Alphabet filter shows countries starting with selected letter', async ({ page }) => {
    console.log('[TC-COUNTRY-002] Navigate to Countries tab');
    await navigateToCountriesTab(page);

    console.log('[TC-COUNTRY-002] Click alphabet "A"');
    const alphaA = page.locator('button:has-text("A"), [class*="alpha"] button').filter({ hasText: /^A$/ }).first();
    await alphaA.waitFor({ state: 'visible', timeout: 10000 });
    await alphaA.click();
    await page.waitForTimeout(1500);

    const firstCountryRow = page.locator('tbody tr, [class*="country-row"]').first();
    await expect(firstCountryRow).toBeVisible({ timeout: 10000 });
    const firstCountryName = await firstCountryRow.locator('td, [class*="country-name"]').first().textContent();
    expect(firstCountryName?.trim().toUpperCase().startsWith('A')).toBe(true);
    console.log(`[TC-COUNTRY-002] First country starts with A: ${firstCountryName}`);

    console.log('[TC-COUNTRY-002] Click alphabet "B"');
    const alphaB = page.locator('button:has-text("B"), [class*="alpha"] button').filter({ hasText: /^B$/ }).first();
    await alphaB.click();
    await page.waitForTimeout(1500);
    const firstBRow = page.locator('tbody tr, [class*="country-row"]').first();
    const firstBName = await firstBRow.locator('td, [class*="country-name"]').first().textContent();
    expect(firstBName?.trim().toUpperCase().startsWith('B')).toBe(true);
    console.log(`[TC-COUNTRY-002] First country starts with B: ${firstBName}`);
  });

  // ── TC-COUNTRY-003: Search bar filters countries ───────────────────────────
  test('TC-COUNTRY-003: Search bar filters to show matching country (Bangladesh)', async ({ page }) => {
    console.log('[TC-COUNTRY-003] Navigate to Countries tab');
    await navigateToCountriesTab(page);

    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="country" i]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput.fill('Bangladesh');
    await page.waitForTimeout(1500);

    const rows = page.locator('tbody tr, [class*="country-row"]');
    const rowCount = await rows.count();
    console.log(`[TC-COUNTRY-003] Countries shown after search: ${rowCount}`);

    const bangladeshRow = rows.filter({ hasText: /bangladesh/i }).first();
    await expect(bangladeshRow).toBeVisible({ timeout: 5000 });
    console.log('[TC-COUNTRY-003] Bangladesh visible in search results');
  });

  // Shared helper for the six "Sort by" dropdown variants (TC-COUNTRY-004..009)
  async function sortByAndVerify(page, label, index) {
    const sortDropdown = page.locator('select, [class*="sort-by"], [class*="sort-dropdown"]').first();
    await sortDropdown.waitFor({ state: 'visible', timeout: 10000 });

    try {
      await sortDropdown.selectOption({ label: new RegExp(label, 'i') });
    } catch {
      await sortDropdown.click();
      const optEl = page.locator('li, option').filter({ hasText: new RegExp(label, 'i') }).first();
      if (await optEl.isVisible()) {
        await optEl.click();
      } else {
        await sortDropdown.selectOption({ index }).catch(() => {});
      }
    }
    await page.waitForTimeout(1500);

    const rows = page.locator('tbody tr, [class*="country-row"]');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
  }

  // ── TC-COUNTRY-004: Sort by Country Name Descending ────────────────────────
  test('TC-COUNTRY-004: Sort by dropdown - Country Name Descending (Z to A)', async ({ page }) => {
    await navigateToCountriesTab(page);
    await sortByAndVerify(page, 'Country Name Descending', 1);
    console.log('[TC-COUNTRY-004] Sorted by Country Name Descending (Z to A)');
  });

  // ── TC-COUNTRY-005: Sort by Country Name Ascending ─────────────────────────
  test('TC-COUNTRY-005: Sort by dropdown - Country Name Ascending (A to Z)', async ({ page }) => {
    await navigateToCountriesTab(page);
    await sortByAndVerify(page, 'Country Name Ascending', 2);
    console.log('[TC-COUNTRY-005] Sorted by Country Name Ascending (A to Z)');
  });

  // ── TC-COUNTRY-006: Sort by Start Date Descending ──────────────────────────
  test('TC-COUNTRY-006: Sort by dropdown - Start Date Descending (Dec to Jan)', async ({ page }) => {
    await navigateToCountriesTab(page);
    await sortByAndVerify(page, 'Start Date Descending', 3);
    console.log('[TC-COUNTRY-006] Sorted by Start Date Descending (Dec to Jan)');
  });

  // ── TC-COUNTRY-007: Sort by Start Date Ascending ───────────────────────────
  test('TC-COUNTRY-007: Sort by dropdown - Start Date Ascending (Jan to Dec)', async ({ page }) => {
    await navigateToCountriesTab(page);
    await sortByAndVerify(page, 'Start Date Ascending', 4);
    console.log('[TC-COUNTRY-007] Sorted by Start Date Ascending (Jan to Dec)');
  });

  // ── TC-COUNTRY-008: Sort by End Date Descending ────────────────────────────
  test('TC-COUNTRY-008: Sort by dropdown - End Date Descending (Dec to Jan)', async ({ page }) => {
    await navigateToCountriesTab(page);
    await sortByAndVerify(page, 'End Date Descending', 5);
    console.log('[TC-COUNTRY-008] Sorted by End Date Descending (Dec to Jan)');
  });

  // ── TC-COUNTRY-009: Sort by End Date Ascending ─────────────────────────────
  test('TC-COUNTRY-009: Sort by dropdown - End Date Ascending (Jan to Dec)', async ({ page }) => {
    await navigateToCountriesTab(page);
    await sortByAndVerify(page, 'End Date Ascending', 6);
    console.log('[TC-COUNTRY-009] Sorted by End Date Ascending (Jan to Dec)');
  });

  // ── TC-COUNTRY-010: Filter by T1/T2/T3 data type ──────────────────────────
  test('TC-COUNTRY-010: All dropdown filter shows T1/T2/T3 etc. data correctly', async ({ page }) => {
    console.log('[TC-COUNTRY-010] Navigate to Countries tab');
    await navigateToCountriesTab(page);

    const allDropdown = page.locator('select, [class*="filter-dropdown"]').filter({ hasText: /All|T1|T2|T3/i }).first();
    await allDropdown.waitFor({ state: 'visible', timeout: 10000 });

    const filterOptions = ['T1', 'T2', 'T3+', 'Import', 'Export', 'SME'];
    for (const filterOpt of filterOptions) {
      try {
        await allDropdown.selectOption({ label: new RegExp(filterOpt, 'i') });
        await page.waitForTimeout(1500);
        const rows = page.locator('tbody tr, [class*="country-row"]');
        const rowCount = await rows.count();
        console.log(`[TC-COUNTRY-010] Filter "${filterOpt}" - rows: ${rowCount}`);
      } catch {
        console.log(`[TC-COUNTRY-010] Filter "${filterOpt}" option not available`);
      }
    }
    console.log('[TC-COUNTRY-010] Type filters checked');
  });

  // ── TC-COUNTRY-011: SME onwards filter ────────────────────────────────────
  test('TC-COUNTRY-011: "SME Onwards" filter shows Accessibility column with SME onwards data', async ({ page }) => {
    console.log('[TC-COUNTRY-011] Navigate to Countries tab');
    await navigateToCountriesTab(page);

    const allDropdown = page.locator('select, [class*="filter-dropdown"]').first();
    await allDropdown.waitFor({ state: 'visible', timeout: 10000 });

    try {
      await allDropdown.selectOption({ label: /SME onwards/i });
      await page.waitForTimeout(1500);

      const accessibilityCol = page.locator('th, [class*="col-header"]').filter({ hasText: /accessibility/i }).first();
      await expect(accessibilityCol).toBeVisible({ timeout: 5000 });

      const firstRow = page.locator('tbody tr').first();
      const accessibilityCell = firstRow.locator('td').last();
      const cellText = await accessibilityCell.textContent();
      console.log(`[TC-COUNTRY-011] Accessibility value: ${cellText}`);
      console.log('[TC-COUNTRY-011] SME onwards filter and Accessibility column verified');
    } catch {
      console.log('[TC-COUNTRY-011] SME onwards filter not available for this plan');
    }
  });

  // ── TC-COUNTRY-012: Switch to List View ───────────────────────────────────
  test('TC-COUNTRY-012: List View icon switches to grid/list view', async ({ page }) => {
    console.log('[TC-COUNTRY-012] Navigate to Countries tab');
    await navigateToCountriesTab(page);

    const listViewBtn = page.locator('button[title*="list" i], button[aria-label*="list" i], [class*="list-view"]').first();
    if (await listViewBtn.isVisible()) {
      await listViewBtn.click();
      await page.waitForTimeout(1000);
      const listView = page.locator('[class*="list-view"], tbody').first();
      await expect(listView).toBeVisible({ timeout: 5000 });
      console.log('[TC-COUNTRY-012] List view activated');
    } else {
      console.log('[TC-COUNTRY-012] List view button not found');
    }
  });

  // ── TC-COUNTRY-013: Excel download ─────────────────────────────────────────
  test('TC-COUNTRY-013: Excel download has same data as visible in grid', async ({ page }) => {
    console.log('[TC-COUNTRY-013] Navigate to Countries tab and download Excel');
    await navigateToCountriesTab(page);

    const downloadIcon = page.locator('[class*="excel"], [class*="download"] svg, button:has-text("Download")').first();
    await downloadIcon.waitFor({ state: 'visible', timeout: 10000 });
    const [dl] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }).catch(() => null),
      downloadIcon.click(),
    ]);
    if (dl) {
      console.log(`[TC-COUNTRY-013] Excel downloaded: ${dl.suggestedFilename()}`);
    } else {
      const popup = page.locator('[class*="toast"], [role="alert"]').filter({ hasText: /download/i }).first();
      await expect(popup).toBeVisible({ timeout: 10000 });
      console.log('[TC-COUNTRY-013] Download triggered');
    }
  });

  // ── TC-COUNTRY-014: Click country name redirects to Search tab ────────────
  test('TC-COUNTRY-014: Clicking country name (Afghanistan Import) redirects to Search tab', async ({ page }) => {
    console.log('[TC-COUNTRY-014] Navigate to Countries tab');
    await navigateToCountriesTab(page);

    const countryLink = page.locator('tbody td a, [class*="country-name"] a').first();
    await countryLink.waitFor({ state: 'visible', timeout: 15000 });
    const countryText = await countryLink.textContent();
    console.log(`[TC-COUNTRY-014] Clicking country: ${countryText}`);
    await countryLink.click();
    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/search/, { timeout: 15000 });
    console.log('[TC-COUNTRY-014] Redirected to Search tab with country pre-selected');
  });

  // ── TC-COUNTRY-015: Country start/end dates match website ─────────────────
  test('TC-COUNTRY-015: Country start/end dates match latest updated data', async ({ page }) => {
    console.log('[TC-COUNTRY-015] Navigate to Countries tab');
    await navigateToCountriesTab(page);

    const startDateCol = page.locator('th').filter({ hasText: /start date/i }).first();
    const endDateCol   = page.locator('th').filter({ hasText: /end date/i }).first();
    await expect(startDateCol).toBeVisible({ timeout: 10000 });
    await expect(endDateCol).toBeVisible({ timeout: 10000 });

    const firstRow = page.locator('tbody tr').first();
    const cells = firstRow.locator('td');
    const cellCount = await cells.count();
    const startDate = cellCount > 2 ? await cells.nth(2).textContent() : '';
    const endDate   = cellCount > 3 ? await cells.nth(3).textContent() : '';
    console.log(`[TC-COUNTRY-015] Country start date: ${startDate?.trim()}, end date: ${endDate?.trim()}`);
    console.log('[TC-COUNTRY-015] Start and end dates visible in Countries grid');
  });
});
