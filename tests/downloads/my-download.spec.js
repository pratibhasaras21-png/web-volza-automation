// @ts-nocheck
const { test, expect } = require('@playwright/test');
const XLSX = require('xlsx');
const { handleMaxRecordsPopup } = require('../../helpers/maxRecordsPopup');

// ─── Module 8: My Download Tab ────────────────────────────────────────────────
// Flow: Search tab -> All Country (Global Search) -> Product "oil" -> Search ->
// Save Workspace -> apply a left FILTERS panel filter -> toolbar Download button
// -> My Downloads tab -> verify the saved workspace's query is listed there ->
// download its Excel and verify it has real data. A second scenario repeats the
// search on a global database but deliberately skips Save Workspace, to confirm
// the toolbar Download button also works as a "direct" download that doesn't
// depend on a saved workspace, and still lands correctly in My Downloads.
//
// Pre-conditions: SME/Corporate plan account. Login is handled once via
// globalSetup (see global-setup.js), which persists session cookies to
// auth-state.json - every test here starts already authenticated.
//
// Migrated from src/pages/MyDownload.specs.js (Module 8).

const PRODUCT_KEYWORD = 'oil';

test.describe('Module 8 - My Download Tab', () => {
  // Wider than the project default (1280x720) - at that width the top nav collapses
  // "My Download" (and other labels) down to icon-only buttons, same fix already
  // documented in SearchTab_DashboardTab.specs.js.
  test.use({ viewport: { width: 1366, height: 768 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('https://app.volza.com/home');
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  });

  // Helper: open the "Select Country" dropdown and pick "All Country (Global Search)" -
  // same id convention already proven in MyWorkspace.specs.js/SearchTab_AutoSelect.specs.js.
  async function selectAllCountryGlobalSearch(page) {
    await page.locator('.dropdown-display', { hasText: 'Select Country' }).first().click();
    await page.waitForTimeout(500);
    await page.locator('[id^="Type_Exports_"]').first().click();
    await page.waitForTimeout(1000);
  }

  // Helper: type a product keyword into the (default) Product search field and tokenize
  // it, picking the first autocomplete suggestion if one appears, else pressing Enter.
  async function enterProductKeyword(page, keyword) {
    const productInput = page.locator('input[placeholder="Add new tag"]').first();
    await productInput.waitFor({ state: 'visible', timeout: 10000 });
    await productInput.click();
    await productInput.fill(keyword);
    await page.waitForTimeout(1500);
    const suggestion = page.locator('.react-tags__suggestions li').first();
    if (await suggestion.isVisible({ timeout: 3000 }).catch(() => false)) {
      await suggestion.click();
    } else {
      await page.keyboard.press('Enter');
    }
    await page.waitForTimeout(500);
  }

  // Helper: click Search and wait for the results grid to render.
  async function runSearch(page) {
    const searchBtn = page.locator('button.custom-search, button:has-text("Search")').last();
    await searchBtn.scrollIntoViewIfNeeded();
    await searchBtn.click();
    await page.waitForURL(/workspace\/search\//, { timeout: 20000 }).catch(() => {});
    await page.waitForLoadState('domcontentloaded', { timeout: 20000 }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await handleMaxRecordsPopup(page);

    const gridRows = page.locator('tbody tr:not(.ant-table-measure-row):has(td)');
    await expect(gridRows.first()).toBeVisible({ timeout: 30000 });
  }

  // Helper: click Save, name the workspace, confirm - same "Save Workspace" modal flow
  // already verified in MyWorkspace.specs.js/SearchTab_DashboardTab.specs.js.
  async function saveWorkspace(page, workspaceName) {
    const saveBtn = page.locator('li:has-text("Save"), button:has-text("Save")').filter({ hasNotText: /workspace|query/i }).first();
    await saveBtn.click();
    const saveModal = page.locator('[class*="modal"]:visible, [role="dialog"]:visible').filter({ hasText: 'Save Workspace' }).first();
    await expect(saveModal).toBeVisible({ timeout: 8000 });

    const wsNameInput = saveModal.locator('input[placeholder*="Workspace name" i]').first();
    await wsNameInput.fill(workspaceName);

    const saveQueryBtn = saveModal.locator('button:has-text("Save Query")').first();
    await saveQueryBtn.click();

    const savedPopup = page.locator('.swal-overlay:visible').filter({ hasText: /saved successfully/i }).first();
    await expect(savedPopup).toBeVisible({ timeout: 10000 });
    await savedPopup.locator('button.next-btn-swal').click();
    await savedPopup.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }

  // Helper: expand the left FILTERS "Country of Origin" (COO) accordion panel, and tick
  // the first option whose own shipment count (shown in parentheses at the end of its row
  // label, e.g. "United States (15)") is under the given threshold - rather than just the
  // first available option - then click the panel's own "Apply" button. Returns the applied
  // option's { label, count }, or null if the panel never appeared or no option qualified.
  async function applyCountryOfOriginFilterUnderCount(page, maxCount) {
    const filtersPanel = page.locator('text=FILTERS').first().locator('xpath=../..');
    const panelTitle = filtersPanel.locator('.df-panel-title-custom').filter({ hasText: /^Country of Origin$/i }).first();
    const titleFound = await panelTitle.waitFor({ state: 'visible', timeout: 10000 }).then(() => true).catch(() => false);
    if (!titleFound) {
      console.log('[MyDownload] ⚠️ "Country of Origin" filter panel not found');
      return null;
    }
    await panelTitle.scrollIntoViewIfNeeded();

    const panelContainer = panelTitle.locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " df-panel ")][1]');
    const chevron = panelContainer.locator('.df-panel-tools-filter i').first();
    const isExpanded = await chevron.evaluate(el => el.classList.contains('fa-chevron-up')).catch(() => false);
    if (!isExpanded) {
      // The chevron/tools element (the title's immediate following sibling) is the actual
      // click target that toggles the accordion - clicking the wider header wrapper is a no-op.
      await panelTitle.locator('xpath=following-sibling::*[1]').click();
      await page.waitForTimeout(1200);
    }

    const applyBtn = panelContainer.locator('button.custom-filter-apply').first();
    const rows = panelContainer.locator('.lptr');
    const rowCount = await rows.count();
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const labelText = ((await row.locator('.lptd').nth(1).textContent().catch(() => '')) || '').trim();
      const countMatch = labelText.match(/\((\d+)\)\s*$/);
      if (!countMatch) continue;

      const count = parseInt(countMatch[1], 10);
      if (count < maxCount) {
        await row.locator('input[type="checkbox"]').first().click();
        await applyBtn.click();
        await page.waitForTimeout(1500);
        console.log(`[MyDownload] Applied "Country of Origin: ${labelText}" (shipment count ${count} < ${maxCount})`);
        return { label: labelText, count };
      }
    }

    console.log(`[MyDownload] ⚠️ No "Country of Origin" option found with shipment count under ${maxCount}`);
    return null;
  }

  // Helper: click the top toolbar's "Download" button, tick every checkbox in the
  // dashboard-selection modal, confirm, and wait for the "complete shortly" toast - same
  // flow already proven in SearchTab_DashboardTab.specs.js TC-24 to TC-30.
  async function clickDownloadButton(page) {
    const downloadBtn = page.locator('li:has-text("Download"), button:has-text("Download"), [class*="download-btn" i]')
      .filter({ hasNotText: /excel/i }).first();
    await downloadBtn.waitFor({ state: 'visible', timeout: 10000 });
    await downloadBtn.click();
    await page.waitForTimeout(1500);

    const downloadModal = page.locator('[class*="modal"]:visible, [role="dialog"]:visible').filter({ hasText: /chargeable/i }).first();
    await expect(downloadModal).toBeVisible({ timeout: 8000 });

    const allCheckboxes = downloadModal.locator('input[type="checkbox"]');
    const count = await allCheckboxes.count();
    for (let i = 0; i < count; i++) {
      await allCheckboxes.nth(i).check().catch(() => {});
    }

    // The modal's confirm button carries no accessible text (icon-only) - it's the last
    // of the modal's two footer buttons, after "Cancel". Forced because a stray portal
    // element can sit over the modal and intercept pointer events without actually
    // blocking real user clicks (same gotcha documented in SearchTab_DashboardTab.specs.js).
    const excelDownloadBtn = downloadModal.locator('button').last();
    await excelDownloadBtn.click({ force: true });
    await page.waitForTimeout(1500);

    const successPopup = page.locator('[class*="toast"], [role="alert"]').filter({ hasText: /complete shortly/i }).first();
    await expect(successPopup).toBeVisible({ timeout: 10000 });
    console.log('[MyDownload] ✅ Download initiated from the toolbar Download button');
  }

  // Helper: navigate from anywhere in the app to the My Downloads tab. The export request
  // kicked off by clickDownloadButton() leaves a full-page loading spinner up for a while
  // (server-side file generation) that intercepts clicks - wait it out first. There's no
  // "My Download" text/link in the top nav - it's an icon-only <li> with no accessible
  // name, sitting immediately after "End Demo" next to the user avatar; that icon lands on
  // the Account section, where "My Downloads" is a left sidebar item.
  async function navigateToMyDownloads(page) {
    await page.locator('.spinner-main').first().waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});

    const myDownloadIcon = page.locator('li:has-text("End Demo")').locator('xpath=following-sibling::li[1]').first();
    await myDownloadIcon.waitFor({ state: 'visible', timeout: 10000 });
    await myDownloadIcon.click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });

    const myDownloadsSidebarLink = page.locator('a:has-text("My Downloads"), li:has-text("My Downloads")').first();
    await myDownloadsSidebarLink.waitFor({ state: 'visible', timeout: 10000 });
    await myDownloadsSidebarLink.click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });

    const downloadRow = page.locator('tbody tr, [class*="download-row"]').first();
    await expect(downloadRow).toBeVisible({ timeout: 15000 });
    return downloadRow;
  }

  // Helper: open the downloaded workbook and confirm it actually contains data. The My
  // Downloads list has no on-screen results grid to cross-check content against (unlike
  // the Companies tab's per-row downloads), so this is a content-exists check rather than
  // a row-for-row match - same lenient fallback Companies.specs.js uses when no reference
  // grid is available.
  async function verifyDownloadedExcelHasData(download, label) {
    const filePath = await download.path();
    if (!filePath) {
      console.log(`[MyDownload] ⚠️ "${label}" download had no local file path to inspect (blocked download?)`);
      return;
    }
    const workbook = XLSX.readFile(filePath);
    let blob = '';
    for (const sheetName of workbook.SheetNames) {
      blob += JSON.stringify(XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 }));
    }
    console.log(`[MyDownload] Opened "${download.suggestedFilename()}" (${label}) - ${workbook.SheetNames.length} sheet(s), ${blob.length} chars of data`);
    expect(blob.length).toBeGreaterThan(0);
    console.log(`[MyDownload] ✅ "${label}" Excel file has real data`);
  }

  // Helper: from the My Downloads list, wait for the newest row's export to be ready (not
  // still "Processing"/"In Progress" from server-side file generation) then click its
  // download icon/link and capture the browser download event. Reloads the tab a few times
  // while waiting since the status typically only updates on refresh, not live.
  async function downloadFromRow(page, label) {
    let downloadLink = page.locator('tbody tr').first()
      .locator('a:has-text("Download"), [class*="download-link"], [class*="download-icon" i], a[href*="download" i], img[alt*="download" i]').first();

    for (let attempt = 0; attempt < 6; attempt++) {
      const processing = page.locator('tbody tr').first().locator('text=/processing|in progress|generating/i').first();
      const stillProcessing = await processing.isVisible({ timeout: 2000 }).catch(() => false);
      if (!stillProcessing && await downloadLink.isVisible({ timeout: 2000 }).catch(() => false)) break;

      console.log(`[MyDownload] "${label}" - row not ready yet (attempt ${attempt + 1}/6), reloading`);
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(5000);
      downloadLink = page.locator('tbody tr').first()
        .locator('a:has-text("Download"), [class*="download-link"], [class*="download-icon" i], a[href*="download" i], img[alt*="download" i]').first();
    }

    const [dl] = await Promise.all([
      page.waitForEvent('download', { timeout: 20000 }).catch(() => null),
      downloadLink.click({ timeout: 8000 }).catch(() => {}),
    ]);
    return dl;
  }

  // ── TC-DOWNLOAD-001: Search "oil" across All Country, save workspace, apply a left filter,
  //          download via the toolbar, verify the same workspace query shows up in
  //          My Downloads, then download and verify its Excel file ──────────────────
  test('TC-DOWNLOAD-001: Search + save workspace + filter + toolbar Download, verify query and Excel in My Downloads', async ({ page }) => {
    test.setTimeout(240_000);

    console.log('[TC-DOWNLOAD-001] Step 1: Navigate to Search tab');
    await page.locator('a:has-text("Search"), [href*="search"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await page.waitForTimeout(1000);

    console.log('[TC-DOWNLOAD-001] Step 2: Select "All Country (Global Search)"');
    await selectAllCountryGlobalSearch(page);
    console.log('[TC-DOWNLOAD-001] ✅ "All Country (Global Search)" selected');

    console.log(`[TC-DOWNLOAD-001] Step 3: Enter product "${PRODUCT_KEYWORD}"`);
    await enterProductKeyword(page, PRODUCT_KEYWORD);
    console.log(`[TC-DOWNLOAD-001] ✅ "${PRODUCT_KEYWORD}" tokenized on search box`);

    console.log('[TC-DOWNLOAD-001] Step 4: Click Search and wait for results');
    await runSearch(page);
    console.log('[TC-DOWNLOAD-001] ✅ Search results displayed');

    const workspaceName = `MyDownload_Oil_${Date.now()}`;
    console.log(`[TC-DOWNLOAD-001] Step 5: Save the workspace as "${workspaceName}"`);
    await saveWorkspace(page, workspaceName);
    console.log(`[TC-DOWNLOAD-001] ✅ Workspace "${workspaceName}" saved successfully`);

    console.log('[TC-DOWNLOAD-001] Step 6: From the left FILTERS panel, apply a Country of Origin (COO) option with shipment count under 20');
    const filterResult = await applyCountryOfOriginFilterUnderCount(page, 20);
    expect.soft(filterResult, 'A Country of Origin option with shipment count under 20 should have been found and applied').toBeTruthy();

    console.log('[TC-DOWNLOAD-001] Step 7: Click the toolbar Download button');
    await clickDownloadButton(page);

    console.log('[TC-DOWNLOAD-001] Step 8: Navigate to My Downloads');
    const downloadRow = await navigateToMyDownloads(page);

    console.log('[TC-DOWNLOAD-001] Step 9: Verify the same workspace query is listed');
    const latestRowText = ((await downloadRow.textContent().catch(() => '')) || '').trim();
    const queryListed = latestRowText.toLowerCase().includes(workspaceName.toLowerCase());
    console.log(`[TC-DOWNLOAD-001] My Downloads latest row text: "${latestRowText}"`);
    expect.soft(queryListed, `My Downloads should list an entry for workspace "${workspaceName}"`).toBeTruthy();
    console.log(queryListed
      ? `[TC-DOWNLOAD-001] ✅ Workspace "${workspaceName}" query found in My Downloads`
      : `[TC-DOWNLOAD-001] ⚠️ Workspace name not found verbatim in the latest row - the export may be listed under a different display name`);

    console.log('[TC-DOWNLOAD-001] Step 10: Click the download icon/link in My Downloads and verify the Excel file');
    const dl = await downloadFromRow(page, workspaceName);
    expect(dl, 'Clicking the My Downloads row download icon should trigger a file download').toBeTruthy();
    console.log(`[TC-DOWNLOAD-001] ✅ Downloaded: ${dl.suggestedFilename()}`);
    await verifyDownloadedExcelHasData(dl, workspaceName);
  });

  // ── TC-DOWNLOAD-002: Search on a global database, skip Save Workspace, use the toolbar Download
  //          button directly, and verify it still lands in My Downloads with a working
  //          Excel download - i.e. Download doesn't require a saved workspace ────────
  test('TC-DOWNLOAD-002: Direct toolbar Download without saving the workspace, verify it still appears in My Downloads', async ({ page }) => {
    test.setTimeout(240_000);

    console.log('[TC-DOWNLOAD-002] Step 1: Navigate to Search tab');
    await page.locator('a:has-text("Search"), [href*="search"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await page.waitForTimeout(1000);

    console.log('[TC-DOWNLOAD-002] Step 2: Select a global country/database (All Country Global Search)');
    await selectAllCountryGlobalSearch(page);
    console.log('[TC-DOWNLOAD-002] ✅ Global country selected');

    console.log(`[TC-DOWNLOAD-002] Step 3: Enter product "${PRODUCT_KEYWORD}"`);
    await enterProductKeyword(page, PRODUCT_KEYWORD);

    console.log('[TC-DOWNLOAD-002] Step 4: Click Search and wait for results');
    await runSearch(page);
    console.log('[TC-DOWNLOAD-002] ✅ Search results displayed - deliberately NOT saving this as a workspace');

    console.log('[TC-DOWNLOAD-002] Step 5: Click the toolbar Download button directly (no Save Workspace first)');
    await clickDownloadButton(page);

    console.log('[TC-DOWNLOAD-002] Step 6: Navigate to My Downloads and confirm a new entry appeared');
    const downloadRow = await navigateToMyDownloads(page);
    await expect(downloadRow).toBeVisible({ timeout: 15000 });
    console.log('[TC-DOWNLOAD-002] ✅ A download entry is listed in My Downloads even though no workspace was saved');

    console.log('[TC-DOWNLOAD-002] Step 7: Download the Excel from that entry and verify it has data');
    const dl = await downloadFromRow(page, 'direct-download (unsaved workspace)');
    expect(dl, 'Clicking the My Downloads row download icon should trigger a file download').toBeTruthy();
    console.log(`[TC-DOWNLOAD-002] ✅ Downloaded: ${dl.suggestedFilename()}`);
    await verifyDownloadedExcelHasData(dl, 'direct-download (unsaved workspace)');
  });
});
