const { test, expect } = require('@playwright/test');
const { loginAndSelectCompany } = require('../../fixtures/auth.fixture');
const { handleMaxRecordsPopup } = require('../../helpers/maxRecordsPopup');

// ─── Module 11b: Welcome Tab ──────────────────────────────────────────────────
// Migrated from src/pages/WelcomeTab.specs.js.
// 11.1: SME or Corporate plan
// 11.2: Small plans (Startup, Spark, Delight, Micro)

// The Welcome tab's field-type control is a real <select class="seacrh-type-selectHome">
// with options: HS 2 (hscode), HS 4, 6 Or 8 (HS4Or8), Product Name (product),
// Company Name (company), Consignee (importer), Shipper (exporter).
//
// Depending on the selected type, the search box behaves differently:
//  - Product Name / HS 2 / HS 4,6 Or 8 -> a react-tags tokenizer input. Typing
//    text shows autocomplete suggestions; picking one (or pressing Enter as a
//    fallback) creates a tag and enables the search button. Clicking search
//    then opens a "Select Database" (country) modal before redirecting.
//  - Company Name / Consignee / Shipper -> clicking the box opens an entity
//    picker modal (title "Company" / "Consignee" / "Shipper"). Searching and
//    checking a row + Apply tokenizes the pick back on the Welcome tab.
//    Clicking search here redirects straight to the Search tab with results
//    (defaults to "All Country (Global Search)" - no database modal appears).
// FieldType shape: { value: string, label: string, kind: 'tag' | 'picker', keyword: string, tcId: string }

const FIELD_TYPES = [
  { value: 'product', label: 'Product Name', kind: 'tag', keyword: 'wood', tcId: 'TC-HOME-001' },
  { value: 'hscode', label: 'HS 2', kind: 'tag', keyword: '84', tcId: 'TC-HOME-002' },
  { value: 'HS4Or8', label: 'HS 4, 6 Or 8', kind: 'tag', keyword: '8471', tcId: 'TC-HOME-003' },
  { value: 'exporter', label: 'Shipper', kind: 'picker', keyword: 'Tata', tcId: 'TC-HOME-004' },
  { value: 'importer', label: 'Consignee', kind: 'picker', keyword: 'Tata', tcId: 'TC-HOME-005' },
  { value: 'company', label: 'Company Name', kind: 'picker', keyword: 'Tata', tcId: 'TC-HOME-006' },
];

// Switches the Welcome tab's field-type dropdown (a native <select>).
async function setWelcomeFieldType(page, fieldType) {
  const fieldSelect = page.locator('select.seacrh-type-selectHome').first();
  await fieldSelect.waitFor({ state: 'visible', timeout: 10000 });
  await fieldSelect.selectOption(fieldType.value);
  console.log(`[setWelcomeFieldType] Selected: ${fieldType.label}`);
  await page.waitForTimeout(500);
}

// Product Name / HS 2 / HS 4,6,8: type into the react-tags box and click the
// first autocomplete suggestion to create a tag (typing alone leaves the
// search button disabled). Falls back to Enter if no suggestion appears.
async function fillWelcomeTagSearch(page, keyword) {
  const input = page.locator('.react-tags__search-input').first();
  await input.waitFor({ state: 'visible', timeout: 10000 });
  await input.click();
  await input.pressSequentially(keyword, { delay: 60 });
  await page.waitForTimeout(1500);

  const suggestion = page.locator('#ReactTags li').first();
  if (await suggestion.isVisible({ timeout: 3000 }).catch(() => false)) {
    await suggestion.click();
    console.log(`[fillWelcomeTagSearch] Tagged via suggestion: "${keyword}"`);
  } else {
    await page.keyboard.press('Enter');
    console.log(`[fillWelcomeTagSearch] Tagged via Enter: "${keyword}"`);
  }
  await page.waitForTimeout(300);
}

// Company Name / Consignee / Shipper: opens the entity picker modal (title
// "Company" / "Consignee" / "Shipper"), searches by keyword, checks the first
// specific matching row (row 0 is the "select all/starts-from" header row),
// and clicks Apply. Returns to the Welcome tab with the pick tokenized.
async function pickWelcomeEntity(page, keyword) {
  await page.locator('.company-tag-universal').first().click();
  await page.waitForTimeout(800);

  const modal = page.locator('.ReactModal__Content').first();
  await modal.waitFor({ state: 'visible', timeout: 10000 });

  const searchInput = modal.locator('input[placeholder*="Type the first" i]').first();
  await searchInput.fill(keyword);
  await page.waitForTimeout(1500);

  const rowCheckbox = modal.locator('table input[type="checkbox"]').nth(1);
  await rowCheckbox.waitFor({ state: 'visible', timeout: 10000 });
  await rowCheckbox.check();
  console.log(`[pickWelcomeEntity] Selected first "${keyword}" match`);

  await modal.locator('button:has-text("Apply")').first().click();
  await modal.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(500);
}

