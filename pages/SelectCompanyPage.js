class SelectCompanyPage {
  constructor(page) {
    this.page = page;
  }

  async waitForCompanyPage() {
    await this.page.waitForURL('**/multiple-companies/**', { timeout: 20_000 });
  }

  async selectCompany(company) {
    await this.page.getByText(company, { exact: false }).first().click();
  }

  async waitForHomePage() {
    await this.page.waitForURL('**/home**', { timeout: 20_000 });
  }
}

module.exports = { SelectCompanyPage };
