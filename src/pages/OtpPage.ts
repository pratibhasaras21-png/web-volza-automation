import { Page, Locator } from '@playwright/test';

export class OtpPage {
  readonly page: Page;
  readonly otpInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Exact placeholder from Volza's OTP step (confirmed from page snapshot)
    this.otpInput = page.locator('input[placeholder="Enter the OTP sent to your Email ID"]');

    // Volza reuses the same "Sign In" button for OTP submission
    this.submitButton = page.locator('button:has-text("Sign In")').first();

    this.errorMessage = page.locator('[class*="error"], [class*="alert"], [role="alert"]');
  }

  async waitForOtpPage(): Promise<void> {
    // Wait for the OTP input to become editable (it may exist in DOM but be hidden behind modal)
    await this.otpInput.waitFor({ state: 'visible', timeout: 20_000 });
  }

  async enterOtp(otp: string): Promise<void> {
    await this.otpInput.click();
    await this.otpInput.fill(otp);
  }

  async submitOtp(): Promise<void> {
    await this.submitButton.click();
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 });
  }

  async isErrorVisible(): Promise<boolean> {
    return this.errorMessage.isVisible().catch(() => false);
  }

  async getErrorText(): Promise<string> {
    const visible = await this.isErrorVisible();
    if (!visible) return '';
    return this.errorMessage.textContent().then(t => t?.trim() ?? '');
  }
}
