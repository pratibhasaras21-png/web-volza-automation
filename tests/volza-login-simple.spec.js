const { test, expect } = require('@playwright/test');
const { ImapFlow } = require('imapflow');
require('dotenv').config();

// =============================================
// STEP 1: FUNCTION TO GET OTP FROM GMAIL
// =============================================
async function getOtpFromGmail(signInTime) {

  // Connect to Gmail
  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    logger: false,
  });

  await client.connect();
  await client.mailboxOpen('INBOX');

  // Try for 60 seconds to find the OTP email
  const stopTime = Date.now() + 60000;

  while (Date.now() < stopTime) {

    // Search for emails from volza.com received after sign-in click
    const emailIds = await client.search(
      { since: signInTime, from: '@volza.com' },
      { uid: true }
    );

    // Check each email (latest first)
    for (const id of [...emailIds].reverse()) {

      // Read the email subject
      const email = await client.fetchOne(String(id), { envelope: true }, { uid: true });
      const subject = email && email.envelope ? email.envelope.subject : '';

      // Skip if subject does not contain "otp"
      if (!subject.toLowerCase().includes('otp')) continue;

      // Download full email body
      const download = await client.download(String(id), undefined, { uid: true });
      let rawEmail = '';
      for await (const chunk of download.content) {
        rawEmail += chunk.toString('utf8');
      }

      // Decode base64 content inside the email
      let emailText = rawEmail;
      const parts = rawEmail.split(/Content-Transfer-Encoding:\s*base64\s*\r?\n\r?\n/i);
      if (parts.length > 1) {
        emailText = Buffer.from(
          parts[1].split(/\r?\n--/)[0].replace(/\s/g, ''),
          'base64'
        ).toString('utf8');
      }

      // Find the 6-digit OTP number in the email text
      const found = emailText.match(/\b(\d{6})\b/);
      if (found) {
        await client.logout();
        return found[1]; // Return the OTP
      }
    }

    // OTP not found yet, wait 5 seconds and try again
    console.log('Waiting for OTP email...');
    await new Promise(r => setTimeout(r, 5000));
  }

  await client.logout();
  throw new Error('OTP email not received within 60 seconds');
}


// =============================================
// STEP 2: THE ACTUAL LOGIN TEST
// =============================================
test('Login to Volza using Email OTP', async ({ page }) => {

  const email = process.env.VOLZA_LOGIN_EMAIL;

  // --- Open the login page ---
  await page.goto('https://www.volza.com/signin-wizard-step-1/');
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });

  // --- Type the email address ---
  await page.click('input[type="email"]');
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Delete');
  await page.locator('input[type="email"]').pressSequentially(email, { delay: 50 });
  await page.keyboard.press('Tab');

  // --- Click the Sign In button ---
  const signInTime = new Date(); // save time so we only read new emails
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(2000);

  // --- Close the "OTP Sent" popup if it appears ---
  try {
    await page.getByText('Ok', { exact: true }).waitFor({ state: 'visible', timeout: 8000 });
    await page.getByText('Ok', { exact: true }).click();
  } catch {
    console.log('No popup appeared, moving on...');
  }

  // --- Wait for the OTP input box to appear ---
  await page.waitForSelector(
    'input[placeholder="Enter the OTP sent to your Email ID"]',
    { timeout: 20000 }
  );

  // --- Get OTP from Gmail ---
  const otp = await getOtpFromGmail(signInTime);
  console.log('OTP received:', otp);

  // --- Enter the OTP and submit ---
  await page.fill('input[placeholder="Enter the OTP sent to your Email ID"]', otp);
  await page.click('button:has-text("Sign In")');
  await page.waitForLoadState('networkidle', { timeout: 15000 });

  // --- Check login was successful ---
  await expect(page).not.toHaveURL(/signin-wizard/, { timeout: 15000 });
  console.log('Login successful! URL:', page.url());

});
