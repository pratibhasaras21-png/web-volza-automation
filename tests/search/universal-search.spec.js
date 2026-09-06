const { test, expect } = require('@playwright/test');
const { SearchPage } = require('../../pages/SearchPage');

// Migrated from tests/universalsearch-all.specs.js (the canonical, most complete
// iteration of Universal Search coverage — 7 fields, session reuse, robust
// search-icon click strategies). Its inline getAccessToken/extractOtp/
// readOtpFromOutlook/loginAndSelectCompany/ensureLoggedIn helpers (duplicating
// fixtures/auth.fixture.ts and utils/outlookReader.ts) are gone entirely - this
// suite logs in exactly once, via global-setup.js's storageState (auth-state.json,
// the same session every other spec in the project reuses), instead of maintaining
// its own separate playwright/.auth/user.json session and re-running the OTP login
// a second time whenever the full suite runs.
//
// tests/universalsearch.spec.js and tests/universalsearch.specs.js are NOT
// migrated — both are earlier iterations of this same universal-search test,
// superseded by -all.specs.js before this migration; see search.testcases.md.

/**
 * Opens the Universal Search tab, runs the field/keyword search and returns the results
 * outcome ({ found, results }) - a zero-match keyword is a legitimate app response, not a
 * thrown error, so callers can soft-assert on it and keep going.
 */
async function runUniversalSearch(page, dropdownOption, keyword) {
  await page.goto('https://app.volza.com/home');
  await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });

  await page.getByText('Universal Search', { exact: true }).first().click();
  await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });

  const searchPage = new SearchPage(page);
  const searched = await searchPage.searchWithField(dropdownOption, keyword);
  // A picker field (Company Name/Consignee/Shipper) with zero matching companies never
  // clicks search - nothing to wait for, so report it as a zero-result outcome directly
  // instead of waiting 30s for a results grid that will never appear.
  if (!searched) return { found: false, results: null };
  return searchPage.expectResultsVisible();
}

// A plain (non-serial) describe is used deliberately: soft assertions below let each test
// keep running past a zero-result search, but a genuinely broken step (e.g. a thrown
// error, not a soft assertion) would still fail its own test - serial mode would additionally
// skip every remaining test in the file after that one failure, which is exactly what we
// don't want when the goal is "check every field, report all outcomes".
test.describe('Volza - Universal Search All Fields', () => {

  test('TC-SEARCH-001: HS 2 — search by 2-digit HS code', async ({ page }) => {
    test.setTimeout(150_000);
    const keyword = process.env.SEARCH_HS2 || '74';
    const outcome = await runUniversalSearch(page, 'HS 2', keyword);
    expect.soft(outcome.found, `Expected shipment results for HS 2 = "${keyword}"`).toBeTruthy();
  });

  test('TC-SEARCH-002: HS 4 — search by 4-digit HS code', async ({ page }) => {
    const keyword = process.env.SEARCH_HS4 || '7408';
    const outcome = await runUniversalSearch(page, 'HS 4, 6 Or 8', keyword);
    expect.soft(outcome.found, `Expected shipment results for HS 4 = "${keyword}"`).toBeTruthy();
  });

  test('TC-SEARCH-003: HS 6 — search by 6-digit HS code', async ({ page }) => {
    const keyword = process.env.SEARCH_HS6 || '740811';
    const outcome = await runUniversalSearch(page, 'HS 4, 6 Or 8', keyword);
    expect.soft(outcome.found, `Expected shipment results for HS 6 = "${keyword}"`).toBeTruthy();
  });

  test('TC-SEARCH-004: HS 8 — search by 8-digit HS code', async ({ page }) => {
    const keyword = process.env.SEARCH_HS8 || '74081100';
    const outcome = await runUniversalSearch(page, 'HS 4, 6 Or 8', keyword);
    expect.soft(outcome.found, `Expected shipment results for HS 8 = "${keyword}"`).toBeTruthy();
  });

  test('TC-SEARCH-005: Company Name — search', async ({ page }) => {
    const keyword = process.env.SEARCH_COMPANY || 'Tata';
    const outcome = await runUniversalSearch(page, 'Company Name', keyword);
    expect.soft(outcome.found, `Expected shipment results for Company Name = "${keyword}"`).toBeTruthy();
  });

  test('TC-SEARCH-006: Consignee — search', async ({ page }) => {
    const keyword = process.env.SEARCH_CONSIGNEE || 'JSW';
    const outcome = await runUniversalSearch(page, 'Consignee', keyword);
    expect.soft(outcome.found, `Expected shipment results for Consignee = "${keyword}"`).toBeTruthy();
  });

  test('TC-SEARCH-007: Shipper — search', async ({ page }) => {
    const keyword = process.env.SEARCH_SHIPPER || 'Hindalco';
    const outcome = await runUniversalSearch(page, 'Shipper', keyword);
    expect.soft(outcome.found, `Expected shipment results for Shipper = "${keyword}"`).toBeTruthy();
  });
});
