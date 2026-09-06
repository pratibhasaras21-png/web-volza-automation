/**
 * OTP entry step shown after Sign In is clicked. Consolidates OTP entry logic that
 * was previously duplicated inline across Login.specs.js, OtpPage.specs.js, and
 * ad hoc OtpStep classes in SelectCompany.spec.ts / volza-login.spec.ts.
 */
class OtpPage {
  constructor(page) {
    this.page = page;
    this.otpInput = page.locator('input[placeholder="Enter the OTP sent to your Email ID"]');
    this.submitButton = page.locator('button:has-text("Sign In")').first();
    this.errorMessage = page.locator('[class*="error"], [class*="alert"], .toast, [role="alert"], [class*="message"]').first();

    // A "Trouble receiving your OTP? It was sent to <email>" modal can appear over the OTP
    // page (independently of the "OTP Sent" modal LoginPage already dismisses) and intercepts
    // clicks on the OTP input underneath it until closed.
    this.troubleOtpModal = page.locator('#troubleOtpModal');
  }

  async waitForOtpPage() {
    await this.otpInput.waitFor({ state: 'visible', timeout: 20_000 });
  }

  async dismissTroubleOtpModal() {
    try {
      await this.troubleOtpModal.waitFor({ state: 'visible', timeout: 3_000 });
      const closeBtn = this.troubleOtpModal.locator(
        'button:has-text("Close"), button:has-text("Ok"), [class*="close"], .icon-close'
      ).first();
      if (await closeBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await closeBtn.click();
      } else {
        await this.page.keyboard.press('Escape');
      }
      await this.troubleOtpModal.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
    } catch {
      // Modal never appeared - nothing to dismiss
    }
  }

  async enterOtp(otp) {
    await this.dismissTroubleOtpModal();
    await this.otpInput.click();
    await this.otpInput.fill(otp);
  }

  async submitOtp() {
    await this.submitButton.click({ force: true });
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 });
  }

  async isErrorVisible() {
    return this.errorMessage.isVisible({ timeout: 8_000 }).catch(() => false);
  }

  async getErrorText() {
    const visible = await this.isErrorVisible();
    if (!visible) return '';
    return this.errorMessage.textContent({ timeout: 2_000 }).then(t => t?.trim() ?? '').catch(() => '');
  }
}

module.exports = { OtpPage };
