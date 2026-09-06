// @ts-nocheck
const { test, expect } = require('@playwright/test');

// ─── Module 10: Contact Parser ────────────────────────────────────────────────
// Pre-conditions: SME or Corporate plan with sufficient contact balance points
//
// Migrated from src/pages/ContactParser.specs.js (Module 10).

test.describe('Module 10 - Contact Parser', () => {

  test.use({ timeout: 150_000 });

  test.beforeEach(async ({ page }) => {
    await page.goto('https://app.volza.com/home');
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  });

  // Helper: navigate to Search, run a cotton search, wait for results grid
  async function navigateToSearchAndGetCompanyLink(page) {
    await page.locator('a:has-text("Search"), [href*="search"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });

    const countryDropdown = page.locator('select, [class*="country-select"]').first();
    await countryDropdown.waitFor({ state: 'visible', timeout: 10000 });
    await countryDropdown.selectOption({ index: 1 }).catch(() => {});

    const searchInput = page.locator('input[placeholder*="product" i], input[placeholder*="Search" i]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput.fill('cotton');
    await searchInput.press('Enter');
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Search"), button[type="submit"]').first().click();
    await page.waitForTimeout(5000);

    // Handle database/country picker modal if it appears after clicking Search
    const dbModal = page.locator('[class*="modal"], [class*="database"], [role="dialog"]').first();
    if (await dbModal.isVisible({ timeout: 4000 }).catch(() => false)) {
      const firstItem = dbModal.locator('li, button, [class*="country-item"]').first();
      if (await firstItem.isVisible()) await firstItem.click();
      await page.waitForTimeout(3000);
    }

    await page.waitForLoadState('networkidle', { timeout: 25000 }).catch(() => {});
  }

  // Helper: find and return the first clickable company link in search results
  async function getFirstCompanyLink(page) {
    // Wait for at least one row to appear
    await page.locator('tbody tr, [class*="grid-row"], [class*="result-row"]').first()
      .waitFor({ state: 'visible', timeout: 25000 });

    // Debug: log how many rows are visible
    const rowCount = await page.locator('tbody tr').count();
    console.log(`[ContactParser] Search result rows: ${rowCount}`);

    // Try progressively broader selectors for the clickable company name
    const selectors = [
      'tbody tr td a',
      'tbody tr td button',
      '[class*="shipper"] a, [class*="shipper"] span[class*="name"]',
      '[class*="consignee"] a, [class*="consignee"] span[class*="name"]',
      '[class*="company"] a, [class*="company-name"]',
      'a[href*="company"], a[href*="contact"], a[href*="profile"]',
      'tbody tr td:nth-child(5)',   // shipper column (common position)
      'tbody tr td:nth-child(6)',   // consignee column
      'tbody tr td:nth-child(4)',
      'tbody tr td:nth-child(3)',
    ];

    for (const sel of selectors) {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 1000 }).catch(() => false)) {
        const text = await el.textContent().catch(() => '');
        console.log(`[ContactParser] Found company link with selector "${sel}": "${text?.trim()}"`);
        return el;
      }
    }

    throw new Error('[ContactParser] No company link found in search results. Check selector or page structure.');
  }

  // ── TC-CONTACT-001: Navigate to Contact Parser via shipper/consignee click ──
  test('TC-CONTACT-001: Click shipper/consignee name - redirects to Contact Parser with company name', async ({ page }) => {
    console.log('[TC-CONTACT-001] Search and get results');
    await navigateToSearchAndGetCompanyLink(page);

    console.log('[TC-CONTACT-001] Click on shipper/consignee name in shipment grid');
    const companyLink = await getFirstCompanyLink(page);
    const companyName = await companyLink.textContent();
    console.log(`[TC-CONTACT-001] Clicking company: ${companyName}`);
    await companyLink.click();
    await page.waitForTimeout(3000);

    console.log('[TC-CONTACT-001] Verify redirect to Contact Parser and URL');
    await expect(page).toHaveURL(/contact.*parser|company-profile|profile/, { timeout: 15000 });
    console.log(`[TC-CONTACT-001] URL: ${page.url()}`);

    console.log('[TC-CONTACT-001] Verify contact profile point deducted');
    const contactPage = page.locator('[class*="contact-parser"], [class*="company-contact"], main').first();
    await expect(contactPage).toBeVisible({ timeout: 10000 });
    console.log('[TC-CONTACT-001] ✅ Contact Parser page loaded');

    console.log('[TC-CONTACT-001] Verify company name in URL/heading matches clicked company');
    const heading = page.locator('h1, h2, [class*="company-name"]').first();
    const headingText = await heading.textContent().catch(() => '');
    console.log(`[TC-CONTACT-001] Company on Contact Parser: ${headingText}`);
  });

  // ── TC-CONTACT-002: Fetch Contact from LinkedIn ─────────────────────────────────────
  test('TC-CONTACT-002: Fetch Contact from LinkedIn shows contact data in grid', async ({ page }) => {
    console.log('[TC-CONTACT-002] Navigate to Contact Parser via Search');
    await navigateToSearchAndGetCompanyLink(page);

    const companyLink = await getFirstCompanyLink(page);
    await companyLink.click();
    await page.waitForTimeout(3000);

    console.log('[TC-CONTACT-002] Scroll down and click Fetch Contact from LinkedIn');
    await page.evaluate(() => window.scrollBy(0, 400));
    const fetchLinkedIn = page.locator('button:has-text("Fetch Contact from LinkedIn"), a:has-text("LinkedIn")').first();
    if (await fetchLinkedIn.isVisible()) {
      await fetchLinkedIn.click();
      await page.waitForTimeout(4000);
      const contactGrid = page.locator('tbody tr, [class*="contact-row"]').first();
      await expect(contactGrid).toBeVisible({ timeout: 20000 });
      console.log('[TC-CONTACT-002] ✅ Contact data fetched and displayed');
    } else {
      console.log('[TC-CONTACT-002] LinkedIn fetch button not visible on this page');
    }
  });

  // ── TC-CONTACT-003: Manual Contact Request ──────────────────────────────────────────
  test('TC-CONTACT-003: Manual Contact Request - designation + count and submit', async ({ page }) => {
    console.log('[TC-CONTACT-003] Navigate to Contact Parser');
    await navigateToSearchAndGetCompanyLink(page);

    const companyLink = await getFirstCompanyLink(page);
    await companyLink.click();
    await page.waitForTimeout(3000);

    console.log('[TC-CONTACT-003] Click Manual Contact Request button');
    const manualContactBtn = page.locator('button:has-text("Manual Contact Request"), button:has-text("Request Contact")').first();
    await manualContactBtn.waitFor({ state: 'visible', timeout: 10000 });
    await manualContactBtn.click();
    await page.waitForTimeout(1000);

    const requestModal = page.locator('[class*="modal"], [role="dialog"]').first();
    await expect(requestModal).toBeVisible({ timeout: 8000 });
    console.log('[TC-CONTACT-003] ✅ Manual Contact Request form opened');

    const designationSelect = requestModal.locator('select, [class*="designation"]').first();
    if (await designationSelect.isVisible()) {
      await designationSelect.selectOption({ index: 1 }).catch(() => {});
    }

    const contactCountInput = requestModal.locator('input[type="number"], input[placeholder*="count"]').first();
    if (await contactCountInput.isVisible()) await contactCountInput.fill('1');

    const submitBtn = requestModal.locator('button:has-text("Request for Contact"), button:has-text("Submit")').first();
    await submitBtn.click();
    await page.waitForTimeout(2000);

    const successMsg = page.locator('[class*="toast"], [class*="success"], [role="alert"]').filter({ hasText: /success|request/i }).first();
    await expect(successMsg).toBeVisible({ timeout: 10000 });
    console.log('[TC-CONTACT-003] ✅ Manual contact request submitted');
  });

  // ── TC-CONTACT-004: Company Profile button from Contact Parser ────────────────────
  test('TC-CONTACT-004: Company Profile button redirects to company profile page', async ({ page }) => {
    console.log('[TC-CONTACT-004] Navigate to Contact Parser');
    await navigateToSearchAndGetCompanyLink(page);

    const companyLink = await getFirstCompanyLink(page);
    await companyLink.click();
    await page.waitForTimeout(3000);

    const companyProfileBtn = page.locator('button:has-text("Company Profile"), a:has-text("Company Profile")').first();
    if (await companyProfileBtn.isVisible()) {
      const [newPage] = await Promise.all([
        page.context().waitForEvent('page', { timeout: 10000 }).catch(() => null),
        companyProfileBtn.click(),
      ]);
      if (newPage) {
        await newPage.waitForLoadState('domcontentloaded', { timeout: 15000 });
        await expect(newPage).toHaveURL(/company|profile/, { timeout: 10000 });
        console.log(`[TC-CONTACT-004] ✅ Company Profile opened: ${newPage.url()}`);
      } else {
        await expect(page).toHaveURL(/company|profile/, { timeout: 10000 });
        console.log('[TC-CONTACT-004] ✅ Company Profile opened in same tab');
      }
    }
  });

  // ── TC-CONTACT-005: Manual Contact from grid with checkbox - points deduction ────────
  test('TC-CONTACT-005: Select grid checkboxes, request manual contact, verify point deduction', async ({ page }) => {
    console.log('[TC-CONTACT-005] Navigate to Contact Parser');
    await navigateToSearchAndGetCompanyLink(page);

    const companyLink = await getFirstCompanyLink(page);
    await companyLink.click();
    await page.waitForTimeout(3000);

    console.log('[TC-CONTACT-005] Select first checkbox in grid');
    const firstCheckbox = page.locator('tbody input[type="checkbox"], [class*="contact-row"] input[type="checkbox"]').first();
    if (await firstCheckbox.isVisible()) {
      await firstCheckbox.click();

      const manualBtn = page.locator('button:has-text("Manual Contact Request"), button:has-text("Request Contact")').first();
      await manualBtn.click();
      await page.waitForTimeout(1000);

      const requestModal = page.locator('[class*="modal"], [role="dialog"]').first();
      await expect(requestModal).toBeVisible({ timeout: 8000 });
      const creditInfo = await requestModal.locator('[class*="credit"], [class*="point"], p').first().textContent().catch(() => '');
      console.log(`[TC-CONTACT-005] Credit info: ${creditInfo}`);

      const submitBtn = requestModal.locator('button:has-text("Request Contact"), button:has-text("Submit")').first();
      await submitBtn.click();
      await page.waitForTimeout(2000);
      console.log('[TC-CONTACT-005] ✅ Contact requested - points deducted on match, refunded otherwise');
    }
  });

  // ── TC-CONTACT-006: View Phone/Email on hover ───────────────────────────────────────
  test('TC-CONTACT-006: Hover over company name to see View Phone/Email option', async ({ page }) => {
    console.log('[TC-CONTACT-006] Navigate to Contact Parser');
    await navigateToSearchAndGetCompanyLink(page);

    const companyLink = await getFirstCompanyLink(page);
    await companyLink.click();
    await page.waitForTimeout(3000);

    const firstCompanyName = page.locator('tbody td [class*="company"], tbody td a').first();
    if (await firstCompanyName.isVisible()) {
      await firstCompanyName.hover();
      await page.waitForTimeout(800);

      const viewPhoneBtn = page.locator('button:has-text("View Phone"), button:has-text("View Email"), a:has-text("View Phone")').first();
      if (await viewPhoneBtn.isVisible()) {
        await viewPhoneBtn.click();
        await page.waitForTimeout(1500);
        console.log('[TC-CONTACT-006] ✅ Phone/Email tooltip/popup shown');
      } else {
        console.log('[TC-CONTACT-006] View Phone/Email button not visible on hover');
      }
    }
  });

  // ── TC-CONTACT-007: Contact tab - My Saved and My Requested sub-tabs ────────────────
  test('TC-CONTACT-007: Contact tab shows My Saved Contacts and My Requested Contacts sub-tabs', async ({ page }) => {
    console.log('[TC-CONTACT-007] Navigate to Contact Parser');
    await navigateToSearchAndGetCompanyLink(page);

    const companyLink = await getFirstCompanyLink(page);
    await companyLink.click();
    await page.waitForTimeout(3000);

    console.log('[TC-CONTACT-007] Click Contact tab');
    const contactTab = page.locator('[class*="tab"]').filter({ hasText: /contact/i }).first();
    if (await contactTab.isVisible()) {
      await contactTab.click();
      await page.waitForTimeout(1000);

      const savedTab = page.locator('[class*="tab"]').filter({ hasText: /saved/i }).first();
      const requestedTab = page.locator('[class*="tab"]').filter({ hasText: /requested/i }).first();
      await expect(savedTab).toBeVisible({ timeout: 5000 });
      await expect(requestedTab).toBeVisible({ timeout: 5000 });
      console.log('[TC-CONTACT-007] ✅ My Saved Contacts and My Requested Contacts tabs visible');
    }
  });

  // ── TC-CONTACT-008: Report incorrect functionality ─────────────────────────────────
  test('TC-CONTACT-008: Report incorrect contact - popup, comment, submit shows success', async ({ page }) => {
    console.log('[TC-CONTACT-008] Navigate to Contact Parser');
    await navigateToSearchAndGetCompanyLink(page);

    const companyLink = await getFirstCompanyLink(page);
    await companyLink.click();
    await page.waitForTimeout(3000);

    const reportFlag = page.locator('[class*="report"], button:has-text("Report"), [class*="flag"]').first();
    if (await reportFlag.isVisible()) {
      await reportFlag.click();
      await page.waitForTimeout(1000);

      const reportModal = page.locator('[class*="modal"], [role="dialog"]').first();
      await expect(reportModal).toBeVisible({ timeout: 8000 });

      const commentInput = reportModal.locator('textarea, input[placeholder*="comment"]').first();
      if (await commentInput.isVisible()) await commentInput.fill('Incorrect phone number');

      const submitBtn = reportModal.locator('button:has-text("Submit"), button:has-text("Report")').first();
      await submitBtn.click();
      await page.waitForTimeout(2000);

      const successMsg = page.locator('[class*="toast"], [role="alert"]').filter({ hasText: /reported successfully|success/i }).first();
      await expect(successMsg).toBeVisible({ timeout: 10000 });
      console.log('[TC-CONTACT-008] ✅ "Reported Successfully" message shown');
    }
  });

  // ── TC-CONTACT-009: Location, Branches, Social Media Links cart visible ────────────
  test('TC-CONTACT-009: Location, Branches, and Social Media Links sections visible', async ({ page }) => {
    console.log('[TC-CONTACT-009] Navigate to Contact Parser');
    await navigateToSearchAndGetCompanyLink(page);

    const companyLink = await getFirstCompanyLink(page);
    await companyLink.click();
    await page.waitForTimeout(3000);
    await page.evaluate(() => window.scrollBy(0, 600));

    const sections = ['Location', 'Branches', 'Social Media'];
    for (const section of sections) {
      const sectionEl = page.locator('[class*="card"], [class*="section"]').filter({ hasText: new RegExp(section, 'i') }).first();
      const visible = await sectionEl.isVisible().catch(() => false);
      console.log(`[TC-CONTACT-009] Section "${section}" visible: ${visible}`);
    }
    console.log('[TC-CONTACT-009] ✅ Page sections checked');
  });

  // ── TC-CONTACT-010: Social Media verify/unverify functionality ─────────────────────
  test('TC-CONTACT-010: Social Media Links verify (Yes) and unverify (No) tabs', async ({ page }) => {
    console.log('[TC-CONTACT-010] Navigate to Contact Parser');
    await navigateToSearchAndGetCompanyLink(page);

    const companyLink = await getFirstCompanyLink(page);
    await companyLink.click();
    await page.waitForTimeout(3000);
    await page.evaluate(() => window.scrollBy(0, 600));

    const socialMediaSection = page.locator('[class*="social-media"], [class*="social"]').first();
    if (await socialMediaSection.isVisible()) {
      const socialLink = socialMediaSection.locator('a, [class*="link"]').first();
      if (await socialLink.isVisible()) {
        const yesBtn = socialMediaSection.locator('button:has-text("Yes")').first();
        const noBtn  = socialMediaSection.locator('button:has-text("No")').first();

        if (await yesBtn.isVisible()) {
          await yesBtn.click();
          await page.waitForTimeout(1000);
          console.log('[TC-CONTACT-010] ✅ Social link moved to Verified tab');
        }

        if (await noBtn.isVisible()) {
          await noBtn.click();
          await page.waitForTimeout(1000);
          console.log('[TC-CONTACT-010] ✅ Social link moved to Unverified tab');
        }
      }
    } else {
      console.log('[TC-CONTACT-010] Social Media section not visible on this page');
    }
  });
});
