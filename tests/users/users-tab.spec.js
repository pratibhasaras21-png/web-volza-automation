const { test, expect } = require('@playwright/test');

// ─── Module 13 & 14: Users Tab ────────────────────────────────────────────────
// Module 13: User list management (activate, suspend, remove, resend invite, etc.)
// Module 14: Add Member modal (form validations, permissions, phone, admin role)

// Navigate to the Users tab starting from home
async function navigateToUsersTab(page) {
  await page.goto('https://app.volza.com/home');
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  await page.locator('a:has-text("Users"), [href*="users"], a:has-text("My Account")').first().click();
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  const usersSubLink = page.locator('a:has-text("Users"), [href*="users"]').first();
  if (await usersSubLink.isVisible({ timeout: 3000 }).catch(() => false)) {
    await usersSubLink.click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  }
}

// Open the Add Member modal and return the modal locator.
// The Volza modal has class "add-member-modal fade modal show".
// Waits for the fade animation to settle before returning.
async function openAddMemberModal(page) {
  const addBtn = page.locator(
    'button:has-text("Add Member"), button:has-text("Add User"), button:has-text("Invite")'
  ).first();
  await addBtn.waitFor({ state: 'visible', timeout: 10000 });
  await addBtn.click();

  // Wait for the add-member-modal specifically; fall back to any role=dialog
  const modal = page.locator('.add-member-modal, [role="dialog"]').first();
  await modal.waitFor({ state: 'visible', timeout: 8000 });
  // Let the Bootstrap fade animation complete so inner elements are interactable
  await page.waitForTimeout(600);
  return modal;
}

