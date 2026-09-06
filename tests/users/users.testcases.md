# Users Tab — Test Cases

Sourced from the QA backlog CSV (`Daily Testing and app test cases(Module wise TestCases).csv`, Module 13 "Users- Home Tab" and Module 14 "User-Add New User Page"). Automated by `tests/users/users-tab.spec.js`. The source spec's own `TC-N` numbering (1-19 for Module 13, 1-15 for Module 14) lines up 1:1 with the CSV backlog's numbered scenarios, so each automated row below cites the matching CSV item. A handful of CSV scenarios (Module 13 items 7, 16, 17, 19; Module 14 items 4, 7, 11, 13, 15) have no automated coverage yet and are not assigned an ID in this pass — see "Not automated" note at the bottom.

Common precondition: user is logged in and on the Users tab (My Account → Users).

## Module 13: Users - Home Tab

| TC ID | Title | Priority | Preconditions | Steps | Expected Result | Spec Reference |
|---|---|---|---|---|---|---|
| TC-USERS-001 | Add Member with valid details - user appears in list | P1 | Logged in, on Users tab | 1. Click "Add Member".<br>2. Fill in valid details.<br>3. Submit. | New user appears in the list with correct details. | `users-tab.spec.js` |
| TC-USERS-002 | Select inactive user and Activate changes status to Active | P1 | Logged in, on Users tab, at least one inactive user exists | 1. Select checkbox next to an inactive user (e.g., "Live").<br>2. Click "Activate". | User status changes from "In Active" to "Active". | `users-tab.spec.js` |
| TC-USERS-003 | Select active user and Suspend changes status to Suspended | P1 | Logged in, on Users tab, at least one active user exists | 1. Select an active user.<br>2. Click "Suspend". | User status changes to "Suspended" or equivalent. | `users-tab.spec.js` |
| TC-USERS-004 | Select user and Remove Member removes from list | P1 | Logged in, on Users tab, at least one user exists | 1. Select a user.<br>2. Click "Remove Member". | User is removed from the list. | `users-tab.spec.js` |
| TC-USERS-005 | Edit user details via pencil icon | P2 | Logged in, on Users tab | 1. Click the edit pencil icon next to a user.<br>2. Update info.<br>3. Save. | Updated details reflect correctly. | `users-tab.spec.js` |
| TC-USERS-006 | Click sort icon on First Name column - list sorts alphabetically | P3 | Logged in, on Users tab | 1. Click the sort icon next to "First Name". | User list is sorted alphabetically by first name. | `users-tab.spec.js` |
| TC-USERS-007 | Send Link for a user re-sends invite email with confirmation | P2 | Logged in, on Users tab | 1. Click "Send Link" for a user. | Email is re-sent and confirmation shown. | `users-tab.spec.js` |
| TC-USERS-008 | Check your plan button redirects to subscription page | P2 | Logged in, on Users tab | 1. Click "Check your plan". | Redirects to user's subscription info page. | `users-tab.spec.js` |
| TC-USERS-009 | Last Login On column shows dates in correct format | P3 | Logged in, on Users tab | 1. Check "Last Login On" for users. | Dates are in correct format and relevant. | `users-tab.spec.js` |
| TC-USERS-010 | Page renders table and actions on standard screen | P3 | Logged in, on Users tab | 1. Load page in browser. | Table and actions visible and responsive. | `users-tab.spec.js` |
| TC-USERS-011 | Invalid email format prevents submission | P2 | Logged in, Add Member modal open | 1. Click "Add Member".<br>2. Enter bad email (e.g., "user@com"). | System shows error, prevents submission. | `users-tab.spec.js` |
| TC-USERS-012 | Missing required fields shows validation errors | P2 | Logged in, Add Member modal open | 1. Leave required fields blank.<br>2. Submit. | Validation error shown, user not added. | `users-tab.spec.js` |
| TC-USERS-013 | Activate without selecting a user shows alert | P2 | Logged in, on Users tab, no user selected | 1. Click "Activate" without selecting a user. | Alert shown: "Please select a user". | `users-tab.spec.js` |
| TC-USERS-014 | Suspend without selecting a user shows alert or no action | P3 | Logged in, on Users tab, no user selected | 1. Click "Suspend" with no checkbox selected. | Alert shown, or no action taken. | `users-tab.spec.js` |
| TC-USERS-015 | Remove Member without checkbox selection shows warning | P2 | Logged in, on Users tab, no user selected | 1. Click "Remove Member" with no checkbox selected. | Warning shown, or no action taken. | `users-tab.spec.js` |

