// Runs ONCE before the entire test suite.
// Logs in with OTP, saves browser cookies/localStorage to auth-state.json.
// All tests that use storageState: 'auth-state.json' skip the login step entirely.
const dotenv = require('dotenv');
const { chromium } = require('@playwright/test');
const { loginAndSelectCompany } = require('./fixtures/auth.fixture');

dotenv.config({ path: ['.env', '.env.local'] });

module.exports = async function globalSetup(config) {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  // Must match playwright.config.js's `use.baseURL` — this context is created manually
  // (not via the `page` test fixture), so it doesn't inherit that config automatically.
  // LoginPage.goto() navigates with a relative URL and depends on it being set here.
  const context = await browser.newContext({ baseURL: 'https://app.volza.com', viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  console.log('[globalSetup] Logging in once for all SME tests...');
  await loginAndSelectCompany(page, process.env.VOLZA_COMPANY || 'SME Biyearly plan');

  await context.storageState({ path: 'auth-state.json' });
  console.log('[globalSetup] ✅ Auth state saved → auth-state.json');

  await browser.close();
};
