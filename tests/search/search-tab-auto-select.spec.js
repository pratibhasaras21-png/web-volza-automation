const { test, expect } = require('@playwright/test');
const { handleMaxRecordsPopup } = require('../../helpers/maxRecordsPopup');

// Migrated from src/pages/SearchTab_AutoSelect.specs.js. No module number in the
// source; kept as-is. Pre-conditions: SME or Corporate plan; user is already
// authenticated via global setup (auth-state.json).
//
// HS 2 "85" search -> read every available field from the first result row ->
// add each as a second-level query row (same combined query) -> Search again.
//
// Second-level fields are driven by the "Search Field" dropdown shown in the query
// builder (Product, HS 2, HS 4/6/8, Consignee Name, Shipper Name, Company Name,
// Country of Destination/Origin, Source Country, Port of Destination/Origin,
// Continent of Destination/Origin, Qty, CAS Number, Value (USD)). "Product"/"HS
// 2"/"HS 4,6 Or 8" are skipped since HS 2 is already the primary field. Of the
// rest, only fields with a matching column in the default results grid are
// populated - Company Name, Continent of Destination/Origin and CAS Number have
// no default grid column to read a value from, so they're skipped rather than
// guessed.

// Field configs: type 'company' - value input opens the company-picker popup
// (Consignee/Shipper/Company); type 'tag' - value input is a react-tags "Add new
// tag" typeahead; type 'numeric' - value input is a plain number box, paired with
// an Operator select. "Source Country" is excluded from grid-driven capture here: its
// grid values are internal data-source/mirror labels (e.g. "USA T3  Import") rather than
// geographic country names, so the field's own autocomplete typeahead never has a matching
// suggestion for a value read off the grid - it's instead added with a fixed value below
// (see SOURCE_COUNTRY_FIELD), the same way every other 'tag' field is applied.
const SECOND_LEVEL_FIELDS = [
  { label: 'Shipper Name', type: 'company', modalTitle: 'Shipper', headerRegex: /^shipper$/i },
  { label: 'Consignee Name', type: 'company', modalTitle: 'Consignee', headerRegex: /^consignee$/i },
  { label: 'Country of Destination', type: 'tag', headerRegex: /^country of destination$/i },
  { label: 'Country of Origin', type: 'tag', headerRegex: /^country of origin$/i },
  { label: 'Port of Origin', type: 'tag', headerRegex: /^port of origin$/i },
  { label: 'Port of Destination', type: 'tag', headerRegex: /^port of destination$/i },
  // Exact match only - the grid has two similar columns ("Std. Quantity" and "Quantity");
  // the query builder's "Qty" field corresponds to the plain "Quantity" column specifically,
  // so a broader regex that also matched "Std. Quantity" could read the wrong value.
  { label: 'Qty', type: 'numeric', headerRegex: /^quantity$/i },
  { label: 'Value (USD)', type: 'numeric', headerRegex: /^value\s*\$/i },
];

// Source Country is applied with this fixed value (its own autocomplete typeahead uses plain
// geographic country names, e.g. "United States") rather than a value captured off the grid -
// same reasoning as SECOND_LEVEL_FIELDS' comment above. Added via the same "+" plus-icon /
// addFieldAndSearch flow as every other field, so it's just as likely to be reverted if it
// happens to empty the combined query's results.
const SOURCE_COUNTRY_FIELD = { label: 'Source Country', type: 'tag', value: 'United States' };

