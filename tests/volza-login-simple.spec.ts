import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { ImapFlow } from 'imapflow';

dotenv.config();

// --- Read OTP from Gmail ---
async function getOtpFromGmail(receivedAfter: Date): Promise<string> {
  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER!,
      pass: process.env.GMAIL_APP_PASSWORD!,
    },
    logger: false,
  });

  await client.connect();
  await client.mailboxOpen('INBOX');

  const deadline = Date.now() + 60_000; // wait up to 60 seconds

  while (Date.now() < deadline) {
    const uids = await client.search(
      { since: receivedAfter, from: '@volza.com' },
      { uid: true }
    ) as number[];

    for (const uid of [...uids].reverse()) {
      const msg = await client.fetchOne(String(uid), { envelope: true }, { uid: true });
      const subject = msg?.envelope?.subject ?? '';
      if (!subject.toLowerCase().includes('otp')) continue;

      const download = await client.download(String(uid), undefined, { uid: true });
      let raw = '';
      for await (const chunk of download.content) {
        raw += chunk.toString('utf8');
      }

      // Decode base64 MIME parts
      let bodyText = raw;
      const parts = raw.split(/Content-Transfer-Encoding:\s*base64\s*\r?\n\r?\n/i);
      if (parts.length > 1) {
        bodyText = Buffer.from(parts[1].split(/\r?\n--/)[0].replace(/\s/g, ''), 'base64').toString('utf8');
      }

      const match = bodyText.match(/\b(\d{6})\b/);
      if (match) {
        await client.logout();
        return match[1];
      }
    }

    console.log('OTP not found yet, retrying in 5s...');
    await new Promise(r => setTimeout(r, 5000));
  }

  await client.logout();
  throw new Error('OTP not received within 60 seconds');
}

// --- Test ---
test('Volza login with OTP', async ({ page }) => {
  const email = process.env.VOLZA_LOGIN_EMAIL!;

  // 1. Open login page
  await page.goto('https://www.volza.com/signin-wizard-step-1/');
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });

  // 2. Enter email
  await page.click('input[type="email"]');
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Delete');
  await page.locator('input[type="email"]').pressSequentially(email, { delay: 50 });
  await page.keyboard.press('Tab');

  // 3. Click Sign In
  const signInTime = new Date();
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(2000);

  // 4. Dismiss OTP sent modal (if it appears)
  try {
    await page.getByText('Ok', { exact: true }).waitFor({ state: 'visible', timeout: 8000 });
    await page.getByText('Ok', { exact: true }).click();
  } catch {
    console.log('No OTP modal appeared, continuing...');
  }

  // 5. Wait for OTP input
  await page.waitForSelector('input[placeholder="Enter the OTP sent to your Email ID"]', { timeout: 20000 });

  // 6. Fetch OTP from Gmail
  const otp = await getOtpFromGmail(signInTime);
  console.log('OTP received:', otp);

  // 7. Enter and submit OTP
  await page.fill('input[placeholder="Enter the OTP sent to your Email ID"]', otp);
  await page.click('button:has-text("Sign In")');
  await page.waitForLoadState('networkidle', { timeout: 15000 });

  // 8. Confirm login succeeded
  await expect(page).not.toHaveURL(/signin-wizard/, { timeout: 15000 });
  console.log('Logged in! URL:', page.url());
});
