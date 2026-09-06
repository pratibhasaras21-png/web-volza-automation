// @ts-nocheck
// Cheap sanity spec for db-reporter.js - see playwright.dbtest.config.js. Only ever
// run explicitly via that config, never picked up by the real suite's testMatch.
const { test, expect } = require('@playwright/test');

test.describe('DB Reporter Sanity Module', () => {
  test('TC-DB1: passing case with real steps', async ({ page }) => {
    console.log('[TC-DB1] Navigating to example.com');
    await page.goto('https://example.com');
    await expect(page.locator('h1')).toHaveText('Example Domain');
    console.log('[TC-DB1] Heading verified');
  });

  test('TC-DB2: failing case with a real error', async ({ page }) => {
    console.log('[TC-DB2] Navigating to example.com');
    await page.goto('https://example.com');
    await expect(page.locator('h1')).toHaveText('This Will Never Match', { timeout: 2000 });
  });
});
