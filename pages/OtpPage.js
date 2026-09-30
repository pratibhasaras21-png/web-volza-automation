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

    // The site reuses a generic "success" popup (#searchBoxModal) for the "OTP Sent"
    // notification too. LoginPage.dismissOtpSentModal() closes the first occurrence after
    // Sign In, but clicking "Send OTP" in selectEmailOtpDeliveryMethod() can trigger it again,
    // leaving it open and intercepting clicks on the OTP input underneath it.
    this.searchBoxModal = page.locator('#searchBoxModal');
    this.searchBoxModalOkButton = this.searchBoxModal.locator('.search-box-popup-ok');
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

  async dismissSearchBoxModal() {
    try {
      await this.searchBoxModal.waitFor({ state: 'visible', timeout: 3_000 });
      await this.searchBoxModalOkButton.click({ timeout: 2_000 });
      await this.searchBoxModal.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
    } catch {
      // Modal never appeared - nothing to dismiss
    }
  }

  async enterOtp(otp) {
    // otpInput.click() has no built-in timeout, so if a modal keeps re-appearing
    // (e.g. re-rendered by the page right as we dismiss it) it can retry forever
    // instead of failing. Bound each click attempt and retry the dismiss+click a
    // few times rather than hanging indefinitely.
    const maxAttempts = 5;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await this.dismissTroubleOtpModal();
      await this.dismissSearchBoxModal();
      try {
        await this.otpInput.click({ timeout: 5_000 });
        await this.otpInput.fill(otp);
        return;
      } catch (err) {
        if (attempt === maxAttempts) throw err;
      }
    }
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
