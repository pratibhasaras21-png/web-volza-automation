import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailRadio: Locator;
  readonly emailInput: Locator;
  readonly signInButton: Locator;
  readonly otpSentModalOkButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.emailRadio = page.locator(
      'input[type="radio"][value="email"], label:has-text("Email") input[type="radio"]'
    ).first();

    this.emailInput = page.locator(
      'input[placeholder*="Business Email"], input[placeholder*="business email"], input[type="email"]'
    ).first();

    this.signInButton = page.locator(
      'button[type="submit"]:has-text("Sign In"), button:has-text("Sign In")'
    ).first();

    // "OTP Sent" modal Ok — rendered as a <div>, not a <button>
    this.otpSentModalOkButton = page.getByText('Ok', { exact: true });
  }

  async goto(): Promise<void> {
    await this.page.goto('/signin-wizard-step-1/');
    await this.emailInput.waitFor({ state: 'visible', timeout: 15_000 });
  }

  async selectEmailMethod(): Promise<void> {
    const isChecked = await this.emailRadio.isChecked().catch(() => false);
    if (!isChecked) {
      await this.emailRadio.click();
    }
  }

  async enterEmail(email: string): Promise<void> {
    await this.emailInput.click();
    // Clear any existing value with Ctrl+A then Delete
    await this.page.keyboard.press('Control+A');
    await this.page.keyboard.press('Delete');
    // Type character-by-character to trigger React's onChange synthetic events
    // plain fill() bypasses these and the Sign In button won't process the request
    await this.emailInput.pressSequentially(email, { delay: 50 });
    // Tab away to trigger onBlur / form validation before clicking Sign In
    await this.emailInput.press('Tab');
  }

  async clickSignIn(): Promise<void> {
    // Wait until the button is enabled/stable before clicking
    await this.signInButton.waitFor({ state: 'visible', timeout: 10_000 });
    await this.signInButton.click();
    // Give the SPA time to make the API call and render the modal
    await this.page.waitForTimeout(2000);
  }

  async dismissOtpSentModal(): Promise<void> {
    // Modal may auto-dismiss or may not appear on every run — treat as optional
    try {
      await this.otpSentModalOkButton.waitFor({ state: 'visible', timeout: 8_000 });
      await this.otpSentModalOkButton.click();
      // Wait for modal to disappear before proceeding
      await this.otpSentModalOkButton.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
    } catch {
      // Modal wasn't visible — already dismissed or page skipped it; continue
      console.log('[LoginPage] OTP sent modal not found — continuing without dismissal');
    }
  }
}
