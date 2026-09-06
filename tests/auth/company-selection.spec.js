const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const { OtpPage } = require('../../pages/OtpPage');
const { SelectCompanyPage } = require('../../pages/SelectCompanyPage');
const { readOtpFromOutlook } = require('../../utils/outlookReader');

// ─── Auth - Login and Company Selection ──────────────────────────────────────
// Merged from src/pages/OtpPage.specs.js and tests/SelectCompany.spec.ts — both
// exercised the same login -> OTP -> company-select -> home flow as near-duplicates.
// tests/SelectCompany.spec.ts is used as the base since it already used LoginPage;
// its inline OtpStep class and its (never-actually-existing) SelectCompanyPage
// import are swapped for the real OtpPage / SelectCompanyPage POMs.
//
// Pre-conditions:
//   • Registered email set via VOLZA_LOGIN_EMAIL env var
//   • Tests start unauthenticated (storageState overridden to empty)

const TARGET_COMPANY = process.env.VOLZA_COMPANY || 'SME Biyearly plan';

test.describe('Auth - Login and Company Selection', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  // Tagged @otp-edge alongside login.spec.ts's negative/edge OTP cases: this is
  // another full, independent login cycle. Exclude on a full-suite run — see
  // auth.testcases.md for the reasoning and the command to skip these.
  test('TC-AUTH-008: Login, select company and reach home page', { tag: '@otp-edge' }, async ({ page }) => {
    const loginEmail = process.env.VOLZA_LOGIN_EMAIL;
    if (!loginEmail) throw new Error('VOLZA_LOGIN_EMAIL is not set in .env');

    const loginPage = new LoginPage(page);
    const otpPage = new OtpPage(page);
    const selectCompanyPage = new SelectCompanyPage(page);

    // Step 1: Navigate to sign-in page
    console.log('[TC-AUTH-008] Step 1: Navigating to sign-in page...');
    await loginPage.goto();

    // Step 2: Select Email method
    console.log('[TC-AUTH-008] Step 2: Selecting Email login method...');
    await loginPage.selectEmailMethod();

    // Step 3: Enter email
    console.log(`[TC-AUTH-008] Step 3: Entering email: ${loginEmail}`);
    await loginPage.enterEmail(loginEmail);

    // Capture timestamp so OTP search only picks up the fresh email
    const signInTimestamp = new Date();

    // Step 4: Click Sign In
    console.log('[TC-AUTH-008] Step 4: Clicking Sign In...');
    await loginPage.clickSignIn();

    // Step 5: Dismiss "OTP Sent" modal
    console.log('[TC-AUTH-008] Step 5: Dismissing OTP sent modal...');
    await loginPage.dismissOtpSentModal();

    // Step 5b: Pick "Email" as the OTP delivery method - required before the OTP is actually sent
    console.log('[TC-AUTH-008] Step 5b: Selecting Email OTP delivery method...');
    await loginPage.selectEmailOtpDeliveryMethod();

    // Step 6: Wait for OTP input page
    console.log('[TC-AUTH-008] Step 6: Waiting for OTP page...');
    await otpPage.waitForOtpPage();

    // Step 7: Read OTP from Outlook via Microsoft Graph API
    console.log('[TC-AUTH-008] Step 7: Reading OTP from Outlook...');
    const otp = await readOtpFromOutlook({
      receivedAfter: signInTimestamp,
      senderDomain: process.env.OTP_SENDER_DOMAIN,
      subjectKeyword: process.env.OTP_SUBJECT_KEYWORD,
    });
    console.log(`[TC-AUTH-008] OTP received: ${otp}`);

    // Step 8: Enter OTP
    console.log('[TC-AUTH-008] Step 8: Entering OTP...');
    await otpPage.enterOtp(otp);

    // Step 9: Submit OTP
    console.log('[TC-AUTH-008] Step 9: Submitting OTP...');
    await otpPage.submitOtp();

    // Verify no OTP error shown
    const hasError = await otpPage.isErrorVisible();
    if (hasError) {
      const errorText = await otpPage.getErrorText();
      throw new Error(`OTP verification failed: ${errorText}`);
    }

    // Step 10: Wait for company selection page (https://www.volza.com/multiple-companies/)
    console.log('[TC-AUTH-008] Step 10: Waiting for company selection page...');
    await selectCompanyPage.waitForCompanyPage();

    // Step 11: Select the target company
    console.log(`[TC-AUTH-008] Step 11: Selecting company "${TARGET_COMPANY}"...`);
    await selectCompanyPage.selectCompany(TARGET_COMPANY);

    // Step 12: Verify redirect to https://app.volza.com/home
    console.log('[TC-AUTH-008] Step 12: Waiting for redirect to home page...');
    await selectCompanyPage.waitForHomePage();

    await expect(page).toHaveURL(/app\.volza\.com\/home/, { timeout: 20_000 });
    console.log(`[TC-AUTH-008] Successfully logged in and reached: ${page.url()}`);
  });
});
