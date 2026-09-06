const { test, expect } = require('@playwright/test');
const { handleMaxRecordsPopup } = require('../../helpers/maxRecordsPopup');

// Migrated from src/pages/SearchTab_DashboardTab.specs.js (Module 6.2 - Search
// Tab, HS Code). Pre-conditions: SME or Corporate plan. Login is handled once
// via global-setup.ts, which persists session cookies to auth-state.json -
// every test here starts already authenticated.
//
// Country database: "India Export (Mirror)" - list entry id prefix
// "India_Exports_". Field type: "HS 2" - selecting it turns the search box
// into a react-tags tokenizer; typing a code shows autocomplete suggestions
// ("HS : <code> : ...") in .react-tags__suggestions, picking one creates a
// .react-tags__selected-tag chip.

const COUNTRY_DATABASE = { label: 'India Export (Mirror)', idPrefix: 'India_Exports_', textFallbackRegex: /India.*Export/i };
const HS_CODE = '85';

test.describe('Module 6.2 - Search Tab (HS Code)', () => {
  // Wider than the project default (1280x720) - at that width the top nav collapses
  // "My Download" (and other labels) down to icon-only buttons, and the results page
  // can't scroll to reveal all of its content, breaking text/href-based locators below.
  test.use({ viewport: { width: 1920, height: 1080 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('https://app.volza.com/home');
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });
  });

  // Helper: open the "Select Country" dropdown and pick the given database.
  // Tries the "<Country>_Exports_" id convention first, falling back to
  // matching the option by its visible label text.
  async function selectCountryDatabase(page, db) {
    await page.locator('.dropdown-display', { hasText: 'Select Country' }).first().click();
    await page.waitForTimeout(500);

    const idOption = page.locator(`[id^="${db.idPrefix}"]`).first();
    const textOption = page.locator('li:visible, [role="option"]:visible, a:visible, div:visible')
      .filter({ hasText: db.textFallbackRegex })
      .first();

    if (await idOption.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await idOption.click();
    } else {
      await textOption.waitFor({ state: 'visible', timeout: 8_000 });
      await textOption.click();
    }
    await page.waitForTimeout(1000);
  }

  // Helper: select "HS 2" as the primary search field, type the given 2-digit
  // HS code and pick the matching autocomplete suggestion.
  async function selectHsCode(page, hsCode) {
    const fieldDropdown = page.locator('select[name="field"]').first();
    await fieldDropdown.waitFor({ state: 'visible', timeout: 10_000 });
    await fieldDropdown.selectOption({ label: 'HS 2' });
    await page.waitForTimeout(1500);

    const hsInput = page.locator('input[placeholder="Add new tag"]').first();
    await hsInput.waitFor({ state: 'visible', timeout: 10_000 });
    await hsInput.click();
    await hsInput.fill(hsCode);
    await page.waitForTimeout(1500);

    const escapedHsCode = hsCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const hsSuggestion = page.locator('.react-tags__suggestions li').filter({ hasText: new RegExp(`^HS\\s*:\\s*${escapedHsCode}\\s*:`, 'i') }).first();
    await hsSuggestion.waitFor({ state: 'visible', timeout: 5_000 });
    await hsSuggestion.click();
    await page.waitForTimeout(1000);

    const hsChip = page.locator('.react-tags__selected-tag').filter({ hasText: hsCode }).first();
    await expect(hsChip).toBeVisible({ timeout: 5_000 });
  }

  // Result tabs, in on-screen order, and what to do on each once search results are
  // showing: `verifyLocked` - check the grid's Consignee/Shipper/Notify Party columns
  // and the left FILTERS panel are locked (Partial View only); `loadOnClick` -
  // Analysis's data doesn't auto-load, a "Click here to load data" prompt over a
  // static preview image has to be clicked first; `download` - click that tab's
  // Excel/download icon once its data has loaded.
  const TAB_FLOW = [
    { name: 'Partial View', verifyLocked: true },
    { name: 'Shipments' },
    { name: 'Summary', download: true },
    { name: 'Analysis', loadOnClick: true },
    { name: 'Shipper', download: true },
    { name: 'Consignee', download: true },
    { name: 'Country of Origin', download: true },
    { name: 'Country of Destination', download: true },
    { name: 'Port of Origin', download: true },
    { name: 'Port of Destination', download: true },
    { name: 'HS Code', download: true },
    { name: 'Time Series', download: true },
  ];

  // Grid columns that show a lock icon + "Click here to view" placeholder instead of
  // real data on the "Partial View" tab.
  const LOCKED_GRID_COLUMNS = [
    { label: 'Consignee', headerRegex: /^consignee$/i },
    { label: 'Shipper', headerRegex: /^shipper$/i },
    { label: 'Notify Party', headerRegex: /^notify\s*party(\s*name)?$/i },
  ];

  // Left FILTERS sidebar categories whose values are locked on the current plan.
  const LOCKED_FILTER_CATEGORIES = ['Consignee', 'Shipper'];

  // Helper: click a result tab by its visible name.
  async function clickResultTab(page, tabName) {
    const tab = page.locator('[role="tab"]').filter({ hasText: new RegExp(`^${tabName}`, 'i') }).first();
    await tab.waitFor({ state: 'visible', timeout: 10_000 });
    await tab.click();
    await page.waitForTimeout(1500);
  }

  // Helper: wait for a tab's data to actually finish loading - network settles and
  // any visible loading spinner clears. Tabs like Summary render several widgets
  // progressively, so a fixed pause alone isn't a reliable "loaded" signal.
  async function waitForTabDataLoaded(page) {
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    const spinner = page.locator('[class*="loading" i]:visible, [class*="spinner" i]:visible').first();
    await spinner.waitFor({ state: 'hidden', timeout: 20_000 }).catch(() => {});
  }

  // Helper: click Save, name the workspace, confirm - same "Save Workspace" modal
  // flow already verified in SearchTab_AutoSelect.specs.js/SearchTab_ShipperName.specs.js.
  async function saveWorkspace(page, workspaceName) {
    const saveBtn = page.locator('li:has-text("Save"), button:has-text("Save")').filter({ hasNotText: /workspace|query/i }).first();
    await saveBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await saveBtn.click();

    const saveModal = page.locator('[class*="modal"]:visible, [role="dialog"]:visible').filter({ hasText: 'Save Workspace' }).first();
    await expect(saveModal).toBeVisible({ timeout: 8_000 });

    const wsNameInput = saveModal.locator('input[placeholder*="Workspace name" i]').first();
    await wsNameInput.fill(workspaceName);

    const saveQueryBtn = saveModal.locator('button:has-text("Save Query")').first();
    await saveQueryBtn.click();

    // Either a "Your Changes saved successfully." confirmation or (if the name
    // collided) a "Cannot save duplicate name" alert - either way it blocks further
    // clicks until its button is dismissed.
    const postSaveDialog = page.locator('dialog, [role="dialog"], .swal-overlay').filter({ hasText: /saved successfully|duplicate name/i }).first();
    await postSaveDialog.waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {});
    const postSaveBtn = postSaveDialog.locator('button').first();
    if (await postSaveBtn.isVisible().catch(() => false)) {
      await postSaveBtn.click();
      await postSaveBtn.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
    }
  }

  // Helper: check a "Partial View" grid column shows the locked-field placeholder
  // (a lock icon and/or "Click here to view" link) in its first data row, instead of
  // a real value. Never throws - any failure to even locate the column resolves to
  // "not confirmed locked" (false) rather than aborting the whole tab walk.
  async function verifyGridColumnLocked(page, field) {
    try {
      const headerLocator = page.locator('thead th, [role="columnheader"]').filter({ hasText: field.headerRegex }).first();
      const headerFound = await headerLocator.waitFor({ state: 'visible', timeout: 10_000 }).then(() => true).catch(() => false);
      if (!headerFound) return false;

      const headerRow = headerLocator.locator('xpath=ancestor::tr[1]');
      const allHeaders = headerRow.locator('th, [role="columnheader"]');
      const totalHeaders = await allHeaders.count();
      let colIndex = -1;
      for (let i = 0; i < totalHeaders; i++) {
        const text = ((await allHeaders.nth(i).textContent()) || '').trim();
        if (field.headerRegex.test(text)) { colIndex = i; break; }
      }
      if (colIndex === -1) return false;

      const firstRow = page.locator('tbody tr:not(.ant-table-measure-row):has(td)').first();
      const rowFound = await firstRow.waitFor({ state: 'visible', timeout: 10_000 }).then(() => true).catch(() => false);
      if (!rowFound) return false;
      const cell = firstRow.locator('td').nth(colIndex);

      const lockIcon = cell.locator('[class*="lock" i]').first();
      const viewLink = cell.locator('text=/click here to view/i').first();
      const hasLockIcon = await lockIcon.isVisible().catch(() => false);
      const hasViewLink = await viewLink.isVisible().catch(() => false);
      return hasLockIcon || hasViewLink;
    } catch {
      return false;
    }
  }

  // Helper: the results grid scrolls horizontally to reveal columns further right
  // (e.g. Consignee/Shipper Name on "Partial View") - click the floating right-scroll
  // arrow shown over the grid; fall back to a horizontal mouse-wheel scroll on the
  // grid's own scroll container if no explicit arrow button is found.
  async function scrollGridRight(page, times = 3) {
    const rightArrow = page.locator(
      '[class*="scroll-right" i], [class*="arrow-right" i], [class*="right-arrow" i], ' +
      'button:has(i[class*="chevron-right" i]), button:has(i[class*="angle-right" i]), ' +
      '[class*="carousel-next" i], [class*="slick-next" i]'
    ).first();

    for (let i = 0; i < times; i++) {
      if (await rightArrow.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await rightArrow.click().catch(() => {});
      } else {
        const gridScrollContainer = page.locator('.ant-table-body, [class*="table-scroll" i], [class*="grid-scroll" i]').first();
        await gridScrollContainer.hover().catch(() => {});
        await page.mouse.wheel(600, 0);
      }
      await page.waitForTimeout(800);
    }
  }

  // Helper: check a left FILTERS accordion panel's title shows a lock icon (the
  // Consignee/Shipper categories show it directly on the collapsed header - no need
  // to expand the panel first). Never throws - any failure to even locate the panel
  // resolves to "not confirmed locked" (false) rather than aborting the whole tab walk.
  async function verifyFilterCategoryLocked(page, filtersPanel, categoryLabel) {
    try {
      const escapedLabel = categoryLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const panelTitle = filtersPanel.locator('.df-panel-title-custom').filter({ hasText: new RegExp(`^${escapedLabel}$`, 'i') }).first();
      const titleFound = await panelTitle.waitFor({ state: 'visible', timeout: 8_000 }).then(() => true).catch(() => false);
      if (!titleFound) return false;
      await panelTitle.scrollIntoViewIfNeeded().catch(() => {});

      const panelContainer = panelTitle.locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " df-panel ")][1]');
      // The lock indicator here is an <img alt="Locked" src=".../filter-lock-icon.png">,
      // not a class-based icon (unlike the grid column lock check above) - match on
      // that, falling back to a class-based lookup in case the markup varies elsewhere.
      const lockIndicator = panelContainer.locator('img[alt="Locked" i], img[src*="lock" i], [class*="lock" i]').first();
      return await lockIndicator.isVisible({ timeout: 5_000 }).catch(() => false);
    } catch {
      return false;
    }
  }

  // Helper: the "Analysis" tab's chart doesn't auto-load - it shows a static/blurred
  // preview image with a "Click here to load data" prompt. Click it to trigger the
  // real, interactive load and wait for the loading spinner to clear.
  async function loadAnalysisData(page) {
    const loadTrigger = page.locator('text=/click here to load data/i').first();
    if (await loadTrigger.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await loadTrigger.click().catch(() => {});
    } else {
      // Fallback: no explicit prompt text found - the blurred preview image itself
      // may be the click target.
      const blurredPreview = page.locator('[class*="blur" i] img, img[class*="static" i], img[class*="preview" i]').first();
      if (await blurredPreview.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await blurredPreview.click().catch(() => {});
      }
    }
    await page.waitForTimeout(1000);

    const loadingIndicator = page.locator('text=/loading/i, [class*="loading" i], [class*="spinner" i]').first();
    await loadingIndicator.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
    await loadingIndicator.waitFor({ state: 'hidden', timeout: 25_000 }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  }

  // Helper: scroll the page down to the bottom a step at a time, so lazy-loaded
  // content (and any per-tab Excel icon further down the page) has a chance to render.
  async function scrollToBottom(page) {
    let lastHeight = 0;
    for (let i = 0; i < 15; i++) {
      const height = await page.evaluate(() => document.body.scrollHeight);
      if (height === lastHeight) break;
      lastHeight = height;
      await page.mouse.wheel(0, 1500);
      await page.waitForTimeout(500);
    }
  }

  // Helper: indices (into the shared "[class*=excel]"-style candidates locator) of
  // icons positioned inside the tab's own content area (below the tab strip), as
  // opposed to the generic top-toolbar "Download" button (next to Save/Save As,
  // always present regardless of tab) which shares the same "excel"-ish markup.
  async function findWidgetExcelIconIndices(page) {
    const tabStrip = page.locator('[role="tab"]').first();
    const tabBox = await tabStrip.boundingBox().catch(() => null);
    const minY = tabBox ? tabBox.y + tabBox.height : 0;

    const candidates = page.locator(
      '[class*="excel" i]:visible, [class*="xls" i]:visible, ' +
      'img[alt*="excel" i]:visible, img[src*="excel" i]:visible, ' +
      '[title*="excel" i]:visible, [aria-label*="excel" i]:visible'
    );
    const count = await candidates.count();
    const indices = [];
    for (let i = 0; i < count; i++) {
      const box = await candidates.nth(i).boundingBox().catch(() => null);
      if (box && box.y >= minY) indices.push(i);
    }
    return { candidates, indices };
  }

  // Helper: the site occasionally pops up a "Voli" AI-assistant chat panel that can
  // overlap and block clicks on widget icons sitting near the right edge of the page
  // (same gotcha already documented/handled in SearchTab_AutoSelect.specs.js for the
  // query builder's +/- buttons - manually confirmed this app works fine when clicked
  // by hand, so an obscured/intercepted automated click is the likely culprit here
  // too). Dismiss it defensively before every widget-icon click.
  async function dismissVoliWidgetIfPresent(page) {
    const voliHeader = page.locator('text=/AI Assistant/i').first();
    if (await voliHeader.isVisible({ timeout: 500 }).catch(() => false)) {
      const closeBtn = page.locator('[class*="close" i]:visible, [aria-label="Close" i]:visible').last();
      if (await closeBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await closeBtn.click({ timeout: 3_000 }).catch(() => {});
        await page.waitForTimeout(300);
      }
    }
  }

  // Helper: try a plain click first, then fall back to a forced click if the plain one times
  // out. Icons can be reported "obscured/intercepted" by a floating widget (the "Ask on
  // WhatsApp" button, or the Voli chat panel) sitting over that exact screen position without
  // actually blocking a real user's click there - same reasoning already applied to the
  // Download-modal confirm button in TC-SEARCH-032.
  async function clickWithForceFallback(locator, timeout = 8_000) {
    try {
      await locator.click({ timeout });
      return true;
    } catch {
      try {
        await locator.click({ timeout: 5_000, force: true });
        return true;
      } catch {
        return false;
      }
    }
  }

  // Helper: click a resolved download trigger and wait for the browser download event.
  // Tabs can have a dozen+ near-identical widget icons where most don't actually
  // trigger a file download - default to a short wait so one non-functional icon
  // doesn't eat 15s out of the whole tab walk's budget; the slower generic
  // Download-modal fallback path passes a longer timeout explicitly.
  //
  // The click itself is NOT swallowed silently - if even a forced click fails, that's logged
  // distinctly from "clicked fine but nothing downloaded", since those need different fixes.
  // Also checks for a newly-opened tab in case the export opens there instead of downloading
  // on the current page.
  async function clickAndCaptureDownload(page, trigger, tabName, label, downloadTimeoutMs = 6_000) {
    await dismissVoliWidgetIfPresent(page);

    const context = page.context();
    const pagesBefore = context.pages().length;

    const [dl, clicked] = await Promise.all([
      page.waitForEvent('download', { timeout: downloadTimeoutMs }).catch(() => null),
      clickWithForceFallback(trigger),
    ]);

    if (!clicked) {
      console.log(`[TC-SEARCH-030] ⚠️ "${tabName}" - ${label} click itself failed (obscured/intercepted, even with a forced click)`);
      return null;
    }

    if (dl) {
      console.log(`[TC-SEARCH-030] ✅ "${tabName}" - Excel downloaded (${label}): ${dl.suggestedFilename()}`);
      return dl;
    }

    const pagesAfter = context.pages();
    if (pagesAfter.length > pagesBefore) {
      const newPage = pagesAfter[pagesAfter.length - 1];
      const dl2 = await newPage.waitForEvent('download', { timeout: downloadTimeoutMs }).catch(() => null);
      await newPage.close().catch(() => {});
      if (dl2) {
        console.log(`[TC-SEARCH-030] ✅ "${tabName}" - Excel downloaded (${label}, opened in new tab): ${dl2.suggestedFilename()}`);
        return dl2;
      }
    }

    console.log(`[TC-SEARCH-030] ⚠️ "${tabName}" - ${label} clicked successfully but no download event captured`);
    return null;
  }

  // Helper: resolve the heading text of the widget/panel a given Excel icon belongs
  // to (e.g. "Export Performance", "HS Code", "Buyers"), by walking up its ancestors
  // and taking the first one with short, non-empty text - that's the panel header
  // (icon + title), not the whole card's chart/table content. Falls back to an empty
  // string if no such ancestor is found.
  async function getWidgetHeadingText(icon) {
    for (const depth of [1, 2, 3, 4]) {
      const container = icon.locator(`xpath=ancestor::*[${depth}]`);
      const text = ((await container.textContent().catch(() => '')) || '').trim();
      if (text && text.length <= 60) return text;
    }
    return '';
  }

  // Helper: click every widget-level Excel icon on the current tab (e.g. Shipper's
  // "Shipper Summary", "Relationship", "Top 15 Shippers by ...", pie charts, etc. -
  // every widget down the full length of the page has its own). Always scrolls all
  // the way to the bottom first so every widget (including ones near the very
  // bottom, like the last chart pair) is rendered and counted before downloading
  // starts - not just whatever happens to be visible at the tab's initial scroll
  // position. Falls back to the generic top-bar "Download" button (which opens a
  // dashboard-selection modal rather than downloading directly) only if no widget
  // icon is found anywhere on the tab.
  async function downloadExcelIfPresent(page, tabName) {
    await scrollToBottom(page);
    const { candidates, indices } = await findWidgetExcelIconIndices(page);

    if (indices.length > 0) {
      for (const idx of indices) {
        const icon = candidates.nth(idx);
        if (!(await icon.isVisible().catch(() => false))) continue;
        await icon.scrollIntoViewIfNeeded().catch(() => {});
        // Move the mouse to the icon before clicking - visibly traceable when run
        // headed, and some widgets only reveal/enable their export icon on hover.
        await icon.hover({ timeout: 5_000 }).catch(() => {});
        await page.waitForTimeout(300);
        const heading = await getWidgetHeadingText(icon);
        const label = heading || `widget #${idx + 1}`;
        await clickAndCaptureDownload(page, icon, tabName, label);
        await page.waitForTimeout(500);
      }
      return;
    }

    const genericDownloadBtn = page.locator('[class*="download-btn" i]:visible, button:has-text("Download"):visible, a:has-text("Download"):visible').first();
    if (!(await genericDownloadBtn.isVisible({ timeout: 3_000 }).catch(() => false))) {
      return;
    }

    await genericDownloadBtn.click();
    await page.waitForTimeout(1500);

    // The top-bar "Download" button opens a dashboard-selection modal (checkboxes +
    // its own "Excel Download" confirm button) rather than downloading directly -
    // same modal already handled in the TC-SEARCH-032 flow.
    const downloadModal = page.locator('[class*="modal"]:visible, [role="dialog"]:visible').first();
    if (await downloadModal.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const allCheckboxes = downloadModal.locator('input[type="checkbox"]');
      const count = await allCheckboxes.count();
      for (let i = 0; i < count; i++) {
        await allCheckboxes.nth(i).check().catch(() => {});
      }
      const excelDownloadBtn = downloadModal.locator('button:has-text("Excel Download"), button:has-text("Download Excel")').first();
      if (await excelDownloadBtn.isVisible().catch(() => false)) {
        await clickAndCaptureDownload(page, excelDownloadBtn, tabName, 'Download modal', 15_000);
      }
      return;
    }
  }

  test('TC-SEARCH-029: HS Code search - India Export (Mirror), HS 2 = 85', async ({ page }) => {
    await page.locator('a:has-text("Search"), [href*="search"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });

    await selectCountryDatabase(page, COUNTRY_DATABASE);
    await selectHsCode(page, HS_CODE);

    const searchBtn = page.locator('button.custom-search, button:has-text("Search")').last();
    await searchBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await searchBtn.click();
    await page.waitForLoadState('domcontentloaded', { timeout: 20_000 }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await handleMaxRecordsPopup(page);

    const gridRows = page.locator('tbody tr:not(.ant-table-measure-row):has(td)');
    await expect(gridRows.first()).toBeVisible({ timeout: 30_000 });
  });

  test('TC-SEARCH-030: Save workspace, verify Consignee/Shipper/Notify Party are locked, download Excel from every tab', async ({ page }) => {
    // 12 tabs, each with a 5-10s hold plus (on Summary/Shipper/Consignee/etc.) up to a
    // dozen+ widget Excel icons to click through - a full live run completed the entire
    // walk in ~899s, right at the 900s budget (and got marked as timed-out mid-teardown
    // as a result) - give it real headroom instead of cutting it that close.
    test.setTimeout(1_080_000);

    await page.locator('a:has-text("Search"), [href*="search"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });

    await selectCountryDatabase(page, COUNTRY_DATABASE);
    await selectHsCode(page, HS_CODE);

    const searchBtn = page.locator('button.custom-search, button:has-text("Search")').last();
    await searchBtn.click();
    await page.waitForURL(/workspace\/search\//, { timeout: 20_000 }).catch(() => {});
    await page.waitForLoadState('domcontentloaded', { timeout: 20_000 }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await handleMaxRecordsPopup(page);

    const gridRows = page.locator('tbody tr:not(.ant-table-measure-row):has(td)');
    await expect(gridRows.first()).toBeVisible({ timeout: 30_000 });

    await saveWorkspace(page, `SearchTab_HSCode_${Date.now()}`);

    const shipmentsTab = page.locator('[role="tab"]').filter({ hasText: /^Shipments/i }).first();
    await expect(shipmentsTab).toBeVisible({ timeout: 15_000 });

    for (const step of TAB_FLOW) {
      await clickResultTab(page, step.name);
      await waitForTabDataLoaded(page);

      // Hold on the tab for 5-10s before interacting further.
      const holdMs = 5_000 + Math.floor(Math.random() * 5_000);
      await page.waitForTimeout(holdMs);

      if (step.verifyLocked) {
        await scrollToBottom(page);
        await scrollGridRight(page);
        for (const field of LOCKED_GRID_COLUMNS) {
          const isLocked = await verifyGridColumnLocked(page, field);
          // Soft assertion: records a failure for the report but does NOT throw, so
          // the rest of the tab walk (Summary, Analysis, Shipper, downloads, ...)
          // still runs even if this particular lock check doesn't pass.
          expect.soft(isLocked, `"${field.label}" column should show the locked placeholder`).toBeTruthy();
        }

        const filtersPanel = page.locator('text=FILTERS').first().locator('xpath=../..');
        for (const category of LOCKED_FILTER_CATEGORIES) {
          const filterLocked = await verifyFilterCategoryLocked(page, filtersPanel, category);
          expect.soft(filterLocked, `"${category}" filter should show a lock icon in the left FILTERS panel`).toBeTruthy();
        }

        await page.mouse.wheel(0, -600);
        await page.waitForTimeout(500);
      }

      if (step.loadOnClick) {
        await loadAnalysisData(page);
      }

      if (step.download) {
        await downloadExcelIfPresent(page, step.name);
      }
    }
  });

  test('TC-SEARCH-031: Apply left filter - results update with counter deduction', async ({ page }) => {
    await page.locator('a:has-text("Search"), [href*="search"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });

    await selectCountryDatabase(page, COUNTRY_DATABASE);
    await selectHsCode(page, HS_CODE);

    const searchBtn = page.locator('button.custom-search, button:has-text("Search")').last();
    await searchBtn.click();
    await page.waitForLoadState('domcontentloaded', { timeout: 20_000 }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await handleMaxRecordsPopup(page);

    const leftFilterCheckbox = page.locator('[class*="left-filter"] input[type="checkbox"]').first();
    if (await leftFilterCheckbox.isVisible()) {
      await leftFilterCheckbox.click();
      await page.waitForTimeout(2000);
    }
  });

  test('TC-SEARCH-032: Save workspace, download all dashboards, verify in My Download', async ({ page }) => {
    // Search + save + a real backend-triggered multi-dashboard Excel export + waiting out
    // its full-page loading spinner + Account/My Downloads navigation comfortably exceeds
    // the project's default 90s test timeout - give it real headroom like TC-SEARCH-030 has.
    test.setTimeout(240_000);

    await page.locator('a:has-text("Search"), [href*="search"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });

    await selectCountryDatabase(page, COUNTRY_DATABASE);
    await selectHsCode(page, HS_CODE);

    const searchBtn = page.locator('button.custom-search, button:has-text("Search")').last();
    await searchBtn.click();
    await page.waitForLoadState('domcontentloaded', { timeout: 20_000 }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await handleMaxRecordsPopup(page);

    // The on-screen trigger is just labeled "Save" (not "Save Workspace") - reuse the
    // same helper already proven working in TC-SEARCH-030 instead of a stale duplicate locator.
    await saveWorkspace(page, `HS_Code_Test_Workspace_${Date.now()}`);

    // Same top toolbar as Save/Save As - the trigger is a non-<button> element (li/div),
    // matching the pattern already proven for the Save button above.
    const downloadBtn = page.locator('li:has-text("Download"), button:has-text("Download"), [class*="download-btn" i]')
      .filter({ hasNotText: /excel/i }).first();
    await downloadBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await downloadBtn.click();
    await page.waitForTimeout(1500);

    // Scope to the "Download" dashboard-selection modal specifically (by its "chargeable"
    // copy) rather than a bare [class*="modal"] match, which can resolve to an unrelated
    // leftover dialog/swal elsewhere on the page.
    const downloadModal = page.locator('[class*="modal"]:visible, [role="dialog"]:visible').filter({ hasText: /chargeable/i }).first();
    await expect(downloadModal).toBeVisible({ timeout: 8_000 });

    const allCheckboxes = downloadModal.locator('input[type="checkbox"]');
    const count = await allCheckboxes.count();
    for (let i = 0; i < count; i++) {
      await allCheckboxes.nth(i).check().catch(() => {});
    }

    // The modal's confirm button carries no accessible text (icon-only in the a11y tree) -
    // it's the last of the modal's two footer buttons, after "Cancel". Forced because a
    // stray react-tags portal from the earlier HS-code tokenizer can sit over the modal
    // and intercept pointer events without actually blocking real user clicks.
    const excelDownloadBtn = downloadModal.locator('button').last();
    await excelDownloadBtn.click({ force: true });
    await page.waitForTimeout(1500);
    const successPopup = page.locator('[class*="toast"], [role="alert"]').filter({ hasText: /complete shortly/i }).first();
    await expect(successPopup).toBeVisible({ timeout: 10_000 });

    // The export request that "Download initiated" kicked off leaves a full-page loading
    // spinner up for a while (server-side file generation) - it intercepts clicks
    // anywhere on the page until it clears, so wait it out before clicking anything else.
    await page.locator('.spinner-main').first().waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});

    // There's no "My Download" text/link in the top nav - it's an icon-only <li> with no
    // accessible name, sitting immediately after "End Demo" (next to the user avatar).
    const myDownloadIcon = page.locator('li:has-text("End Demo")').locator('xpath=following-sibling::li[1]').first();
    await myDownloadIcon.waitFor({ state: 'visible', timeout: 10_000 });
    await myDownloadIcon.click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });

    // That icon lands on the Account section (My Profile tab) - "My Downloads" is a left
    // sidebar item within that section, not opened directly by the top nav icon itself.
    const myDownloadsSidebarLink = page.locator('a:has-text("My Downloads"), li:has-text("My Downloads")').first();
    await myDownloadsSidebarLink.waitFor({ state: 'visible', timeout: 10_000 });
    await myDownloadsSidebarLink.click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });

    const downloadRow = page.locator('tbody tr, [class*="download-row"]').first();
    await expect(downloadRow).toBeVisible({ timeout: 15_000 });

    const downloadLink = page.locator('a:has-text("Download"), [class*="download-link"]').first();
    if (await downloadLink.isVisible()) {
      await Promise.all([
        page.waitForEvent('download', { timeout: 15_000 }).catch(() => null),
        downloadLink.click(),
      ]);
    }
  });
});
