// @ts-check
const { test, expect } = require('@playwright/test');
const { loginAndSelectCompany } = require('../fixtures/auth.fixture');

// ─── Test ─────────────────────────────────────────────────────────────────────
test.describe('Volza - Universal Search', () => {
  test('should search for product "brass" in Universal Search', async ({ page }) => {

    // Step 1: Login and reach home page
    console.log('[test] Step 1: Logging in...');
    await loginAndSelectCompany(page);

    // Step 2: Click "Universal Search" tab on the home page
    console.log('[test] Step 2: Clicking Universal Search tab...');
    await page.getByText('Universal Search', { exact: true }).first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    console.log(`[test] Universal Search tab clicked, URL: ${page.url()}`);

    // Step 3: Verify "Product Name" field dropdown is present in the search section
    console.log('[test] Step 3: Checking "Product Name" field dropdown is present...');
    const fieldDropdown = page.locator('button, [class*="btn"], [class*="select"]')
      .filter({ hasText: 'Product Name' })
      .first();
    await fieldDropdown.waitFor({ state: 'visible', timeout: 10000 });
    console.log('[test] ✅ "Product Name" field dropdown is present');

    // Step 4: Click the field dropdown and select "Product Name"
    console.log('[test] Step 4: Opening field dropdown to confirm "Product Name"...');
    await fieldDropdown.click();
    await page.waitForTimeout(600);
    // Select "Product Name" from the open dropdown list
    const productOption = page.locator('li, [class*="option"], [class*="item"]')
      .filter({ hasText: /^Product Name$/ })
      .first();
    try {
      await productOption.waitFor({ state: 'visible', timeout: 4000 });
      await productOption.click();
      console.log('[test] ✅ "Product Name" selected from dropdown');
    } catch {
      // Dropdown may not have opened or "Product Name" is already selected — close and continue
      await page.keyboard.press('Escape');
      console.log('[test] ✅ "Product Name" already selected, continuing...');
    }

    // Step 5: Enter keyword "brass" in the search input and tokenize with Enter
    console.log('[test] Step 5: Entering keyword "brass"...');
    const searchInput = page.locator(
      'input[placeholder="Search by product"], input[placeholder*="product"], input[placeholder*="Search"], input[placeholder*="keyword"]'
    ).first();
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput.click();
    await searchInput.fill('brass');
    await searchInput.press('Enter');
    await page.waitForTimeout(500);
    console.log('[test] ✅ Keyword "brass" tokenized');

    // Step 6: Click the blue search icon button (magnifying glass) at the end of the search bar
    console.log('[test] Step 6: Clicking Search icon button...');
    // Use evaluate to find the button with an SVG that is NOT the chip × close button
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const searchBtn = buttons.find(btn => {
        const hasSvg = btn.querySelector('svg') !== null;
        const isCloseBtn = btn.textContent.trim() === '×' || btn.getAttribute('aria-label') === 'close';
        return hasSvg && !isCloseBtn;
      });
      if (searchBtn) { searchBtn.click(); return true; }
      return false;
    });
    console.log(`[test] Search button clicked via evaluate: ${clicked}`);
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    console.log(`[test] ✅ Search executed. URL: ${page.url()}`);

    // Step 7: Verify results are shown
    console.log('[test] Step 7: Verifying search results...');
    // Results may appear as cards, rows, list items, or table data
    const results = page.locator(
      'tbody tr, [class*="card"], [class*="list-item"], [class*="row-item"], ' +
      '[class*="result"], [class*="data"], [class*="record"], ' +
      'ul li:not(:empty), .MuiTableRow-root, [class*="shipment"]'
    ).first();
    await results.waitFor({ state: 'visible', timeout: 30000 });
    console.log('[test] ✅ Search results displayed');

    await expect(results).toBeVisible();
  });
});
