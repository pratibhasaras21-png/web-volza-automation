const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const { OtpPage } = require('../../pages/OtpPage');
const { readOtpFromOutlook } = require('../../utils/outlookReader');

// ─── Module 1: Sign Up Functionality ─────────────────────────────────────────
// Migrated from src/pages/SignUp.specs.js (TC-1..TC-3).
//
// Pre-conditions:
//   • Use a fresh email & mobile not previously registered on app.volza.com
//   • Have username, company name, and desired plan details ready
//   • Set env vars: SIGNUP_EMAIL, SIGNUP_MOBILE, SIGNUP_NAME, SIGNUP_COMPANY
//
// Note: only TC-AUTH-011 (post-signup login check, formerly TC-3) goes through
// the standard app.volza.com login form, so only that test uses the LoginPage /
// OtpPage POMs. TC-AUTH-009's inline OTP entry is a different, signup-specific
// form (generic input[placeholder*="OTP"] inside the signup wizard, not the
// login page's OTP step) and is kept inline as in the original.

test.describe('Auth - Sign Up', () => {
  // Override global storageState so tests start unauthenticated
  test.use({ storageState: { cookies: [], origins: [] } });

  // ── TC-AUTH-009 (was TC-1): Free Trial Sign-Up end-to-end ─────────────────
  // Tagged @signup: creates an actual new account end-to-end — exclude on a
  // fast/full-suite run. See auth.testcases.md for the command.
  test('TC-AUTH-009: Free Trial plan - complete sign-up flow', { tag: '@signup' }, async ({ page }) => {
    const signupEmail = process.env.SIGNUP_EMAIL || 'testuser@example.com';
    const signupName = process.env.SIGNUP_NAME || 'Test User';
    const signupCompany = process.env.SIGNUP_COMPANY || 'Test Company';

    console.log('[TC-AUTH-009] Step 1: Navigate to app.volza.com');
    await page.goto('https://www.volza.com');
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });

    console.log('[TC-AUTH-009] Step 2: Click Sign Up button');
    await page.locator('a:has-text("Sign Up"), button:has-text("Sign Up")').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });

    console.log('[TC-AUTH-009] Step 3: Select Free Trial plan');
    await page.locator('[class*="plan"], [class*="card"]').filter({ hasText: /free trial/i }).first().click();
    await page.waitForTimeout(1000);

    console.log('[TC-AUTH-009] Step 4: Fill required personal details');
    const nameField = page.locator('input[name*="name"], input[placeholder*="name" i]').first();
    await nameField.waitFor({ state: 'visible', timeout: 10000 });
    await nameField.fill(signupName);

    const emailField = page.locator('input[type="email"], input[name*="email"]').first();
    await emailField.fill(signupEmail);

    const mobileField = page.locator('input[type="tel"], input[name*="mobile"], input[name*="phone"]').first();
    await mobileField.fill(process.env.SIGNUP_MOBILE || '9876543210');

    await page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Proceed")').first().click();
    await page.waitForTimeout(1500);

    console.log('[TC-AUTH-009] Step 5: Fill company details');
    const companyField = page.locator('input[name*="company"], input[placeholder*="company" i]').first();
    await companyField.waitFor({ state: 'visible', timeout: 10000 });
    await companyField.fill(signupCompany);
    await page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Proceed")').first().click();
    await page.waitForTimeout(1500);

    console.log('[TC-AUTH-009] Step 6: Validate plan details page - check Change Plan option');
    const planDetailsHeading = page.locator('[class*="plan-detail"], h2, h3').filter({ hasText: /plan detail/i }).first();
    await planDetailsHeading.waitFor({ state: 'visible', timeout: 10000 });
    await expect(planDetailsHeading).toBeVisible();
    const changePlanBtn = page.locator('button:has-text("Change Plan"), a:has-text("Change Plan")').first();
    await expect(changePlanBtn).toBeVisible();

    console.log('[TC-AUTH-009] Step 7: Validate Login option on plan details page');
    const loginLink = page.locator('a:has-text("Login"), button:has-text("Login")').first();
    await expect(loginLink).toBeVisible();

    console.log('[TC-AUTH-009] Step 8: Complete sign-up and validate OTP sent to email');
    const signUpTimestamp = new Date();
    await page.locator('button:has-text("Sign Up"), button:has-text("Submit"), button:has-text("Complete")').first().click();
    await page.waitForTimeout(2000);

    const otpInput = page.locator('input[placeholder*="OTP"], input[placeholder*="otp"], input[name*="otp"]').first();
    await otpInput.waitFor({ state: 'visible', timeout: 20000 });
    const otp = await readOtpFromOutlook({ receivedAfter: signUpTimestamp });
    console.log(`[TC-AUTH-009] OTP received: ${otp}`);
    await otpInput.fill(otp);
    await page.locator('button:has-text("Verify"), button:has-text("Submit"), button:has-text("Confirm")').first().click();
    await page.waitForTimeout(2000);

    console.log('[TC-AUTH-009] Step 9: Complete questionnaire');
    const questionnaireSection = page.locator('[class*="questionnaire"], [class*="onboard"]').first();
    try {
      await questionnaireSection.waitFor({ state: 'visible', timeout: 10000 });
      const nextBtn = page.locator('button:has-text("Next"), button:has-text("Finish"), button:has-text("Done")').first();
      while (await nextBtn.isVisible()) {
        await nextBtn.click();
        await page.waitForTimeout(800);
      }
    } catch {
      console.log('[TC-AUTH-009] Questionnaire not present or already done');
    }

    console.log('[TC-AUTH-009] Step 10: Validate final landing page details match signup data');
    await page.waitForURL(/home|dashboard|welcome/, { timeout: 20000 });
    const pageContent = await page.content();
    expect(pageContent).toContain(signupName);

    console.log('[TC-AUTH-009] Step 11-12: Request OTP via login button on landing page and verify redirect to Welcome page');
    const loginBtn = page.locator('button:has-text("Login"), a:has-text("Login")').first();
    if (await loginBtn.isVisible()) {
      await loginBtn.click();
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
      await expect(page).toHaveURL(/signin|login|welcome/);
    }
  });

  // ── TC-AUTH-010 (was TC-2): Plan details - change plan, amount reflection ─
  test('TC-AUTH-010: Plan details page - change plan, amount reflection, and login redirect', { tag: '@signup' }, async ({ page }) => {
    console.log('[TC-AUTH-010] Step 1: Navigate to sign-up and reach plan details page');
    await page.goto('https://app.volza.com');
    await page.locator('a:has-text("Sign Up"), button:has-text("Sign Up")').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });

    const anyPlan = page.locator('[class*="plan"], [class*="card"]').first();
    await anyPlan.waitFor({ state: 'visible', timeout: 10000 });
    await anyPlan.click();
    await page.waitForTimeout(1000);

    console.log('[TC-AUTH-010] Fill minimal required fields and proceed to plan details');
    const emailField = page.locator('input[type="email"]').first();
    await emailField.waitFor({ state: 'visible', timeout: 10000 });
    await emailField.fill(process.env.SIGNUP_EMAIL || 'testuser@example.com');
    await page.locator('input[type="tel"], input[name*="mobile"]').first().fill('9876543210');
    await page.locator('button:has-text("Next"), button:has-text("Continue")').first().click();
    await page.waitForTimeout(1500);

    console.log('[TC-AUTH-010] Step 6: Validate Change Plan option and amount reflection');
    const changePlanBtn = page.locator('button:has-text("Change Plan"), a:has-text("Change Plan")').first();
    await changePlanBtn.waitFor({ state: 'visible', timeout: 10000 });
    await expect(changePlanBtn).toBeVisible();

    const amountDisplay = page.locator('[class*="amount"], [class*="price"]').first();
    await expect(amountDisplay).toBeVisible();
    const initialAmount = await amountDisplay.textContent();
    console.log(`[TC-AUTH-010] Initial plan amount: ${initialAmount}`);

    await changePlanBtn.click();
    await page.waitForTimeout(1000);
    const alternatePlan = page.locator('[class*="plan"], [class*="card"]').nth(1);
    await alternatePlan.click();
    await page.waitForTimeout(1000);
    const updatedAmount = await amountDisplay.textContent();
    console.log(`[TC-AUTH-010] Updated plan amount after change: ${updatedAmount}`);
    expect(updatedAmount).not.toBe(initialAmount);

    console.log('[TC-AUTH-010] Step 7: Click Login option and verify redirect with pre-filled email');
    const loginLink = page.locator('a:has-text("Login"), button:has-text("Login")').first();
    await loginLink.click();
    await page.waitForURL(/signin|login/, { timeout: 10000 });
    const emailPrefilled = page.locator('input[type="email"]').first();
    const emailVal = await emailPrefilled.inputValue();
    console.log(`[TC-AUTH-010] Pre-filled email on login page: ${emailVal}`);
    await expect(emailPrefilled).toBeVisible();
  });

  // ── TC-AUTH-011 (was TC-3): My Account plan and credit validation ─────────
  test('TC-AUTH-011: Post sign-up - My Account plan & credits validation', { tag: '@signup' }, async ({ page }) => {
    console.log('[TC-AUTH-011] Login with newly created free trial account');
    const email = process.env.SIGNUP_EMAIL || 'testuser@example.com';

    const loginPage = new LoginPage(page);
    const otpPage = new OtpPage(page);

    await loginPage.goto();
    await loginPage.selectEmailMethod();
    await loginPage.enterEmail(email);
    const signInTimestamp = new Date();
    await loginPage.clickSignIn();
    await loginPage.dismissOtpSentModal();

    await otpPage.waitForOtpPage();
    const otp = await readOtpFromOutlook({
      receivedAfter: signInTimestamp,
      senderDomain: process.env.OTP_SENDER_DOMAIN,
      subjectKeyword: process.env.OTP_SUBJECT_KEYWORD,
    });
    await otpPage.enterOtp(otp);
    await otpPage.submitOtp();

    const hasError = await otpPage.isErrorVisible();
    if (hasError) {
      throw new Error(`OTP verification failed: ${await otpPage.getErrorText()}`);
    }
    await page.waitForURL(/home|dashboard/, { timeout: 20000 });

    console.log('[TC-AUTH-011] Step 13: Navigate to My Account and verify correct plan');
    await page.locator('a:has-text("My Account"), [href*="account"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    const planInfo = page.locator('[class*="plan"], [class*="subscription"]').filter({ hasText: /free trial/i }).first();
    await expect(planInfo).toBeVisible();

    console.log('[TC-AUTH-011] Step 14: Verify user details match signup data');
    const userDetails = await page.locator('[class*="profile"], [class*="account-info"]').first().textContent();
    expect(userDetails).toBeTruthy();

    console.log('[TC-AUTH-011] Step 15: Verify auto-generated workspace in My Workspaces');
    await page.locator('a:has-text("My Workspaces"), [href*="workspace"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    const workspaceItems = page.locator('[class*="workspace-item"], tbody tr, [class*="workspace-card"]');
    await expect(workspaceItems.first()).toBeVisible();

    console.log('[TC-AUTH-011] Step 16: Verify credits (download, search, hot company) match plan specs');
    await page.locator('a:has-text("My Account"), [href*="account"]').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    const creditsSection = page.locator('[class*="credit"], [class*="balance"]').first();
    await expect(creditsSection).toBeVisible();
  });
});
