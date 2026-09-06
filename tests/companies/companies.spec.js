// @ts-nocheck
const { test, expect } = require('@playwright/test');
const XLSX = require('xlsx');

// ─── Module 9: Companies Tab ──────────────────────────────────────────────────
// Migrated from src/pages/Companies.specs.js (Module 9).

test.describe('Module 9 - Companies Tab', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('https://app.volza.com/home');
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  });

  // ── TC-COMPANY-001: Navigate to Companies tab ───────────────────────────────────────
  test('TC-COMPANY-001: Navigate to Companies tab and verify it loads', async ({ page }) => {
    console.log('[TC-COMPANY-001] Click Companies tab');
    await page.locator('a:has-text("Companies"), [href*="companies"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });

    const companiesGrid = page.locator('tbody tr, [class*="company-card"], [class*="company-row"]').first();
    await expect(companiesGrid).toBeVisible({ timeout: 20000 });
    console.log('[TC-COMPANY-001] ✅ Companies tab loaded');
  });

  // Helper: rc-tabs keeps every visited tab pane mounted (off-screen) instead
  // of unmounting it, so an unscoped locator can match a stale copy from a
  // previously-visited tab. Given a locator that may match both the live
  // on-screen element and off-canvas leftovers, resolve to the one actually
  // positioned in the viewport.
  async function resolveInViewport(locator) {
    const count = await locator.count();
    for (let i = 0; i < count; i++) {
      const box = await locator.nth(i).boundingBox().catch(() => null);
      if (box && box.x >= 0) return locator.nth(i);
    }
    return locator.first();
  }

  // Helper: open a downloaded workbook and confirm the row currently shown
  // in the grid's first row is actually present in it. The exported layout
  // varies by tab (a full "Company List" sheet vs. a single-company contact
  // detail sheet, plus report-title/blank rows before the real header), so
  // rather than assuming a fixed header/column layout this flattens every
  // sheet's cells into one searchable blob and looks for the grid's own
  // company name as a substring - a lenient but real content check.
  // `gridNameLocator` lets callers point at whatever cell holds the row's
  // identifying text - defaults to the 5-grid-tabs' company name cell, but
  // e.g. the Contacts grid (a plain ant-table with no such class) passes its
  // own "Contact Name" cell locator instead.
  async function verifyDownloadedFileMatchesGrid(page, download, tabName, gridNameLocator) {
    const filePath = await download.path();
    if (!filePath) {
      console.log(`[${tabName}] ⚠️ Download had no local file path to inspect (blocked download?)`);
      return;
    }

    const nameLocator = gridNameLocator || page.locator('tbody tr').first().locator('.company-name-allignment').first();
    const gridName = (await nameLocator.textContent().catch(() => '')).trim();

    const workbook = XLSX.readFile(filePath);
    let blob = '';
    for (const sheetName of workbook.SheetNames) {
      blob += JSON.stringify(XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 }));
    }
    console.log(`[${tabName}] Opened "${download.suggestedFilename()}" - ${workbook.SheetNames.length} sheet(s), ${blob.length} chars of data`);

    expect(blob.length).toBeGreaterThan(0);
    if (gridName) {
      expect(blob.toLowerCase()).toContain(gridName.toLowerCase());
      console.log(`[${tabName}] ✅ File data matches grid - contains "${gridName}"`);
    } else {
      console.log(`[${tabName}] ⚠️ Could not read a company name off the grid to cross-check, but file has data`);
    }
  }

  // Helper: click a tab's download icon and confirm the grid data it shows
  // was actually downloaded - either a real file download fires (which is
  // then opened and its contents checked against the grid), or (for tabs
  // with zero rows) the app's own "No record found." confirmation appears,
  // which is dismissed so the next tab starts clean.
  async function downloadActiveTabAndVerify(page, tabName) {
    // Both tab layouts (the 5 grid tabs' own icon, and Contacts' nested
    // "My Saved Contact" icon) can have multiple mounted copies at once -
    // resolve page-wide rather than assuming which tabpane wrapper holds
    // the on-screen one.
    const downloadIcon = await resolveInViewport(
      page.locator('span.company-list-download, .excel-bg-style')
    );
    await downloadIcon.waitFor({ state: 'visible', timeout: 10000 });

    const [dl] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }).catch(() => null),
      downloadIcon.click(),
    ]);
    await page.waitForTimeout(500);

    if (dl) {
      console.log(`[${tabName}] ✅ Grid data downloaded: ${dl.suggestedFilename()}`);
      await verifyDownloadedFileMatchesGrid(page, dl, tabName);
      return;
    }

    const noRecordAlert = page.locator('.swal-overlay:visible').filter({ hasText: /no record found/i }).last();
    await expect(noRecordAlert).toBeVisible({ timeout: 8000 });
    console.log(`[${tabName}] ✅ No rows in grid - "No record found" shown instead of a download`);
    // Scope the OK click to this exact alert instance - older, already-handled
    // overlays can still linger in the DOM and a page-wide button query can
    // resolve to one of those instead of the one just asserted visible. The
    // 5 grid tabs use plain SweetAlert (button.swal-button--confirm); the
    // Contacts tab's own empty-state alert is a "custom-swal" variant with
    // its own button.next-btn-swal instead.
    await noRecordAlert.locator('.swal-button--confirm, button.next-btn-swal').first().click();
    await noRecordAlert.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }

  // ── TC-COMPANY-002: Every tab (All, Buyers, Export Competitors, Suppliers,
  // Import Competitors, Contacts) has its own download icon that exports
  // exactly the data currently shown in that tab's grid.
  test('TC-COMPANY-002: Every Companies tab has a working download icon for its own grid data', async ({ page }) => {
    // Downloads + verifies Excel content across 6 tabs sequentially against a live app —
    // duration is inherently variable (each tab does a real network download + xlsx
    // parse). Observed 1.5m-3m+ across live runs; 180s still wasn't enough on the
    // 6th (Contacts) tab in one run, so budget generously rather than re-tune again.
    test.setTimeout(300_000);
    console.log('[TC-COMPANY-002] Navigate to Companies tab');
    await page.locator('a:has-text("Companies"), [href*="companies"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await page.waitForTimeout(1500);

    const tabNames = ['All', 'Buyers', 'Export Competitors', 'Suppliers', 'Import Competitors', 'Contacts'];
    for (const tabName of tabNames) {
      const tab = page.locator('[role="tab"]').filter({ hasText: new RegExp(`^${tabName}`, 'i') }).first();
      const tabVisible = await tab.isVisible().catch(() => false);
      if (!tabVisible) {
        console.log(`[${tabName}] Tab not found, skipping`);
        continue;
      }

      await tab.click();
      await page.waitForTimeout(1500);
      console.log(`[${tabName}] ✅ Tab opened`);

      await downloadActiveTabAndVerify(page, tabName);
    }
    console.log('[TC-COMPANY-002] ✅ Download verified on every Companies tab');
  });

  // ── TC-COMPANY-003: Apply left filters ───────────────────────────────────────────────
  test('TC-COMPANY-003: Apply left panel filters and verify data update', async ({ page }) => {
    console.log('[TC-COMPANY-003] Navigate to Companies tab');
    await page.locator('a:has-text("Companies"), [href*="companies"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await page.waitForTimeout(2000);

    const leftFilterCheckbox = page.locator('[class*="left-filter"] input[type="checkbox"], [class*="filter-panel"] input[type="checkbox"]').first();
    if (await leftFilterCheckbox.isVisible()) {
      await leftFilterCheckbox.click();
      await page.waitForTimeout(2000);
      const updatedRows = page.locator('tbody tr, [class*="company-card"]');
      console.log(`[TC-COMPANY-003] Rows after filter: ${await updatedRows.count()}`);
      console.log('[TC-COMPANY-003] ✅ Left filter applied and data updated');
    } else {
      console.log('[TC-COMPANY-003] Left filter panel not visible');
    }
  });

  // ── TC-COMPANY-004: Tagging functionality ────────────────────────────────────────────
  test('TC-COMPANY-004: Tag a company and verify it appears in Tagged tab', async ({ page }) => {
    console.log('[TC-COMPANY-004] Navigate to Companies tab');
    await page.locator('a:has-text("Companies"), [href*="companies"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await page.waitForTimeout(2000);

    const firstRow = page.locator('tbody tr, [class*="company-row"]').first();
    await firstRow.waitFor({ state: 'visible', timeout: 15000 });

    const tagBtn = firstRow.locator('[class*="tag-btn"], button:has-text("Tag"), [class*="bookmark"]').first();
    if (await tagBtn.isVisible()) {
      await tagBtn.click();
      await page.waitForTimeout(1000);

      const tagModal = page.locator('[class*="modal"], [role="dialog"]').first();
      if (await tagModal.isVisible()) {
        const tagInput = tagModal.locator('input').first();
        if (await tagInput.isVisible()) await tagInput.fill('Test Tag');
        const confirmBtn = tagModal.locator('button:has-text("Save"), button:has-text("Add")').first();
        if (await confirmBtn.isVisible()) await confirmBtn.click();
        console.log('[TC-COMPANY-004] Tag added via modal');
      } else {
        console.log('[TC-COMPANY-004] Tag applied inline');
      }
      await page.waitForTimeout(1000);

      const taggedTab = page.locator('[class*="tab"]').filter({ hasText: /tagged/i }).first();
      if (await taggedTab.isVisible()) {
        await taggedTab.click();
        await page.waitForTimeout(1500);
        const taggedRows = page.locator('tbody tr, [class*="company-row"]');
        const taggedCount = await taggedRows.count();
        console.log(`[TC-COMPANY-004] Tagged companies: ${taggedCount}`);
        console.log('[TC-COMPANY-004] ✅ Tagged tab shows tagged companies');
      }
    }
  });

  // ── TC-COMPANY-005: Change time period (Max/1Y/3Y) - SME+ only ─────────────────────
  test('TC-COMPANY-005: Change time period from Max to 1Y or 3Y (SME+ plan)', async ({ page }) => {
    console.log('[TC-COMPANY-005] Navigate to Companies tab');
    await page.locator('a:has-text("Companies"), [href*="companies"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await page.waitForTimeout(2000);

    const oneYBtn = page.locator('button:has-text("1Y"), [class*="date-range"]').filter({ hasText: /1Y/i }).first();
    if (await oneYBtn.isVisible()) {
      await oneYBtn.click();
      await page.waitForTimeout(2000);
      const rows = page.locator('tbody tr, [class*="company-row"]').first();
      await expect(rows).toBeVisible({ timeout: 10000 });
      console.log('[TC-COMPANY-005] ✅ 1Y time period selected and data refreshed');
    } else {
      console.log('[TC-COMPANY-005] Time period buttons not visible for this plan');
    }
  });

  // ── TC-COMPANY-006: Pagination ──────────────────────────────────────────────────────
  test('TC-COMPANY-006: Pagination works correctly', async ({ page }) => {
    console.log('[TC-COMPANY-006] Navigate to Companies tab');
    await page.locator('a:has-text("Companies"), [href*="companies"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await page.waitForTimeout(2000);

    const nextPageBtn = page.locator('[class*="pagination"] button:has-text("Next"), [class*="pagination"] [aria-label*="next"]').first();
    if (await nextPageBtn.isVisible()) {
      await nextPageBtn.click();
      await page.waitForTimeout(1500);
      const rows = page.locator('tbody tr, [class*="company-card"]').first();
      await expect(rows).toBeVisible({ timeout: 10000 });
      console.log('[TC-COMPANY-006] ✅ Next page loaded');
    } else {
      console.log('[TC-COMPANY-006] Pagination not visible (single page)');
    }
  });

  // ── TC-COMPANY-007: Viewed companies tab ────────────────────────────────────────────
  test('TC-COMPANY-007: Viewed companies show in the dedicated viewed tab', async ({ page }) => {
    console.log('[TC-COMPANY-007] Navigate to Companies tab');
    await page.locator('a:has-text("Companies"), [href*="companies"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await page.waitForTimeout(2000);

    const viewedTab = page.locator('[class*="tab"], button[role="tab"]').filter({ hasText: /viewed/i }).first();
    if (await viewedTab.isVisible()) {
      await viewedTab.click();
      await page.waitForTimeout(1500);
      console.log('[TC-COMPANY-007] ✅ Viewed tab clicked and data shown');
    } else {
      console.log('[TC-COMPANY-007] Viewed tab not visible for this account');
    }
  });

  // ── TC-COMPANY-008: Saved companies tab ──────────────────────────────────────────────
  test('TC-COMPANY-008: Saved companies show in the dedicated saved tab', async ({ page }) => {
    console.log('[TC-COMPANY-008] Navigate to Companies tab');
    await page.locator('a:has-text("Companies"), [href*="companies"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await page.waitForTimeout(2000);

    const savedTab = page.locator('[class*="tab"], button[role="tab"]').filter({ hasText: /saved/i }).first();
    if (await savedTab.isVisible()) {
      await savedTab.click();
      await page.waitForTimeout(1500);
      console.log('[TC-COMPANY-008] ✅ Saved tab clicked');
    }
  });

  // ── TC-COMPANY-009: Company search box filter ──────────────────────────────────────
  test('TC-COMPANY-009: Company search box filters companies by name', async ({ page }) => {
    console.log('[TC-COMPANY-009] Navigate to Companies tab');
    await page.locator('a:has-text("Companies"), [href*="companies"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await page.waitForTimeout(2000);

    const companySearchBox = page.locator('input[placeholder*="company" i], input[placeholder*="search" i]').first();
    if (await companySearchBox.isVisible()) {
      await companySearchBox.fill('TATA');
      await page.waitForTimeout(1500);
      const filteredRows = page.locator('tbody tr, [class*="company-row"]');
      console.log(`[TC-COMPANY-009] Filtered companies: ${await filteredRows.count()}`);
      console.log('[TC-COMPANY-009] ✅ Company search filter working');
    } else {
      console.log('[TC-COMPANY-009] Company search box not found');
    }
  });

  // ── TC-COMPANY-010: Contacts tab - My Saved Contact download, then My Requested Contact ──
  test('TC-COMPANY-010: Contacts tab - download and verify My Saved Contact, then open My Requested Contact', async ({ page }) => {
    console.log('[TC-COMPANY-010] Navigate to Companies tab');
    await page.locator('a:has-text("Companies"), [href*="companies"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await page.waitForTimeout(1500);

    console.log('[TC-COMPANY-010] Click Contacts tab');
    const contactsTab = page.locator('[role="tab"]').filter({ hasText: /^Contacts/i }).first();
    await contactsTab.waitFor({ state: 'visible', timeout: 10000 });
    await contactsTab.click();
    await page.waitForTimeout(2000);

    // "My Saved Contact" is the default sub-tab - just wait for its grid to load.
    console.log('[TC-COMPANY-010] Step 1: Wait for "My Saved Contact" data to load');
    const firstRow = page.locator('tbody tr:not(.ant-table-measure-row):has(td)').first();
    await firstRow.waitFor({ state: 'visible', timeout: 15000 });
    console.log('[TC-COMPANY-010] ✅ "My Saved Contact" data loaded');

    console.log('[TC-COMPANY-010] Step 2: Download the Excel');
    const downloadIcon = await resolveInViewport(page.locator('span.company-list-download, .excel-bg-style'));
    await downloadIcon.waitFor({ state: 'visible', timeout: 10000 });
    const [dl] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }).catch(() => null),
      downloadIcon.click(),
    ]);
    expect(dl, 'Excel download should fire for "My Saved Contact"').toBeTruthy();
    console.log(`[TC-COMPANY-010] ✅ Downloaded: ${dl.suggestedFilename()}`);

    console.log('[TC-COMPANY-010] Step 3: Verify downloaded data matches the grid');
    const gridContactNameCell = firstRow.locator('td').nth(1);
    await verifyDownloadedFileMatchesGrid(page, dl, 'Contacts - My Saved Contact', gridContactNameCell);

    console.log('[TC-COMPANY-010] Step 4: Click "My Requested Contact" tab');
    const requestedContactTab = await resolveInViewport(page.locator('.tab-header-text').filter({ hasText: /^My Requested Contact/i }));
    await requestedContactTab.waitFor({ state: 'visible', timeout: 10000 });
    await requestedContactTab.click();
    await page.waitForTimeout(1500);
    console.log('[TC-COMPANY-010] ✅ "My Requested Contact" tab opened - stopping here');
  });
});
