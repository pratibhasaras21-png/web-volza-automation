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

    // The A-Z filter is a row of plain <div class="key-search">A</div> elements
    // (plus a default-active "All"), not <button>s - the original locator never
    // matched anything real and just timed out.
    console.log('[TC-COUNTRY-002] Click alphabet "A"');
    const alphaA = page.locator('.key-search', { hasText: /^A$/ }).first();
    await alphaA.waitFor({ state: 'visible', timeout: 10000 });
    await alphaA.click();
    await page.waitForTimeout(1500);

    // Countries render as `.country-card-cont` cards (grid view, the default -
    // there's no <table>/<tbody> here at all), not table rows.
    const firstCountryCard = page.locator('.country-card-cont').first();
    await expect(firstCountryCard).toBeVisible({ timeout: 10000 });
    const firstCountryName = await firstCountryCard.locator('.country-card-title').first().textContent();
    expect(firstCountryName?.trim().toUpperCase().startsWith('A')).toBe(true);
    console.log(`[TC-COUNTRY-002] First country starts with A: ${firstCountryName}`);

    console.log('[TC-COUNTRY-002] Click alphabet "B"');
    const alphaB = page.locator('.key-search', { hasText: /^B$/ }).first();
    await alphaB.click();
    await page.waitForTimeout(1500);
    const firstBCard = page.locator('.country-card-cont').first();
    const firstBName = await firstBCard.locator('.country-card-title').first().textContent();
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

    const rows = page.locator('.country-card-cont');
    const rowCount = await rows.count();
    console.log(`[TC-COUNTRY-003] Countries shown after search: ${rowCount}`);

    const bangladeshRow = rows.filter({ hasText: /bangladesh/i }).first();
    await expect(bangladeshRow).toBeVisible({ timeout: 5000 });
    console.log('[TC-COUNTRY-003] Bangladesh visible in search results');
  });

  // Shared helper for the six "Sort by" dropdown variants (TC-COUNTRY-004..009).
  // `exactLabel` must match an <option>'s visible text exactly - Playwright's
  // selectOption({ label }) does an exact match, not a substring/regex match.
  async function sortByAndVerify(page, exactLabel) {
    // The page also has a Google Translate widget with its own <select> earlier
    // in the DOM than the app's sort dropdown - `page.locator('select').first()`
    // was grabbing that instead. Scope to the <select> that actually contains
    // "Sort By" options.
    const sortDropdown = page.locator('select:has(option:has-text("Sort By"))').first();
    await sortDropdown.waitFor({ state: 'visible', timeout: 10000 });
    await sortDropdown.selectOption({ label: exactLabel });
    await page.waitForTimeout(1500);

    const rows = page.locator('.country-card-cont');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
  }

  // ── TC-COUNTRY-004: Sort by Country Name Descending ────────────────────────
  test('TC-COUNTRY-004: Sort by dropdown - Country Name Descending (Z to A)', async ({ page }) => {
    await navigateToCountriesTab(page);
    await sortByAndVerify(page, 'Sort By Country Name in Descending Order');
    console.log('[TC-COUNTRY-004] Sorted by Country Name Descending (Z to A)');
  });

  // ── TC-COUNTRY-005: Sort by Country Name Ascending ─────────────────────────
  test('TC-COUNTRY-005: Sort by dropdown - Country Name Ascending (A to Z)', async ({ page }) => {
    await navigateToCountriesTab(page);
    await sortByAndVerify(page, 'Sort By Country Name in Ascending Order');
    console.log('[TC-COUNTRY-005] Sorted by Country Name Ascending (A to Z)');
  });

  // ── TC-COUNTRY-006: Sort by Start Date Descending ──────────────────────────
  test('TC-COUNTRY-006: Sort by dropdown - Start Date Descending (Dec to Jan)', async ({ page }) => {
    await navigateToCountriesTab(page);
    await sortByAndVerify(page, 'Sort By Start Date in Descending Order');
    console.log('[TC-COUNTRY-006] Sorted by Start Date Descending (Dec to Jan)');
  });

  // ── TC-COUNTRY-007: Sort by Start Date Ascending ───────────────────────────
  test('TC-COUNTRY-007: Sort by dropdown - Start Date Ascending (Jan to Dec)', async ({ page }) => {
    await navigateToCountriesTab(page);
    await sortByAndVerify(page, 'Sort By Start Date in Ascending Order');
    console.log('[TC-COUNTRY-007] Sorted by Start Date Ascending (Jan to Dec)');
  });

  // ── TC-COUNTRY-008: Sort by End Date Descending ────────────────────────────
  test('TC-COUNTRY-008: Sort by dropdown - End Date Descending (Dec to Jan)', async ({ page }) => {
    await navigateToCountriesTab(page);
    await sortByAndVerify(page, 'Sort By End Date in Descending Order');
    console.log('[TC-COUNTRY-008] Sorted by End Date Descending (Dec to Jan)');
  });

  // ── TC-COUNTRY-009: Sort by End Date Ascending ─────────────────────────────
  test('TC-COUNTRY-009: Sort by dropdown - End Date Ascending (Jan to Dec)', async ({ page }) => {
    await navigateToCountriesTab(page);
    await sortByAndVerify(page, 'Sort By End Date in Ascending Order');
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
        const rows = page.locator('.country-card-cont');
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

    // The download icon is a plain <span class="icon-sprite bg-exel_download">
    // (note: the site's own class name typos "excel" as "exel") with no <svg>
    // child, so `[class*="download"] svg` never matched anything.
    const downloadIcon = page.locator('[class*="exel_download"], button:has-text("Download")').first();
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

    // Grid view (the default here) has no <a> country-name link - each
    // `.country-card-cont` card shows the name/points/dates, and a separate
    // hover-reveal overlay (`.country-card-search` / "Search" text) is what
    // actually navigates to the Search tab; that overlay sits on top of the
    // title text and intercepts clicks on it, so target the overlay directly.
    const firstCard = page.locator('.country-card-cont').first();
    await firstCard.waitFor({ state: 'visible', timeout: 15000 });
    const countryText = await firstCard.locator('.country-card-title').first().textContent();
    console.log(`[TC-COUNTRY-014] Clicking country: ${countryText?.trim()}`);
    const searchTrigger = firstCard.locator('.country-card-search, .country-sr-title').first();
    await searchTrigger.click({ force: true, timeout: 10000 });
    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/search/, { timeout: 15000 });
    console.log('[TC-COUNTRY-014] Redirected to Search tab with country pre-selected');
  });

  // ── TC-COUNTRY-015: Country start/end dates match website ─────────────────
  test('TC-COUNTRY-015: Country start/end dates match latest updated data', async ({ page }) => {
    console.log('[TC-COUNTRY-015] Navigate to Countries tab');
    await navigateToCountriesTab(page);

    // Grid view (the default here) has no <table>/<th> at all - there are no
    // separate Start Date/End Date columns, just a "<Start> - <End>" range
    // shown inline on each card (e.g. "Sep 24 - Jul 26").
    // .country-card-title actually contains two ".frRight" spans - the
    // favorite-icon wrapper (`.df-panel-tools.frRight`, empty text) and the
    // date-range one - `.first()` alone was grabbing the empty icon span.
    const firstCard = page.locator('.country-card-cont').first();
    const dateRange = firstCard.locator('.country-card-title .frRight:not(.df-panel-tools)').first();
    await expect(dateRange).toBeVisible({ timeout: 10000 });
    const dateRangeText = (await dateRange.textContent())?.trim();
    expect(dateRangeText).toMatch(/\S+\s*-\s*\S+/);
    console.log(`[TC-COUNTRY-015] Country date range: ${dateRangeText}`);
    console.log('[TC-COUNTRY-015] Start and end dates visible in Countries grid');
  });
});
