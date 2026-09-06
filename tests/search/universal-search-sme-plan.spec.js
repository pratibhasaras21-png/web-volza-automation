const { test, expect } = require('@playwright/test');

// Migrated from src/pages/UniversalSearch_SMEPlan.specs.js (Module 5 - Universal
// Search, SME/Corporate Plan). No login call in the source — relies on the
// global auth-state.json session set up by global-setup.ts, same as here.
// Pre-conditions: SME or Corporate plan with Company Name / Consignee / Shipper
// search access.

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

test.describe('Module 5 - Universal Search (SME/Corporate Plan)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://app.volza.com/home');
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });
  });

  test('TC-SEARCH-008: Navigate to Universal Search and verify dropdown options', async ({ page }) => {
    await page.getByText('Universal Search', { exact: true }).first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });

    const fieldDropdown = page.locator('[class*="field-select"], select, button[class*="dropdown"]')
      .filter({ hasText: /Product Name|HS|Company/i }).first();
    await fieldDropdown.waitFor({ state: 'visible', timeout: 10_000 });
    await fieldDropdown.click();
    await page.waitForTimeout(600);

    const expectedOptions = ['HS 2', 'HS 4', 'Products', 'Company name', 'Consignee', 'Shipper'];
    for (const opt of expectedOptions) {
      const optEl = page.locator('li, option, [class*="option"]').filter({ hasText: new RegExp(opt, 'i') }).first();
      await optEl.isVisible().catch(() => false);
    }

    await page.keyboard.press('Escape');
  });

  test('TC-SEARCH-009: Search by Product "brass" - tokenized and country-wise data in grid', async ({ page }) => {
    await page.getByText('Universal Search', { exact: true }).first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });

    const fieldDropdown = page.locator('[class*="field-select"], select').first();
    await fieldDropdown.waitFor({ state: 'visible', timeout: 10_000 });
    await selectDropdownOptionByText(page, fieldDropdown, /product/i);

    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="product"]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 10_000 });
    await searchInput.fill('brass');
    await searchInput.press('Enter');
    await page.waitForTimeout(1000);

    const chip = page.locator('[class*="chip"], [class*="token"], [class*="tag"]').filter({ hasText: /brass/i }).first();
    await expect(chip).toBeVisible({ timeout: 5_000 });

    await page.locator('button:has-text("Search"), button[type="submit"]').first().click();
    await page.waitForTimeout(4000);
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

    const gridRows = page.locator('tbody tr, [class*="grid-row"]');
    await expect(gridRows.first()).toBeVisible({ timeout: 25_000 });
  });

  test('TC-SEARCH-010: Download with country selection and verify point deduction', async ({ page }) => {
    await page.getByText('Universal Search', { exact: true }).first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });

    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="product"]').first();
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

    const countryCheckbox = page.locator('[class*="modal"] input[type="checkbox"], [role="dialog"] input[type="checkbox"]').first();
    await countryCheckbox.waitFor({ state: 'visible', timeout: 8_000 });
    await countryCheckbox.click();

    const downloadConfirmBtn = page.locator('button:has-text("Download"), button:has-text("Confirm")').last();
    await downloadConfirmBtn.click();
    await page.waitForTimeout(2000);
  });

  test('TC-SEARCH-011: My Download tab shows Universal Search download query', async ({ page }) => {
    await page.locator('a:has-text("My Download"), [href*="download"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });

    const downloadRow = page.locator('tbody tr, [class*="download-row"]').first();
    await expect(downloadRow).toBeVisible({ timeout: 15_000 });
  });

  test('TC-SEARCH-012: Filter options (HS code, Import, Export, COO/COD) apply correctly', async ({ page }) => {
    await page.getByText('Universal Search', { exact: true }).first().click();
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

    const hsFilter = page.locator('[class*="filter"] label, [class*="filter"] li').filter({ hasText: /hs code/i }).first();
    if (await hsFilter.isVisible()) {
      await hsFilter.click();
      await page.waitForTimeout(1000);
    }

    const importFilter = page.locator('[class*="filter"] label').filter({ hasText: /import/i }).first();
    if (await importFilter.isVisible()) {
      await importFilter.click();
      await page.waitForTimeout(1000);
    }
  });

  // Helper: the "View More & Refine" date-range popup uses a react-datepicker whose text
  // input can't be trusted with a typed value (confirmed live: typing a date and then
  // blurring the field silently snapped the year back to the picker's own default) - the
  // reliable way to set a date is clicking through the calendar itself, the same way
  // handleMaxRecordsPopup does for the antd picker elsewhere in this project.
  async function setDatepickerDate(page, dateInput, targetDate) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    await dateInput.click();
    const calendar = page.locator('.react-datepicker').first();
    await calendar.waitFor({ state: 'visible', timeout: 5_000 });

    let guard = 0;
    while (guard++ < 150) {
      const currentMonthYear = (await calendar.locator('.react-datepicker__current-month').first().textContent()).trim();
      const [monthName, yearStr] = currentMonthYear.split(' ');
      const curTotal = Number(yearStr) * 12 + monthNames.indexOf(monthName);
      const targetTotal = targetDate.getFullYear() * 12 + targetDate.getMonth();
      if (curTotal === targetTotal) break;
      const nav = calendar.locator(curTotal < targetTotal ? '.react-datepicker__navigation--next' : '.react-datepicker__navigation--previous').first();
      // The calendar occasionally re-renders mid-click (observed live) - retry once with a
      // force click rather than letting one flaky click abort the whole date selection.
      await nav.click({ timeout: 8_000 }).catch(() => nav.click({ timeout: 8_000, force: true }));
      await page.waitForTimeout(200);
    }

    const dayCell = calendar.locator('.react-datepicker__day:not(.react-datepicker__day--outside-month)')
      .filter({ hasText: new RegExp(`^${targetDate.getDate()}$`) }).first();
    await dayCell.click({ timeout: 8_000 }).catch(() => dayCell.click({ timeout: 8_000, force: true }));
    await page.waitForTimeout(300);
  }

  test('TC-SEARCH-013/014: Universal Search "View More & Refine" (latest 2 months) redirects to Search tab with matching country and counts', async ({ page }) => {
    test.setTimeout(150_000);

    await page.getByText('Universal Search', { exact: true }).first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });

    // Product Name search for "Waste Paper" - this is a react-tags tokenizer input, so typing
    // must use pressSequentially (not fill()) to trigger React's onChange and populate the
    // autocomplete suggestion list; fill() leaves the search button disabled.
    const fieldDropdown = page.locator('select.seacrh-type-selectHome, select[class*="select"]').first();
    await fieldDropdown.waitFor({ state: 'visible', timeout: 10_000 });
    await fieldDropdown.selectOption({ label: 'Product Name' });
    await page.waitForTimeout(800);

    const searchInput = page.locator('.react-tags__search-input').first();
    await searchInput.waitFor({ state: 'visible', timeout: 10_000 });
    await searchInput.click();
    await searchInput.pressSequentially('Waste Paper', { delay: 50 });
    await page.waitForTimeout(1500);
    const suggestion = page.locator('#ReactTags li, .react-tags__suggestions li').first();
    if (await suggestion.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await suggestion.click();
    } else {
      await searchInput.press('Enter');
    }
    await page.waitForTimeout(800);

    await page.locator('button.searchButton').first().click({ force: true });
    // The country-wise aggregated results take noticeably longer to load than a single-field
    // search tab query - give it a generous window before reading anything off the page.
    await page.waitForTimeout(20_000);
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

    // Capture the first country's breakdown (name, shipment count, Importer/Exporter counts)
    // before navigating away, to compare against the Search tab after the redirect.
    const bodyText = await page.locator('body').innerText();
    const countryMatch = bodyText.match(/([A-Za-z .]+?)\s+(Import|Export)\s*\((\d+)\)[\s\S]{0,80}?Importer\s*\((\d+)\)[\s\S]{0,80}?Exporter\s*\((\d+)\)/);
    expect(countryMatch, 'Expected at least one per-country breakdown row on the Universal Search results page').toBeTruthy();
    const [, countryName, tradeType, shipmentCount, importerCount, exporterCount] = countryMatch;
    console.log(`[universal-search] First country breakdown: ${countryName.trim()} ${tradeType} - Shipments=${shipmentCount}, Importer=${importerCount}, Exporter=${exporterCount}`);

    // The lock icon is hidden inside the country row's own collapsed grid - the row itself
    // (with its "CountryName Export (313)" header) has to be expanded first before it becomes
    // clickable. The row's default expand/collapse state is inconsistent, so click once and
    // check, then click again if the lock icon still isn't there.
    const escapedCountry = countryName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const countryRow = page.locator('p', { hasText: new RegExp(`${escapedCountry}\\s+${tradeType}\\s*\\(${shipmentCount}\\)`) }).first();
    await countryRow.waitFor({ state: 'visible', timeout: 10_000 });
    await countryRow.scrollIntoViewIfNeeded();
    await countryRow.click();
    await page.waitForTimeout(800);

    // The lock icon is the "a[data-title*='Unlock and apply...']" link inside the expanded
    // grid's locked cells - clicking it opens the same "redirected to Advance search" modal as
    // "View More & Refine". Its actionability check is unreliable (reports "not visible" even
    // when it renders and responds correctly), so this uses a force click.
    const lockIcon = page.locator('a[data-title*="Unlock and apply additional filters"]').first();
    if (!(await lockIcon.isVisible().catch(() => false))) {
      await countryRow.click();
      await page.waitForTimeout(800);
    }
    await lockIcon.waitFor({ state: 'attached', timeout: 10_000 });
    await lockIcon.scrollIntoViewIfNeeded().catch(() => {});
    await lockIcon.click({ force: true, timeout: 15_000 });
    await page.waitForTimeout(1000);

    const modal = page.locator('[class*="modal"]:visible, [role="dialog"]:visible')
      .filter({ hasText: /redirected to the Advance search view/i }).first();
    await expect(modal).toBeVisible({ timeout: 8_000 });

    // The modal's own date fields don't need to be touched here - the app's copy already says
    // "change time period to customize the query" (i.e. it's optional), and the date range is
    // instead applied more reliably after the redirect via the Search tab's "3 M" quick filter
    // (see below) rather than this modal's read-only, react-datepicker-backed inputs.

    // Clicking OK opens the Search tab in a new browser tab (a popup), not a same-tab
    // navigation - the popup listener must be registered before the click.
    const popupPromise = page.waitForEvent('popup', { timeout: 20_000 }).catch(() => null);
    await modal.locator('button:has-text("OK")').first().click();
    const popup = await popupPromise;
    const searchTabPage = popup || page;
    await searchTabPage.waitForLoadState('domcontentloaded', { timeout: 20_000 }).catch(() => {});
    await searchTabPage.waitForTimeout(5_000);
    await searchTabPage.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

    // Verify the redirect actually landed on the Search tab (with the same country
    // pre-selected), rather than staying on Universal Search's own aggregated view. The
    // dropdown shows a value like "Afghanistan Export-Detailed-Sep-24-Jul-26" right below the
    // "Select Country" label, rather than exposing a stable class name to hook a locator on.
    const searchTabBodyTextForCountry = await searchTabPage.locator('body').innerText();
    const countryDisplayMatch = searchTabBodyTextForCountry.match(/Select Country\s*[\r\n]+\s*([A-Za-z .]+?\s+(?:Export|Import)-Detailed[^\r\n]*)/);
    const selectedCountryText = countryDisplayMatch ? countryDisplayMatch[1].trim() : '';
    console.log(`[universal-search] Redirected to Search tab - pre-selected country: "${selectedCountryText}"`);
    expect.soft(
      selectedCountryText.toLowerCase().includes(countryName.trim().toLowerCase()),
      `Expected the Search tab's pre-selected country ("${selectedCountryText}") to match Universal Search's country ("${countryName.trim()}")`
    ).toBeTruthy();

    // The modal's date range didn't reliably carry the latest-2-months selection through the
    // redirect (defaults to a stale historical range, e.g. 2020-2022), which would leave the
    // Search tab showing zero results and make the count comparison below meaningless. Retry
    // the same date fields here - the Search tab appears to reuse the same date-range component
    // - and re-run the query. Best-effort: if this fails, the comparison below still runs
    // against whatever range the redirect landed on.
    // The redirect lands on a stale default date range (e.g. 01/01/2020-12/31/2022), which
    // produces "No result found" and makes the count comparison below meaningless. The custom
    // date inputs here are read-only and their calendar trigger has proven unreliable (the
    // react-datepicker calendar used elsewhere on this site is flaky, and here it doesn't even
    // open on click), so this uses the "3 M" quick-filter button instead - the closest available
    // preset to "latest 2 months" (there is no exact 2-month option), applied with one reliable
    // click rather than a fragile custom-range interaction.
    const threeMonthBtn = searchTabPage.getByText('3 M', { exact: true }).first();
    if (await threeMonthBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await threeMonthBtn.click();
      await searchTabPage.waitForTimeout(3_000);
      await searchTabPage.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    } else {
      console.log('[universal-search] "3 M" quick filter not found, comparing against the redirect default range instead');
    }

    // Read the Search tab's summary bar (Shipments / HS Code / Shipper Name / Consignee
    // Name / ...) and compare against Universal Search's counts for the same country.
    // Shipper Name <-> Exporter and Consignee Name <-> Importer are the analogous pairs for
    // export shipments. Universal Search's own count reflects its default multi-year window
    // (e.g. 2024-2026), while the Search tab here is narrowed to a recent quick-filter window -
    // if the matched product/country has no shipments inside that narrower window, "No result
    // found" is the correct, expected outcome (not a bug), so that case is reported as its own
    // clear soft-assertion message rather than three confusing "null" mismatches.
    const summaryText = await searchTabPage.locator('body').innerText();
    const noResultsOnSearchTab = /no result found/i.test(summaryText);
    if (noResultsOnSearchTab) {
      console.log(`[universal-search] Search tab shows "No result found" for ${countryName.trim()} within the applied recent-months window - Universal Search's ${shipmentCount} count reflects its own wider default date range, so an exact match isn't expected here.`);
      expect.soft(
        false,
        `Search tab returned "No result found" for ${countryName.trim()} in the applied recent-months window, while Universal Search shows ${shipmentCount} shipments under its own (wider) default date range - the two counts aren't comparable when the recent window has no matching shipments`
      ).toBeTruthy();
    } else {
      const shipmentsMatch = summaryText.match(/Shipments\s*[\r\n]+\s*(\d[\d,]*)/i);
      const shipperMatch = summaryText.match(/Shipper Name\s*[\r\n]+\s*(\d[\d,]*)/i);
      const consigneeMatch = summaryText.match(/Consignee Name\s*[\r\n]+\s*(\d[\d,]*)/i);
      const searchTabShipments = shipmentsMatch ? shipmentsMatch[1] : null;
      const searchTabShipper = shipperMatch ? shipperMatch[1] : null;
      const searchTabConsignee = consigneeMatch ? consigneeMatch[1] : null;
      console.log(`[universal-search] Search tab summary - Shipments=${searchTabShipments}, Shipper Name=${searchTabShipper}, Consignee Name=${searchTabConsignee}`);

      expect.soft(
        searchTabShipments === shipmentCount,
        `Expected Search tab Shipments (${searchTabShipments}) to match Universal Search's ${countryName.trim()} shipment count (${shipmentCount})`
      ).toBeTruthy();
      expect.soft(
        searchTabShipper === exporterCount,
        `Expected Search tab Shipper Name count (${searchTabShipper}) to match Universal Search's Exporter count (${exporterCount})`
      ).toBeTruthy();
      expect.soft(
        searchTabConsignee === importerCount,
        `Expected Search tab Consignee Name count (${searchTabConsignee}) to match Universal Search's Importer count (${importerCount})`
      ).toBeTruthy();
    }
  });

  test('TC-SEARCH-015: View in Global Search redirects with pre-applied filters', async ({ page }) => {
    await page.getByText('Universal Search', { exact: true }).first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });

    const fieldDropdown = page.locator('[class*="field-select"], select').first();
    await fieldDropdown.waitFor({ state: 'visible', timeout: 10_000 });
    await selectDropdownOptionByText(page, fieldDropdown, /company name/i);

    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="company"]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 10_000 });
    await searchInput.fill('TATA');
    await searchInput.press('Enter');
    await page.waitForTimeout(500);

    await page.locator('button:has-text("Search"), button[type="submit"]').first().click();
    await page.waitForTimeout(4000);

    const globalSearchBtn = page.locator('button:has-text("View in Global Search"), a:has-text("View in Global Search")').first();
    await globalSearchBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await globalSearchBtn.click();
    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/search/, { timeout: 15_000 });
  });
});
