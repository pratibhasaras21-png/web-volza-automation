# Auth Module — Test Cases

Covers login (email + OTP), company selection, and sign-up flows for
`app.volza.com`. Source specs: `login.spec.js`, `company-selection.spec.js`,
`signup.spec.js`.

IDs are freshly assigned in migration order (`TC-AUTH-001`–`TC-AUTH-011`) per
the plan's ID convention — this module isn't one of the spreadsheet's
own-ID-carrying sections (FTA/API-dashboard/Director-Search/Onboarding).

Preconditions/Steps/Expected-Result content is sourced from the QA backlog CSV
(`Daily Testing and app test cases(Module wise TestCases).csv`), **Module 1:
Sign Up** (rows 1–44) and **Module 2: Log In** (rows 45–79), with each
CSV numbered sub-step mapped onto the corresponding automated test case (e.g.
the Login module's step 7 "invalid OTP" maps to TC-AUTH-002, step 8 "expired
OTP" to TC-AUTH-003, and so on).

## Running this module without piling up repeated live logins

`TC-AUTH-002`–`TC-AUTH-008` (the invalid/expired/multiple-request/empty/
unregistered-email/alt-delivery OTP cases, plus the standalone company-selection
test) each perform their own full, independent OTP login by design — that's
what they're testing. Since `auth/` sorts first alphabetically, running the
whole suite in one go means the first ~9 live logins in a row all happen before
any other module even starts, each waiting on a real inbox round-trip.

`TC-AUTH-009`–`TC-AUTH-011` (the sign-up flow in `signup.spec.js`) are tagged
`@signup` for the same reason plus an extra one: they don't just log in
repeatedly, `TC-AUTH-009`/`010` actually create/step through a real new
account end-to-end.

- **Full suite, login once, no new accounts created:**
  `npx playwright test --grep-invert "@otp-edge|@signup"`
  — skips all 10 tagged tests (keeps `TC-AUTH-001` as the one login sanity
  check), every other module runs normally.
- **Just skip the repeated-login edge cases, keep sign-up:**
  `npx playwright test --grep-invert "@otp-edge"`
- **Exhaustive OTP coverage:** `npx playwright test tests/auth/login.spec.js`
  (or target `auth/`/`signup.spec.js` directly) — untouched, every scenario
  still runs every time regardless of the tag.

## Retired / dropped duplicate specs

Two source files are **not** migrated into this module, per the migration
plan:

- `tests/volza-login-simple.spec.ts` / `tests/volza-login-simple.spec.js` —
  raw duplicates of TC-AUTH-001 (valid OTP login) without any POM usage;
  fully superseded by `login.spec.js`.
- `tests/volza-login.spec.js` — its login portion duplicates
  `company-selection.spec.js` (login → OTP → home), and its search portion
  duplicates Search Tab coverage that a separate migration pass handles under
  `search/`. Flagged rather than silently dropped; no unique behaviour of its
  own was found worth preserving as a standalone smoke test.

## Test Cases

| TC ID | Title | Priority | Preconditions | Steps | Expected Result | Spec Reference |
|---|---|---|---|---|---|---|
| TC-AUTH-001 | Valid OTP login redirects to Welcome/home page | P1 | Registered email set via `VOLZA_LOGIN_EMAIL`; unauthenticated session | 1. Go to app.volza.com sign-in page 2. Navigate to login page 3. Enter the registered email 4. Click "Request OTP" 5. Dismiss the "OTP Sent" modal, if shown 6. Click "Click here" and choose Email as the OTP delivery method, then click "Send OTP" (this step is intermittent - some sessions send the OTP directly without it) 7. Enter the received OTP 8. Click "Login" | Page redirects to the Welcome/home page | `login.spec.js` |
| TC-AUTH-002 | Invalid OTP shows error message | P2 | Registered email; unauthenticated session; OTP request already sent | 1. Complete steps 1–6 of TC-AUTH-001 2. Enter an invalid OTP ("000000") 3. Click "Login" | User receives an error message, e.g. "Invalid OTP, Please try again" | `login.spec.js` |
| TC-AUTH-003 | Expired OTP shows expiry error message | P2 | Registered email; unauthenticated session; a previously-issued OTP that has since expired | 1. Complete steps 1–6 of TC-AUTH-001 2. Enter a known-expired OTP ("111111") 3. Click "Login" | User receives an error message indicating the OTP has expired and is not logged in | `login.spec.js` |
| TC-AUTH-004 | Multiple OTP requests — latest OTP is valid | P2 | Registered email; unauthenticated session | 1. Complete steps 1–6 of TC-AUTH-001 2. Request OTP again via "Resend"/"Request Again" 3. Enter the latest OTP received 4. Click "Login" | User receives the latest OTP and can log in with it; previous OTPs become invalid | `login.spec.js` |
| TC-AUTH-005 | Empty OTP field shows validation error | P2 | Registered email; unauthenticated session; OTP request already sent | 1. Complete steps 1–6 of TC-AUTH-001 2. Leave the OTP field empty 3. Click "Login" | User receives an error message: "Please enter OTP" | `login.spec.js` |
| TC-AUTH-006 | Unregistered email shows account-not-found error | P2 | Unauthenticated session; an email not registered on app.volza.com | 1. Go to login page 2. Enter an incorrect/unregistered email 3. Click "Request OTP" | User receives an error: "The email address you entered is not associated with any account. Please check the email address and try again." | `login.spec.js` |
| TC-AUTH-007 | Alternative OTP delivery (Text / WhatsApp) | P3 | Registered email; unauthenticated session; OTP request already sent | 1. Complete steps 1–5 of TC-AUTH-001 (through dismissing the "OTP Sent" modal, before choosing a delivery method) 2. Click "Click here" to open the OTP delivery method picker 3. Verify the send-options popup (Email/Text/WhatsApp) appears | The delivery-method picker gates OTP sending on every login (not just this alternative path); its popup with send options (Email/Text/WhatsApp) is shown | `login.spec.js` |
| TC-AUTH-008 | Login and select company redirects to home page | P1 | Registered email tied to multiple companies; unauthenticated session | 1. Go to sign-in page 2. Select Email method 3. Enter registered email, click Sign In 4. Dismiss "OTP Sent" modal 5. Click "Click here" and choose Email as the OTP delivery method, then click "Send OTP" (intermittent - some sessions send the OTP directly without it) 6. Enter OTP received via email, submit 7. Wait for company-selection page 8. Select target company (`VOLZA_COMPANY` or default) | Redirected to `app.volza.com/home` for the selected company | `company-selection.spec.js` |
| TC-AUTH-009 | Free Trial plan — complete sign-up flow | P1 | Fresh email/mobile not previously registered on app.volza.com; username, company name, and plan preferences ready | 1. Open app.volza.com 2. Click Sign Up, select Free Trial plan 3. Fill personal details (name, email, mobile), proceed 4. Fill company details, proceed to Plan Details page 5. Validate Change Plan option and Login option on Plan Details page 6. Complete sign-up; OTP sent to email — validate OTP 7. Complete the onboarding questionnaire 8. Request OTP via Login button on the sign-up landing page and enter the valid OTP | Final landing page shows the same details provided during sign-up; entering the valid OTP after sign-up redirects to the Welcome page | `signup.spec.js` |
| TC-AUTH-010 | Plan Details page — change plan reflects amount, Login redirects with pre-filled email | P2 | Sign-up flow reached the Plan Details page | 1. From Plan Details page, note the initial plan amount 2. Click "Change Plan" and select an alternate plan 3. Click "Login" option on Plan Details page | Amount updates to reflect the newly selected plan; clicking Login redirects to the login page with the sign-up email pre-filled | `signup.spec.js` |
| TC-AUTH-011 | Post sign-up — My Account plan & credits validation | P1 | A Free Trial (or paid) account created via sign-up; email registered | 1. Log in with the newly created account (email + OTP) 2. Go to My Account and check the correct plan is assigned 3. Verify user details match the data provided at sign-up 4. Go to My Workspaces and verify an auto-generated workspace exists 5. Go to My Account and verify download/search/hot-company credits match the plan | Correct plan, user details, auto-generated workspace, and credit balances all match what was configured at sign-up | `signup.spec.js` |
