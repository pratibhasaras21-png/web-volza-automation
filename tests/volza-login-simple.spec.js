const { test, expect } = require('@playwright/test');
const { loginAndSelectCompany } = require('../fixtures/auth.fixture');

test('Login to Volza using Email OTP', async ({ page }) => {
  await loginAndSelectCompany(page);

  // --- Check login was successful ---
  await expect(page).not.toHaveURL(/signin-wizard/, { timeout: 15000 });
  console.log('Login successful! URL:', page.url());
});
