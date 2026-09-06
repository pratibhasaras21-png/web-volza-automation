// Describes one entry in the Search-tab "Select Country" database dropdown
// (e.g. India Export Mirror, All Country Global Search, Bangladesh Export
// Detailed): { label, idPrefix?, textFallbackRegex, preferTextMatch? }.
// `idPrefix` matches the "<Country>_Exports_" id convention some list entries
// use; `textFallbackRegex` matches the option by its visible label text when
// no id convention applies (or as a fallback). `preferTextMatch` flips the
// match order for entries whose id prefix is ambiguous/shared with another
// entry (e.g. "Bangladesh Export Detailed" vs. plain "Bangladesh Export").

class SearchPage {
  constructor(page) {
    this.page = page;

    this.searchTab = page.locator('a:has-text("Search"), button:has-text("Search"), nav a:has-text("Search")').first();

    // The country selector container — clicking it opens the searchable dropdown
    this.countryDropdown = page.locator('.select__control, [class*="select-container"], [class*="country"]').first();

    // Text input that appears inside the dropdown for filtering
    this.countryInput = page.locator('.select__input input, [class*="select"] input[type="text"]').first();

    // Period dropdown (shows "Last 30 Days" by default)
    this.periodDropdown = page.locator('select, [class*="period"], .dropdown').filter({ hasText: /Last/i }).first();

    // Tag-style input for product keywords
    this.productKeywordInput = page.locator('input[placeholder*="Add new tag"], input[placeholder*="tag"], .tags-input input').first();

    this.searchButton = page.locator('button:has-text("Search")').last();
  }

