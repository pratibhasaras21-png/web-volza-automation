const { test: base, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { LoginPage } = require('../pages/LoginPage');
const { OtpPage } = require('../pages/OtpPage');
const { SelectCompanyPage } = require('../pages/SelectCompanyPage');
const { readOtpFromOutlook } = require('../utils/outlookReader');

/**
 * Full email+OTP login → company selection flow. Replaces the CommonJS
 * helpers/auth.js#loginAndSelectCompany and the ad hoc inline versions that were
 * duplicated across several spec files.
 */
async function loginAndSelectCompany(page, company) {
  const email = process.env.VOLZA_LOGIN_EMAIL;
  if (!email) throw new Error('VOLZA_LOGIN_EMAIL is not set in .env');
  const targetCompany = company || process.env.VOLZA_COMPANY || 'SME Biyearly plan';

  const loginPage = new LoginPage(page);
  const otpPage = new OtpPage(page);
  const selectCompanyPage = new SelectCompanyPage(page);

  await loginPage.goto();
  await loginPage.selectEmailMethod();
  await loginPage.enterEmail(email);

  const signInTimestamp = new Date();
  await loginPage.clickSignIn();
  await loginPage.dismissOtpSentModal();
  await loginPage.selectEmailOtpDeliveryMethod();
  await otpPage.waitForOtpPage();

  const otp = await readOtpFromOutlook({
    receivedAfter: signInTimestamp,
    senderDomain: process.env.OTP_SENDER_DOMAIN,
    subjectKeyword: process.env.OTP_SUBJECT_KEYWORD,
  });
  console.log(`[auth.fixture] OTP: ${otp}`);

  await otpPage.enterOtp(otp);
  await otpPage.submitOtp();

  const hasError = await otpPage.isErrorVisible();
  if (hasError) {
    throw new Error(`OTP verification failed: ${await otpPage.getErrorText()}`);
  }

  await selectCompanyPage.waitForCompanyPage();
  await selectCompanyPage.selectCompany(targetCompany);
  await selectCompanyPage.waitForHomePage();
  console.log(`[auth.fixture] ✅ Logged in and reached: ${page.url()}`);
}

const AUTH_FILE = path.join(__dirname, '..', 'playwright', '.auth', 'user.json');

/**
 * Logs in only if the cached session (AUTH_FILE) is missing or expired; otherwise
 * reuses it. Persists cookies after a fresh login so subsequent tests in the run
 * skip the OTP flow entirely.
 */
async function ensureLoggedIn(page, company) {
  await page.goto('https://app.volza.com/home');
  await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });

  if (page.url().includes('/home')) {
    return;
  }

  await loginAndSelectCompany(page, company);

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });
}

/**
 * Extends the base Playwright test with a `loggedInPage` fixture that reuses the
 * cached session and only performs a full OTP login when needed.
 */
const test = base.extend({
  loggedInPage: async ({ page }, use) => {
    await ensureLoggedIn(page);
    await use(page);
  },
});

module.exports = { loginAndSelectCompany, ensureLoggedIn, test, expect };
