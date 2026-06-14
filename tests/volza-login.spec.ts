import { test, expect, Page } from '@playwright/test';
import * as dotenv from 'dotenv';
import { LoginPage } from '../src/pages/LoginPage';
import { OtpPage } from '../src/pages/OtpPage';
import { SearchPage } from '../src/pages/SearchPage';
import { readOtpFromGmail } from '../src/utils/emailReader';
import { logFailure, FailureRecord } from '../src/utils/reporter';

dotenv.config();

async function handleFailure(
  page: Page,
  testName: string,
  step: string,
  error: Error
): Promise<void> {
  const screenshotName = `failure-${step}-${Date.now()}.png`;
  const screenshotPath = `reports/failures/${screenshotName}`;

  try {
    await page.screenshot({ path: screenshotPath, fullPage: true });
  } catch {
    console.warn('[test] Could not capture screenshot');
  }

  const record: FailureRecord = {
    testName,
    timestamp: new Date().toISOString(),
    step,
    errorMessage: error.message,
    screenshotPath,
    url: page.url(),
  };

  logFailure(record);
}

test.describe('Volza Login Flow', () => {
  test('should login with email OTP successfully', async ({ page }) => {
    const testName = 'Volza Email OTP Login';
    const loginEmail = process.env.VOLZA_LOGIN_EMAIL;

    if (!loginEmail) {
      throw new Error('VOLZA_LOGIN_EMAIL is not set in .env');
    }

    const loginPage = new LoginPage(page);
    const otpPage = new OtpPage(page);

    // Step 1: Navigate to sign-in page
    try {
      await loginPage.goto();
    } catch (err) {
      await handleFailure(page, testName, 'navigate-to-signin', err as Error);
      throw err;
    }

    // Step 2: Ensure Email radio is selected
    try {
      await loginPage.selectEmailMethod();
    } catch (err) {
      await handleFailure(page, testName, 'select-email-radio', err as Error);
      throw err;
    }

    // Step 3: Enter business email
    try {
      await loginPage.enterEmail(loginEmail);
    } catch (err) {
      await handleFailure(page, testName, 'enter-email', err as Error);
      throw err;
    }

    // Capture timestamp before triggering OTP so we only read the freshly sent email
    const signInTimestamp = new Date();

    // Step 4: Click Sign In
    try {
      await loginPage.clickSignIn();
    } catch (err) {
      await handleFailure(page, testName, 'click-sign-in', err as Error);
      throw err;
    }

    // Step 5: Dismiss the "OTP Sent" confirmation modal
    try {
      await loginPage.dismissOtpSentModal();
    } catch (err) {
      await handleFailure(page, testName, 'dismiss-otp-sent-modal', err as Error);
      throw err;
    }

    // Step 6: Wait for OTP input page/step to appear
    try {
      await otpPage.waitForOtpPage();
    } catch (err) {
      await handleFailure(page, testName, 'wait-for-otp-page', err as Error);
      throw err;
    }

    // Step 7: Read OTP from Gmail via IMAP
    let otp: string;
    try {
      otp = await readOtpFromGmail({
        receivedAfter: signInTimestamp,
        senderDomain: process.env.OTP_SENDER_DOMAIN,
        subjectKeyword: process.env.OTP_SUBJECT_KEYWORD,
      });
    } catch (err) {
      await handleFailure(page, testName, 'read-otp-from-gmail', err as Error);
      throw err;
    }

    // Step 8: Enter OTP
    try {
      await otpPage.enterOtp(otp);
    } catch (err) {
      await handleFailure(page, testName, 'enter-otp', err as Error);
      throw err;
    }

    // Step 9: Submit OTP
    try {
      await otpPage.submitOtp();
    } catch (err) {
      await handleFailure(page, testName, 'submit-otp', err as Error);
      throw err;
    }

    // Step 10: Verify login success
    try {
      const hasError = await otpPage.isErrorVisible();
      if (hasError) {
        const errorText = await otpPage.getErrorText();
        throw new Error(`OTP verification failed: ${errorText}`);
      }

      await expect(page).not.toHaveURL(/signin-wizard/, { timeout: 15_000 });
      console.log(`[test] Login successful. Current URL: ${page.url()}`);
    } catch (err) {
      await handleFailure(page, testName, 'verify-login-success', err as Error);
      throw err;
    }

    const searchPage = new SearchPage(page);

    // Step 11: Navigate to home and click Search tab
    try {
      await searchPage.goto();
      await searchPage.clickSearchTab();
      console.log(`[test] Search tab clicked. URL: ${page.url()}`);
    } catch (err) {
      await handleFailure(page, testName, 'navigate-to-search-tab', err as Error);
      throw err;
    }

    // Step 12: Select country — Afghanistan Export-Detailed
    try {
      await searchPage.selectCountry('Afghanistan');
      console.log('[test] Country selected: Afghanistan Export-Detailed');
    } catch (err) {
      await handleFailure(page, testName, 'select-country', err as Error);
      throw err;
    }

    // Step 13: Select period — Last 1 Year
    try {
      await searchPage.selectPeriod('Last 1 Year');
      console.log('[test] Period selected: Last 1 Year');
    } catch (err) {
      await handleFailure(page, testName, 'select-period', err as Error);
      throw err;
    }

    // Step 14: Enter product keyword — oil
    try {
      await searchPage.enterProductKeyword('oil');
      console.log('[test] Product keyword entered: oil');
    } catch (err) {
      await handleFailure(page, testName, 'enter-product-keyword', err as Error);
      throw err;
    }

    // Step 15: Click Search
    try {
      await searchPage.clickSearch();
      console.log(`[test] Search executed. Current URL: ${page.url()}`);
    } catch (err) {
      await handleFailure(page, testName, 'click-search', err as Error);
      throw err;
    }
  });
});
