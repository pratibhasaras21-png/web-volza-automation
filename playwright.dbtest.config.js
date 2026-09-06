// @ts-nocheck
// Lightweight smoke-test config for db-reporter.js: runs dbtest.spec.js against
// example.com (no real Volza login, since it deliberately skips the real suite's
// globalSetup) so the reporter -> SQLite pipeline can be verified cheaply and quickly
// without touching the live account. Run with:
//   npx playwright test --config=playwright.dbtest.config.js
// Not matched by the real suite's testMatch patterns, so it never runs as part of a
// normal `npx playwright test`.
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './',
  testMatch: ['dbtest.spec.js'],
  timeout: 30_000,
  reporter: [['list'], ['./db-reporter.js']],
  use: { headless: true, screenshot: 'only-on-failure' },
  projects: [{ name: 'edge', use: { channel: 'msedge' } }],
});