_Not automated (documented in CSV, no matching spec case): item 7 "Filter by role/status", item 16 "Re-send invite for inactive user", item 17 "Edit user with invalid input", item 19 "Check plan button with missing subscription"._

## Module 14: User - Add New User Page

| TC ID | Title | Priority | Preconditions | Steps | Expected Result | Spec Reference |
|---|---|---|---|---|---|---|
| TC-USERS-016 | Add user with valid name, email, phone and permissions - saved | P1 | Logged in, Add Member modal open | 1. Enter valid name, email, phone number.<br>2. Select permissions.<br>3. Click Save. | User is added successfully and appears in the user list. | `users-tab.spec.js` |
| TC-USERS-017 | Check Is Admin checkbox and save creates admin user | P1 | Logged in, Add Member modal open | 1. Fill in all fields.<br>2. Check "Is Admin?".<br>3. Save. | User is added with admin role. | `users-tab.spec.js` |
| TC-USERS-018 | Check all workspace permissions and save | P2 | Logged in, Add Member modal open | 1. Fill form.<br>2. Check all workspace permission checkboxes.<br>3. Save. | User has full workspace access. | `users-tab.spec.js` |
| TC-USERS-019 | Phone number accepts country codes | P2 | Logged in, Add Member modal open | 1. Select a different country from the phone code dropdown.<br>2. Enter a valid number.<br>3. Save. | Phone number saved with correct international code. | `users-tab.spec.js` |
| TC-USERS-020 | Form resets to blank after closing and reopening modal | P3 | Logged in, Add Member modal open | 1. Close the modal.<br>2. Reopen the modal. | Form is cleared and reset to blank. | `users-tab.spec.js` |
| TC-USERS-021 | Submit with empty email and phone shows validation errors | P2 | Logged in, Add Member modal open | 1. Leave Email and Phone empty.<br>2. Click Save. | Form validation errors shown, user not added. | `users-tab.spec.js` |
| TC-USERS-022 | Invalid email (user@com) shows email validation error | P2 | Logged in, Add Member modal open | 1. Enter email like "user@com" or "user.com".<br>2. Click Save. | Email validation error shown. | `users-tab.spec.js` |
| TC-USERS-023 | Alphabetic/incomplete phone number shows phone validation error | P2 | Logged in, Add Member modal open | 1. Enter an incomplete or alphabetic phone number (e.g., "123AB").<br>2. Click Save. | Phone validation error shown. | `users-tab.spec.js` |
| TC-USERS-024 | Adding duplicate email shows "User already exists" error | P2 | Logged in, Add Member modal open, an existing user's email known | 1. Try adding a user with the same email as an existing one. | Error shown: "User already exists" or similar. | `users-tab.spec.js` |
| TC-USERS-025 | Special characters (emojis/symbols) in name field shows error or sanitizes | P3 | Logged in, Add Member modal open | 1. Input a name like "????@#".<br>2. Save. | Error shown, or name field sanitizes input. | `users-tab.spec.js` |

_Not automated (documented in CSV, no matching spec case): item 4 "Add user with partial workspace permissions", item 7 "Form resets after successful submission", item 11 "Name field is left blank", item 13 "Click Save with no permissions selected", item 15 "Attempt to bypass required field validation via browser dev tools"._
