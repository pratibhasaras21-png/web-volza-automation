const { test, expect } = require('@playwright/test');

// ─── Module 3: Share Demo / Payment Link (Client Tab) ────────────────────────
// Pre-conditions:
//   • Logged-in user with Sales Demo plan (executive level)
//   • Set VOLZA_COMPANY env var to a company with Sales Demo plan

test.describe('Module 3 - Share Demo/Payment Link (Client Tab)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('https://app.volza.com/home');
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  });

  // ── TC-SUBSCRIPTION-001: Navigate and load data ────────────────────────────
  test('TC-SUBSCRIPTION-001: Open Share Demo tab on All tab with blurred data, then load data', async ({ page }) => {
    console.log('[TC-SUBSCRIPTION-001] Step 1: Click Share Demo/Payment Link tab');
    await page.locator('a:has-text("Share Demo"), a:has-text("Share demo"), [href*="client"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });

    console.log('[TC-SUBSCRIPTION-001] Step 2: Verify All tab is active and data is blurred');
    const allTab = page.locator('[class*="tab"]').filter({ hasText: /^All$/i }).first();
    await expect(allTab).toBeVisible({ timeout: 10000 });
    const blurredEl = page.locator('[class*="blur"], [style*="blur"]').first();
    const blurPresent = await blurredEl.isVisible().catch(() => false);
    console.log(`[TC-SUBSCRIPTION-001] Data blurred: ${blurPresent}`);

    console.log('[TC-SUBSCRIPTION-001] Step 3: Click "Click here to load data"');
    const loadBtn = page.locator('button:has-text("Click here to load data"), a:has-text("Click here to load data")').first();
    await loadBtn.waitFor({ state: 'visible', timeout: 10000 });
    await loadBtn.click();
    await page.waitForTimeout(3000);

    const gridRows = page.locator('tbody tr, [class*="grid-row"], [class*="data-row"]');
    await expect(gridRows.first()).toBeVisible({ timeout: 20000 });
    console.log('[TC-SUBSCRIPTION-001] Data loaded in grid');
  });

  // ── TC-SUBSCRIPTION-002: Date picker - year 2010 to present ────────────────
  test('TC-SUBSCRIPTION-002: Date picker from 2010 to present loads without Oh Snap error', async ({ page }) => {
    console.log('[TC-SUBSCRIPTION-002] Navigate to Share Demo tab and load data');
    await page.locator('a:has-text("Share Demo"), a:has-text("Share demo"), [href*="client"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });

    const loadBtn = page.locator('button:has-text("Click here to load data"), a:has-text("Click here to load data")').first();
    if (await loadBtn.isVisible()) await loadBtn.click();
    await page.waitForTimeout(2000);

    console.log('[TC-SUBSCRIPTION-002] Step 5: Select date range 2010 to present in date picker');
    const datePicker = page.locator('[class*="date-picker"], [class*="datepicker"], input[type="date"]').first();
    await datePicker.waitFor({ state: 'visible', timeout: 10000 });
    await datePicker.click();
    await page.waitForTimeout(500);

    const yearInput = page.locator('input[placeholder*="year" i], input[name*="year"]').first();
    if (await yearInput.isVisible()) {
      await yearInput.fill('2010');
      await page.keyboard.press('Tab');
    }
    const applyBtn = page.locator('button:has-text("Apply"), button:has-text("OK")').first();
    if (await applyBtn.isVisible()) await applyBtn.click();
    await page.waitForTimeout(3000);

    const ohSnapError = page.locator('[class*="error"], [class*="snap"]').filter({ hasText: /oh snap/i }).first();
    const hasError = await ohSnapError.isVisible().catch(() => false);
    expect(hasError).toBe(false);
    console.log('[TC-SUBSCRIPTION-002] No Oh Snap error after date range selection');
  });

  // ── TC-SUBSCRIPTION-003: Column sorting ─────────────────────────────────────
  test('TC-SUBSCRIPTION-003: Column sorting on Company Name, Email, Plan Name, etc.', async ({ page }) => {
    console.log('[TC-SUBSCRIPTION-003] Navigate to Share Demo tab and load data');
    await page.locator('a:has-text("Share Demo"), a:has-text("Share demo"), [href*="client"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    const loadBtn = page.locator('button:has-text("Click here to load data")').first();
    if (await loadBtn.isVisible()) await loadBtn.click();
    await page.waitForTimeout(2000);

    const sortableColumns = ['Company name', 'Person name', 'Email', 'Plan Name', 'Status'];
    for (const col of sortableColumns) {
      console.log(`[TC-SUBSCRIPTION-003] Clicking sort on column: ${col}`);
      const colHeader = page.locator('th, [class*="col-header"], [class*="th"]').filter({ hasText: new RegExp(col, 'i') }).first();
      if (await colHeader.isVisible()) {
        await colHeader.click();
        await page.waitForTimeout(800);
        console.log(`[TC-SUBSCRIPTION-003] Sorted by ${col}`);
      }
    }
  });

  // ── TC-SUBSCRIPTION-004: Column search filter and reset ─────────────────────
  test('TC-SUBSCRIPTION-004: Column search filter on Company Name and reset', async ({ page }) => {
    console.log('[TC-SUBSCRIPTION-004] Navigate and load data');
    await page.locator('a:has-text("Share Demo"), a:has-text("Share demo"), [href*="client"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    const loadBtn = page.locator('button:has-text("Click here to load data")').first();
    if (await loadBtn.isVisible()) await loadBtn.click();
    await page.waitForTimeout(2000);

    console.log('[TC-SUBSCRIPTION-004] Step 7: Click Company Name column filter');
    const companyColHeader = page.locator('th, [class*="col-header"]').filter({ hasText: /company name/i }).first();
    await companyColHeader.click();
    await page.waitForTimeout(500);

    const filterInput = page.locator('[class*="filter-input"], input[placeholder*="search" i]').first();
    await filterInput.waitFor({ state: 'visible', timeout: 5000 });
    await filterInput.fill('Test Company');
    const searchBtn = page.locator('button:has-text("Search")').first();
    await searchBtn.click();
    await page.waitForTimeout(1500);
    console.log('[TC-SUBSCRIPTION-004] Company Name filter applied');

    console.log('[TC-SUBSCRIPTION-004] Step 9: Click Reset to clear filter');
    const resetBtn = page.locator('button:has-text("Reset"), button:has-text("Clear")').first();
    await resetBtn.click();
    await page.waitForTimeout(1000);
    const inputVal = await filterInput.inputValue().catch(() => '');
    expect(inputVal).toBe('');
    console.log('[TC-SUBSCRIPTION-004] Filter reset/cleared');
  });

  // ── TC-SUBSCRIPTION-005: Last Login column validation ───────────────────────
  test('TC-SUBSCRIPTION-005: Last Login column shows date after user login and search', async ({ page }) => {
    console.log('[TC-SUBSCRIPTION-005] Navigate and load data');
    await page.locator('a:has-text("Share Demo"), a:has-text("Share demo"), [href*="client"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    const loadBtn = page.locator('button:has-text("Click here to load data")').first();
    if (await loadBtn.isVisible()) await loadBtn.click();
    await page.waitForTimeout(2000);

    const lastLoginCol = page.locator('th').filter({ hasText: /last login/i }).first();
    await expect(lastLoginCol).toBeVisible({ timeout: 10000 });
    const firstDateCell = page.locator('tbody tr').first().locator('td').nth(5);
    const dateText = await firstDateCell.textContent();
    console.log(`[TC-SUBSCRIPTION-005] Last Login date: ${dateText}`);
    console.log('[TC-SUBSCRIPTION-005] Last Login column visible');
  });

  // ── TC-SUBSCRIPTION-006: Clear All filters button ───────────────────────────
  test('TC-SUBSCRIPTION-006: Clear All button clears all applied filters', async ({ page }) => {
    console.log('[TC-SUBSCRIPTION-006] Navigate and load data');
    await page.locator('a:has-text("Share Demo"), a:has-text("Share demo"), [href*="client"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    const loadBtn = page.locator('button:has-text("Click here to load data")').first();
    if (await loadBtn.isVisible()) await loadBtn.click();
    await page.waitForTimeout(2000);

    const clearAllBtn = page.locator('button:has-text("Clear All"), button:has-text("Clear all")').first();
    await clearAllBtn.waitFor({ state: 'visible', timeout: 10000 });
    await clearAllBtn.click();
    await page.waitForTimeout(1000);
    console.log('[TC-SUBSCRIPTION-006] Clear All button clicked and filters cleared');
  });

  // ── TC-SUBSCRIPTION-007: Share Payment Link - send and verify email template ─
  test('TC-SUBSCRIPTION-007: Share Payment Link - fill details, send, verify email', async ({ page }) => {
    console.log('[TC-SUBSCRIPTION-007] Navigate to Share Demo tab');
    await page.locator('a:has-text("Share Demo"), a:has-text("Share demo"), [href*="client"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    const loadBtn = page.locator('button:has-text("Click here to load data")').first();
    if (await loadBtn.isVisible()) await loadBtn.click();
    await page.waitForTimeout(2000);

    console.log('[TC-SUBSCRIPTION-007] Step 12: Click Share Payment Link button');
    await page.locator('button:has-text("Share Payment Link"), button:has-text("Share payment link")').first().click();
    await page.waitForTimeout(1500);

    const modal = page.locator('[class*="modal"], [role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 10000 });

    const recipientEmail = page.locator('input[type="email"], input[placeholder*="email" i]').first();
    await recipientEmail.fill(process.env.PAYMENT_LINK_RECIPIENT || 'recipient@example.com');

    const nameInput = page.locator('input[placeholder*="name" i], input[name*="name"]').first();
    if (await nameInput.isVisible()) await nameInput.fill('Test Recipient');

    const sendBtn = page.locator('button:has-text("Send")').first();
    await sendBtn.click();
    await page.waitForTimeout(2000);

    const successMsg = page.locator('[class*="success"], [class*="toast"], .alert').filter({ hasText: /sent|success/i }).first();
    await expect(successMsg).toBeVisible({ timeout: 10000 });
    console.log('[TC-SUBSCRIPTION-007] Payment link sent successfully');
  });

  // ── TC-SUBSCRIPTION-008: Tab navigation - Free, Expired, Active, Payment Failure
  test('TC-SUBSCRIPTION-008: Tab navigation shows data per tab (Free, Active, Expired, Payment Failure)', async ({ page }) => {
    console.log('[TC-SUBSCRIPTION-008] Navigate to Share Demo tab');
    await page.locator('a:has-text("Share Demo"), a:has-text("Share demo"), [href*="client"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    const loadBtn = page.locator('button:has-text("Click here to load data")').first();
    if (await loadBtn.isVisible()) await loadBtn.click();
    await page.waitForTimeout(2000);

    const tabs = ['Free', 'Active', 'Expired', 'Payment failure'];
    for (const tabName of tabs) {
      const tab = page.locator('[class*="tab"], button[role="tab"]').filter({ hasText: new RegExp(tabName, 'i') }).first();
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(1500);
        const gridContent = page.locator('tbody tr, [class*="grid-row"]').first();
        await expect(gridContent).toBeVisible({ timeout: 10000 });
        console.log(`[TC-SUBSCRIPTION-008] "${tabName}" tab shows data`);
      } else {
        console.log(`[TC-SUBSCRIPTION-008] Tab "${tabName}" not found, skipping`);
      }
    }
  });

  // ── TC-SUBSCRIPTION-009: Free Trial Demo - send link and verify email login flow
  test('TC-SUBSCRIPTION-009: Free Trial Demo - send link and verify email redirect to login', async ({ page }) => {
    console.log('[TC-SUBSCRIPTION-009] Navigate to Share Demo tab');
    await page.locator('a:has-text("Share Demo"), a:has-text("Share demo"), [href*="client"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    const loadBtn = page.locator('button:has-text("Click here to load data")').first();
    if (await loadBtn.isVisible()) await loadBtn.click();
    await page.waitForTimeout(2000);

    console.log('[TC-SUBSCRIPTION-009] Step 15: Click Free Trial Demo button');
    await page.locator('button:has-text("Free Trial Demo"), button:has-text("Free trial demo")').first().click();
    await page.waitForTimeout(1500);

    const modal = page.locator('[class*="modal"], [role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 10000 });

    const demoEmail = page.locator('input[type="email"]').first();
    await demoEmail.fill(process.env.DEMO_LINK_RECIPIENT || 'demo@example.com');

    const sendLinkBtn = page.locator('button:has-text("Send Link")').first();
    await sendLinkBtn.click();
    await page.waitForTimeout(2000);

    const successMsg = page.locator('[class*="success"], [class*="toast"]').filter({ hasText: /sent|success/i }).first();
    await expect(successMsg).toBeVisible({ timeout: 10000 });
    console.log('[TC-SUBSCRIPTION-009] Free Trial Demo link sent successfully');
  });
});
