const { test, expect } = require('@playwright/test');
const { handleMaxRecordsPopup } = require('../../helpers/maxRecordsPopup');
const { SearchPage } = require('../../pages/SearchPage');

// Migrated from src/pages/SearchTab_ConsigneeName.specs.js (Module 6.4 - Search Tab,
// Consignee Name). Pre-conditions: SME or Corporate plan.
//
// Flow: for each country database below, run a primary "HS 2 = <hsCode>"
// search first, read the Consignee Name of the first result row into a
// variable, then swap the primary search field over to "Consignee Name"
// using that captured value (instead of a hardcoded company name) in place
// of HS Code, and re-run the search. The whole flow repeats once per database.
//
// The "open Select Country dropdown and pick a database" logic previously
// duplicated near-verbatim here and in SearchTab_ShipperName.specs.js is now
// SearchPage.selectCountryDatabase() - both specs call the shared helper below
// instead of keeping their own copies.

// Country databases to run the full flow against, in order. "All Country
// (Global Search)" uses HS 2 = 44 instead of the default 85.
const COUNTRY_DATABASES = [
  { tcId: 'TC-SEARCH-036', label: 'India Export (Mirror)', idPrefix: 'India_Exports_', textFallbackRegex: /India.*Export/i, hsCode: '85' },
  { tcId: 'TC-SEARCH-037', label: 'All Country (Global Search)', idPrefix: 'Type_Exports_', textFallbackRegex: /All Country/i, hsCode: '44' },
  // "Bangladesh Export Detailed" is a distinct list entry from a plain "Bangladesh Export" -
  // match on its own label text rather than the shared "Bangladesh_Exports_" id prefix, which
  // could otherwise resolve to the wrong (non-detailed) entry.
  { tcId: 'TC-SEARCH-038', label: 'Bangladesh Export Detailed', idPrefix: 'Bangladesh_Exports_', textFallbackRegex: /Bangladesh.*Export.*Detailed/i, preferTextMatch: true, hsCode: '85' },
];

