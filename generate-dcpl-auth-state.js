// One-off/on-demand script (NOT run automatically by the test suite or
// global-setup.js) - logs in and selects the "DCPL Team Testing SME" company,
// then saves the resulting session to dcpl-auth-state.json.
//
// Why this exists: volza-api.spec.js needs a session on "DCPL Team Testing
// SME" (the only company with an active API plan), but global-setup.js
// always logs into "SME Biyearly plan" first for the rest of the suite, and
// this machine's IP/device appears to be server-side trusted once already
// verified in a run - a second live login attempted right after, from this
// same machine, gets silently short-circuited straight back to an
// already-authenticated Home page (skipping OTP and the company picker
// entirely), even after an explicit logout first. So a live second login
// can't be done reliably from this machine as part of the automated run.
//
// Run this manually instead - ideally from a machine/network that ISN'T
// already trusted by a recent login (e.g. right after your own manual login
// like the one in the "Choose a Company" screenshot) - to capture a working
// DCPL session once:
//
//   node generate-dcpl-auth-state.js
//
// volza-api.spec.js automatically uses dcpl-auth-state.json if present, and
// falls back to a live login (same one this script does) if it's missing -
// see that file's beforeAll. Re-run this script whenever the saved session
// expires (dcpl-auth-state.json's cookies will eventually stop working, at
// which point volza-api.spec.js's tests will start failing at the login/home
// step).
const dotenv = require('dotenv');
const { chromium } = require('@playwright/test');
const { loginAndSelectCompany } = require('./fixtures/auth.fixture');

dotenv.config({ path: ['.env', '.env.local'] });

const OUTPUT_FILE = 'dcpl-auth-state.json';
const TARGET_COMPANY = 'DCPL Team Testing SME';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ baseURL: 'https://app.volza.com', viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  console.log(`[generate-dcpl-auth-state] Logging in and selecting "${TARGET_COMPANY}"...`);

  // Fail loudly and early if this machine is already server-side trusted -
  // continuing would silently produce a session under the WRONG company.
  await page.goto('https://app.volza.com/home');
  await page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
  const alreadyAuthenticated = await page.locator('text=Logout').first().isVisible({ timeout: 5_000 }).catch(() => false);
  if (alreadyAuthenticated) {
    console.error(
      '[generate-dcpl-auth-state] ❌ This machine/context landed on an already-authenticated Home page ' +
      'without logging in - it appears to be server-side trusted (likely from a recent login on this same ' +
      'machine/IP, e.g. global-setup.js having just run). Re-run this script from a machine/network that has ' +
      'NOT recently logged into this account, or wait for that trust window to expire, then try again.'
    );
    await browser.close();
    process.exit(1);
  }

  try {
    await loginAndSelectCompany(page, TARGET_COMPANY);
  } catch (err) {
    console.error(`[generate-dcpl-auth-state] Login flow failed mid-way. Current URL: ${page.url()}`);
    await page.screenshot({ path: 'dcpl-login-failure.png', fullPage: true }).catch(() => {});
    console.error('[generate-dcpl-auth-state] Screenshot saved -> dcpl-login-failure.png');
    throw err;
  }

  await context.storageState({ path: OUTPUT_FILE });
  console.log(`[generate-dcpl-auth-state] ✅ Auth state for "${TARGET_COMPANY}" saved → ${OUTPUT_FILE}`);

  await browser.close();
})().catch((err) => {
  console.error('[generate-dcpl-auth-state] ❌ Failed:', err);
  process.exit(1);
});
