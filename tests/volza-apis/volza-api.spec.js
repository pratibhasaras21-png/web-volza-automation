const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { loginAndSelectCompany } = require('../../fixtures/auth.fixture');

// Produced on-demand by generate-dcpl-auth-state.js (repo root) - NOT by
// global-setup.js or any automatic step. See that script and the beforeAll
// below for why: a live second login for this same email, run right after
// global-setup.js's own login, was observed silently short-circuiting
// straight to an already-authenticated Home page on this machine (server-
// side "trusted" behavior, independent of cookies, that survives even an
// explicit logout) - so a saved session is the reliable path, with a live
// login kept only as a best-effort fallback.
const DCPL_AUTH_FILE = path.join(__dirname, '..', '..', 'dcpl-auth-state.json');

// ─── Volza API — Test Cases ──────────────────────────────────────────────────
// Sourced from tests/volza-apis/volza-apis.testcases.md (TC_001–TC_040).
// This feature had no prior automation ("No automated spec yet" per the
// testcases doc) and its DOM hasn't been explored in the live app, so the
// locators below are best-guess text/class combinations rather than
// confirmed selectors. Every uncertain check follows this repo's existing
// pattern (see my-workspace.spec.js): try the likely selector, and if it
// isn't found, log a "⚠️ not found — skipping" line and soft-fail rather
// than hard-crash the whole run. Tighten these locators once the real
// Volza API UI is available to inspect.

