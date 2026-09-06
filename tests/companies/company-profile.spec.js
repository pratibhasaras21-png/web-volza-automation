// @ts-nocheck
const { test, expect } = require('@playwright/test');

// ─── Company Profile - New Search by Country + Product tag ───────────────────
// Pre-conditions: user is already authenticated via global setup (auth-state.json)
//
// Migrated from src/pages/CompanyProfile.specs.js (no module number in source).
// Continues the COMPANY prefix from companies.spec.ts.

test.describe('Company Profile - New Search (Country + Product tag)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('https://app.volza.com/home');
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  });

  // Helper: resolve the "Shipper" column's index in the results grid by header text,
  // rather than a hardcoded position - the grid's column set/order can vary by search.
  async function getShipperColumnIndex(page) {
    const headerLocator = page.locator('thead th, [role="columnheader"]').filter({ hasText: /^shipper$/i }).first();
    await headerLocator.waitFor({ state: 'visible', timeout: 10000 });
    const allHeaders = headerLocator.locator('xpath=ancestor::tr[1]').locator('th, [role="columnheader"]');
    const total = await allHeaders.count();
    for (let i = 0; i < total; i++) {
      const text = ((await allHeaders.nth(i).textContent()) || '').trim();
      if (/^shipper$/i.test(text)) return i;
    }
    return -1;
  }

  // Helper: scan the first few grid rows for one with a real shipper name (skipping
  // "To Order"/"NA" placeholder rows), and return that row's shipper-name <a> locator.
  async function getFirstShipperLink(page, shipperColIndex) {
    const rows = page.locator('tbody tr:not(.ant-table-measure-row):has(td)');
    const rowCount = Math.min(await rows.count(), 15);
    for (let r = 0; r < rowCount; r++) {
      const cell = rows.nth(r).locator('td').nth(shipperColIndex);
      const text = ((await cell.textContent().catch(() => '')) || '').trim();
      if (text && !/to\s*order/i.test(text) && !/^na$/i.test(text)) {
        return cell.locator('a').first();
      }
    }
    throw new Error('[CompanyProfile] No row with a real shipper name found in the results grid.');
  }

  // Helper: read the "Company Transaction History" credit counter shown top-right of the
  // company profile page - it's rendered inside a circular-progress widget, so the number
  // has to be pulled out of the surrounding block's text rather than a dedicated element.
  async function getTransactionCounter(page) {
    const label = page.locator('text=/Company\\s*Transaction\\s*History/i').first();
    const text = (await label.locator('xpath=ancestor::*[3]').innerText()).replace(/\s+/g, ' ').trim();
    const match = text.match(/(\d+)/);
    if (!match) throw new Error(`[CompanyProfile] Could not read the transaction counter from: "${text}"`);
    return parseInt(match[1], 10);
  }

  // Helper: from the Shipment grid card's "View All" link, open the "Shipments" modal and click
  // its "View in Global Search" button. Confirms the redirected search pre-fills Country =
  // "All Country (Global Search)" and tokenizes the same company just inspected - tying the
  // whole company-profile flow back to a matching Global Search query.
  async function verifyViewInGlobalSearch(companyPage, companyName) {
    console.log('[TC-COMPANY-011] Scroll to the Shipment card and click "View All"');
    const viewAllLink = companyPage.locator('a, span, div').filter({ hasText: /^View All$/i }).last();
    await viewAllLink.scrollIntoViewIfNeeded();
    await viewAllLink.click();

    const shipmentsModal = companyPage.locator('[class*="modal"]:visible, [role="dialog"]:visible').filter({ hasText: 'Shipments' }).first();
    await expect(shipmentsModal).toBeVisible({ timeout: 10000 });

    // The modal's own "View in Global Search" button is portal-appended - .last() reaches it
    // over the dimmed page-level link of the same name sitting behind the overlay. The click
    // occasionally misses right as the modal's fade-in animation settles, so retry briefly.
    console.log('[TC-COMPANY-011] Click "View in Global Search" in the Shipments modal');
    const viewInGlobalBtn = companyPage.locator('button:has-text("View in Global Search")').last();
    let searchPage = null;
    for (let attempt = 0; attempt < 4 && !searchPage; attempt++) {
      await companyPage.waitForTimeout(800);
      [searchPage] = await Promise.all([
        companyPage.context().waitForEvent('page', { timeout: 6000 }).catch(() => null),
        viewInGlobalBtn.click({ force: true }).catch(() => {}),
      ]);
    }
    if (!searchPage) throw new Error('[CompanyProfile] "View in Global Search" never opened the Global Search tab.');

    await searchPage.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await searchPage.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await expect(searchPage).toHaveURL(/workspace\/search/, { timeout: 15000 });

    const countryDisplay = searchPage.locator('.dropdown-display').first();
    await expect(countryDisplay).toContainText(/All Country \(Global Search\)/i, { timeout: 10000 });

    const escapedName = companyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const tag = searchPage.locator('.react-tags__selected-tag').filter({ hasText: new RegExp(escapedName, 'i') }).first();
    await expect(tag).toBeVisible({ timeout: 10000 });

    console.log(`[TC-COMPANY-011] ✅ "View in Global Search" redirected with Country=All Country and "${companyName}" tokenized`);
    await searchPage.close();

    // Opening "View in Global Search" leaves the Shipments modal open behind the new tab
    // (it doesn't navigate companyPage away) - close it so the next tab click isn't blocked
    // by its overlay.
    const closeBtn = shipmentsModal.locator('button, [class*="close" i]').first();
    await closeBtn.click({ force: true }).catch(() => {});
    await expect(shipmentsModal).toBeHidden({ timeout: 5000 }).catch(() => {});
  }

  // Helper: click a tab (Export/Import), Unlock it if still locked, verify the resulting
  // Company Transaction History point deduction, then download every card's Excel export.
  async function verifyTabUnlockAndDownloads(companyPage, tabName, shipmentsOnRecord, companyName) {
    console.log(`[TC-COMPANY-011] Read transaction counter before opening ${tabName} tab`);
    const counterBefore = await getTransactionCounter(companyPage);
    console.log(`[TC-COMPANY-011] ${tabName} shipments on record: ${shipmentsOnRecord}, transaction counter before: ${counterBefore}`);

    console.log(`[TC-COMPANY-011] Click the ${tabName} tab and Unlock`);
    await companyPage.locator(`text=/^${tabName}$/i`).first().click();
    await companyPage.waitForTimeout(1500);

    const unlockBtn = companyPage.locator('button.unlock-button, button:has-text("Unlock")').first();
    const wasLocked = await unlockBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (wasLocked) {
      await unlockBtn.click();
      await companyPage.waitForTimeout(3000);
    } else {
      console.log(`[TC-COMPANY-011] ${tabName} data already unlocked from a previous run - no Unlock button to click`);
    }

    // The app only renders a "{tabName} Performance" summary card when the company has
    // at least one shipment of that type — with 0 on record it shows an empty/"Not
    // Available" grid instead, so only wait for the card when there's real data to show.
    if (shipmentsOnRecord > 0) {
      console.log(`[TC-COMPANY-011] Wait for the ${tabName} Performance card to render`);
      await companyPage.locator(`text=/${tabName} Performance/i`).first().waitFor({ state: 'visible', timeout: 20000 });
    } else {
      console.log(`[TC-COMPANY-011] ${tabName} shipments on record: 0 - no Performance card expected, skipping wait`);
    }
    await companyPage.waitForTimeout(1500);

    const counterAfter = await getTransactionCounter(companyPage);
    console.log(`[TC-COMPANY-011] Transaction counter after: ${counterAfter}`);

    if (wasLocked && shipmentsOnRecord > 0) {
      expect(counterAfter).toBe(counterBefore - 1);
      console.log(`[TC-COMPANY-011] ✅ ${tabName} data existed - 1 point deducted from Company Transaction History`);
    } else {
      expect(counterAfter).toBe(counterBefore);
      console.log(wasLocked
        ? `[TC-COMPANY-011] ✅ No ${tabName} data - no point deducted from Company Transaction History`
        : `[TC-COMPANY-011] ✅ Already unlocked - no additional point deducted from Company Transaction History`);
    }

    console.log(`[TC-COMPANY-011] Download the Excel export for every card on the ${tabName} tab`);
    const excelIcons = companyPage.locator('span.icon-sprite.bg-excel_icon.cursor-pointer');
    const cardCount = await excelIcons.count();
    expect(cardCount).toBeGreaterThan(0);
    for (let i = 0; i < cardCount; i++) {
      const icon = excelIcons.nth(i);
      await icon.scrollIntoViewIfNeeded();
      await companyPage.waitForTimeout(300);
      const [download] = await Promise.all([
        companyPage.waitForEvent('download', { timeout: 10000 }),
        icon.click(),
      ]);
      console.log(`[TC-COMPANY-011] ✅ ${tabName} card ${i + 1}/${cardCount} downloaded: ${download.suggestedFilename()}`);
      await companyPage.waitForTimeout(500);
    }

    await verifyViewInGlobalSearch(companyPage, companyName);
  }

  test('TC-COMPANY-011: New Search by country + product tag returns results, shipper/consignee click through to Contact Parser, tab unlock/downloads, and view-in-global-search round trip', async ({ page }) => {
    console.log('[TC-COMPANY-011] Click "New Search" in the top nav');
    await page.getByRole('link', { name: 'New Search' }).click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });

    console.log('[TC-COMPANY-011] Open "Select Country" dropdown and choose "All Country (Global Search)"');
    await page.locator('span').filter({ hasText: 'Select Country' }).first().click();
    await page.waitForTimeout(500);
    await page.getByText('All Country (Global Search)', { exact: false }).first().click();
    await page.waitForTimeout(1000);

    console.log('[TC-COMPANY-011] Fill product tag "oil" and pick the matching suggestion');
    const tagInput = page.locator('input[placeholder="Add new tag"]').first();
    await tagInput.waitFor({ state: 'visible', timeout: 10000 });
    await tagInput.click();
    await tagInput.fill('oil');
    await page.waitForTimeout(1200);

    const suggestion = page.locator('.react-tags__suggestions li').filter({ hasText: /^oil$/i }).first();
    await suggestion.waitFor({ state: 'visible', timeout: 5000 });
    await suggestion.click();
    await page.waitForTimeout(500);

    console.log('[TC-COMPANY-011] Click Search and verify results');
    await page.locator('button:has-text("Search")').last().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 20000 }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});

    const resultTile = page.locator('text=/^Shipments$/i').first();
    await expect(resultTile).toBeVisible({ timeout: 20000 });
    console.log('[TC-COMPANY-011] ✅ Search results displayed for country=All Country, tag=oil');

    console.log('[TC-COMPANY-011] Scroll down to the results grid');
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(1000);

    console.log('[TC-COMPANY-011] Shift the grid right to bring the Shipper/Consignee columns into view');
    const rightArrow = page.locator('.scroll-circle.fa-chevron-right').first();
    for (let i = 0; i < 6; i++) {
      const shipperVisible = await page.locator('thead th, [role="columnheader"]')
        .filter({ hasText: /^shipper$/i }).first().isVisible().catch(() => false);
      if (shipperVisible) break;
      await rightArrow.click().catch(() => {});
      await page.waitForTimeout(600);
    }

    console.log('[TC-COMPANY-011] Click a shipper name in the grid');
    const shipperColIndex = await getShipperColumnIndex(page);
    const shipperLink = await getFirstShipperLink(page, shipperColIndex);
    const shipperName = (await shipperLink.textContent()).trim();
    console.log(`[TC-COMPANY-011] Clicking shipper: ${shipperName}`);

    // The grid is very tall/wide and the row can sit outside Playwright's actionability
    // viewport check (and behind floating widgets like the WhatsApp button) even after
    // scrolling - dispatch the click directly on the element instead of a coordinate click.
    await shipperLink.evaluate(el => el.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(300);
    const [companyPage] = await Promise.all([
      page.context().waitForEvent('page', { timeout: 10000 }),
      shipperLink.evaluate(el => el.click()),
    ]);

    console.log('[TC-COMPANY-011] Verify redirect to Contact Parser page');
    await companyPage.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await expect(companyPage).toHaveURL(/\/company\/.*isContact=true/, { timeout: 15000 });
    await expect(companyPage.getByText(shipperName, { exact: false }).first()).toBeVisible({ timeout: 10000 });
    console.log(`[TC-COMPANY-011] ✅ Redirected to Contact Parser for "${shipperName}": ${companyPage.url()}`);

    console.log('[TC-COMPANY-011] Read export/import shipment counts from Overview');
    const overviewText = (await companyPage.locator('text=/Overview/i').first().locator('xpath=ancestor::*[2]').innerText()).replace(/\s+/g, ' ');
    const exportMatch = overviewText.match(/exported\s+(\d+)\s+shipments?/i);
    const importMatch = overviewText.match(/imported\s+(\d+)\s+shipments?/i);
    const exportShipments = exportMatch ? parseInt(exportMatch[1], 10) : 0;
    const importShipments = importMatch ? parseInt(importMatch[1], 10) : 0;
    await companyPage.locator('text=/Company\\s*Transaction\\s*History/i').first().waitFor({ state: 'visible', timeout: 10000 });

    await verifyTabUnlockAndDownloads(companyPage, 'Export', exportShipments, shipperName);
    await verifyTabUnlockAndDownloads(companyPage, 'Import', importShipments, shipperName);
  });
});