test.describe('Module 6.4 - Search Tab (Consignee Name)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://app.volza.com/home');
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });
  });

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
    await expect.soft(hsChip).toBeVisible({ timeout: 5_000 });
  }

  // Helper: read a grid column's first-row value by matching its header text.
  async function getFirstRowColumnValue(page, headerRegex) {
    const firstRow = page.locator('tbody tr:not(.ant-table-measure-row):has(td)').first();
    await firstRow.waitFor({ state: 'visible', timeout: 20_000 });

    const headerLocator = page.locator('thead th, [role="columnheader"]').filter({ hasText: headerRegex });
    const headerCount = await headerLocator.count();
    if (headerCount === 0) return '';

    const headerRow = headerLocator.first().locator('xpath=ancestor::tr[1]');
    const allHeaders = headerRow.locator('th, [role="columnheader"]');
    const totalHeaders = await allHeaders.count();
    for (let i = 0; i < totalHeaders; i++) {
      const text = ((await allHeaders.nth(i).textContent()) || '').trim();
      if (headerRegex.test(text)) {
        const value = ((await firstRow.locator('td').nth(i).textContent()) || '').trim();
        if (value) return value;
      }
    }
    return '';
  }

  for (const db of COUNTRY_DATABASES) {
    test(`${db.tcId}: Consignee Name search [${db.label}] - capture from HS 2 "${db.hsCode}" results and apply search`, async ({ page }) => {
      test.setTimeout(300_000);

      await page.locator('a:has-text("Search"), [href*="search"]').first().click();
      await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });

      const searchPage = new SearchPage(page);
      await searchPage.selectCountryDatabase(db);

      const periodSelect = page.locator('#periodList').first();
      await periodSelect.waitFor({ state: 'visible', timeout: 10_000 });
      const sixtyDaysOption = periodSelect.locator('option', { hasText: /last 60 days/i }).first();
      const has60DaysOption = await sixtyDaysOption.count();
      if (has60DaysOption > 0) {
        // selectOption's `label` matcher requires an exact string, not a regex - resolve
        // the option's literal text first.
        const sixtyDaysLabel = (await sixtyDaysOption.textContent()).trim();
        await periodSelect.selectOption({ label: sixtyDaysLabel });
      } else {
        // No preset "Last 60 Days" option exists - use Custom range with today - 60 days
        await periodSelect.selectOption({ value: '-1' }).catch(() => {});
        await page.waitForTimeout(500);
        const today = new Date();
        const start = new Date(today);
        start.setDate(start.getDate() - 60);
        const fmt = (d) => `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;

        const startDate = page.locator('#globalDataFromDate').first();
        const endDate = page.locator('#globalDataToDate').first();
        if (await startDate.isVisible().catch(() => false)) {
          await startDate.fill(fmt(start));
          await page.keyboard.press('Escape');
          await endDate.fill(fmt(today));
          await page.keyboard.press('Escape');
        }
      }

      await selectHsCode(page, db.hsCode);

      const searchBtn = page.locator('button.custom-search, button:has-text("Search")').last();
      await searchBtn.waitFor({ state: 'visible', timeout: 10_000 });
      await searchBtn.click();
      await page.waitForLoadState('domcontentloaded', { timeout: 20_000 }).catch(() => {});
      await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
      await handleMaxRecordsPopup(page);

      const gridRows = page.locator('tbody tr:not(.ant-table-measure-row):has(td)');
      await expect(gridRows.first()).toBeVisible({ timeout: 30_000 });

      const consigneeName = await getFirstRowColumnValue(page, /^consignee$/i);
      expect(consigneeName).toBeTruthy();

      const fieldDropdown = page.locator('select[name="field"]').first();
      await fieldDropdown.waitFor({ state: 'visible', timeout: 10_000 });
      await fieldDropdown.selectOption({ label: 'Consignee Name' });

      const consigneeInput = page.locator('input[placeholder*="Consignee" i]').first();
      await consigneeInput.waitFor({ state: 'visible', timeout: 10_000 });
      await consigneeInput.click();

      const consigneeModal = page.locator('[class*="modal"]:visible, [role="dialog"]:visible').filter({ hasText: 'Consignee' }).first();
      await expect(consigneeModal).toBeVisible({ timeout: 8_000 });

      const modalSearchInput = consigneeModal.locator('input[placeholder*="first three characters" i]').first();
      await modalSearchInput.fill(consigneeName);
      await page.waitForTimeout(2000);

      let selectAllCheckbox = consigneeModal.locator('input[type="checkbox"]').first();
      if (!(await selectAllCheckbox.isVisible().catch(() => false))) {
        // Results may need an explicit search trigger - click the search icon button inside the modal (not Close/Apply)
        const modalSearchBtn = consigneeModal.locator('button').filter({ hasNotText: /close|apply|reset/i }).first();
        if (await modalSearchBtn.isVisible().catch(() => false)) {
          await modalSearchBtn.click();
          await page.waitForTimeout(2000);
        }
      }
      selectAllCheckbox = consigneeModal.locator('input[type="checkbox"]').first();
      await selectAllCheckbox.waitFor({ state: 'visible', timeout: 8_000 });
      await selectAllCheckbox.click();

      const applyBtn = consigneeModal.locator('button:has-text("Apply")').first();
      await applyBtn.click();
      await page.waitForTimeout(1000);

      const escapedConsigneeName = consigneeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const chip = page.locator('[class*="tag"]:visible, [class*="chip"]:visible, [class*="token"]:visible').filter({ hasText: new RegExp(escapedConsigneeName, 'i') }).first();
      await expect.soft(chip).toBeVisible({ timeout: 5_000 });

      await searchBtn.click();
      // Search navigates from the query builder to a dedicated results page
      // (URL: .../workspace/search/{id}#Shipments) - wait for that navigation
      // rather than just for the click to register.
      await page.waitForURL(/workspace\/search\//, { timeout: 20_000 }).catch(() => {});
      await page.waitForLoadState('domcontentloaded', { timeout: 20_000 }).catch(() => {});
      await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
      await handleMaxRecordsPopup(page);

      const shipmentsTab = page.locator('text=Shipments').first();
      await shipmentsTab.waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {});

      await expect.soft(gridRows.first()).toBeVisible({ timeout: 30_000 });

      const resultCount = page.locator('text=/showing .* of .* items/i').first();
      await expect.soft(resultCount).toBeVisible({ timeout: 10_000 });

      await page.waitForTimeout(10_000);

      // Apply left filter - Country of Destination: United States
      // "Country of Destination" also appears as a stat card, a results tab, and grid column
      // headers - scope strictly to the FILTERS sidebar panel to avoid matching those.
      const filtersPanel = page.locator('text=FILTERS').first().locator('xpath=../..');
      const codHeaderText = filtersPanel.locator('text=Country of Destination').first();
      // The expand/collapse caret is a separate sibling element next to the label text -
      // clicking the wrapping container can miss both and hit blank space between them.
      const codCaret = codHeaderText.locator('xpath=following-sibling::*[1]');
      await codHeaderText.scrollIntoViewIfNeeded();

      let usaLabel = filtersPanel.locator('text=United States').first();
      if (!(await usaLabel.isVisible().catch(() => false))) {
        await codCaret.click();
        await page.waitForTimeout(1000);
        usaLabel = filtersPanel.locator('text=United States').first();
        if (!(await usaLabel.isVisible().catch(() => false))) {
          // Fallback: click directly on the label text in case the handler is there instead
          await codHeaderText.click();
          await page.waitForTimeout(1000);
          usaLabel = filtersPanel.locator('text=United States').first();
        }
      }
      await usaLabel.waitFor({ state: 'visible', timeout: 8_000 });
      const usaCheckbox = usaLabel.locator('xpath=ancestor::*[self::div or self::li or self::tr][1]//input[@type="checkbox"]').first();
      await usaCheckbox.waitFor({ state: 'visible', timeout: 5_000 });
      await usaCheckbox.click();

      const codApplyBtn = filtersPanel.locator('button:has-text("Apply")').first();
      await codApplyBtn.click();
      await page.waitForTimeout(1500);

      const filtersAppliedSection = page.locator('text=Filters Applied').first();
      await expect.soft(filtersAppliedSection).toBeVisible({ timeout: 8_000 });
      const codChip = page.locator('[class*="chip"]:visible, [class*="tag"]:visible, [class*="token"]:visible').filter({ hasText: /united states/i }).first();
      await expect.soft(codChip).toBeVisible({ timeout: 8_000 });

      // Click Save button - Save Workspace modal opens
      const saveBtn = page.locator('li:has-text("Save"), button:has-text("Save")').filter({ hasNotText: /workspace|query/i }).first();
      await saveBtn.click();

      const saveModal = page.locator('[class*="modal"]:visible, [role="dialog"]:visible').filter({ hasText: 'Save Workspace' }).first();
      await expect(saveModal).toBeVisible({ timeout: 8_000 });

      // Use a unique workspace name per run - reusing the same literal name across repeat
      // runs triggers a "Cannot save duplicate name" alert instead of the success dialog.
      const workspaceName = `testing7july_${Date.now()}`;
      const wsNameInput = saveModal.locator('input[placeholder*="Workspace name" i]').first();
      await wsNameInput.fill(workspaceName);

      const saveQueryBtn = saveModal.locator('button:has-text("Save Query")').first();
      await saveQueryBtn.click();

      // Saving shows either a "Your Changes saved successfully." confirmation or (if the name
      // collided) a "Cannot save duplicate name" alert - either way it blocks further clicks
      // until its button is dismissed.
      const postSaveDialog = page.locator('dialog, [role="dialog"], .swal-overlay').filter({ hasText: /saved successfully|duplicate name/i }).first();
      await postSaveDialog.waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {});
      const postSaveBtn = postSaveDialog.locator('button').first();
      if (await postSaveBtn.isVisible().catch(() => false)) {
        await postSaveBtn.click();
        await postSaveBtn.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
      }

      // Click Download icon - "Download" popup opens
      const downloadTriggerBtn = page.locator('li:has-text("Download"), button:has-text("Download")').first();
      await downloadTriggerBtn.click();

      // A "Download" radio-choice dialog (how to download relative to the saved workspace) may
      // appear first - its default selection is fine, just confirm with "Proceed".
      const proceedBtn = page.locator('button:has-text("Proceed")').first();
      if (await proceedBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await proceedBtn.click();
        await page.waitForTimeout(1000);
      }

      const downloadModal = page.locator('[class*="modal"]:visible, [role="dialog"]:visible').filter({ hasText: 'Download' }).first();
      await expect(downloadModal).toBeVisible({ timeout: 8_000 });

      // The checklist tree (with "Select All") loads asynchronously after the modal itself
      // appears - give it a generous window rather than assuming it's ready immediately.
      const selectAllLabel = downloadModal.locator('text=Select All').first();
      await selectAllLabel.waitFor({ state: 'visible', timeout: 20_000 });
      // Climb to the nearest ancestor that actually contains a checkbox descendant, rather than
      // assuming a fixed tag/depth - the modal's checklist tree renders slightly after the label.
      const selectAllCb = selectAllLabel.locator('xpath=ancestor::*[.//input[@type="checkbox"]][1]//input[@type="checkbox"]').first();
      await selectAllCb.waitFor({ state: 'visible', timeout: 10_000 });
      await selectAllCb.click();

      // The modal's Download confirm button is icon-only (no accessible text) - it's the
      // button immediately after "Cancel" in the modal footer.
      const cancelBtn = downloadModal.locator('button:has-text("Cancel")').first();
      let downloadConfirmBtn = cancelBtn.locator('xpath=following-sibling::button[1]');
      if (!(await downloadConfirmBtn.isVisible().catch(() => false))) {
        downloadConfirmBtn = downloadModal.locator('button').last();
      }
      await downloadConfirmBtn.click();

      const successMsg = page.locator('text=/download will complete shortly/i').first();
      await expect.soft(successMsg).toBeVisible({ timeout: 10_000 });

      await page.waitForTimeout(10_000);
    });
  }
});
