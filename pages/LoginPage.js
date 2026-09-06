class LoginPage {
  constructor(page) {
    this.page = page;

    this.emailRadio = page.locator(
      'input[type="radio"][value="email"], label:has-text("Email") input[type="radio"]'
    ).first();

    this.emailInput = page.locator(
      'input[placeholder="Business Email"], input[placeholder*="business email"], input[type="email"]'
    ).first();

    this.signInButton = page.locator(
      'button[type="submit"]:has-text("Sign In"), button:has-text("Sign In")'
    ).first();

    // "OTP Sent" modal Ok — rendered as a <div>, not a <button>
    this.otpSentModalOkButton = page.getByText('Ok', { exact: true });

    // After the "Ok" modal, the site now also requires picking an OTP delivery method
    // (Email / Text / WhatsApp) before it actually sends the OTP - this step used to be
    // specific to the "alternative delivery" flow but now gates the OTP input on every login.
    this.clickHereLink = page.getByText('Click here', { exact: false });
    this.emailDeliveryLabel = page.locator('label').filter({ hasText: /email/i }).filter({ hasNotText: /whatsapp|text/i }).first();
    this.sendOtpButton = page.getByRole('button', { name: 'Send OTP' });
  }

  async goto() {
    // Absolute URL, not relative to config's baseURL (app.volza.com) — the sign-in
    // wizard lives on the www subdomain; app.volza.com is the post-login app itself.
    await this.page.goto('https://www.volza.com/signin-wizard-step-1/');
    await this.emailInput.waitFor({ state: 'visible', timeout: 15_000 });
  }

  async selectEmailMethod() {
    const isChecked = await this.emailRadio.isChecked().catch(() => false);
    if (!isChecked) {
      await this.emailRadio.click();
    }
  }

  async enterEmail(email) {
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

  async clickSignIn() {
    // Wait until the button is enabled/stable before clicking
    await this.signInButton.waitFor({ state: 'visible', timeout: 10_000 });
    await this.signInButton.click();
    // Give the SPA time to make the API call and render the modal
    await this.page.waitForTimeout(2000);
  }

  async dismissOtpSentModal() {
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

  // "Click here" -> pick "Email" as the delivery method -> "Send OTP" is what actually
  // triggers the email to be sent; without it, the OTP input never appears and
  // waitForOtpPage() times out. Optional/best-effort: some sessions may still send the
  // OTP immediately after the "Ok" modal without this extra step.
  async selectEmailOtpDeliveryMethod() {
    try {
      await this.clickHereLink.waitFor({ state: 'visible', timeout: 5_000 });
      await this.clickHereLink.click();
      await this.emailDeliveryLabel.waitFor({ state: 'visible', timeout: 5_000 });
      await this.emailDeliveryLabel.click();
      await this.sendOtpButton.click();
      await this.page.waitForTimeout(1000);
    } catch {
      console.log('[LoginPage] OTP delivery method step not shown — continuing (OTP may already be sent)');
    }
  }
}

module.exports = { LoginPage };