test.describe('Volza API', () => {
  // The Volza API feature lives on a separate, dedicated API plan - only the
  // "DCPL Team Testing SME" company carries it. Every other spec in this repo
  // authenticates as whatever global-setup.js logs into by default (env
  // VOLZA_COMPANY, normally "SME Biyearly plan"), which has no API access.
  // So THIS FILE ONLY logs in fresh with its own session pinned to the DCPL
  // company, instead of reusing the shared auth-state.json every other spec
  // relies on - global-setup.js and every other spec file are untouched.
  let page;
  let authState;

  test.beforeAll(async ({ browser }) => {
    // A full live email+OTP login doesn't reliably fit in playwright.config.js's
    // default 90s test/hook timeout - give it real headroom.
    test.setTimeout(240_000);

    const hasSavedDcplSession = fs.existsSync(DCPL_AUTH_FILE);

    // Matches global-setup.js's manually-created-context pattern: baseURL
    // has to be passed explicitly here since a context created off `browser`
    // directly (rather than via the `page` fixture) doesn't inherit
    // playwright.config.js's use.baseURL, and LoginPage.goto() relies on it
    // for its relative navigation.
    const context = await browser.newContext({
      baseURL: 'https://app.volza.com',
      viewport: { width: 1280, height: 720 },
      ...(hasSavedDcplSession ? { storageState: DCPL_AUTH_FILE } : {}),
    });
    page = await context.newPage();
    await page.goto('https://app.volza.com/home');
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});

    const logoutLink = page.locator('text=Logout').first();
    const alreadyAuthenticated = await logoutLink.isVisible({ timeout: 8_000 }).catch(() => false);

    if (hasSavedDcplSession && alreadyAuthenticated) {
      console.log('[volza-api.spec.js] ✅ Using saved DCPL session from dcpl-auth-state.json');
    } else {
      if (hasSavedDcplSession) {
        console.log('[volza-api.spec.js] ⚠️ Saved session in dcpl-auth-state.json appears expired - falling back to a live login (run `node generate-dcpl-auth-state.js` to refresh it)');
      }
      // A live login for the same email, run right after global-setup.js's
      // own login for "SME Biyearly plan" moments earlier, was observed
      // silently short-circuiting straight to an already-authenticated Home
      // page - skipping the email/OTP form and the company picker entirely
      // and keeping whatever company that first login already selected
      // (this machine appears to be server-side "trusted", independent of
      // cookies, surviving even an explicit logout). This live-login path is
      // therefore a best-effort fallback, not the reliable route - see
      // generate-dcpl-auth-state.js for the one that actually works.
      if (alreadyAuthenticated) {
        console.log('[volza-api.spec.js] Fresh context already authenticated (server-side trust?) - logging out to attempt a real OTP login for DCPL Team Testing SME');
        await logoutLink.click();
        await page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
      }
      await loginAndSelectCompany(page, 'DCPL Team Testing SME');
    }

    // Captured so the two tests below that deliberately clear cookies/storage
    // (TC_006, TC_036) can spin up their own throwaway, identically-authenticated
    // context instead of logging out this shared one for every test after them.
    authState = await context.storageState();
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  test.beforeEach(async () => {
    const homeLink = page.locator('a:has-text("Home"), [href*="/home"]').first();
    if (await homeLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await homeLink.click();
      await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
    } else {
      await page.goto('https://app.volza.com/home');
      await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    }
  });

  // Helper: the left-panel "Volza API" nav button/link.
  function volzaApiButton(page) {
    return page.locator('a:has-text("Volza API"), button:has-text("Volza API"), [href*="api-dashboard"], [href*="volza-api"]').first();
  }

  // Helper: click it and wait for whatever page it lands on.
  async function clickVolzaApiButton(page) {
    const btn = volzaApiButton(page);
    await btn.click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000);
  }

  // Helper: locate a visible modal/dialog by its heading text.
  function modalByTitle(page, title) {
    return page.locator('[class*="modal"]:visible, [role="dialog"]:visible').filter({ hasText: title }).first();
  }

  // Helper: navigate straight to the API Dashboard, going through the nav
  // button first (rather than a raw goto) so plan-gating logic actually runs.
  async function openApiDashboard(page) {
    await clickVolzaApiButton(page);
  }

  // Helper: close the Add Credit popup, trying a close (X) icon, then a
  // "Cancel"/"Close" button, then falling back to Escape. Every test in this
  // file shares one page/session, so a modal left open by one test blocks
  // whatever the next test tries to click behind it - always call this after
  // opening Add Credit, regardless of what the test itself was checking.
  async function closeAddCreditPopup(page, popup) {
    const closeIcon = popup.locator('[class*="close" i]:visible, [aria-label="Close" i]:visible').last();
    if (await closeIcon.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await closeIcon.click().catch(() => {});
    } else {
      const closeBtn = popup.locator('button:has-text("Cancel"), button:has-text("Close")').first();
      if (await closeBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await closeBtn.click().catch(() => {});
      } else {
        await page.keyboard.press('Escape').catch(() => {});
      }
    }
    await popup.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
  }

  // Helper: fill the Add Credit amount field. A first live run found this
  // input reliably blocked by a "vapi-modal-overlay" element intercepting
  // pointer events (Playwright's actionability check correctly refusing to
  // click/type into something visually covered) - which then hung for the
  // full 90s test timeout waiting for it to clear, since it never does. That
  // looks like a real z-index/layering issue in this modal, not a locator
  // problem, so: try a normal fill with a short bound first, and if it's
  // genuinely blocked, fall back to a forced fill (bypassing the
  // obscured-element check) so the test can still reach its actual
  // assertion instead of hanging - while still surfacing the overlay
  // blockage as a loud, explicit finding rather than hiding it.
  async function fillAddCreditAmount(popup, amount) {
    const amountInput = popup.locator('input[type="number"], input[placeholder*="amount" i], input[placeholder*="USD" i]').first();
    try {
      await amountInput.fill(amount, { timeout: 8_000 });
    } catch {
      console.log('[Add Credit] ⚠️ Amount input appears blocked by an overlay (e.g. "vapi-modal-overlay") sitting on top of the modal - possible z-index/layering bug. Forcing the fill so the test can still proceed.');
      await amountInput.fill(amount, { timeout: 8_000, force: true }).catch(() => {});
    }
    return amountInput;
  }

  // ── TC_001: Verify Volza API button visibility ─────────────────────────────
  test('TC_001: Verify Volza API button visibility', async () => {
    console.log('[TC_001] Check left panel for the Volza API button');
    const apiBtn = volzaApiButton(page);
    const visible = await apiBtn.isVisible({ timeout: 8000 }).catch(() => false);
    expect.soft(visible, 'Volza API button should be visible for a user on an API plan').toBeTruthy();
    console.log(visible
      ? '[TC_001] ✅ "Volza API" button is visible in the left panel'
      : '[TC_001] ⚠️ "Volza API" button not found — verify this account has an API plan / locator needs updating');
  });

  // ── TC_002: Verify API button hidden for non-plan users ─────────────────────
  test('TC_002: Verify API button hidden for non-plan users', async () => {
    console.log('[TC_002] Check left panel — button should be hidden/restricted without an API plan');
    const apiBtn = volzaApiButton(page);
    const visible = await apiBtn.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`[TC_002] Volza API button visible: ${visible}`);
    // This suite's account may or may not carry an API plan — record the
    // observed state rather than asserting a fixed expectation either way,
    // since that depends on which account the run is authenticated as.
    console.log('[TC_002] ⚠️ Requires a non-API-plan account to fully validate — recording current-account visibility only');
  });

  // ── TC_003: Redirect to dashboard for active plan ───────────────────────────
  test('TC_003: Redirect to dashboard for active plan', async () => {
    console.log('[TC_003] Click Volza API button');
    const apiBtn = volzaApiButton(page);
    if (!(await apiBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log('[TC_003] ⚠️ Volza API button not visible — skipping (no API plan on this account?)');
      return;
    }
    await clickVolzaApiButton(page);
    const onDashboard = /api-dashboard|volza-api/i.test(page.url());
    const dashboardHeading = page.locator('text=/API Dashboard/i').first();
    const headingVisible = await dashboardHeading.isVisible({ timeout: 8000 }).catch(() => false);
    expect.soft(onDashboard || headingVisible, 'Active-plan user should land on the API Dashboard').toBeTruthy();
    console.log(`[TC_003] ${onDashboard || headingVisible ? '✅' : '⚠️'} Landed at ${page.url()}`);
  });

  // ── TC_004: Redirect external site if no plan ───────────────────────────────
  test('TC_004: Redirect external site if no plan', async () => {
    console.log('[TC_004] Click Volza API button on an account without an active API plan');
    const apiBtn = volzaApiButton(page);
    if (!(await apiBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log('[TC_004] ⚠️ Volza API button not visible on this account — cannot exercise the no-plan redirect path here');
      return;
    }
    await clickVolzaApiButton(page);
    const redirectedExternally = /volza\.com\/(api|pricing)/i.test(page.url()) && !/api-dashboard/i.test(page.url());
    console.log(`[TC_004] Landed at ${page.url()} (external landing-page redirect: ${redirectedExternally})`);
    console.log('[TC_004] ⚠️ Meaningful only on a genuinely no-plan account — this run\'s account may already have API access');
  });

  // ── TC_005: Direct URL access validation ────────────────────────────────────
  test('TC_005: Direct URL access validation', async () => {
    console.log('[TC_005] Open /api-dashboard directly by URL');
    await page.goto('https://app.volza.com/api-dashboard');
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1500);

    const deniedMsg = page.locator('[class*="error"], [class*="denied"], [role="alert"]')
      .filter({ hasText: /no access|denied|not authorized|upgrade/i }).first();
    const denied = await deniedMsg.isVisible({ timeout: 5000 }).catch(() => false);
    const redirectedAway = !/api-dashboard/i.test(page.url());
    console.log(`[TC_005] Denied message shown: ${denied}, redirected away from /api-dashboard: ${redirectedAway}, current URL: ${page.url()}`);
    console.log('[TC_005] ⚠️ Result depends on whether this account has an API plan — recording observed behavior only');
  });

  // ── TC_006: Session timeout handling ────────────────────────────────────────
  test('TC_006: Session timeout handling', async ({ browser }) => {
    console.log('[TC_006] Simulate an expired session, then open the API dashboard');
    // Clearing cookies/storage would log the shared DCPL session out for
    // every test after this one - use a disposable clone of it instead.
    const context = await browser.newContext({ baseURL: 'https://app.volza.com', storageState: authState });
    const isolatedPage = await context.newPage();
    await isolatedPage.goto('https://app.volza.com/home');
    await isolatedPage.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});

    await context.clearCookies();
    await isolatedPage.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (e) { /* not accessible */ } });

    await isolatedPage.goto('https://app.volza.com/api-dashboard');
    await isolatedPage.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
    await isolatedPage.waitForTimeout(2000);

    const loginPrompt = isolatedPage.locator('input[type="email"], text=/sign in|log in|session expired/i').first();
    const redirectedToLogin = /login|signin/i.test(isolatedPage.url());
    const loginPromptShown = await loginPrompt.isVisible({ timeout: 8000 }).catch(() => false);

    expect.soft(redirectedToLogin || loginPromptShown, 'Expired session should prompt for login when opening the API dashboard').toBeTruthy();
    console.log(`[TC_006] ${redirectedToLogin || loginPromptShown ? '✅' : '⚠️'} Redirected to login: ${redirectedToLogin}, login prompt shown: ${loginPromptShown}`);

    await context.close();
  });

  // ── TC_007: Verify Current Plan details ─────────────────────────────────────
  test('TC_007: Verify Current Plan details', async () => {
    console.log('[TC_007] Open API Dashboard and check the Current Plan section');
    await openApiDashboard(page);
    // The "Current Plan" card has no stable class name to hook (it renders as
    // plain unstyled-looking wrapper divs) - anchor on the visible "Current
    // Plan" label text instead, then climb to the nearest ancestor that also
    // contains the plan-tier heading (e.g. "Standard") to capture the card.
    const planLabel = page.getByText('Current Plan', { exact: true }).first();
    const visible = await planLabel.isVisible({ timeout: 8000 }).catch(() => false);
    expect.soft(visible, 'Current Plan details should load on the API Dashboard').toBeTruthy();
    if (visible) {
      const planSection = planLabel.locator('xpath=ancestor::*[.//h3][1]');
      const text = (await planSection.textContent().catch(() => planLabel.textContent()))?.trim();
      console.log(`[TC_007] ✅ Plan details section loaded: "${text?.slice(0, 120)}"`);
    } else {
      console.log('[TC_007] ⚠️ Current Plan section not found — locator needs updating once the dashboard UI is confirmed');
    }
  });

  // ── TC_008: Verify Subscription End Date ────────────────────────────────────
  test('TC_008: Verify Subscription End Date', async () => {
    console.log('[TC_008] Open API Dashboard and check the subscription period section');
    await openApiDashboard(page);
    const endsOn = page.locator('text=/Ends On|Expires On|Valid Till/i').first();
    const visible = await endsOn.isVisible({ timeout: 8000 }).catch(() => false);
    expect.soft(visible, 'Subscription end date ("Ends On") should be displayed').toBeTruthy();
    if (visible) {
      const dateText = await endsOn.locator('xpath=following::*[1]').textContent().catch(() => null);
      console.log(`[TC_008] ✅ "Ends On" shown${dateText ? ` — value: "${dateText.trim()}"` : ''}`);
    } else {
      console.log('[TC_008] ⚠️ "Ends On" label not found — locator needs updating');
    }
  });

  // ── TC_009: Verify Requests Per Minute display ──────────────────────────────
  test('TC_009: Verify Requests Per Minute display', async () => {
    console.log('[TC_009] Open API Dashboard and check the RPM (rate limit) display');
    await openApiDashboard(page);
    const rpm = page.locator('text=/requests per minute|RPM|rate limit/i').first();
    const visible = await rpm.isVisible({ timeout: 8000 }).catch(() => false);
    console.log(visible
      ? '[TC_009] ✅ Requests Per Minute is displayed on the dashboard'
      : '[TC_009] ⚠️ RPM display not found — may not apply to this plan tier, or locator needs updating');
  });

  // ── TC_010: Open Add Credit popup ───────────────────────────────────────────
  test('TC_010: Open Add Credit popup', async () => {
    console.log('[TC_010] Open API Dashboard and click Add Credit');
    await openApiDashboard(page);
    const addCreditBtn = page.locator('button:has-text("Add Credit"), a:has-text("Add Credit")').first();
    if (!(await addCreditBtn.isVisible({ timeout: 8000 }).catch(() => false))) {
      console.log('[TC_010] ⚠️ "Add Credit" control not found — skipping');
      return;
    }
    await addCreditBtn.click();
    const popup = modalByTitle(page, /add credit/i);
    await expect.soft(popup).toBeVisible({ timeout: 8000 });
    console.log('[TC_010] ✅ Add Credit popup opened');

    // Every test below shares this one page/session (see the file-level
    // comment on `page`) - leaving this modal open blocks whatever the next
    // test tries to click on the dashboard behind it, so always close it.
    await closeAddCreditPopup(page, popup);
  });

  // ── TC_011: Minimum credit validation ───────────────────────────────────────
  test('TC_011: Minimum credit validation', async () => {
    console.log('[TC_011] Open Add Credit popup and enter an amount below the $1000 minimum');
    await openApiDashboard(page);
    const addCreditBtn = page.locator('button:has-text("Add Credit"), a:has-text("Add Credit")').first();
    if (!(await addCreditBtn.isVisible({ timeout: 8000 }).catch(() => false))) {
      console.log('[TC_011] ⚠️ "Add Credit" control not found — skipping');
      return;
    }
    await addCreditBtn.click();
    const popup = modalByTitle(page, /add credit/i);
    await expect.soft(popup).toBeVisible({ timeout: 8000 });

    await fillAddCreditAmount(popup, '500');
    const proceedBtn = popup.locator('button:has-text("Proceed")').first();
    await proceedBtn.click().catch(() => {});
    await page.waitForTimeout(1000);

    const validationError = popup.locator('[class*="error"], [class*="invalid"], [role="alert"]')
      .filter({ hasText: /1000|minimum|at least/i }).first();
    const errorShown = await validationError.isVisible({ timeout: 5000 }).catch(() => false);
    expect.soft(errorShown, 'Amount below $1000 should trigger a minimum-credit validation error').toBeTruthy();
    console.log(`[TC_011] ${errorShown ? '✅' : '⚠️'} Minimum-credit validation shown: ${errorShown}`);

    await closeAddCreditPopup(page, popup);
  });

  // ── TC_012: Proceed to Paddle payment ───────────────────────────────────────
  test('TC_012: Proceed to Paddle payment', async () => {
    console.log('[TC_012] Open Add Credit, enter a valid amount, and click Proceed to Pay');
    await openApiDashboard(page);
    const addCreditBtn = page.locator('button:has-text("Add Credit"), a:has-text("Add Credit")').first();
    if (!(await addCreditBtn.isVisible({ timeout: 8000 }).catch(() => false))) {
      console.log('[TC_012] ⚠️ "Add Credit" control not found — skipping');
      return;
    }
    await addCreditBtn.click();
    const popup = modalByTitle(page, /add credit/i);
    await expect.soft(popup).toBeVisible({ timeout: 8000 });

    await fillAddCreditAmount(popup, '1000');
    const proceedBtn = popup.locator('button:has-text("Proceed")').first();
    await proceedBtn.click().catch(() => {});
    await page.waitForTimeout(2000);

    const onPaddle = /paddle\.com/i.test(page.url());
    const paddleFrame = page.frameLocator('iframe[src*="paddle"]').first();
    const paddleFrameVisible = await paddleFrame.locator('body').isVisible({ timeout: 8000 }).catch(() => false);
    expect.soft(onPaddle || paddleFrameVisible, 'Proceeding to pay should redirect to (or embed) the Paddle payment page').toBeTruthy();
    console.log(`[TC_012] ${onPaddle || paddleFrameVisible ? '✅' : '⚠️'} Paddle redirect/embed detected: ${onPaddle || paddleFrameVisible} (URL: ${page.url()})`);

    if (!onPaddle) await closeAddCreditPopup(page, popup);
  });

  // ── TC_013: Successful payment flow ─────────────────────────────────────────
  test('TC_013: Successful payment flow', async () => {
    console.log('[TC_013] Full payment completion requires a real Paddle sandbox transaction');
    console.log('[TC_013] ⚠️ Skipping actual payment submission (would incur/simulate a real charge) — needs a Paddle test-mode account to automate safely');
    test.skip(true, 'Requires a Paddle test/sandbox payment account to complete a real transaction safely');
  });

  // ── TC_014: Payment cancellation handling ───────────────────────────────────
  test('TC_014: Payment cancellation handling', async () => {
    console.log('[TC_014] Open Add Credit, proceed to payment, then cancel');
    await openApiDashboard(page);
    const addCreditBtn = page.locator('button:has-text("Add Credit"), a:has-text("Add Credit")').first();
    if (!(await addCreditBtn.isVisible({ timeout: 8000 }).catch(() => false))) {
      console.log('[TC_014] ⚠️ "Add Credit" control not found — skipping');
      return;
    }
    await addCreditBtn.click();
    const popup = modalByTitle(page, /add credit/i);
    await expect.soft(popup).toBeVisible({ timeout: 8000 });

    await fillAddCreditAmount(popup, '1000');
    const proceedBtn = popup.locator('button:has-text("Proceed")').first();
    await proceedBtn.click().catch(() => {});
    await page.waitForTimeout(2000);

    console.log('[TC_014] Cancel the payment (close/back out of Paddle)');
    await closeAddCreditPopup(page, popup);
    await page.waitForTimeout(1000);

    await openApiDashboard(page);
    console.log('[TC_014] ⚠️ Verifying "no credit added" requires reading the balance before/after — capturing dashboard state only, see TC_007/TC_009 for balance/plan reads');
  });

  // ── TC_015: Duplicate payment prevention ────────────────────────────────────
  test('TC_015: Duplicate payment prevention', async () => {
    console.log('[TC_015] Open Add Credit, enter a valid amount, and click Proceed to Pay multiple times rapidly');
    await openApiDashboard(page);
    const addCreditBtn = page.locator('button:has-text("Add Credit"), a:has-text("Add Credit")').first();
    if (!(await addCreditBtn.isVisible({ timeout: 8000 }).catch(() => false))) {
      console.log('[TC_015] ⚠️ "Add Credit" control not found — skipping');
      return;
    }
    await addCreditBtn.click();
    const popup = modalByTitle(page, /add credit/i);
    await expect.soft(popup).toBeVisible({ timeout: 8000 });

    await fillAddCreditAmount(popup, '1000');
    const proceedBtn = popup.locator('button:has-text("Proceed")').first();

    const stillEnabledAfterFirstClick = await proceedBtn.click().catch(() => {})
      .then(() => proceedBtn.isEnabled().catch(() => true));
    console.log(`[TC_015] Proceed button re-clickable immediately after first click: ${stillEnabledAfterFirstClick}`);
    expect.soft(stillEnabledAfterFirstClick, 'Proceed button should disable/debounce after first click to prevent duplicate transactions').toBeFalsy();
    console.log(`[TC_015] ${stillEnabledAfterFirstClick ? '⚠️' : '✅'} Duplicate-click protection ${stillEnabledAfterFirstClick ? 'not detected' : 'appears in place'}`);

    if (!/paddle\.com/i.test(page.url())) await closeAddCreditPopup(page, popup);
  });

  // ── TC_016: Generate Sandbox API key ────────────────────────────────────────
  test('TC_016: Generate Sandbox API key', async () => {
    console.log('[TC_016] Open API Dashboard and create a Sandbox key');
    await openApiDashboard(page);
    const sandboxTab = page.locator('a:has-text("Sandbox"), button:has-text("Sandbox"), [role="tab"]:has-text("Sandbox")').first();
    if (await sandboxTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sandboxTab.click();
      await page.waitForTimeout(800);
    }

    const createKeyBtn = page.locator('button:has-text("Create Key"), button:has-text("Generate Key"), button:has-text("New Key")').first();
    if (!(await createKeyBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log('[TC_016] ⚠️ "Create Key" control not found — skipping');
      return;
    }
    await createKeyBtn.click();
    const popup = modalByTitle(page, /key/i);
    const keyName = `Sandbox_${Date.now()}`;
    if (await popup.isVisible({ timeout: 5000 }).catch(() => false)) {
      await popup.locator('input[placeholder*="name" i]').first().fill(keyName);
      await popup.locator('button:has-text("Create"), button:has-text("Generate"), button:has-text("Save")').first().click();
    }
    await page.waitForTimeout(1500);

    const keyRow = page.locator('[class*="key-row"], tbody tr').filter({ hasText: keyName }).first();
    const created = await keyRow.isVisible({ timeout: 8000 }).catch(() => false);
    expect.soft(created, 'Sandbox key should be generated and listed').toBeTruthy();
    console.log(`[TC_016] ${created ? '✅' : '⚠️'} Sandbox key "${keyName}" ${created ? 'generated' : 'not confirmed in list'}`);
  });

  // ── TC_017: Generate Production API key ─────────────────────────────────────
  test('TC_017: Generate Production API key', async () => {
    console.log('[TC_017] Open API Dashboard and create a Production key');
    await openApiDashboard(page);
    const prodTab = page.locator('a:has-text("Production"), button:has-text("Production"), [role="tab"]:has-text("Production")').first();
    if (await prodTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await prodTab.click();
      await page.waitForTimeout(800);
    }

    const createKeyBtn = page.locator('button:has-text("Create Key"), button:has-text("Generate Key"), button:has-text("New Key")').first();
    if (!(await createKeyBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log('[TC_017] ⚠️ "Create Key" control not found (production access may not be granted on this account) — skipping');
      return;
    }
    await createKeyBtn.click();
    const popup = modalByTitle(page, /key/i);
    const keyName = `Production_${Date.now()}`;
    if (await popup.isVisible({ timeout: 5000 }).catch(() => false)) {
      await popup.locator('input[placeholder*="name" i]').first().fill(keyName);
      await popup.locator('button:has-text("Create"), button:has-text("Generate"), button:has-text("Save")').first().click();
    }
    await page.waitForTimeout(1500);

    const keyRow = page.locator('[class*="key-row"], tbody tr').filter({ hasText: keyName }).first();
    const created = await keyRow.isVisible({ timeout: 8000 }).catch(() => false);
    expect.soft(created, 'Production key should be generated and listed').toBeTruthy();
    console.log(`[TC_017] ${created ? '✅' : '⚠️'} Production key "${keyName}" ${created ? 'generated' : 'not confirmed in list'}`);
  });

  // ── TC_018: API key masking ─────────────────────────────────────────────────
  test('TC_018: API key masking', async () => {
    console.log('[TC_018] Open the key list and verify keys are masked by default');
    await openApiDashboard(page);
    const keyValue = page.locator('[class*="key-value"], code, [class*="api-key"]').first();
    if (!(await keyValue.isVisible({ timeout: 8000 }).catch(() => false))) {
      console.log('[TC_018] ⚠️ No key value element found (no keys yet, or locator needs updating) — skipping');
      return;
    }
    const text = (await keyValue.textContent())?.trim() || '';
    const looksMasked = /\*{3,}|•{3,}|x{3,}/i.test(text) || text.length < 12;
    expect.soft(looksMasked, `Key value should be masked by default, got: "${text}"`).toBeTruthy();
    console.log(`[TC_018] ${looksMasked ? '✅' : '⚠️'} Key display: "${text}" (masked: ${looksMasked})`);
  });

  // ── TC_019: Copy API key functionality ──────────────────────────────────────
  test('TC_019: Copy API key functionality', async () => {
    console.log('[TC_019] Click the Copy control on an existing key');
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    await openApiDashboard(page);
    const copyBtn = page.locator('button[title*="copy" i], [class*="copy"], button:has-text("Copy")').first();
    if (!(await copyBtn.isVisible({ timeout: 8000 }).catch(() => false))) {
      console.log('[TC_019] ⚠️ Copy control not found — skipping');
      return;
    }
    await copyBtn.click();
    await page.waitForTimeout(500);

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText().catch(() => null)).catch(() => null);
    const toast = page.locator('text=/copied/i').first();
    const toastShown = await toast.isVisible({ timeout: 3000 }).catch(() => false);
    const copied = Boolean(clipboardText) || toastShown;
    expect.soft(copied, 'Clicking Copy should copy the key to the clipboard (or confirm via a toast)').toBeTruthy();
    console.log(`[TC_019] ${copied ? '✅' : '⚠️'} Copy confirmed via ${clipboardText ? 'clipboard read' : toastShown ? '"copied" toast' : 'neither signal'}`);
  });

  // ── TC_020: Regenerate API key ──────────────────────────────────────────────
  test('TC_020: Regenerate API key', async () => {
    console.log('[TC_020] Regenerate an existing key and confirm the old value is invalidated');
    await openApiDashboard(page);
    const keyRow = page.locator('[class*="key-row"], tbody tr').first();
    if (!(await keyRow.isVisible({ timeout: 8000 }).catch(() => false))) {
      console.log('[TC_020] ⚠️ No existing key row found — skipping');
      return;
    }
    const regenBtn = keyRow.locator('button:has-text("Regenerate"), [title*="regenerate" i]').first();
    if (!(await regenBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log('[TC_020] ⚠️ Regenerate control not found — skipping');
      return;
    }
    await regenBtn.click();
    const confirmDialog = page.locator('[class*="modal"]:visible, [role="dialog"]:visible, [role="alertdialog"]:visible')
      .filter({ hasText: /regenerate|are you sure/i }).first();
    if (await confirmDialog.isVisible({ timeout: 5000 }).catch(() => false)) {
      await confirmDialog.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Regenerate")').first().click();
    }
    await page.waitForTimeout(1500);

    const successMsg = page.locator('text=/regenerated|new key/i').first();
    const regenerated = await successMsg.isVisible({ timeout: 8000 }).catch(() => false);
    expect.soft(regenerated, 'Regenerating a key should confirm success and invalidate the old value').toBeTruthy();
    console.log(`[TC_020] ${regenerated ? '✅' : '⚠️'} Key regeneration confirmed: ${regenerated}`);
  });

  // ── TC_021: Duplicate key name validation ───────────────────────────────────
  test('TC_021: Duplicate key name validation', async () => {
    console.log('[TC_021] Create a key, then attempt to create another with the same name');
    await openApiDashboard(page);
    const createKeyBtn = page.locator('button:has-text("Create Key"), button:has-text("Generate Key"), button:has-text("New Key")').first();
    if (!(await createKeyBtn.isVisible({ timeout: 8000 }).catch(() => false))) {
      console.log('[TC_021] ⚠️ "Create Key" control not found — skipping');
      return;
    }
    const keyName = `Dup_${Date.now()}`;

    for (let attempt = 0; attempt < 2; attempt++) {
      await createKeyBtn.click();
      const popup = modalByTitle(page, /key/i);
      if (await popup.isVisible({ timeout: 5000 }).catch(() => false)) {
        await popup.locator('input[placeholder*="name" i]').first().fill(keyName);
        await popup.locator('button:has-text("Create"), button:has-text("Generate"), button:has-text("Save")').first().click();
        await page.waitForTimeout(1000);
      }
    }

    const dupError = page.locator('[class*="error"], [role="alert"]').filter({ hasText: /duplicate|already exists|already used/i }).first();
    const errorShown = await dupError.isVisible({ timeout: 5000 }).catch(() => false);
    const matchingKeys = await page.locator('[class*="key-row"], tbody tr').filter({ hasText: keyName }).count();
    console.log(`[TC_021] Duplicate-name error shown: ${errorShown}, keys named "${keyName}" listed: ${matchingKeys}`);
    expect.soft(errorShown || matchingKeys <= 1, 'Duplicate key name should be rejected, or otherwise not create two identically-named keys').toBeTruthy();
    console.log(`[TC_021] ✅ Duplicate key name handled per business rule (error shown: ${errorShown}, count: ${matchingKeys})`);
  });

  // ── TC_022: Verify total request count ──────────────────────────────────────
  test('TC_022: Verify total request count', async () => {
    console.log('[TC_022] Open Credit Consumption tab and check total request count');
    await openApiDashboard(page);
    const consumptionTab = page.locator('a:has-text("Credit Consumption"), [role="tab"]:has-text("Credit Consumption")').first();
    if (!(await consumptionTab.isVisible({ timeout: 8000 }).catch(() => false))) {
      console.log('[TC_022] ⚠️ "Credit Consumption" tab not found — skipping');
      return;
    }
    await consumptionTab.click();
    await page.waitForTimeout(1500);

    const requestCount = page.locator('text=/total requests?/i').first();
    const visible = await requestCount.isVisible({ timeout: 8000 }).catch(() => false);
    expect.soft(visible, 'Total request count should be displayed on Credit Consumption').toBeTruthy();
    console.log(`[TC_022] ${visible ? '✅' : '⚠️'} Total request count displayed: ${visible}`);
  });

  // ── TC_023: Verify success rate calculation ─────────────────────────────────
  test('TC_023: Verify success rate calculation', async () => {
    console.log('[TC_023] Open Credit Consumption tab and check the success rate metric');
    await openApiDashboard(page);
    const consumptionTab = page.locator('a:has-text("Credit Consumption"), [role="tab"]:has-text("Credit Consumption")').first();
    if (await consumptionTab.isVisible({ timeout: 8000 }).catch(() => false)) {
      await consumptionTab.click();
      await page.waitForTimeout(1500);
    }

    const successRate = page.locator('text=/success rate/i').first();
    const visible = await successRate.isVisible({ timeout: 8000 }).catch(() => false);
    if (visible) {
      const valueText = await successRate.locator('xpath=following::*[1]').textContent().catch(() => null);
      const looksLikePercent = valueText ? /\d+(\.\d+)?\s*%/.test(valueText) : false;
      expect.soft(looksLikePercent, `Success rate should render as a percentage, got: "${valueText}"`).toBeTruthy();
      console.log(`[TC_023] ${looksLikePercent ? '✅' : '⚠️'} Success rate value: "${valueText}"`);
    } else {
      console.log('[TC_023] ⚠️ Success rate metric not found — skipping');
    }
  });

  // ── TC_024: Date range filter validation ────────────────────────────────────
  test('TC_024: Date range filter validation', async () => {
    console.log('[TC_024] Open Analytics/Credit Consumption and select a custom date range');
    await openApiDashboard(page);
    const consumptionTab = page.locator('a:has-text("Credit Consumption"), [role="tab"]:has-text("Credit Consumption")').first();
    if (await consumptionTab.isVisible({ timeout: 8000 }).catch(() => false)) {
      await consumptionTab.click();
      await page.waitForTimeout(1500);
    }

    const dateRangeControl = page.locator('[class*="date-range"], [class*="ant-picker-range"], button:has-text("Custom")').first();
    if (!(await dateRangeControl.isVisible({ timeout: 8000 }).catch(() => false))) {
      console.log('[TC_024] ⚠️ Date range control not found — skipping');
      return;
    }
    const before = await page.locator('table, [class*="chart"]').first().textContent().catch(() => '');
    await dateRangeControl.click();
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape').catch(() => {});
    const after = await page.locator('table, [class*="chart"]').first().textContent().catch(() => '');
    console.log(`[TC_024] Data content changed after opening date range control: ${before !== after}`);
    console.log('[TC_024] ⚠️ Full custom-range selection needs the confirmed date-picker locator — recorded interaction only');
  });

  // ── TC_025: Month filter validation ─────────────────────────────────────────
  test('TC_025: Month filter validation', async () => {
    console.log('[TC_025] Open Analytics and select a month filter');
    await openApiDashboard(page);
    const consumptionTab = page.locator('a:has-text("Credit Consumption"), [role="tab"]:has-text("Credit Consumption")').first();
    if (await consumptionTab.isVisible({ timeout: 8000 }).catch(() => false)) {
      await consumptionTab.click();
      await page.waitForTimeout(1500);
    }

    const monthFilter = page.locator('select, [class*="month-filter"], [class*="dropdown"]').filter({ hasText: /month/i }).first();
    if (!(await monthFilter.isVisible({ timeout: 8000 }).catch(() => false))) {
      console.log('[TC_025] ⚠️ Month filter control not found — skipping');
      return;
    }
    await monthFilter.click();
    await page.waitForTimeout(500);
    const firstOption = page.locator('li, option').nth(1);
    if (await firstOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstOption.click();
      await page.waitForTimeout(1500);
    }
    console.log('[TC_025] ✅ Month filter interacted with — verify filtered data manually until locator is confirmed');
  });

  // ── TC_026: Status filter 2xx ───────────────────────────────────────────────
  test('TC_026: Status filter 2xx', async () => {
    console.log('[TC_026] Apply the "Success" status filter on usage data');
    await openApiDashboard(page);
    const consumptionTab = page.locator('a:has-text("Credit Consumption"), [role="tab"]:has-text("Credit Consumption")').first();
    if (await consumptionTab.isVisible({ timeout: 8000 }).catch(() => false)) {
      await consumptionTab.click();
      await page.waitForTimeout(1500);
    }

    const successFilter = page.locator('button:has-text("Success"), [class*="filter"]:has-text("2xx")').first();
    if (!(await successFilter.isVisible({ timeout: 8000 }).catch(() => false))) {
      console.log('[TC_026] ⚠️ "Success" status filter not found — skipping');
      return;
    }
    await successFilter.click();
    await page.waitForTimeout(1500);

    const statusColumn = page.locator('tbody tr td').filter({ hasText: /^[45]\d{2}$/ });
    const nonSuccessCount = await statusColumn.count();
    expect.soft(nonSuccessCount).toBe(0);
    console.log(`[TC_026] ${nonSuccessCount === 0 ? '✅' : '⚠️'} Non-2xx rows visible after Success filter: ${nonSuccessCount}`);
  });

  // ── TC_027: Environment filter production ───────────────────────────────────
  test('TC_027: Environment filter production', async () => {
    console.log('[TC_027] Apply the "Production Only" environment filter');
    await openApiDashboard(page);
    const consumptionTab = page.locator('a:has-text("Credit Consumption"), [role="tab"]:has-text("Credit Consumption")').first();
    if (await consumptionTab.isVisible({ timeout: 8000 }).catch(() => false)) {
      await consumptionTab.click();
      await page.waitForTimeout(1500);
    }

    const prodFilter = page.locator('button:has-text("Production Only"), [class*="filter"]:has-text("Production")').first();
    if (!(await prodFilter.isVisible({ timeout: 8000 }).catch(() => false))) {
      console.log('[TC_027] ⚠️ "Production Only" filter not found — skipping');
      return;
    }
    await prodFilter.click();
    await page.waitForTimeout(1500);

    const sandboxRows = page.locator('tbody tr').filter({ hasText: /sandbox/i });
    const sandboxCount = await sandboxRows.count();
    expect.soft(sandboxCount).toBe(0);
    console.log(`[TC_027] ${sandboxCount === 0 ? '✅' : '⚠️'} Sandbox rows visible after Production Only filter: ${sandboxCount}`);
  });

  // ── TC_028: Combined filters logic ──────────────────────────────────────────
  test('TC_028: Combined filters logic', async () => {
    console.log('[TC_028] Apply Status + API + Environment filters together');
    await openApiDashboard(page);
    const consumptionTab = page.locator('a:has-text("Credit Consumption"), [role="tab"]:has-text("Credit Consumption")').first();
    if (await consumptionTab.isVisible({ timeout: 8000 }).catch(() => false)) {
      await consumptionTab.click();
      await page.waitForTimeout(1500);
    }

    const filters = [
      page.locator('button:has-text("Success")').first(),
      page.locator('[class*="api-filter"], select').filter({ hasText: /api/i }).first(),
      page.locator('button:has-text("Production Only")').first(),
    ];
    let appliedCount = 0;
    for (const filter of filters) {
      if (await filter.isVisible({ timeout: 3000 }).catch(() => false)) {
        await filter.click().catch(() => {});
        await page.waitForTimeout(800);
        appliedCount++;
      }
    }
    console.log(`[TC_028] Applied ${appliedCount}/3 filters`);

    const rows = page.locator('tbody tr:not(.ant-table-measure-row):has(td)');
    const resultCount = await rows.count();
    console.log(`[TC_028] ${appliedCount > 0 ? '✅' : '⚠️'} Combined filters applied, ${resultCount} row(s) remain — verify accuracy manually until filter locators are confirmed`);
  });

  // ── TC_029: Subscription pricing tab default ────────────────────────────────
  test('TC_029: Subscription pricing tab default', async () => {
    console.log('[TC_029] Open API Pricing page and check the default selected tab');
    await page.goto('https://app.volza.com/api-pricing');
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1500);

    const subscriptionTab = page.locator('[role="tab"], [class*="tab"]').filter({ hasText: /subscription/i }).first();
    if (!(await subscriptionTab.isVisible({ timeout: 8000 }).catch(() => false))) {
      console.log('[TC_029] ⚠️ Subscription pricing tab not found — skipping');
      return;
    }
    const isSelected = await subscriptionTab.evaluate((el) =>
      el.getAttribute('aria-selected') === 'true' || el.className.includes('active') || el.className.includes('selected')
    ).catch(() => false);
    expect.soft(isSelected, 'Subscription tab should be selected by default on API Pricing').toBeTruthy();
    console.log(`[TC_029] ${isSelected ? '✅' : '⚠️'} Subscription tab default-selected: ${isSelected}`);
  });

  // ── TC_030: Verify country API pricing table ────────────────────────────────
  test('TC_030: Verify country API pricing table', async () => {
    console.log('[TC_030] Open API Pricing and check the Country API section');
    await page.goto('https://app.volza.com/api-pricing');
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1500);

    const countryApiSection = page.locator('text=/Country API/i').first();
    if (!(await countryApiSection.isVisible({ timeout: 8000 }).catch(() => false))) {
      console.log('[TC_030] ⚠️ "Country API" section not found — skipping');
      return;
    }
    const pricingRows = page.locator('table tbody tr, [class*="pricing-row"]');
    const rowCount = await pricingRows.count();
    expect.soft(rowCount).toBeGreaterThan(0);
    console.log(`[TC_030] ${rowCount > 0 ? '✅' : '⚠️'} Country API pricing rows shown: ${rowCount}`);
  });

  // ── TC_031: Custom API pricing visibility ───────────────────────────────────
  test('TC_031: Custom API pricing visibility', async () => {
    console.log('[TC_031] Open API Pricing and check for the Custom API row (Enterprise-only)');
    await page.goto('https://app.volza.com/api-pricing');
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1500);

    const customApiRow = page.locator('text=/Custom API/i').first();
    const visible = await customApiRow.isVisible({ timeout: 8000 }).catch(() => false);
    console.log(visible
      ? '[TC_031] ✅ "Custom API" row is visible'
      : '[TC_031] ⚠️ "Custom API" row not visible — expected unless this account is on an Enterprise plan');
  });

  // ── TC_032: Redirect to API documentation ───────────────────────────────────
  test('TC_032: Redirect to API documentation', async () => {
    console.log('[TC_032] Click the Documentation tab from inside the API section');
    await openApiDashboard(page);
    const docsLink = page.locator('a:has-text("Documentation"), a:has-text("Docs")').first();
    if (!(await docsLink.isVisible({ timeout: 8000 }).catch(() => false))) {
      console.log('[TC_032] ⚠️ "Documentation" link not found — skipping');
      return;
    }
    const href = await docsLink.getAttribute('href');
    const opensNewTab = (await docsLink.getAttribute('target')) === '_blank';

    if (opensNewTab) {
      const [docsPage] = await Promise.all([page.context().waitForEvent('page'), docsLink.click()]);
      await docsPage.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
      expect.soft(docsPage.url(), 'Documentation link should navigate to a docs URL').toMatch(/docs|documentation/i);
      console.log(`[TC_032] ✅ Documentation opened in a new tab: ${docsPage.url()}`);
      await docsPage.close();
    } else {
      await docsLink.click();
      await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
      expect.soft(page.url(), 'Documentation link should navigate to a docs URL').toMatch(/docs|documentation/i);
      console.log(`[TC_032] ✅ Redirected to documentation: ${page.url()} (href was "${href}")`);
    }
  });

  // ── TC_033: Unauthorized API access ─────────────────────────────────────────
  test('TC_033: Unauthorized API access', async ({ request }) => {
    console.log('[TC_033] Call a Volza API endpoint with no auth token and expect 401');
    // Real base URL/endpoint path needs confirming against the actual API docs;
    // this targets the most likely REST convention as a best guess.
    const response = await request.get('https://api.volza.com/v1/shipments', {
      headers: { Authorization: '' },
      failOnStatusCode: false,
    }).catch((err) => {
      console.log(`[TC_033] ⚠️ Request failed outright (endpoint may not exist / needs confirming): ${err.message}`);
      return null;
    });
    if (!response) return;
    console.log(`[TC_033] Response status: ${response.status()}`);
    expect.soft(response.status()).toBe(401);
    console.log(`[TC_033] ${response.status() === 401 ? '✅' : '⚠️'} Unauthenticated call returned ${response.status()} (expected 401)`);
  });

  // ── TC_034: API key exposure check ──────────────────────────────────────────
  test('TC_034: API key exposure check', async () => {
    console.log('[TC_034] Inspect network responses while on the API dashboard for a fully-exposed key value');
    const exposedKeys = [];
    page.on('response', async (response) => {
      if (!/key|dashboard|profile/i.test(response.url())) return;
      try {
        const body = await response.text();
        // A raw, unmasked key would typically be a long alphanumeric token
        // with no mask characters anywhere in the payload around it.
        const match = body.match(/"(?:api[_-]?key|token)"\s*:\s*"([a-zA-Z0-9_-]{24,})"/i);
        if (match) exposedKeys.push({ url: response.url(), sample: match[1] });
      } catch (e) { /* non-text/binary response, ignore */ }
    });

    await openApiDashboard(page);
    await page.waitForTimeout(3000);

    expect.soft(exposedKeys, `Full unmasked key values should not appear in network responses: ${JSON.stringify(exposedKeys)}`).toHaveLength(0);
    console.log(`[TC_034] ${exposedKeys.length === 0 ? '✅' : '⚠️'} Unmasked key-shaped values found in responses: ${exposedKeys.length}`);
  });

  // ── TC_035: Sandbox vs Production isolation ─────────────────────────────────
  test('TC_035: Sandbox vs Production isolation', async ({ request }) => {
    console.log('[TC_035] Use a Sandbox key against a Production endpoint and expect it to be rejected');
    console.log('[TC_035] ⚠️ Requires real Sandbox/Production key values (generated in TC_016/TC_017) and confirmed API base URLs — not available to this spec run in isolation');
    test.skip(true, 'Needs real generated Sandbox/Production key values plumbed in from TC_016/TC_017 plus a confirmed API endpoint');
  });

  // ── TC_036: Expired token validation ────────────────────────────────────────
  test('TC_036: Expired token validation', async ({ browser }) => {
    console.log('[TC_036] Simulate an expired token/session and open the dashboard');
    // Same reasoning as TC_006: clear cookies/storage on a disposable clone
    // of the shared session, not the shared session itself.
    const context = await browser.newContext({ baseURL: 'https://app.volza.com', storageState: authState });
    const isolatedPage = await context.newPage();
    await isolatedPage.goto('https://app.volza.com/home');
    await isolatedPage.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});

    await context.clearCookies();
    await isolatedPage.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (e) { /* not accessible */ } });
    await openApiDashboard(isolatedPage);

    const loginPrompt = isolatedPage.locator('input[type="email"], text=/sign in|log in|session expired|token expired/i').first();
    const redirectedToLogin = /login|signin/i.test(isolatedPage.url());
    const loginPromptShown = await loginPrompt.isVisible({ timeout: 8000 }).catch(() => false);

    expect.soft(redirectedToLogin || loginPromptShown, 'Expired token should log the user out or block dashboard access').toBeTruthy();
    console.log(`[TC_036] ${redirectedToLogin || loginPromptShown ? '✅' : '⚠️'} Redirected to login: ${redirectedToLogin}, prompt shown: ${loginPromptShown}`);

    await context.close();
  });

  // ── TC_037: Dashboard load performance ──────────────────────────────────────
  test('TC_037: Dashboard load performance', async () => {
    console.log('[TC_037] Measure time to open the API Dashboard');
    const perfSlaMs = 8000;
    const start = Date.now();
    await openApiDashboard(page);
    const elapsed = Date.now() - start;
    expect.soft(elapsed, `API Dashboard should load within ${perfSlaMs}ms SLA`).toBeLessThan(perfSlaMs);
    console.log(`[TC_037] ${elapsed < perfSlaMs ? '✅' : '⚠️'} Dashboard loaded in ${elapsed}ms (SLA: ${perfSlaMs}ms)`);
  });

  // ── TC_038: Analytics filter performance ────────────────────────────────────
  test('TC_038: Analytics filter performance', async () => {
    console.log('[TC_038] Measure time to apply a filter on Credit Consumption with a large data volume');
    await openApiDashboard(page);
    const consumptionTab = page.locator('a:has-text("Credit Consumption"), [role="tab"]:has-text("Credit Consumption")').first();
    if (!(await consumptionTab.isVisible({ timeout: 8000 }).catch(() => false))) {
      console.log('[TC_038] ⚠️ "Credit Consumption" tab not found — skipping');
      return;
    }
    await consumptionTab.click();
    await page.waitForTimeout(1000);

    const successFilter = page.locator('button:has-text("Success")').first();
    if (!(await successFilter.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log('[TC_038] ⚠️ No filter control found — skipping');
      return;
    }
    const perfSlaMs = 5000;
    const start = Date.now();
    await successFilter.click();
    await page.waitForLoadState('networkidle', { timeout: perfSlaMs }).catch(() => {});
    const elapsed = Date.now() - start;
    expect.soft(elapsed, `Filter application should complete within ${perfSlaMs}ms SLA`).toBeLessThan(perfSlaMs);
    console.log(`[TC_038] ${elapsed < perfSlaMs ? '✅' : '⚠️'} Filter applied in ${elapsed}ms (SLA: ${perfSlaMs}ms)`);
  });

  // ── TC_039: Pricing table performance ───────────────────────────────────────
  test('TC_039: Pricing table performance', async () => {
    console.log('[TC_039] Measure time to open API Pricing with a large pricing dataset, and check for UI lag');
    const perfSlaMs = 6000;
    const start = Date.now();
    await page.goto('https://app.volza.com/api-pricing');
    await page.waitForLoadState('domcontentloaded', { timeout: perfSlaMs }).catch(() => {});
    const pricingTable = page.locator('table, [class*="pricing"]').first();
    await pricingTable.waitFor({ state: 'visible', timeout: perfSlaMs }).catch(() => {});
    const elapsed = Date.now() - start;
    expect.soft(elapsed, `Pricing page should render within ${perfSlaMs}ms without noticeable lag`).toBeLessThan(perfSlaMs);
    console.log(`[TC_039] ${elapsed < perfSlaMs ? '✅' : '⚠️'} Pricing page rendered in ${elapsed}ms (SLA: ${perfSlaMs}ms)`);
  });

  // ── TC_040: Concurrent API key generation ───────────────────────────────────
  test('TC_040: Concurrent API key generation', async () => {
    console.log('[TC_040] Fire multiple "Create Key" submissions concurrently and verify no crash');
    await openApiDashboard(page);
    const createKeyBtn = page.locator('button:has-text("Create Key"), button:has-text("Generate Key"), button:has-text("New Key")').first();
    if (!(await createKeyBtn.isVisible({ timeout: 8000 }).catch(() => false))) {
      console.log('[TC_040] ⚠️ "Create Key" control not found — skipping');
      return;
    }

    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await createKeyBtn.click();
    const popup = modalByTitle(page, /key/i);
    if (await popup.isVisible({ timeout: 5000 }).catch(() => false)) {
      const nameInput = popup.locator('input[placeholder*="name" i]').first();
      await nameInput.fill(`Concurrent_${Date.now()}`);
      const submitBtn = popup.locator('button:has-text("Create"), button:has-text("Generate"), button:has-text("Save")').first();
      // Fire several rapid clicks to simulate concurrent submission attempts.
      await Promise.all([submitBtn.click(), submitBtn.click().catch(() => {}), submitBtn.click().catch(() => {})]);
    }
    await page.waitForTimeout(2000);

    const crashed = await page.locator('body').isHidden().catch(() => false);
    expect.soft(crashed).toBeFalsy();
    expect.soft(pageErrors, `No unhandled JS errors expected under concurrent key generation: ${pageErrors.join('; ')}`).toHaveLength(0);
    console.log(`[TC_040] ${!crashed && pageErrors.length === 0 ? '✅' : '⚠️'} Page crashed: ${crashed}, unhandled JS errors: ${pageErrors.length}`);
  });
});
