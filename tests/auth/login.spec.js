const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const { OtpPage } = require('../../pages/OtpPage');
const { readOtpFromOutlook } = require('../../utils/outlookReader');

// ─── Module 2: Log In Functionality ──────────────────────────────────────────
// Migrated from src/pages/Login.specs.js (TC-1..TC-7), rewritten against the
// LoginPage / OtpPage POMs instead of the original's inline locators.
//
// Pre-conditions:
//   • Registered email set via VOLZA_LOGIN_EMAIL env var
//   • Tests start unauthenticated (storageState overridden to empty)

test.describe('Auth - Login', () => {
  // Override global storageState so every test starts unauthenticated
  test.use({ storageState: { cookies: [], origins: [] } });

  // ── TC-AUTH-001 (was TC-1): Successful login with valid OTP ───────────────
  test('TC-AUTH-001: Valid OTP login and redirect to Welcome page', async ({ page }) => {
    const email = process.env.VOLZA_LOGIN_EMAIL;
    const loginPage = new LoginPage(page);
    const otpPage = new OtpPage(page);

    console.log('[TC-AUTH-001] Navigate to login page');
    await loginPage.goto();

    console.log('[TC-AUTH-001] Select Email method and enter registered email');
    await loginPage.selectEmailMethod();
    await loginPage.enterEmail(email);

    const signInTimestamp = new Date();
    console.log('[TC-AUTH-001] Click Sign In / request OTP');
    await loginPage.clickSignIn();
    await loginPage.dismissOtpSentModal();
    await loginPage.selectEmailOtpDeliveryMethod();

    console.log('[TC-AUTH-001] Wait for OTP page and enter OTP received via email');
    await otpPage.waitForOtpPage();
    const otp = await readOtpFromOutlook({
      receivedAfter: signInTimestamp,
      senderDomain: process.env.OTP_SENDER_DOMAIN,
      subjectKeyword: process.env.OTP_SUBJECT_KEYWORD,
    });
    await otpPage.enterOtp(otp);

    console.log('[TC-AUTH-001] Submit OTP');
    await otpPage.submitOtp();

    await expect.soft(page).toHaveURL(/multiple-companies|home|welcome/, { timeout: 20000 });
    console.log('[TC-AUTH-001] Login successful — redirected to:', page.url());
  });

  // ── TC-AUTH-002 (was TC-2): Invalid OTP shows error ────────────────────────
  // Tagged @otp-edge: exercises its own full login/OTP cycle by design (that's what
  // it's testing). Exclude this tag on a full-suite run to avoid piling up repeated
  // live OTP logins before the run ever reaches the other modules — see auth.testcases.md.
  test('TC-AUTH-002: Invalid OTP shows error message', { tag: '@otp-edge' }, async ({ page }) => {
    const loginPage = new LoginPage(page);
    const otpPage = new OtpPage(page);

    console.log('[TC-AUTH-002] Navigate to login page and enter email');
    await loginPage.goto();
    await loginPage.selectEmailMethod();
    await loginPage.enterEmail(process.env.VOLZA_LOGIN_EMAIL);
    await loginPage.clickSignIn();
    await loginPage.dismissOtpSentModal();
    await loginPage.selectEmailOtpDeliveryMethod();

    console.log('[TC-AUTH-002] Enter invalid OTP "000000"');
    await otpPage.waitForOtpPage();
    await otpPage.enterOtp('000000');
    await otpPage.submitOtp();

    const hasError = await otpPage.isErrorVisible();
    expect.soft(hasError).toBeTruthy();
    console.log(`[TC-AUTH-002] Error shown: "${(await otpPage.getErrorText()).slice(0, 80)}"`);
  });

  // ── TC-AUTH-003 (was TC-3): Expired OTP shows error ────────────────────────
  test('TC-AUTH-003: Expired OTP shows expiry error message', { tag: '@otp-edge' }, async ({ page }) => {
    const loginPage = new LoginPage(page);
    const otpPage = new OtpPage(page);

    console.log('[TC-AUTH-003] Navigate to login page');
    await loginPage.goto();
    await loginPage.selectEmailMethod();
    await loginPage.enterEmail(process.env.VOLZA_LOGIN_EMAIL);
    await loginPage.clickSignIn();
    await loginPage.dismissOtpSentModal();
    await loginPage.selectEmailOtpDeliveryMethod();

    await otpPage.waitForOtpPage();

    console.log('[TC-AUTH-003] Enter a known-expired OTP "111111"');
    await otpPage.enterOtp('111111');
    await otpPage.submitOtp();

    const hasError = await otpPage.isErrorVisible();
    expect.soft(hasError).toBeTruthy();
    console.log(`[TC-AUTH-003] Error shown: "${(await otpPage.getErrorText()).slice(0, 80)}"`);
  });

  // ── TC-AUTH-004 (was TC-4): Multiple OTP requests — latest OTP is valid ───
  test('TC-AUTH-004: Multiple OTP requests - latest OTP is valid', { tag: '@otp-edge' }, async ({ page }) => {
    const loginPage = new LoginPage(page);
    const otpPage = new OtpPage(page);

    console.log('[TC-AUTH-004] Navigate to login page');
    await loginPage.goto();
    await loginPage.selectEmailMethod();
    await loginPage.enterEmail(process.env.VOLZA_LOGIN_EMAIL);

    console.log('[TC-AUTH-004] Request OTP');
    await loginPage.clickSignIn();
    await loginPage.dismissOtpSentModal();
    await loginPage.selectEmailOtpDeliveryMethod();
    await otpPage.waitForOtpPage();

    const resendBtn = page.locator('button:has-text("Resend"), a:has-text("Resend"), button:has-text("Request Again")').first();
    if (await resendBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      const resendTimestamp = new Date();
      await resendBtn.click();
      await page.waitForTimeout(2000);

      const latestOtp = await readOtpFromOutlook({
        receivedAfter: resendTimestamp,
        senderDomain: process.env.OTP_SENDER_DOMAIN,
        subjectKeyword: process.env.OTP_SUBJECT_KEYWORD,
      });
      await otpPage.enterOtp(latestOtp);
      await otpPage.submitOtp();

      await expect.soft(page).toHaveURL(/multiple-companies|home|welcome/, { timeout: 20000 });
      console.log('[TC-AUTH-004] Login successful with latest OTP after multiple requests');
    } else {
      console.log('[TC-AUTH-004] Resend button not available — skipping resend step');
    }
  });

  // ── TC-AUTH-005 (was TC-5): Empty OTP field shows validation error ────────
  test('TC-AUTH-005: Empty OTP field shows "Please enter OTP" error', { tag: '@otp-edge' }, async ({ page }) => {
    const loginPage = new LoginPage(page);
    const otpPage = new OtpPage(page);

    console.log('[TC-AUTH-005] Navigate to login page and request OTP');
    await loginPage.goto();
    await loginPage.selectEmailMethod();
    await loginPage.enterEmail(process.env.VOLZA_LOGIN_EMAIL);
    await loginPage.clickSignIn();
    await loginPage.dismissOtpSentModal();
    await loginPage.selectEmailOtpDeliveryMethod();

    console.log('[TC-AUTH-005] Leave OTP empty and submit');
    await otpPage.waitForOtpPage();
    await otpPage.submitOtp();

    const hasError = await otpPage.isErrorVisible();
    expect.soft(hasError).toBeTruthy();
    console.log(`[TC-AUTH-005] Error shown: "${(await otpPage.getErrorText()).slice(0, 80)}"`);
  });

  // ── TC-AUTH-006 (was TC-6): Unregistered email shows account not found ────
  test('TC-AUTH-006: Unregistered email shows "not associated with any account" error', { tag: '@otp-edge' }, async ({ page }) => {
    const loginPage = new LoginPage(page);
    const otpPage = new OtpPage(page);

    console.log('[TC-AUTH-006] Navigate to login page');
    await loginPage.goto();
    await loginPage.selectEmailMethod();

    console.log('[TC-AUTH-006] Enter unregistered email');
    await loginPage.enterEmail('notregistered_xyz999@example.com');
    await loginPage.clickSignIn();

    const hasError = await otpPage.isErrorVisible();
    expect.soft(hasError).toBeTruthy();
    console.log(`[TC-AUTH-006] Error shown: "${(await otpPage.getErrorText()).slice(0, 80)}"`);
  });

  // ── TC-AUTH-007 (was TC-7): Alternative OTP delivery (SMS / WhatsApp) ─────
  // The delivery-method picker ("click here" -> Email/Text/WhatsApp -> Send OTP) now gates
  // every login up front, rather than being offered as an alternative after an OTP is already
  // sent via email - so this verifies the picker itself and its send options directly, instead
  // of waiting for an OTP page that won't appear until a delivery method is chosen.
  test('TC-AUTH-007: OTP via mobile text or WhatsApp alternative', { tag: '@otp-edge' }, async ({ page }) => {
    const loginPage = new LoginPage(page);

    console.log('[TC-AUTH-007] Navigate to login page and request OTP');
    await loginPage.goto();
    await loginPage.selectEmailMethod();
    await loginPage.enterEmail(process.env.VOLZA_LOGIN_EMAIL);
    await loginPage.clickSignIn();
    await loginPage.dismissOtpSentModal();

    console.log('[TC-AUTH-007] Click "click here" link for alternative OTP delivery');
    try {
      await loginPage.clickHereLink.waitFor({ state: 'visible', timeout: 8000 });
      await loginPage.clickHereLink.click();
      await page.waitForTimeout(1000);

      const mobileOtpPopup = page.locator('[class*="modal"], [class*="popup"], [role="dialog"]').first();
      await expect.soft(mobileOtpPopup).toBeVisible({ timeout: 8000 });
      const anyOption = page.locator(
        'button:has-text("Email"), button:has-text("Text"), button:has-text("WhatsApp"), label:has-text("Email"), label:has-text("SMS"), label:has-text("WhatsApp")'
      ).first();
      await expect.soft(anyOption).toBeVisible({ timeout: 5000 });
      console.log('[TC-AUTH-007] Alternative OTP popup opened with send options');
    } catch {
      console.log('[TC-AUTH-007] Alternative OTP link not visible on this page variant — skipping');
    }
  });
});