test.describe('Search Tab - Auto Select (HS 2 "85" + all readable second-level fields)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://app.volza.com/home');
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });
  });

  // Helper: the site occasionally pops up a "Voli" AI-assistant chat panel that can overlap
  // and block clicks on the query builder's +/- buttons, causing them to hang indefinitely
  // (no actionTimeout is configured, so a blocked click waits until the whole test times
  // out). Dismiss it defensively wherever it might have appeared.
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
  // out. Floating widgets (the Voli chat panel, the "Ask on WhatsApp" bubble, a support-chat
  // iframe) can sit over a query-builder +/- icon's exact screen position and get reported as
  // "intercepts pointer events" without actually blocking what a real user would experience as
  // a normal click there - same reasoning already applied to icon clicks in the HS-Code
  // dashboard spec. Prevents one stray overlay from hanging the whole run on an 8s/browser
  // "waiting for element to be visible, enabled and stable" retry loop.
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

  // Helper: the app's own "Your search criteria is empty. Please enter a search criteria to
  // execute the search." SweetAlert blocks every other click on the page until its "Ok" button
  // is dismissed - a leftover query row with a field selected but no value (e.g. a company
  // picker bail-out whose own minus-button click got silently swallowed) is enough to trigger
  // it. Callers that detect this alert must dismiss it before attempting any recovery click
  // (removing a row, re-searching), otherwise every subsequent action hangs behind the still-
  // open overlay. Defensive/idempotent - a no-op when the alert isn't showing.
  async function dismissCriteriaAlertIfPresent(page) {
    const criteriaAlert = page.locator('text=/search criteria is empty/i').first();
    if (await criteriaAlert.isVisible({ timeout: 500 }).catch(() => false)) {
      const okBtn = page.locator('.swal-overlay:visible button, [role="dialog"]:visible button')
        .filter({ hasText: /^ok$/i }).first();
      if (await okBtn.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await clickWithForceFallback(okBtn, 3_000);
      } else {
        await page.keyboard.press('Escape').catch(() => {});
      }
      await page.waitForTimeout(300);
    }
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

  // Helper: select the "HS 2" field (2-digit HS chapter code) from the primary field
  // dropdown, type "85" into the tag input and pick the matching autocomplete suggestion.
  // The field dropdown has no "HS Code" option - "HS 2" is the 2-digit chapter-code field,
  // and its value entry is a react-tags input ("Add new tag"), not an "HS Locator" popup.
  async function selectHsCode85(page) {
    const fieldDropdown = page.locator('select[name="field"]').first();
    await fieldDropdown.waitFor({ state: 'visible', timeout: 10_000 });
    await fieldDropdown.selectOption({ label: 'HS 2' });
    await page.waitForTimeout(1500);

    const hsInput = page.locator('input[placeholder="Add new tag"]').first();
    await hsInput.waitFor({ state: 'visible', timeout: 10_000 });
    await hsInput.click();
    await hsInput.fill('85');
    await page.waitForTimeout(1500);

    const hsSuggestion = page.locator('.react-tags__suggestions li').filter({ hasText: /^HS\s*:\s*85\s*:/i }).first();
    await hsSuggestion.waitFor({ state: 'visible', timeout: 5_000 });
    await hsSuggestion.click();
    await page.waitForTimeout(1000);

    const hsChip = page.locator('.react-tags__selected-tag').filter({ hasText: '85' }).first();
    await expect(hsChip).toBeVisible({ timeout: 5_000 });
  }

  // Helper: click the "+" icon to append a new "Search Operator / Search Field" row to the
  // query builder, then select `fieldLabel` in that new row's field dropdown. The new row's
  // <select name="field"> is always inserted at the index equal to the pre-click count of
  // select[name="field"] elements (verified: 1 -> click "+" -> 2, new one at index 1, etc.).
  async function addQueryFieldRow(page, fieldLabel) {
    // Defensive: a previous step's leftover empty row can leave the "search criteria is empty"
    // alert open, which would otherwise block this click indefinitely.
    await dismissCriteriaAlertIfPresent(page);
    const countBefore = await page.locator('select[name="field"]').count();
    const plusBtn = page.locator('button.plus-icon').last();
    await plusBtn.waitFor({ state: 'visible', timeout: 10_000 });

    // Verify by row count rather than trusting one click - the Voli chat widget has been
    // observed re-opening itself mid-run (see removeQueryRow), which can silently swallow a
    // click that lands on it instead of the intended button, even the forced fallback.
    let countAfter = countBefore;
    for (let attempt = 1; attempt <= 3 && countAfter <= countBefore; attempt++) {
      await dismissVoliWidgetIfPresent(page);
      await clickWithForceFallback(plusBtn, 8_000);
      await page.waitForTimeout(1000);
      countAfter = await page.locator('select[name="field"]').count();
      if (countAfter <= countBefore) {
        console.log(`[addQueryFieldRow] "+" click (attempt ${attempt}/3) didn't add a new row while adding "${fieldLabel}" - retrying`);
      }
    }
    if (countAfter <= countBefore) {
      throw new Error(`[addQueryFieldRow] "+" button click failed to add a new row (obscured/intercepted, even with a forced click) while adding "${fieldLabel}"`);
    }

    const newFieldDropdown = page.locator('select[name="field"]').nth(countBefore);
    await newFieldDropdown.selectOption({ label: fieldLabel });
    await page.waitForTimeout(1000);
    return newFieldDropdown;
  }

  // Helper: click a query-builder row's company-name value input (e.g. "Select Consignee
  // Name" / "Select Shipper Name"), which opens the same company-picker popup used by the
  // primary Consignee/Shipper field - search by name, select the match, and Apply.
  async function pickCompanyValue(fieldDropdown, page, fieldLabel, modalTitleText, companyName) {
    await dismissVoliWidgetIfPresent(page);
    const valueInput = page.locator(`input[placeholder="Select ${fieldLabel}"]`).first();
    await valueInput.waitFor({ state: 'visible', timeout: 10_000 });
    await valueInput.click({ timeout: 8_000 });

    const modal = page.locator('[class*="modal"]:visible, [role="dialog"]:visible').filter({ hasText: modalTitleText }).first();
    await expect(modal).toBeVisible({ timeout: 8_000 });

    const modalSearchInput = modal.locator('input[placeholder*="first three characters" i]').first();
    await modalSearchInput.fill(companyName);
    await page.waitForTimeout(2000);

    let headerCheckbox = modal.locator('input[type="checkbox"]').first();
    if (!(await headerCheckbox.isVisible().catch(() => false))) {
      // Results may need an explicit search trigger - click the search icon button inside the modal (not Close/Apply)
      const modalSearchBtn = modal.locator('button').filter({ hasNotText: /close|apply|reset/i }).first();
      if (await modalSearchBtn.isVisible().catch(() => false)) {
        await modalSearchBtn.click({ timeout: 8_000 });
        await page.waitForTimeout(2000);
      }
    }
    headerCheckbox = modal.locator('input[type="checkbox"]').first();
    await headerCheckbox.waitFor({ state: 'visible', timeout: 8_000 });

    // The modal's header "select all" checkbox renders disabled when the search matched
    // zero rows - bail out and remove this query row instead of hanging until the click
    // action times out (the captured grid value doesn't always resolve to a picker match).
    const isDisabled = await headerCheckbox.isDisabled().catch(() => false);
    if (isDisabled) {
      console.log(`[pickCompanyValue] No "${modalTitleText}" match for "${companyName}" - removing this query row`);
      await modal.locator('button:has-text("Close")').first().click({ timeout: 8_000 }).catch(() => {});
      await modal.waitFor({ state: 'hidden', timeout: 8_000 }).catch(() => {});
      // removeQueryRow verifies the row count actually drops and retries (re-dismissing the
      // Voli widget each time) rather than trusting a single click - see its own comment for why.
      await removeQueryRow(fieldDropdown, page);
      return false;
    }

    // Select just the first matching row (index 1 - index 0 is the header "select all"), not
    // every result - the search text can match multiple distinct company records that share
    // the same display name (different addresses/IDs), and "select all" floods this field with
    // near-duplicate values instead of the one specific company actually read off the grid.
    const firstRowCheckbox = modal.locator('input[type="checkbox"]').nth(1);
    await firstRowCheckbox.waitFor({ state: 'visible', timeout: 8_000 });
    await firstRowCheckbox.click({ timeout: 8_000 });

    const applyBtn = modal.locator('button:has-text("Apply")').first();
    await applyBtn.click({ timeout: 8_000 });
    await page.waitForTimeout(1000);
    return true;
  }

  // Helper: fill a query-builder row's react-tags "Add new tag" input (Country/Port/Source
  // Country) and click the matching autocomplete suggestion. This widget only tokenizes a
  // value when a suggestion is actually clicked - pressing Enter with no suggestion selected
  // leaves the typed text sitting uncommitted in the input, which the app's own validation
  // treats as invalid and blocks the whole search with a "search criteria is empty" alert.
  // Returns false (and removes the just-added row) if no suggestion appears at all.
  async function pickTagValue(fieldDropdown, page, value) {
    const tagInput = fieldDropdown.locator('xpath=following::input[@placeholder="Add new tag"][1]');
    await tagInput.waitFor({ state: 'visible', timeout: 10_000 });
    await tagInput.click();
    await tagInput.fill(value);
    await page.waitForTimeout(1500);

    const suggestionList = page.locator('.react-tags__suggestions li');
    const suggestionCount = await suggestionList.count();
    if (suggestionCount === 0) {
      // removeQueryRow verifies the row count actually drops and retries (re-dismissing the
      // Voli widget each time) rather than trusting a single click - see its own comment for why.
      await removeQueryRow(fieldDropdown, page);
      return false;
    }

    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matchingSuggestions = suggestionList.filter({ hasText: new RegExp(escaped, 'i') });
    const matchingCount = await matchingSuggestions.count();
    const candidates = matchingCount > 0 ? matchingSuggestions : suggestionList;
    const candidateCount = matchingCount > 0 ? matchingCount : suggestionCount;

    // Prefer a suggestion that's actually known to have data. When the widget shows a
    // trailing shipment count (e.g. "Norfolk (0)" vs "Savannah (245)"), the "(0)" entry is a
    // guaranteed dead end - selecting it produces "No result found" once combined with the
    // rest of the query. Among the (value-matching, when any matched) candidates, pick the one
    // with the highest count instead of just the first line. Falls back to the previous
    // exact-match/top-suggestion behavior when no candidate exposes a parseable count at all.
    let bestIndex = -1;
    let bestCount = -1;
    for (let i = 0; i < candidateCount; i++) {
      const text = ((await candidates.nth(i).textContent()) || '').trim();
      const countMatch = text.match(/\((\d[\d,]*)\)\s*$/);
      if (countMatch) {
        const n = Number(countMatch[1].replace(/,/g, ''));
        if (n > bestCount) { bestCount = n; bestIndex = i; }
      }
    }

    if (bestIndex >= 0) {
      await candidates.nth(bestIndex).click({ timeout: 8_000 });
    } else if (matchingCount > 0) {
      await matchingSuggestions.first().click({ timeout: 8_000 });
    } else {
      // No exact text match, but the widget did filter suggestions for what was typed -
      // the top suggestion is very likely the intended match.
      await suggestionList.first().click({ timeout: 8_000 });
    }
    await page.waitForTimeout(800);
    return true;
  }

  // Helper: remove a query-builder row via the minus button immediately following its field
  // dropdown - same targeting used internally by pickCompanyValue/pickTagValue when a value
  // never resolves to a match, but exposed here so a row can also be reverted after the fact
  // (e.g. it applied fine but emptied the combined query's results).
  //
  // The remove button has no useful class to match on - its accessible name is the literal
  // text "-" (confirmed via the accessibility snapshot captured on a failed run: every row's
  // remove control reads as `button "-"`, distinct from the "+" add button covered by
  // `button.plus-icon`), so it's targeted by that text rather than a class guess.
  //
  // A single click still isn't fully trustworthy on top of that - the "Voli" AI-assistant chat
  // panel has been observed re-opening itself mid-run (it auto-sends follow-up messages on its
  // own timer) and can intercept a click moment-to-moment. Rather than trust one click, this
  // verifies success the only way that actually matters here - the query builder's row count
  // going down - and retries (re-dismissing the widget each time) up to 3 attempts, so a
  // transient widget pop-open can't silently leave an unwanted field sitting in the query.
  async function removeQueryRow(fieldDropdown, page) {
    const countBefore = await page.locator('select[name="field"]').count();
    for (let attempt = 1; attempt <= 3; attempt++) {
      await dismissVoliWidgetIfPresent(page);
      await dismissCriteriaAlertIfPresent(page);
      const rowMinusBtn = fieldDropdown.locator('xpath=following::button[normalize-space(text())="-"][1]');
      // This project's Playwright config sets no actionTimeout, so any action call without an
      // explicit timeout waits indefinitely (until the whole test's own timeout force-kills the
      // browser) rather than failing fast - give every action here its own bounded timeout.
      await rowMinusBtn.scrollIntoViewIfNeeded({ timeout: 3_000 }).catch(() => {});
      await clickWithForceFallback(rowMinusBtn, 8_000);
      await page.waitForTimeout(500);

      const countAfter = await page.locator('select[name="field"]').count();
      if (countAfter < countBefore) return;
      console.log(`[removeQueryRow] Minus button click (attempt ${attempt}/3) didn't reduce the query row count - retrying`);
    }
    console.log('[removeQueryRow] ⚠️ Could not remove the row after 3 attempts - it may still be present in the query');
  }

  // Helper: apply Shipper Name and Consignee Name together as one atomic pair (both values
  // were captured off the SAME first-row shipment, so together they describe a real
  // shipper->consignee relationship), then run a single Search. Adding them one at a time
  // (each independently reverted, as every other second-level field is) can silently drop
  // one half of a legitimate pair - e.g. the Shipper Name gets applied and kept, then the
  // Consignee Name is added on top of that narrower result set and reverted because *that*
  // combination happens to be empty, even though the original shipment genuinely paired them.
  // Reverts BOTH rows together (not just one) if the pair empties the results. Returns the
  // array of fields that ended up applied (0, 1, or 2 entries).
  async function addShipperConsigneeAndSearch(page, shipperField, consigneeField, searchBtn, gridRows) {
    const applied = [];
    const rowsToRevert = [];

    if (shipperField) {
      const dropdown = await addQueryFieldRow(page, shipperField.label);
      const ok = await pickCompanyValue(dropdown, page, shipperField.label, shipperField.modalTitle, shipperField.value);
      if (ok) { applied.push(shipperField); rowsToRevert.push(dropdown); }
    }
    if (consigneeField) {
      const dropdown = await addQueryFieldRow(page, consigneeField.label);
      const ok = await pickCompanyValue(dropdown, page, consigneeField.label, consigneeField.modalTitle, consigneeField.value);
      if (ok) { applied.push(consigneeField); rowsToRevert.push(dropdown); }
    }
    if (applied.length === 0) return [];

    await dismissVoliWidgetIfPresent(page);
    await searchBtn.click({ timeout: 8_000 });

    const criteriaAlert = page.locator('text=/search criteria is empty/i').first();
    if (await criteriaAlert.isVisible({ timeout: 3_000 }).catch(() => false)) {
      // Dismiss the alert itself first - it's a modal overlay that blocks every other click
      // (including the row-removal minus buttons below) until its "Ok" is clicked.
      await dismissCriteriaAlertIfPresent(page);
      // Revert in reverse of add order - rowsToRevert holds positional (nth-index) locators,
      // so removing the later-added row first keeps the earlier row's index valid.
      for (const dropdown of [...rowsToRevert].reverse()) await removeQueryRow(dropdown, page);
      await dismissCriteriaAlertIfPresent(page);
      await clickWithForceFallback(searchBtn, 8_000);
      return [];
    }

    await page.waitForLoadState('domcontentloaded', { timeout: 20_000 }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await handleMaxRecordsPopup(page);

    const noResultsMsg = page.locator('text=/no result found/i').first();
    await gridRows.first().or(noResultsMsg).first().waitFor({ state: 'visible', timeout: 30_000 });
    const isEmpty = await noResultsMsg.isVisible().catch(() => false);
    if (isEmpty) {
      console.log(
        `[search-tab-auto-select] Shipper "${shipperField ? shipperField.value : ''}" + Consignee ` +
        `"${consigneeField ? consigneeField.value : ''}" pair emptied the results - reverting both`
      );
      for (const dropdown of [...rowsToRevert].reverse()) await removeQueryRow(dropdown, page);
      await dismissVoliWidgetIfPresent(page);
      await dismissCriteriaAlertIfPresent(page);
      await clickWithForceFallback(searchBtn, 8_000);
      await page.waitForLoadState('domcontentloaded', { timeout: 20_000 }).catch(() => {});
      await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
      await handleMaxRecordsPopup(page);
      return [];
    }
    return applied;
  }

  // Helper: add one second-level query row for `field`, run Search, and check whether the
  // combined query still returns data. Reverts (removes the row and re-searches) if the
  // addition emptied the results, so the query only ever grows more specific while staying
  // non-empty - this is what lets every readable field be layered on one at a time instead of
  // ANDing all of them in a single shot (which is narrow enough to legitimately zero out).
  async function addFieldAndSearch(page, field, searchBtn, gridRows) {
    const dropdown = await addQueryFieldRow(page, field.label);
    let applied = false;
    if (field.type === 'company') {
      applied = await pickCompanyValue(dropdown, page, field.label, field.modalTitle, field.value);
    } else if (field.type === 'tag') {
      applied = await pickTagValue(dropdown, page, field.value);
    } else if (field.type === 'numeric') {
      await fillNumericValue(dropdown, page, field.value);
      applied = true;
    }
    // pickCompanyValue/pickTagValue already remove the row themselves when nothing matched.
    if (!applied) return false;

    await dismissVoliWidgetIfPresent(page);
    await searchBtn.click({ timeout: 8_000 });

    const criteriaAlert = page.locator('text=/search criteria is empty/i').first();
    if (await criteriaAlert.isVisible({ timeout: 3_000 }).catch(() => false)) {
      // Dismiss the alert itself first - it's a modal overlay that blocks every other click
      // (including the row-removal minus button below) until its "Ok" is clicked.
      await dismissCriteriaAlertIfPresent(page);
      await removeQueryRow(dropdown, page);
      await dismissCriteriaAlertIfPresent(page);
      await clickWithForceFallback(searchBtn, 8_000);
      return false;
    }

    await page.waitForLoadState('domcontentloaded', { timeout: 20_000 }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await handleMaxRecordsPopup(page);

    const noResultsMsg = page.locator('text=/no result found/i').first();
    await gridRows.first().or(noResultsMsg).first().waitFor({ state: 'visible', timeout: 30_000 });
    const isEmpty = await noResultsMsg.isVisible().catch(() => false);
    if (isEmpty) {
      console.log(`[search-tab-auto-select] Adding "${field.label}" = "${field.value}" emptied the results - reverting`);
      await removeQueryRow(dropdown, page);
      await dismissVoliWidgetIfPresent(page);
      await dismissCriteriaAlertIfPresent(page);
      await clickWithForceFallback(searchBtn, 8_000);
      await page.waitForLoadState('domcontentloaded', { timeout: 20_000 }).catch(() => {});
      await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
      await handleMaxRecordsPopup(page);
      return false;
    }
    return true;
  }

  // Helper: set a query-builder row's numeric field. Operator defaults to "Greater" - switch
  // to "Greater or Equals" (no exact "Equal" option exists) so the captured row's own value
  // is included rather than excluded by a strict "Greater" comparison.
  async function fillNumericValue(fieldDropdown, page, value) {
    const operatorSelect = fieldDropdown.locator('xpath=following::select[@name="operator"][1]');
    await operatorSelect.selectOption({ label: 'Greater or Equals' }).catch(() => {});
    const valueInput = operatorSelect.locator('xpath=following::input[1]');
    await valueInput.fill(String(value));
    await page.waitForTimeout(500);
  }

  // Helper: click the results grid's row-expand icon ("+") on the first shipment row and wait
  // for its expanded detail panel to render. This grid is an Ant Design table (see the
  // ".ant-table-measure-row" selector used elsewhere in this file), which renders row
  // expansion as a small +/- caret in its own cell and the expanded content as a sibling
  // "tr.ant-table-expanded-row" immediately after the row; broader fallback selectors are
  // included in case this particular grid restyles that caret or renders the detail panel
  // differently.
  async function expandFirstShipmentRow(page) {
    const firstRow = page.locator('tbody tr:not(.ant-table-measure-row):has(td)').first();
    await firstRow.waitFor({ state: 'visible', timeout: 20_000 });

    const expandIcon = firstRow.locator(
      '.ant-table-row-expand-icon:not(.ant-table-row-expand-icon-spaced), ' +
      '[aria-label="Expand row" i], [class*="expand-icon" i], button:has-text("+")'
    ).first();
    await expandIcon.waitFor({ state: 'visible', timeout: 10_000 });
    // Ant Design renders this caret in a sticky/frozen ("fix-left") cell, which a plain click
    // can report as "outside of the viewport" (its actionability check doesn't reliably handle
    // sticky-positioned columns) even though it's genuinely visible - force bypasses that check.
    const clicked = await clickWithForceFallback(expandIcon, 8_000);
    if (!clicked) throw new Error('[expandFirstShipmentRow] Expand icon click failed (obscured/intercepted, even with a forced click)');
    await page.waitForTimeout(1000);

    const expandedPanel = page.locator(
      'tr.ant-table-expanded-row, [class*="expanded-row" i], [class*="shipment-detail" i]'
    ).first();
    await expandedPanel.waitFor({ state: 'visible', timeout: 10_000 });
    return expandedPanel;
  }

  // Helper: read one field's value out of the expanded shipment detail panel by matching a
  // label (the panel renders label/value pairs, not indexed grid columns, so this can't reuse
  // getFirstRowColumnValue's header-index approach). Tries a dedicated value element next to
  // the label first, then falls back to stripping the label text out of a combined
  // "<label>: value" text block. Returns '' if the label isn't present in the panel at all.
  async function getExpandedRowFieldValue(expandedPanel, labelRegex) {
    const labelEl = expandedPanel.locator('*').filter({ hasText: labelRegex }).last();
    if (!(await labelEl.isVisible({ timeout: 3_000 }).catch(() => false))) return '';

    const valueSibling = labelEl.locator('xpath=following-sibling::*[1]');
    let value = ((await valueSibling.textContent().catch(() => '')) || '').trim();
    if (!value || labelRegex.test(value)) {
      const combinedText = ((await labelEl.textContent()) || '').trim();
      value = combinedText.replace(labelRegex, '').replace(/^[:\-\s]+/, '').trim();
    }
    return value;
  }

  // Left-filter categories whose real value should be read off the expanded shipment row -
  // this guarantees the checkbox picked actually belongs to an in-result shipment, instead of
  // blindly ticking whichever option happens to be first unchecked (which can easily be a
  // value that doesn't co-occur with the query built so far, turning "apply a filter" into
  // "no result found").
  const EXPANDED_ROW_FIELD_LABELS = {
    'Std. Unit': /std\.?\s*unit/i,
    'HS Code': /hs\s*code/i,
    'Country of Origin': /country\s*of\s*origin/i,
    'Country of Destination': /country\s*of\s*destination/i,
  };

  // Left "FILTERS" sidebar categories to drive one-checkbox-then-Apply for. Each is an
  // accordion panel (only one open at a time) rendered as either a plain checkbox-row list
  // (.lptr rows) or, for HS Code, a react-checkbox-tree widget - both are handled below.
  // "Refine by product" is excluded: its value input is an empty react-tags typeahead with
  // no default row list, so there is no checkbox to click without first typing a product term.
  // "Month" is excluded: its single top-level tree node is already checked by default
  // (representing the currently active date range) - clicking it would *remove* that
  // filter rather than add a new one, which isn't the "select an unchecked option" case
  // demonstrated by the other categories.
  const LEFT_FILTER_CATEGORIES = [
    'Consignee', 'Shipper', 'HS Code', 'Country of Origin', 'Country of Destination',
    'Continent of Origin', 'Continent of Destination', 'Source Country', 'Port of Origin', 'Std. Unit',
  ];

  // Helper: expand (if needed) a left FILTERS accordion panel by its title, tick a checkbox
  // inside it (plain .lptr row list, or the react-checkbox-tree used by HS Code), click that
  // panel's own "Apply" button, and verify the search still returns rows.
  //
  // When `targetValueText` is supplied (the value read off the expanded first shipment row -
  // see expandFirstShipmentRow/getExpandedRowFieldValue), the option whose row/label text
  // contains it is picked - that's the only option guaranteed to belong to a shipment already
  // in the result set. Without a target value (or if none of the panel's options match it),
  // falls back to the first unchecked option, same as before.
  //
  // Either way, after Apply the grid is checked for "no result found"; if the filter emptied
  // the results it's reverted (unchecked + Apply again) and this returns null, so a filter
  // that doesn't actually co-occur with the built query can never leave the run with an empty
  // result set - the whole point of driving this off the expanded shipment's real values.
  async function applyLeftPanelFilter(page, filtersPanel, categoryLabel, gridRows, targetValueText) {
    const escapedLabel = categoryLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const panelTitle = filtersPanel.locator('.df-panel-title-custom').filter({ hasText: new RegExp(`^${escapedLabel}$`, 'i') }).first();
    await panelTitle.scrollIntoViewIfNeeded();

    // The outer ".df-panel" wrapper (not the inner ".df-panel-header-custom") holds both the
    // header and the expanded body as siblings - match on the exact class token, since a
    // substring match on "df-panel" would also match "df-panel-header-custom".
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
    const targetRegex = targetValueText
      ? new RegExp(targetValueText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      : null;

    const applyAndVerify = async (checkbox, labelText) => {
      await checkbox.click();
      await applyBtn.click();
      await page.waitForTimeout(1500);
      await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

      const noResultsMsg = page.locator('text=/no result found/i').first();
      await gridRows.first().or(noResultsMsg).first().waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {});
      const isEmpty = await noResultsMsg.isVisible().catch(() => false);
      if (isEmpty) {
        console.log(`[search-tab-auto-select] Left filter "${categoryLabel}" = "${labelText}" emptied the results - reverting`);
        await checkbox.click().catch(() => {});
        await applyBtn.click().catch(() => {});
        await page.waitForTimeout(1500);
        return null;
      }
      return labelText;
    };

    // Case 1: plain checkbox-row list (.lptr rows) - used by most categories. The checkbox
    // sits in its own ".lptd" wrapper; the label text is a sibling ".lptd" of that wrapper,
    // not a sibling of the <input> itself - climb to the ".lptr" row first.
    const listRows = panelContainer.locator('.lptr');
    const listRowCount = await listRows.count();
    if (listRowCount > 0) {
      let matchRow = null;
      if (targetRegex) {
        for (let i = 0; i < listRowCount; i++) {
          const row = listRows.nth(i);
          const text = ((await row.textContent()) || '').trim();
          if (targetRegex.test(text)) { matchRow = row; break; }
        }
      }
      if (!matchRow) {
        const firstUnchecked = panelContainer.locator('.lptr').filter({ has: page.locator('input[type="checkbox"]:not(:checked)') }).first();
        if (await firstUnchecked.count() > 0) matchRow = firstUnchecked;
      }
      if (matchRow) {
        const checkbox = matchRow.locator('input[type="checkbox"]').first();
        if (await checkbox.isVisible({ timeout: 5_000 }).catch(() => false) && !(await checkbox.isChecked().catch(() => false))) {
          const labelText = ((await matchRow.locator('.lptd').nth(1).textContent()) || '').trim();
          return await applyAndVerify(checkbox, labelText);
        }
      }
    }

    // Case 2: react-checkbox-tree widget (HS Code) - pick the matching node when a target
    // value was given (and matched an option), otherwise the first unchecked node.
    const treeCheckboxes = panelContainer.locator('.react-checkbox-tree input[type="checkbox"]');
    const treeCount = await treeCheckboxes.count();
    if (treeCount > 0) {
      let matchCheckbox = null;
      let matchLabel = '';
      if (targetRegex) {
        for (let i = 0; i < treeCount; i++) {
          const cb = treeCheckboxes.nth(i);
          if (await cb.isChecked().catch(() => false)) continue;
          const label = cb.locator('xpath=ancestor::label[1]');
          const text = ((await label.textContent()) || '').trim();
          if (targetRegex.test(text)) { matchCheckbox = cb; matchLabel = text; break; }
        }
      }
      if (!matchCheckbox) {
        const fallback = panelContainer.locator('.react-checkbox-tree input[type="checkbox"]:not(:checked)').first();
        if (await fallback.isVisible({ timeout: 5_000 }).catch(() => false)) {
          matchCheckbox = fallback;
          matchLabel = ((await fallback.locator('xpath=ancestor::label[1]').textContent()) || '').trim();
        }
      }
      if (matchCheckbox) {
        return await applyAndVerify(matchCheckbox, matchLabel);
      }
    }

    return null;
  }

  test('TC-SEARCH-039: Build combined query - HS 2 "85" + every readable second-level field, then Search', async ({ page }) => {
    // Building the query one field at a time (each addition is its own search-and-verify
    // round trip, reverted individually if it empties the results) legitimately takes longer
    // than a single combined search - up to 8 fields (including the fixed-value Source
    // Country), then 10 left-filter categories, Save, and Download all within one run. A
    // revert now retries up to 3 times with bounded per-attempt timeouts (see removeQueryRow)
    // rather than a single unbounded attempt, so the budget needs enough room for a few fields
    // to each hit their full retry allowance without starving the steps after them.
    test.setTimeout(600_000);

    await page.locator('a:has-text("Search"), [href*="search"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });

    // Select country dropdown - "All Country (Global Search)"
    await page.locator('.dropdown-display', { hasText: 'Select Country' }).first().click();
    await page.waitForTimeout(500);
    await page.locator('[id^="Type_Exports_"]').first().click();
    await page.waitForTimeout(1000);

    // Select time period - "Last 30 Days"
    const periodSelect = page.locator('#periodList').first();
    await periodSelect.waitFor({ state: 'visible', timeout: 10_000 });
    const thirtyDaysOption = periodSelect.locator('option', { hasText: /last 30 days/i }).first();
    const has30DaysOption = await thirtyDaysOption.count();
    if (has30DaysOption > 0) {
      // selectOption's `label` matcher requires an exact string, not a regex (unlike the
      // `hasText` filter above) - resolve the option's literal text first.
      const thirtyDaysLabel = (await thirtyDaysOption.textContent()).trim();
      await periodSelect.selectOption({ label: thirtyDaysLabel });
    } else {
      // No preset "Last 30 Days" option exists - use Custom range with today - 30 days
      await periodSelect.selectOption({ value: '-1' }).catch(() => {});
      await page.waitForTimeout(500);
      const today = new Date();
      const start = new Date(today);
      start.setDate(start.getDate() - 30);
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

    await selectHsCode85(page);

    const searchBtn = page.locator('button.custom-search, button:has-text("Search")').last();
    await searchBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await searchBtn.click();
    await page.waitForLoadState('domcontentloaded', { timeout: 20_000 }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await handleMaxRecordsPopup(page);

    const gridRows = page.locator('tbody tr:not(.ant-table-measure-row):has(td)');
    await expect(gridRows.first()).toBeVisible({ timeout: 30_000 });

    const resultCount = page.locator('text=/showing .* of .* items/i').first();
    await expect(resultCount).toBeVisible({ timeout: 10_000 });

    // Read every second-level field value from the first result row
    const capturedFields = [];
    for (const field of SECOND_LEVEL_FIELDS) {
      const value = await getFirstRowColumnValue(page, field.headerRegex);
      // A numeric "0" is falsy - the app's own form validation appears to treat it as an
      // empty field (triggering a blocking "search criteria is empty" alert on Search),
      // so skip numeric fields whose captured value is zero rather than applying it.
      const isMeaningfulValue = value && !(field.type === 'numeric' && Number(value) === 0);
      if (isMeaningfulValue) {
        capturedFields.push({ ...field, value });
      }
    }
    expect(capturedFields.length).toBeGreaterThan(0);

    // Build the combined query incrementally, starting with a *valid* Shipper->Consignee
    // relationship: both values were captured off the same first-row shipment, and are applied
    // together as one atomic pair (addShipperConsigneeAndSearch) rather than one at a time, so
    // the query never ends up with a Shipper Name that came from one shipment ANDed against a
    // Consignee Name that came from a different, unrelated one. Every other readable field is
    // then layered on through the same one-field-at-a-time addFieldAndSearch helper. ANDing
    // fields in one shot is narrow enough to legitimately zero out the result set - each value
    // came from one real row, but a company picker's fuzzy search can land on a same-named-but-
    // different record (e.g. another branch/address), or fields just don't co-occur that
    // tightly. Handling every field through a revert-on-empty helper means no single field's
    // mismatch can stop the whole query from building; whatever subset stays compatible is what's
    // left, always non-empty (falling back to the HS 2=85-only baseline already confirmed above
    // if nothing else can be added).
    const shipperField = capturedFields.find(f => f.label === 'Shipper Name') || null;
    const consigneeField = capturedFields.find(f => f.label === 'Consignee Name') || null;
    // Source Country carries a fixed value (SOURCE_COUNTRY_FIELD) rather than one captured off
    // the grid - appended here so it goes through the exact same "+" plus-icon add / Search /
    // revert-if-empty flow (addFieldAndSearch) as every grid-driven field.
    const remainingFields = [
      ...capturedFields.filter(f => f.label !== 'Shipper Name' && f.label !== 'Consignee Name'),
      SOURCE_COUNTRY_FIELD,
    ];

    const appliedFields = [];
    if (shipperField || consigneeField) {
      const pairApplied = await addShipperConsigneeAndSearch(page, shipperField, consigneeField, searchBtn, gridRows);
      appliedFields.push(...pairApplied);
      if (pairApplied.length) {
        console.log(`[search-tab-auto-select] ✅ Applied Shipper "${shipperField ? shipperField.value : ''}" + Consignee "${consigneeField ? consigneeField.value : ''}" as a matched pair - results still present`);
      } else {
        console.log('[search-tab-auto-select] Skipped Shipper/Consignee pair (no picker match, or it emptied the results)');
      }
    }

    for (const field of remainingFields) {
      const applied = await addFieldAndSearch(page, field, searchBtn, gridRows);
      if (applied) {
        appliedFields.push(field);
        console.log(`[search-tab-auto-select] ✅ Added "${field.label}" = "${field.value}" - results still present`);
      } else {
        console.log(`[search-tab-auto-select] Skipped "${field.label}" = "${field.value}" (no match, or it emptied the results)`);
      }
    }

    await expect(gridRows.first()).toBeVisible({ timeout: 30_000 });
    await expect(resultCount).toBeVisible({ timeout: 10_000 });
    console.log(`[search-tab-auto-select] ✅ Final combined query: HS 2=85${appliedFields.length ? ' AND ' + appliedFields.map(f => f.label).join(', ') : ' (no second-level fields matched)'}`);

    // Expand the first shipment row in the now Shipper+Consignee-narrowed results grid ("+" row
    // expand icon) to read its actual Std. Unit / HS Code / Country of Origin / Country of
    // Destination values. These feed the left FILTERS panel below so it selects the option that
    // matches THIS specific shipment, instead of blindly ticking whichever checkbox happens to
    // be first - a mismatched option is exactly what turns "apply a filter" into "no result
    // found". Falls back to the panel's own first-unchecked-option behavior (still verified and
    // reverted on empty by applyLeftPanelFilter) if the row can't be expanded or a label isn't
    // found inside it.
    const expandedShipmentValues = {};
    try {
      const expandedPanel = await expandFirstShipmentRow(page);
      for (const [category, labelRegex] of Object.entries(EXPANDED_ROW_FIELD_LABELS)) {
        const value = await getExpandedRowFieldValue(expandedPanel, labelRegex);
        if (value) expandedShipmentValues[category] = value;
      }
      console.log('[search-tab-auto-select] Expanded shipment values:', expandedShipmentValues);
    } catch (e) {
      console.log(`[search-tab-auto-select] Could not expand first shipment row - left filters will fall back to first-unchecked selection: ${e.message}`);
    }

    // Apply every left FILTERS panel category - one checkbox + Apply each, preferring the
    // option that matches the expanded shipment's own value (see above) where one was captured.
    const filtersPanel = page.locator('text=FILTERS').first().locator('xpath=../..');
    const filtersAppliedSection = page.locator('text=Filters Applied').first();
    for (const category of LEFT_FILTER_CATEGORIES) {
      await dismissVoliWidgetIfPresent(page);
      const targetValueText = expandedShipmentValues[category] || null;
      const appliedLabel = await applyLeftPanelFilter(page, filtersPanel, category, gridRows, targetValueText);
      if (!appliedLabel) continue;
      await expect(filtersAppliedSection).toBeVisible({ timeout: 8_000 });
      // Strip any trailing "(count)" annotation (e.g. HS Code's "85 (755177)") before matching
      // the chip text in the Filters Applied section.
      const chipText = appliedLabel.replace(/\s*\(.*\)\s*$/, '').trim();
      const escapedChipText = chipText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const chip = page.locator('[class*="chip"]:visible, [class*="tag"]:visible, [class*="token"]:visible').filter({ hasText: new RegExp(escapedChipText, 'i') }).first();
      await expect(chip).toBeVisible({ timeout: 15_000 });
    }

    // Click Save button - Save Workspace modal opens
    const saveBtn = page.locator('li:has-text("Save"), button:has-text("Save")').filter({ hasNotText: /workspace|query/i }).first();
    await saveBtn.click();

    const saveModal = page.locator('[class*="modal"]:visible, [role="dialog"]:visible').filter({ hasText: 'Save Workspace' }).first();
    await expect(saveModal).toBeVisible({ timeout: 8_000 });

    // Use a unique workspace name per run - reusing the same literal name across repeat runs
    // triggers a "Cannot save duplicate name" alert instead of the success dialog.
    const workspaceName = `SearchTab_AutoSelect_${Date.now()}`;
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

    // The modal's Download confirm button is icon-only (no accessible text) - it's the button
    // immediately after "Cancel" in the modal footer.
    const cancelBtn = downloadModal.locator('button:has-text("Cancel")').first();
    let downloadConfirmBtn = cancelBtn.locator('xpath=following-sibling::button[1]');
    if (!(await downloadConfirmBtn.isVisible().catch(() => false))) {
      downloadConfirmBtn = downloadModal.locator('button').last();
    }
    await downloadConfirmBtn.click();

    const successMsg = page.locator('text=/download will complete shortly/i').first();
    await expect(successMsg).toBeVisible({ timeout: 10_000 });
  });
});
