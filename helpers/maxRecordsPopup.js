// The dialog's Start/End Date fields are an Ant Design (antd) `ant-picker` -
// the <input> is rendered readonly, so typing/`.fill()` never works: the app
// only accepts a date picked from the calendar dropdown. This clicks the
// input open, jumps the header to the target year/month via the year panel
// and prev/next month buttons, then clicks the day cell (identified by its
// `title="YYYY-MM-DD"` attribute).
async function setAntPickerDate(page, pickerInput, targetDate) {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const targetYear = targetDate.getFullYear();
  const targetMonthIdx = targetDate.getMonth();
  const isoTarget = `${targetYear}-${String(targetMonthIdx + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;

  await pickerInput.click();
  const dropdown = page.locator('.ant-picker-dropdown:visible').first();
  await dropdown.waitFor({ state: 'visible', timeout: 8000 });

  const yearBtn = dropdown.locator('.ant-picker-year-btn');
  const currentYear = Number((await yearBtn.textContent()).trim());
  if (currentYear !== targetYear) {
    await yearBtn.click();
    await page.waitForTimeout(300);
    // Jump a further decade if the target year isn't in the currently shown one.
    let decadeGuard = 0;
    while (!(await dropdown.locator(`td[title="${targetYear}"]`).isVisible().catch(() => false)) && decadeGuard++ < 10) {
      const superBtn = dropdown.locator(targetYear < currentYear ? '.ant-picker-header-super-prev-btn' : '.ant-picker-header-super-next-btn');
      await superBtn.click();
      await page.waitForTimeout(200);
    }
    await dropdown.locator(`td[title="${targetYear}"]`).click();
    await page.waitForTimeout(300);
  }

  // Step through months one at a time until the header shows the target
  // month/year (antd has no direct month-jump from the date panel).
  let monthGuard = 0;
  while (monthGuard++ < 24) {
    const curMonthText = (await dropdown.locator('.ant-picker-month-btn').textContent()).trim();
    const curYearText = Number((await dropdown.locator('.ant-picker-year-btn').textContent()).trim());
    const curMonthIdx = monthNames.indexOf(curMonthText);
    if (curMonthIdx === targetMonthIdx && curYearText === targetYear) break;

    const curTotal = curYearText * 12 + curMonthIdx;
    const targetTotal = targetYear * 12 + targetMonthIdx;
    await dropdown.locator(curTotal < targetTotal ? '.ant-picker-header-next-btn' : '.ant-picker-header-prev-btn').click();
    await page.waitForTimeout(200);
  }

  const dayCell = dropdown.locator(`td[title="${isoTarget}"]`);
  await dayCell.waitFor({ state: 'visible', timeout: 5000 });
  await dayCell.click();
  await page.waitForTimeout(300);
}

// Broad searches (e.g. "All Country" with a wide date range) can exceed the
// platform's 1,000,000-record cap. When that popup appears, narrow the
// Start Date to N days before the dialog's own End Date and Apply. Loops (in
// case a broad search still exceeds the cap after the first narrowing)
// shrinking the window each time.
async function handleMaxRecordsPopup(page) {
  const dayWindows = [11, 5, 2];
  for (const days of dayWindows) {
    const limitDialog = page.locator('[class*="modal"]:visible, [role="dialog"]:visible').filter({ hasText: /exceeded the max limit/i }).first();
    // isVisible() checks the current state only (no polling) - the popup can
    // render a moment after networkidle fires, so wait for it to appear.
    const appeared = await limitDialog.waitFor({ state: 'visible', timeout: 15000 }).then(() => true).catch(() => false);
    if (!appeared) return;

    console.log(`[handleMaxRecordsPopup] ⚠️ "Exceeded max limit" popup shown - narrowing Start Date to ${days} days before End Date`);
    const startDateInput = limitDialog.locator('text=Start Date').locator('xpath=following::input[1]');
    const endDateInput = limitDialog.locator('text=End Date').locator('xpath=following::input[1]');

    const endDateValue = (await endDateInput.inputValue()).trim();
    const [endMonth, endDay, endYear] = endDateValue.split('/').map(Number);
    const endDate = new Date(endYear, endMonth - 1, endDay);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);
    const fmt = (d) => `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;

    await setAntPickerDate(page, startDateInput, startDate);
    console.log(`[handleMaxRecordsPopup] Start Date set to "${fmt(startDate)}" (End Date stays "${endDateValue}")`);

    const applyBtn = limitDialog.locator('button:has-text("Apply")').first();
    await applyBtn.click();
    await limitDialog.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForLoadState('domcontentloaded', { timeout: 20000 }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    console.log('[handleMaxRecordsPopup] ✅ Applied narrowed range - checking if results now display');
  }
}

module.exports = { handleMaxRecordsPopup };