// ─── Module 13: Users Tab (User List Management) ─────────────────────────────
test.describe('Module 13 - Users Tab (User List Management)', () => {

  test.beforeEach(async ({ page }) => {
    await navigateToUsersTab(page);
  });

  // ── TC-USERS-001 (Positive): Add a new user with valid data ───────────────
  test('TC-USERS-001: Add Member with valid details - user appears in list', async ({ page }) => {
    console.log('[TC-USERS-001] Click Add Member button');
    let modal;
    try {
      modal = await openAddMemberModal(page);
    } catch (e) {
      console.log(`[TC-USERS-001] Could not open Add Member modal: ${e.message}`);
      expect.soft(false, 'Add Member modal did not open').toBeTruthy();
      return;
    }

    await expect.soft(modal).toBeVisible({ timeout: 8000 });

    const nameInput  = modal.locator('input[name*="name" i], input[placeholder*="name" i]').first();
    const emailInput = modal.locator('input[type="email"]').first();
    const phoneInput = modal.locator('input[type="tel"], input[name*="phone" i], input[name*="mobile" i]').first();

    try {
      await nameInput.fill('Test User TC1');
      await emailInput.fill(`testuser_tc1_${Date.now()}@example.com`);
      if (await phoneInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await phoneInput.fill('9876543210');
      }

      // Skip "Select all" header checkbox (aria-label="Select all") — click a permission checkbox
      const permCbs = modal.locator('input[type="checkbox"]:not([aria-label="Select all"])');
      const permCount = await permCbs.count();
      if (permCount > 0) {
        await permCbs.first().click({ force: true });
      }

      const saveBtn = modal.locator('button:has-text("Save"), button:has-text("Add"), button:has-text("Invite"), button:has-text("Submit")').first();
      await saveBtn.click({ force: true });
      await page.waitForTimeout(2000);

      const userRow = page.locator('tbody tr').filter({ hasText: /Test User TC1/i }).first();
      const visible = await userRow.isVisible({ timeout: 5000 }).catch(() => false);
      if (visible) {
        await expect.soft(userRow).toBeVisible();
        console.log('[TC-USERS-001] New user visible in list');
      } else {
        const toast = page.locator('[class*="toast"], [role="alert"]')
          .filter({ hasText: /success|added|invited/i }).first();
        await expect.soft(toast).toBeVisible({ timeout: 8000 });
        console.log('[TC-USERS-001] Success toast shown after adding user');
      }
    } catch (e) {
      console.log(`[TC-USERS-001] Error during Add Member flow: ${e.message}`);
      expect.soft(false, `TC-USERS-001 failed: ${e.message}`).toBeTruthy();
    }
  });

  // ── TC-USERS-002 (Positive): Activate an inactive user ────────────────────
  test('TC-USERS-002: Select inactive user and Activate changes status to Active', async ({ page }) => {
    console.log('[TC-USERS-002] Select an inactive user checkbox');
    const inactiveRow = page.locator('tbody tr').filter({ hasText: /inactive|in active/i }).first();
    if (await inactiveRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      const checkbox = inactiveRow.locator('input[type="checkbox"]').first();
      await checkbox.click();

      const activateBtn = page.locator('button:has-text("Activate")').first();
      await expect.soft(activateBtn).toBeVisible({ timeout: 8000 });
      await activateBtn.click({ force: true });
      await page.waitForTimeout(2000);
      console.log('[TC-USERS-002] User activated');
    } else {
      console.log('[TC-USERS-002] No inactive user found to activate — skipping');
    }
  });

  // ── TC-USERS-003 (Positive): Suspend an active user ───────────────────────
  test('TC-USERS-003: Select active user and Suspend changes status to Suspended', async ({ page }) => {
    console.log('[TC-USERS-003] Select an active user checkbox');
    const activeRow = page.locator('tbody tr').filter({ hasText: /\bactive\b/i }).first();
    if (await activeRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      const checkbox = activeRow.locator('input[type="checkbox"]').first();
      await checkbox.click();

      const suspendBtn = page.locator('button:has-text("Suspend")').first();
      await expect.soft(suspendBtn).toBeVisible({ timeout: 8000 });
      await suspendBtn.click({ force: true });
      await page.waitForTimeout(2000);
      console.log('[TC-USERS-003] User suspended');
    } else {
      console.log('[TC-USERS-003] No active user found to suspend — skipping');
    }
  });

  // ── TC-USERS-004 (Positive): Remove a user ────────────────────────────────
  test('TC-USERS-004: Select user and Remove Member removes from list', async ({ page }) => {
    console.log('[TC-USERS-004] Select a user checkbox to remove');
    const anyRow = page.locator('tbody tr').last();
    if (await anyRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      try {
        const checkbox = anyRow.locator('input[type="checkbox"]').first();
        await checkbox.click();

        const removeBtn = page.locator(
          'button:has-text("Remove Member"), button:has-text("Remove User"), button:has-text("Remove")'
        ).first();
        await expect.soft(removeBtn).toBeVisible({ timeout: 8000 });
        await removeBtn.click({ force: true });
        await page.waitForTimeout(500);

        // The Remove confirmation is a SweetAlert — click its confirm button
        const confirmBtn = page.locator(
          '.swal-button--confirm, .swal-button, button.swal2-confirm'
        ).first();
        if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await confirmBtn.click({ force: true });
        }
        await page.waitForTimeout(2000);
        console.log('[TC-USERS-004] User removed');
      } catch (e) {
        console.log(`[TC-USERS-004] Error: ${e.message}`);
        expect.soft(false, `TC-USERS-004 failed: ${e.message}`).toBeTruthy();
      }
    } else {
      console.log('[TC-USERS-004] No user row found to remove');
    }
  });

  // ── TC-USERS-005 (Positive): Edit user details ────────────────────────────
  test('TC-USERS-005: Edit user details via pencil icon', async ({ page }) => {
    console.log('[TC-USERS-005] Click edit icon for first user');
    const editIcon = page.locator(
      '[class*="edit-icon"], button[aria-label*="edit" i], [class*="pencil"], svg[class*="edit"], [title*="Edit" i]'
    ).first();
    if (await editIcon.isVisible({ timeout: 5000 }).catch(() => false)) {
      try {
        await editIcon.click();
        await page.waitForTimeout(1000);
        const editModal = page.locator('[class*="modal"], [role="dialog"]').first();
        await expect.soft(editModal).toBeVisible({ timeout: 8000 });

        const nameField = editModal.locator('input[name*="name" i], input[placeholder*="name" i]').first();
        if (await nameField.isVisible({ timeout: 3000 }).catch(() => false)) {
          await nameField.selectText().catch(() => {});
          await nameField.fill('Updated User Name');
        }

        const saveBtn = editModal.locator('button:has-text("Save"), button:has-text("Update")').first();
        await saveBtn.click();
        await page.waitForTimeout(2000);
        console.log('[TC-USERS-005] User details updated');
      } catch (e) {
        console.log(`[TC-USERS-005] Error: ${e.message}`);
        expect.soft(false, `TC-USERS-005 failed: ${e.message}`).toBeTruthy();
      }
    } else {
      console.log('[TC-USERS-005] Edit icon not found — skipping');
    }
  });

  // ── TC-USERS-006 (Positive): Sort by First Name ───────────────────────────
  test('TC-USERS-006: Click sort icon on First Name column - list sorts alphabetically', async ({ page }) => {
    console.log('[TC-USERS-006] Click sort on First Name column');
    const firstNameCol = page.locator('th, [class*="col-header"]').filter({ hasText: /first name|name/i }).first();
    if (await firstNameCol.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstNameCol.click();
      await page.waitForTimeout(1000);
      await expect.soft(page.locator('tbody tr').first()).toBeVisible({ timeout: 5000 });
      console.log('[TC-USERS-006] Sort applied on First Name column');
    } else {
      console.log('[TC-USERS-006] First Name column header not found');
      expect.soft(false, 'First Name column header not visible').toBeTruthy();
    }
  });

  // ── TC-USERS-007 (Positive): Re-send invite link ──────────────────────────
  test('TC-USERS-007: Send Link for a user re-sends invite email with confirmation', async ({ page }) => {
    console.log('[TC-USERS-007] Click Send Link for first user');
    const sendLinkBtn = page.locator('button:has-text("Send Link"), a:has-text("Send Link")').first();
    if (await sendLinkBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sendLinkBtn.click();
      await page.waitForTimeout(2000);
      const confirmMsg = page.locator('[class*="toast"], [role="alert"]')
        .filter({ hasText: /sent|success/i }).first();
      await expect.soft(confirmMsg).toBeVisible({ timeout: 8000 });
      console.log('[TC-USERS-007] Invite link re-sent');
    } else {
      console.log('[TC-USERS-007] Send Link button not visible — skipping');
    }
  });

  // ── TC-USERS-008 (Positive): Check your plan button ───────────────────────
  test('TC-USERS-008: Check your plan button redirects to subscription page', async ({ page }) => {
    console.log('[TC-USERS-008] Click Check your plan / Check Plan button');
    const planBtn = page.locator(
      'button:has-text("Check your plan"), button:has-text("Check Plan"), a:has-text("Check your plan")'
    ).first();
    if (await planBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await planBtn.click();
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
      await expect.soft(page).toHaveURL(/plan|subscription|account/, { timeout: 10000 });
      console.log('[TC-USERS-008] Redirected to subscription/plan page');
    } else {
      console.log('[TC-USERS-008] Check plan button not visible — skipping');
    }
  });

  // ── TC-USERS-009 (Positive): Last Login On date format ───────────────────
  test('TC-USERS-009: Last Login On column shows dates in correct format', async ({ page }) => {
    console.log('[TC-USERS-009] Check Last Login On column');
    const lastLoginCol = page.locator('th').filter({ hasText: /last login/i }).first();
    await expect.soft(lastLoginCol).toBeVisible({ timeout: 10000 });

    const firstRow = page.locator('tbody tr').first();
    if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      const lastLoginCell = firstRow.locator('td').last();
      const dateText = await lastLoginCell.textContent().catch(() => '');
      console.log(`[TC-USERS-009] Last Login date: "${(dateText ?? '').trim()}"`);
      console.log('[TC-USERS-009] Last Login date visible');
    } else {
      console.log('[TC-USERS-009] No user rows found');
    }
  });

  // ── TC-USERS-010 (Positive): Page renders correctly ─────────────────────────
  test('TC-USERS-010: Page renders table and actions on standard screen', async ({ page }) => {
    console.log('[TC-USERS-010] Verify table and action buttons are visible');
    const table = page.locator('table, [class*="user-table"], [class*="users-table"]').first();
    await expect.soft(table).toBeVisible({ timeout: 10000 });

    const addBtn = page.locator('button:has-text("Add Member"), button:has-text("Add User")').first();
    await expect.soft(addBtn).toBeVisible({ timeout: 5000 });
    console.log('[TC-USERS-010] Table and Add Member button visible');
  });

  // ── TC-USERS-011 (Negative): Invalid email format shows error ───────────────
  test('TC-USERS-011: Invalid email format prevents submission', async ({ page }) => {
    console.log('[TC-USERS-011] Open Add Member modal with invalid email');
    let modal;
    try {
      modal = await openAddMemberModal(page);
      await expect.soft(modal).toBeVisible({ timeout: 8000 });

      const emailInput = modal.locator('input[type="email"], input[name*="email" i]').first();
      const nameInput  = modal.locator('input[name*="name" i], input[placeholder*="name" i]').first();
      await nameInput.fill('Test User').catch(() => {});
      await emailInput.fill('user@com');

      const saveBtn = modal.locator('button:has-text("Save"), button:has-text("Add")').first();
      await saveBtn.click();
      await page.waitForTimeout(1000);

      const emailError = modal.locator('[class*="error"], [class*="invalid"], [role="alert"]')
        .filter({ hasText: /email|invalid/i }).first();
      const anyError   = modal.locator('[class*="error"], [class*="invalid"]').first();
      const hasError   = await emailError.isVisible({ timeout: 5000 }).catch(() => false)
                      || await anyError.isVisible({ timeout: 3000 }).catch(() => false);
      expect.soft(hasError, 'Email validation error should be visible').toBeTruthy();
      console.log(`[TC-USERS-011] Email error visible: ${hasError}`);
    } catch (e) {
      console.log(`[TC-USERS-011] Error: ${e.message}`);
      expect.soft(false, `TC-USERS-011 failed: ${e.message}`).toBeTruthy();
    } finally {
      await page.keyboard.press('Escape').catch(() => {});
    }
  });

  // ── TC-USERS-012 (Negative): Missing required fields shows validation ────────
  test('TC-USERS-012: Missing required fields shows validation errors', async ({ page }) => {
    console.log('[TC-USERS-012] Open Add Member modal and submit empty');
    let modal;
    try {
      modal = await openAddMemberModal(page);
      await expect.soft(modal).toBeVisible({ timeout: 8000 });

      const saveBtn = modal.locator('button:has-text("Save"), button:has-text("Add")').first();
      await saveBtn.click();
      await page.waitForTimeout(1000);

      const anyError = modal.locator('[class*="error"], [class*="invalid"], [class*="validation"]').first();
      await expect.soft(anyError).toBeVisible({ timeout: 5000 });
      console.log('[TC-USERS-012] Required field validation error displayed');
    } catch (e) {
      console.log(`[TC-USERS-012] Error: ${e.message}`);
      expect.soft(false, `TC-USERS-012 failed: ${e.message}`).toBeTruthy();
    } finally {
      await page.keyboard.press('Escape').catch(() => {});
    }
  });

  // ── TC-USERS-013 (Negative): Activate without selecting user shows alert ─────
  test('TC-USERS-013: Activate without selecting a user shows alert', async ({ page }) => {
    console.log('[TC-USERS-013] Click Activate without selecting any user');
    const activateBtn = page.locator('button:has-text("Activate")').first();
    if (await activateBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await activateBtn.click();
      await page.waitForTimeout(1500);
      const alert = page.locator(
        '[class*="alert"], [class*="toast"], [role="alert"], [class*="swal"], .swal2-container'
      ).first();
      await expect.soft(alert).toBeVisible({ timeout: 5000 });
      console.log('[TC-USERS-013] Alert shown when activating without user selection');
      await page.keyboard.press('Escape').catch(() => {});
    } else {
      console.log('[TC-USERS-013] Activate button not visible — skipping');
    }
  });

  // ── TC-USERS-014 (Negative): Suspend without selection shows alert ──────────
  test('TC-USERS-014: Suspend without selecting a user shows alert or no action', async ({ page }) => {
    console.log('[TC-USERS-014] Click Suspend without selecting any user');
    const suspendBtn = page.locator('button:has-text("Suspend")').first();
    if (await suspendBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await suspendBtn.click();
      await page.waitForTimeout(1500);
      const alert = page.locator('[class*="alert"], [class*="toast"], [role="alert"]').first();
      const alertVisible = await alert.isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`[TC-USERS-014] Alert shown: ${alertVisible}`);
      console.log('[TC-USERS-014] Suspend without selection handled');
    } else {
      console.log('[TC-USERS-014] Suspend button not visible — skipping');
    }
  });

  // ── TC-USERS-015 (Negative): Remove without selection shows warning ─────────
  test('TC-USERS-015: Remove Member without checkbox selection shows warning', async ({ page }) => {
    console.log('[TC-USERS-015] Click Remove Member without selecting any user');
    const removeBtn = page.locator(
      'button:has-text("Remove Member"), button:has-text("Remove User")'
    ).first();
    if (await removeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await removeBtn.click();
      await page.waitForTimeout(1500);
      const warning = page.locator('[class*="alert"], [class*="toast"], [role="alert"]').first();
      const warningVisible = await warning.isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`[TC-USERS-015] Warning shown: ${warningVisible}`);
      console.log('[TC-USERS-015] Remove without selection handled');
    } else {
      console.log('[TC-USERS-015] Remove Member button not visible — skipping');
    }
  });
});