// Clicks the Welcome tab's search icon button (force-clicks if the enabled
// state hasn't visually propagated yet).
async function clickWelcomeSearch(page) {
  const searchBtn = page.locator('button.searchButton').first();
  const disabled = await searchBtn.evaluate((el) => el.disabled).catch(() => true);
  await searchBtn.click({ force: disabled });
  console.log(disabled ? '[clickWelcomeSearch] Force-clicked' : '[clickWelcomeSearch] Clicked');
  await page.waitForTimeout(1500);
}

// Selects "All Country (Global Search)" from the "Select Database" modal
// (only shown for Product Name / HS 2 / HS 4,6,8 searches). Types "All
// Country" in the modal's own search box, then clicks the matching row.
async function selectAllCountryFromModal(page) {
  const modal = page.locator('.ReactModal__Content').first();
  await modal.waitFor({ state: 'visible', timeout: 15000 });
  console.log('[selectAllCountryFromModal] "Select Database" modal opened');

  const countrySearch = modal.locator('input[placeholder*="Search Country" i]').first();
  await countrySearch.fill('All Country');
  await page.waitForTimeout(1000);

  const allCountryRow = modal.locator('tr, li, [class*="row"]').filter({ hasText: /All Country/i }).first();
  await allCountryRow.waitFor({ state: 'visible', timeout: 10000 });
  await allCountryRow.click({ force: true });
  console.log('[selectAllCountryFromModal] Clicked: All Country (Global Search)');
  await page.waitForTimeout(1000);
}

// Runs a full Welcome-tab search for one field type and verifies it lands on
// the Search tab with results shown against "All Country (Global Search)".
async function runWelcomeSearch(page, fieldType) {
  console.log(`[runWelcomeSearch] === ${fieldType.label} ===`);
  await page.locator('a:has-text("Welcome"), a:has-text("Home"), [href*="home"]').first().click();
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  await page.waitForTimeout(1000);

  await setWelcomeFieldType(page, fieldType);

  if (fieldType.kind === 'tag') {
    await fillWelcomeTagSearch(page, fieldType.keyword);
  } else {
    await pickWelcomeEntity(page, fieldType.keyword);
  }

  await clickWelcomeSearch(page);

  if (fieldType.kind === 'tag') {
    // Only Product Name / HS 2 / HS 4,6,8 go through the country picker.
    // Company/Consignee/Shipper redirect straight to results already
    // defaulted to "All Country (Global Search)".
    const modal = page.locator('.ReactModal__Content').first();
    const modalVisible = await modal.waitFor({ state: 'visible', timeout: 8000 }).then(() => true).catch(() => false);
    if (modalVisible) {
      await selectAllCountryFromModal(page);
    } else {
      console.log('[runWelcomeSearch] No "Select Database" modal appeared (already defaulted)');
    }
  }

  await expect(page).toHaveURL(/search/, { timeout: 20000 });
  console.log(`[runWelcomeSearch] Redirected to Search tab for ${fieldType.label}`);

  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  await handleMaxRecordsPopup(page);

  const gridRows = page.locator('tbody tr:not(.ant-table-measure-row):has(td)').first();
  await expect(gridRows).toBeVisible({ timeout: 30000 });
  console.log(`[runWelcomeSearch] Results shown for ${fieldType.label}`);

  // Hold on the shipment results grid for 10s so results are visibly confirmed.
  await page.waitForTimeout(10000);
}

// ─── Module 11.1: Welcome Tab (SME/Corporate) ────────────────────────────────
test.describe('Module 11.1 - Welcome Tab (SME/Corporate Plan)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('https://app.volza.com/home');
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  });

  for (const fieldType of FIELD_TYPES) {
    test(`${fieldType.tcId}: Welcome tab search by ${fieldType.label} redirects to Search tab with results`, async ({ page }) => {
      await runWelcomeSearch(page, fieldType);
    });
  }
});

// ─── Module 11.2: Welcome Tab (Small Plans) ───────────────────────────────────
test.describe('Module 11.2 - Welcome Tab (Small/Startup Plan)', () => {

  test.describe.configure({ timeout: 150_000 });

  test.beforeEach(async ({ page }) => {
    if (process.env.VOLZA_STARTUP_COMPANY) {
      await loginAndSelectCompany(page, process.env.VOLZA_STARTUP_COMPANY);
    } else {
      // No startup company configured — reuse SME storageState session
      await page.goto('https://app.volza.com/home');
      await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
      console.log('[Module 11.2] VOLZA_STARTUP_COMPANY not set — using SME session (upgrade popup behaviour may differ)');
    }
  });
});