  async goto() {
    await this.page.goto('https://app.volza.com/home');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async clickSearchTab() {
    // Wait for the nav to settle after redirect from login
    await this.page.waitForTimeout(2000);
    const searchNav = this.page.locator('nav a, .nav-link, [role="tab"]').filter({ hasText: /^Search$/i }).first();
    await searchNav.waitFor({ state: 'visible', timeout: 15_000 });
    await searchNav.click();
    await this.page.waitForTimeout(1000);
  }

  async selectCountry(countryText) {
    // Click the country Select control to open the dropdown
    const selectControl = this.page.locator('.select__control').first();
    await selectControl.waitFor({ state: 'visible', timeout: 15_000 });
    await selectControl.click();

    // Type in the filter input that appears
    const filterInput = this.page.locator('.select__input input').first();
    await filterInput.waitFor({ state: 'visible', timeout: 5_000 });
    await filterInput.fill('afg');
    await this.page.waitForTimeout(800);

    // Click the matching option
    const option = this.page.locator('.select__option, [class*="option"]').filter({ hasText: countryText }).first();
    await option.waitFor({ state: 'visible', timeout: 8_000 });
    await option.click();
    await this.page.waitForTimeout(500);
  }

  async selectPeriod(periodLabel) {
    // Period is typically a native <select> or a custom dropdown
    const nativeSelect = this.page.locator('select').filter({ hasText: /Last/i }).first();
    const isNative = await nativeSelect.count() > 0;

    if (isNative) {
      await nativeSelect.selectOption({ label: periodLabel });
    } else {
      // Custom dropdown — click to open then pick option
      const periodControl = this.page.locator('[class*="period"], .dropdown').filter({ hasText: /Last/i }).first();
      await periodControl.click();
      await this.page.waitForTimeout(500);
      await this.page.locator('[class*="option"], li').filter({ hasText: periodLabel }).first().click();
    }
    await this.page.waitForTimeout(500);
  }

  async enterProductKeyword(keyword) {
    // The tags input — type the keyword then press Enter to create the tag
    const tagsInput = this.page.locator('input[placeholder*="Add new tag"], input[placeholder*="tag"]').first();
    await tagsInput.waitFor({ state: 'visible', timeout: 10_000 });
    await tagsInput.click();
    await tagsInput.fill(keyword);
    await tagsInput.press('Enter');
    await this.page.waitForTimeout(500);
  }

  async clickSearch() {
    const btn = this.page.locator('button:has-text("Search")').last();
    await btn.waitFor({ state: 'visible', timeout: 10_000 });
    await btn.click();
    // Wait for results page to load
    await this.page.waitForLoadState('domcontentloaded', { timeout: 30_000 });
    await this.page.waitForTimeout(2000);
  }

  /**
   * Selects a search field type from the field dropdown (e.g. "HS 2", "HS 4, 6 Or 8",
   * "Company Name", "Consignee", "Shipper", "Product Name"), enters a keyword and
   * triggers the search. Shared by Universal Search and Search Tab variants that all
   * repeat this same field-select → keyword → search sequence. Returns false (without
   * clicking search) if a picker field's keyword matched zero companies - true otherwise.
   */
  async searchWithField(dropdownOption, keyword) {
    const fieldDropdown = this.page.locator('button, [class*="btn"], [class*="select"]')
      .filter({ hasText: /HS 2|HS 4|Product Name|Company Name|Consignee|Shipper/i })
      .first();
    await fieldDropdown.waitFor({ state: 'visible', timeout: 10_000 });

    // The field-type control is a native <select> on some pages (e.g. Universal Search) and
    // a custom button+list dropdown on others. A native <option> never reports as "visible" to
    // Playwright, so clicking it the custom-dropdown way hangs until timeout - use selectOption
    // instead when the matched element is actually a <select>.
    const tagName = await fieldDropdown.evaluate(el => el.tagName.toLowerCase());
    if (tagName === 'select') {
      await fieldDropdown.selectOption({ label: dropdownOption });
      await this.page.waitForTimeout(400);
    } else {
      await fieldDropdown.click();
      await this.page.waitForTimeout(600);

      const option = this.page.getByText(dropdownOption, { exact: true }).first();
      await option.waitFor({ state: 'visible', timeout: 5_000 });
      await option.click();
      await this.page.waitForTimeout(400);
    }

    // Company Name / Consignee / Shipper don't render a text input at all - the value area
    // becomes a ".company-tag-universal" trigger that opens a company-picker modal, same as
    // the Welcome tab's equivalent fields. Everything else (HS 2/4/6/8, Product Name) is a
    // react-tags tokenizer input.
    const isPickerField = /^(Company Name|Consignee|Shipper)$/i.test(dropdownOption);
    if (isPickerField) {
      const picked = await this.pickCompanyValueUniversal(keyword);
      // No matching company for this keyword - nothing to search, so skip the search click
      // and the results wait entirely rather than submitting an empty/stale query.
      if (!picked) return false;
    } else {
      const searchInput = this.page.locator(
        'input[placeholder*="Search"], input[placeholder*="search"], ' +
        'input[placeholder*="product"], input[placeholder*="HS"], ' +
        'input[placeholder*="company"], input[placeholder*="name"]'
      ).first();
      await searchInput.waitFor({ state: 'visible', timeout: 10_000 });
      await searchInput.click();
      // This is a react-tags tokenizer input - .fill() sets the value without firing React's
      // onChange, so the autocomplete suggestion list never populates and the search button
      // stays disabled. Typing character-by-character triggers the real synthetic events.
      await searchInput.pressSequentially(keyword, { delay: 60 });
      await this.page.waitForTimeout(1200);

      const suggestion = this.page.locator('#ReactTags li, .react-tags__suggestions li').first();
      if (await suggestion.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await suggestion.click();
      } else {
        await searchInput.press('Enter');
      }

      try {
        await this.page.locator('[class*="chip"], [class*="token"], [class*="tag"], [class*="badge"]')
          .filter({ hasText: new RegExp(keyword, 'i') }).first()
          .waitFor({ state: 'visible', timeout: 5_000 });
      } catch {
        await this.page.waitForTimeout(800);
      }
    }

    await this.clickSearchIcon();

    await this.page.waitForTimeout(3000);
    try {
      await this.page.waitForLoadState('networkidle', { timeout: 10_000 });
    } catch {
      await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 });
    }
    return true;
  }

  /**
   * Company Name / Consignee / Shipper: clicks the ".company-tag-universal" trigger to open
   * the entity picker modal, searches by keyword, checks the first matching row, and clicks
   * Apply. Mirrors the proven pickWelcomeEntity() helper from the Welcome tab spec. A search
   * keyword can legitimately match zero companies (modal shows "No data") - that's not an
   * automation bug, so this closes the modal and returns false instead of hanging on a row
   * checkbox that will never appear.
   */
  async pickCompanyValueUniversal(keyword) {
    await this.page.locator('.company-tag-universal').first().click();
    await this.page.waitForTimeout(800);

    const modal = this.page.locator('.ReactModal__Content').first();
    await modal.waitFor({ state: 'visible', timeout: 10_000 });

    const searchInput = modal.locator('input[placeholder*="Type the first" i]').first();
    await searchInput.fill(keyword);
    await this.page.waitForTimeout(1500);

    const noDataMessage = modal.locator('text=/no data/i').first();
    const rowCheckbox = modal.locator('table input[type="checkbox"]').nth(1);
    await rowCheckbox.or(noDataMessage).first().waitFor({ state: 'visible', timeout: 10_000 });

    if (await noDataMessage.isVisible().catch(() => false)) {
      console.log(`[pickCompanyValueUniversal] No match for "${keyword}" - closing picker`);
      await modal.locator('button:has-text("Close")').first().click({ timeout: 8_000 }).catch(() => {});
      await modal.waitFor({ state: 'hidden', timeout: 8_000 }).catch(() => {});
      return false;
    }

    await rowCheckbox.check();
    await modal.locator('button:has-text("Apply")').first().click();
    await modal.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
    await this.page.waitForTimeout(500);
    return true;
  }

  /** Clicks the magnifying-glass search icon button, trying several fallback strategies. */
  async clickSearchIcon() {
    let clicked = false;

    try {
      const btn = this.page.locator('button[aria-label*="Search" i], button[title*="Search" i]').first();
      await btn.waitFor({ state: 'visible', timeout: 2_000 });
      await btn.click({ force: true });
      clicked = true;
    } catch { /* try next */ }

    if (!clicked) {
      try {
        const btn = this.page.locator('button[type="submit"]').first();
        await btn.waitFor({ state: 'visible', timeout: 2_000 });
        await btn.click({ force: true });
        clicked = true;
      } catch { /* try next */ }
    }

    if (!clicked) {
      clicked = await this.page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => {
          if (b.textContent?.trim() === '×') return false;
          if (b.getAttribute('aria-label') === 'close') return false;
          const svg = b.querySelector('svg');
          return svg !== null && svg.querySelector('circle') !== null;
        });
        if (btn) { btn.click(); return true; }
        return false;
      });
    }

    if (!clicked) {
      clicked = await this.page.evaluate(() => {
        const svgBtns = Array.from(document.querySelectorAll('button')).filter(b => {
          if (b.textContent?.trim() === '×') return false;
          if (b.getAttribute('aria-label') === 'close') return false;
          if ((b.className || '').toLowerCase().includes('close')) return false;
          return b.querySelector('svg') !== null;
        });
        const btn = svgBtns[svgBtns.length - 1];
        if (btn) { btn.click(); return true; }
        return false;
      });
    }

    if (!clicked) {
      await this.productKeywordInput.press('Enter').catch(() => {});
    }
  }

  /**
   * Opens the Search tab's "Select Country" database dropdown and picks the given
   * database (e.g. "India Export Mirror", "All Country Global Search", "Bangladesh
   * Export Detailed"). By default tries the "<Country>_Exports_" id convention
   * first, falling back to matching the option by its visible label text; when
   * `db.preferTextMatch` is set, text match is tried first instead (for entries
   * whose id prefix is shared/ambiguous with another entry). Extracted from the
   * near-identical local helpers duplicated in the Shipper Name and Consignee Name
   * search-tab specs.
   */
  async selectCountryDatabase(db) {
    await this.page.locator('.dropdown-display', { hasText: 'Select Country' }).first().click();
    await this.page.waitForTimeout(500);

    const idOption = db.idPrefix ? this.page.locator(`[id^="${db.idPrefix}"]`).first() : null;
    const textOption = this.page.locator('li:visible, [role="option"]:visible, a:visible, div:visible')
      .filter({ hasText: db.textFallbackRegex })
      .first();

    if (idOption) {
      const [primary, secondary] = db.preferTextMatch ? [textOption, idOption] : [idOption, textOption];
      if (await primary.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await primary.click();
      } else {
        await secondary.waitFor({ state: 'visible', timeout: 8_000 });
        await secondary.click();
      }
    } else {
      await textOption.waitFor({ state: 'visible', timeout: 8_000 });
      await textOption.click();
    }
    await this.page.waitForTimeout(1000);
  }

  /**
   * Waits for either a result row or the app's own "No shipments found for this search
   * criteria" alert, whichever appears first - a valid search keyword can legitimately
   * match zero shipments, which isn't an automation bug and shouldn't hang until timeout.
   * Dismisses the alert when that's the outcome. Returns { found, results } so the caller
   * can decide whether a zero-match result should soft-fail or be treated as expected.
   */
  async expectResultsVisible() {
    const results = this.page.locator(
      'tbody tr:not([class*="head"]):not([class*="empty"]), ' +
      '.MuiTableRow-root:not([class*="head"]), ' +
      '[class*="shipment-row"], [class*="result-row"], [class*="data-row"], ' +
      'table tr:has(td)'
    ).first();
    const noResultsAlert = this.page.locator('[class*="modal"]:visible, [role="dialog"]:visible')
      .filter({ hasText: /no shipments found/i }).first();

    await results.or(noResultsAlert).first().waitFor({ state: 'visible', timeout: 30_000 });

    const isEmpty = await noResultsAlert.isVisible().catch(() => false);
    if (isEmpty) {
      await noResultsAlert.locator('button:has-text("Ok")').first().click({ timeout: 5_000 }).catch(() => {});
      return { found: false, results: null };
    }
    return { found: true, results };
  }
}

module.exports = { SearchPage };