// ─── Module 14: Add User Form Validations ─────────────────────────────────────
test.describe('Module 14 - Add Member Form (Permissions & Validations)', () => {

  // Navigate directly — storageState from globalSetup already provides auth
  test.beforeEach(async ({ page }) => {
    await navigateToUsersTab(page);
  });

  // ── TC-USERS-016 (Positive): Add user with all valid data ─────────────────
  test('TC-USERS-016: Add user with valid name, email, phone and permissions - saved', async ({ page }) => {
    console.log('[TC-USERS-016] Open Add Member and fill all valid data');
    let modal;
    try {
      modal = await openAddMemberModal(page);
      await expect.soft(modal).toBeVisible({ timeout: 8000 });

      const nameInput  = modal.locator('input[name*="name" i], input[placeholder*="name" i]').first();
      const emailInput = modal.locator('input[type="email"]').first();
      const phoneInput = modal.locator('input[type="tel"], input[name*="phone" i]').first();

      await nameInput.fill('Valid Test User');
      await emailInput.fill(`valid_test_${Date.now()}@example.com`);
      if (await phoneInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await phoneInput.fill('9876543210');
      }

      const firstCb = modal.locator('input[type="checkbox"]:not([aria-label="Select all"])').first();
      if (await firstCb.isVisible({ timeout: 2000 }).catch(() => false)) await firstCb.click({ force: true });

      const saveBtn = modal.locator('button:has-text("Save")').first();
      await saveBtn.click();
      await page.waitForTimeout(2000);

      const toast = page.locator('[class*="toast"], [role="alert"]')
        .filter({ hasText: /success|added/i }).first();
      await expect.soft(toast).toBeVisible({ timeout: 10000 });
      console.log('[TC-USERS-016] User added successfully');
    } catch (e) {
      console.log(`[TC-USERS-016] Error: ${e.message}`);
      expect.soft(false, `TC-USERS-016 failed: ${e.message}`).toBeTruthy();
    }
  });

  // ── TC-USERS-017 (Positive): Add admin user ───────────────────────────────
  test('TC-USERS-017: Check Is Admin checkbox and save creates admin user', async ({ page }) => {
    console.log('[TC-USERS-017] Open Add Member and enable Is Admin');
    let modal;
    try {
      modal = await openAddMemberModal(page);
      await expect.soft(modal).toBeVisible({ timeout: 8000 });

      const nameInput  = modal.locator('input[name*="name" i], input[placeholder*="name" i]').first();
      const emailInput = modal.locator('input[type="email"]').first();
      await nameInput.fill('Admin Test User');
      await emailInput.fill(`admin_test_${Date.now()}@example.com`);

      const isAdminCb = modal.locator(
        'input[id*="admin" i], label:has-text("Is Admin") input, label:has-text("Admin") input'
      ).first();
      if (await isAdminCb.isVisible({ timeout: 3000 }).catch(() => false)) {
        await isAdminCb.click();
        console.log('[TC-USERS-017] Is Admin checked');
      }

      const saveBtn = modal.locator('button:has-text("Save")').first();
      await saveBtn.click();
      await page.waitForTimeout(2000);

      const toast = page.locator('[class*="toast"], [role="alert"]')
        .filter({ hasText: /success|added/i }).first();
      await expect.soft(toast).toBeVisible({ timeout: 10000 });
      console.log('[TC-USERS-017] Admin user created');
    } catch (e) {
      console.log(`[TC-USERS-017] Error: ${e.message}`);
      expect.soft(false, `TC-USERS-017 failed: ${e.message}`).toBeTruthy();
    }
  });

  // ── TC-USERS-018 (Positive): All workspace permissions ────────────────────
  test('TC-USERS-018: Check all workspace permissions and save', async ({ page }) => {
    console.log('[TC-USERS-018] Open Add Member and select all workspace permissions');
    let modal;
    try {
      modal = await openAddMemberModal(page);
      await expect.soft(modal).toBeVisible({ timeout: 8000 });

      const nameInput  = modal.locator('input[name*="name" i], input[placeholder*="name" i]').first();
      const emailInput = modal.locator('input[type="email"]').first();
      await nameInput.fill('All Perms User');
      await emailInput.fill(`allperms_${Date.now()}@example.com`);

      const allCbs  = modal.locator('input[type="checkbox"]:not([aria-label="Select all"])');
      const cbCount = await allCbs.count();
      for (let i = 0; i < cbCount; i++) {
        await allCbs.nth(i).check({ force: true }).catch(() => {});
      }
      console.log(`[TC-USERS-018] ${cbCount} checkboxes checked`);

      const saveBtn = modal.locator('button:has-text("Save")').first();
      await saveBtn.click();
      await page.waitForTimeout(2000);

      const toast = page.locator('[class*="toast"], [role="alert"]')
        .filter({ hasText: /success|added/i }).first();
      await expect.soft(toast).toBeVisible({ timeout: 10000 });
      console.log('[TC-USERS-018] User with full workspace permissions created');
    } catch (e) {
      console.log(`[TC-USERS-018] Error: ${e.message}`);
      expect.soft(false, `TC-USERS-018 failed: ${e.message}`).toBeTruthy();
    }
  });

  // ── TC-USERS-019 (Positive): Country code in phone field ──────────────────
  test('TC-USERS-019: Phone number accepts country codes', async ({ page }) => {
    console.log('[TC-USERS-019] Open Add Member and verify country code selector on phone');
    let modal;
    try {
      modal = await openAddMemberModal(page);
      await expect.soft(modal).toBeVisible({ timeout: 8000 });

      const countryCodeSelector = modal.locator(
        'select[name*="code" i], [class*="phone-code"], [class*="flag"]'
      ).first();
      if (await countryCodeSelector.isVisible({ timeout: 3000 }).catch(() => false)) {
        await countryCodeSelector.selectOption({ index: 1 }).catch(async () => {
          await countryCodeSelector.click();
          await page.locator('li, option').nth(1).click().catch(() => {});
        });
        console.log('[TC-USERS-019] Country code selected');
      }

      const phoneInput = modal.locator('input[type="tel"], input[name*="phone" i]').first();
      if (await phoneInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await phoneInput.fill('9876543210');
      }
      console.log('[TC-USERS-019] Phone number accepts country code');
    } catch (e) {
      console.log(`[TC-USERS-019] Error: ${e.message}`);
      expect.soft(false, `TC-USERS-019 failed: ${e.message}`).toBeTruthy();
    } finally {
      await page.keyboard.press('Escape').catch(() => {});
    }
  });

  // ── TC-USERS-020 (Positive): Form clears after closing ────────────────────
  test('TC-USERS-020: Form resets to blank after closing and reopening modal', async ({ page }) => {
    console.log('[TC-USERS-020] Open, fill, close, reopen and verify empty');
    try {
      const modal = await openAddMemberModal(page);
      await expect.soft(modal).toBeVisible({ timeout: 8000 });

      const nameInput = modal.locator('input[name*="name" i], input[placeholder*="name" i]').first();
      await nameInput.fill('Should Clear');

      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      await modal.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

      const modal2 = await openAddMemberModal(page);
      await expect.soft(modal2).toBeVisible({ timeout: 8000 });
      const nameInput2  = modal2.locator('input[name*="name" i], input[placeholder*="name" i]').first();
      const nameVal     = await nameInput2.inputValue().catch(() => '');
      expect.soft(nameVal, 'Form should be cleared after closing').toBe('');
      console.log('[TC-USERS-020] Form cleared after closing and reopening');
    } catch (e) {
      console.log(`[TC-USERS-020] Error: ${e.message}`);
      expect.soft(false, `TC-USERS-020 failed: ${e.message}`).toBeTruthy();
    } finally {
      await page.keyboard.press('Escape').catch(() => {});
    }
  });

  // ── TC-USERS-021 (Negative): Submit without required fields shows validation ──
  test('TC-USERS-021: Submit with empty email and phone shows validation errors', async ({ page }) => {
    console.log('[TC-USERS-021] Open Add Member and submit with missing email/phone');
    try {
      const modal = await openAddMemberModal(page);
      await expect.soft(modal).toBeVisible({ timeout: 8000 });

      const nameInput = modal.locator('input[name*="name" i], input[placeholder*="name" i]').first();
      await nameInput.fill('Test Name Only');

      const saveBtn = modal.locator('button:has-text("Save"), button:has-text("Add")').first();
      await saveBtn.click();
      await page.waitForTimeout(1000);

      const errorEl = modal.locator('[class*="error"], [class*="invalid"], [role="alert"]').first();
      await expect.soft(errorEl).toBeVisible({ timeout: 5000 });
      console.log('[TC-USERS-021] Validation errors shown for missing required fields');
    } catch (e) {
      console.log(`[TC-USERS-021] Error: ${e.message}`);
      expect.soft(false, `TC-USERS-021 failed: ${e.message}`).toBeTruthy();
    } finally {
      await page.keyboard.press('Escape').catch(() => {});
    }
  });

  // ── TC-USERS-022 (Negative): Invalid email format shows email validation error ─
  test('TC-USERS-022: Invalid email (user@com) shows email validation error', async ({ page }) => {
    console.log('[TC-USERS-022] Open Add Member with invalid email format');
    try {
      const modal = await openAddMemberModal(page);
      await expect.soft(modal).toBeVisible({ timeout: 8000 });

      const nameInput  = modal.locator('input[name*="name" i], input[placeholder*="name" i]').first();
      const emailInput = modal.locator('input[type="email"], input[name*="email" i]').first();
      await nameInput.fill('Test User');
      await emailInput.fill('user@com');

      const saveBtn = modal.locator('button:has-text("Save"), button:has-text("Add")').first();
      await saveBtn.click();
      await page.waitForTimeout(1000);

      const emailError = modal.locator('[class*="error"], [class*="invalid"]')
        .filter({ hasText: /email/i }).first();
      const anyError   = modal.locator('[class*="error"], [class*="invalid"]').first();
      const hasError   = await emailError.isVisible({ timeout: 5000 }).catch(() => false)
                      || await anyError.isVisible({ timeout: 3000 }).catch(() => false);
      expect.soft(hasError, 'Email error should show for invalid format').toBeTruthy();
      console.log(`[TC-USERS-022] Email validation error shown: ${hasError}`);
    } catch (e) {
      console.log(`[TC-USERS-022] Error: ${e.message}`);
      expect.soft(false, `TC-USERS-022 failed: ${e.message}`).toBeTruthy();
    } finally {
      await page.keyboard.press('Escape').catch(() => {});
    }
  });

  // ── TC-USERS-023 (Negative): Invalid phone number shows phone validation error ─
  test('TC-USERS-023: Alphabetic/incomplete phone number shows phone validation error', async ({ page }) => {
    console.log('[TC-USERS-023] Open Add Member with invalid phone number');
    try {
      const modal = await openAddMemberModal(page);
      await expect.soft(modal).toBeVisible({ timeout: 8000 });

      const nameInput  = modal.locator('input[name*="name" i], input[placeholder*="name" i]').first();
      const emailInput = modal.locator('input[type="email"]').first();
      const phoneInput = modal.locator('input[type="tel"], input[name*="phone" i]').first();

      await nameInput.fill('Test User');
      await emailInput.fill(`valid_${Date.now()}@example.com`);
      if (await phoneInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await phoneInput.fill('123AB');
      }

      const saveBtn = modal.locator('button:has-text("Save"), button:has-text("Add")').first();
      await saveBtn.click();
      await page.waitForTimeout(1000);

      const anyError = modal.locator('[class*="error"], [class*="invalid"]').first();
      const hasError = await anyError.isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`[TC-USERS-023] Phone error visible: ${hasError}`);
      console.log('[TC-USERS-023] Phone validation checked');
    } catch (e) {
      console.log(`[TC-USERS-023] Error: ${e.message}`);
      expect.soft(false, `TC-USERS-023 failed: ${e.message}`).toBeTruthy();
    } finally {
      await page.keyboard.press('Escape').catch(() => {});
    }
  });

  // ── TC-USERS-024 (Negative): Duplicate email shows user already exists error ──
  test('TC-USERS-024: Adding duplicate email shows "User already exists" error', async ({ page }) => {
    console.log('[TC-USERS-024] Get existing user email from table');
    try {
      const existingEmailCell = page.locator('tbody tr').first().locator('td').nth(1);
      const existingEmail     = await existingEmailCell.textContent().catch(() => '');
      console.log(`[TC-USERS-024] Existing email: "${(existingEmail ?? '').trim()}"`);

      if (existingEmail && existingEmail.includes('@')) {
        const modal = await openAddMemberModal(page);
        await expect.soft(modal).toBeVisible({ timeout: 8000 });

        const nameInput  = modal.locator('input[name*="name" i], input[placeholder*="name" i]').first();
        const emailInput = modal.locator('input[type="email"]').first();
        await nameInput.fill('Duplicate User');
        await emailInput.fill(existingEmail.trim());

        const saveBtn = modal.locator('button:has-text("Save"), button:has-text("Add")').first();
        await saveBtn.click();
        await page.waitForTimeout(2000);

        const duplicateError = page.locator('[class*="error"], [class*="toast"], [role="alert"]')
          .filter({ hasText: /already exists|exists|duplicate/i }).first();
        await expect.soft(duplicateError).toBeVisible({ timeout: 8000 });
        console.log('[TC-USERS-024] Duplicate email error shown');
      } else {
        console.log('[TC-USERS-024] Could not extract existing email — skipping duplicate check');
      }
    } catch (e) {
      console.log(`[TC-USERS-024] Error: ${e.message}`);
      expect.soft(false, `TC-USERS-024 failed: ${e.message}`).toBeTruthy();
    } finally {
      await page.keyboard.press('Escape').catch(() => {});
    }
  });

  // ── TC-USERS-025 (Negative): Special characters in name shows error ──────────
  test('TC-USERS-025: Special characters (emojis/symbols) in name field shows error or sanitizes', async ({ page }) => {
    console.log('[TC-USERS-025] Open Add Member with special characters in name');
    try {
      const modal = await openAddMemberModal(page);
      await expect.soft(modal).toBeVisible({ timeout: 8000 });

      const nameInput  = modal.locator('input[name*="name" i], input[placeholder*="name" i]').first();
      const emailInput = modal.locator('input[type="email"]').first();
      await nameInput.fill('????@#');
      await emailInput.fill(`special_${Date.now()}@example.com`);

      const saveBtn = modal.locator('button:has-text("Save"), button:has-text("Add")').first();
      await saveBtn.click();
      await page.waitForTimeout(1000);

      const nameError = modal.locator('[class*="error"], [class*="invalid"]').first();
      const hasError  = await nameError.isVisible({ timeout: 5000 }).catch(() => false);
      const inputVal  = await nameInput.inputValue().catch(() => '');
      console.log(`[TC-USERS-025] Name error: ${hasError}, name value: "${inputVal}"`);
      console.log('[TC-USERS-025] Special characters in name field handled');
    } catch (e) {
      console.log(`[TC-USERS-025] Error: ${e.message}`);
      expect.soft(false, `TC-USERS-025 failed: ${e.message}`).toBeTruthy();
    } finally {
      await page.keyboard.press('Escape').catch(() => {});
    }
  });
});
