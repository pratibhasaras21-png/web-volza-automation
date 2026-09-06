# Onboarding — Test Cases

_No automated spec yet — sourced from QA backlog._

> **Note:** The source spreadsheet ("Freebie Updated Test Cases") gives only a one-line title per test case, plus a blanket precondition ("Application is accessible and prerequisite setup completed"). The Steps and Expected Result columns below were inferred from each title during transcription and are intentionally brief — they should be reviewed and filled in with fuller detail (exact UI selectors, data values, edge-case detail) before these are used to write real specs. Priority values were not present in the source for this section either and were judgment-called per row (P1 = core/critical flow or reward-crediting logic, P2 = standard functional/negative-path coverage, P3 = secondary/edge/UI-cosmetic coverage); End-to-End cases are all P1 per the source module name ("Module 12 - End-to-End (Critical)").

## Signup & Welcome Popup

| TC ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| ONB-001 | Verify Welcome popup appears immediately after successful signup | P1 | Application is accessible and prerequisite setup completed | Complete signup successfully | Welcome popup appears immediately |
| ONB-002 | Verify user receives $10 credits immediately after signup | P1 | Application is accessible and prerequisite setup completed | Complete signup successfully | User receives $10 credits immediately |
| ONB-003 | Verify Welcome popup displays logged-in user's name | P2 | Application is accessible and prerequisite setup completed | Sign up/log in and observe the Welcome popup | Welcome popup displays the logged-in user's name |
| ONB-004 | Verify "$10 / $30" credit progress is displayed | P2 | Application is accessible and prerequisite setup completed | Sign up and open the Welcome popup | "$10 / $30" credit progress is displayed |
| ONB-005 | Verify "Account Created" step shows Completed | P2 | Application is accessible and prerequisite setup completed | Sign up and open the Welcome popup | "Account Created" step shows as Completed |
| ONB-006 | Verify Verify Mobile task shows Pending | P2 | Application is accessible and prerequisite setup completed | Sign up and open the Welcome popup before mobile verification | "Verify Mobile" task shows as Pending |
| ONB-007 | Verify Complete Profile task shows Pending | P2 | Application is accessible and prerequisite setup completed | Sign up and open the Welcome popup before profile completion | "Complete Profile" task shows as Pending |
| ONB-008 | Click Verify button opens Mobile Verification popup | P1 | Application is accessible and prerequisite setup completed | Click the Verify button on the Welcome popup | Mobile Verification popup opens |
| ONB-009 | Click Start button opens Complete Profile popup | P1 | Application is accessible and prerequisite setup completed | Click the Start button on the Welcome popup | Complete Profile popup opens |
| ONB-010 | Click Close/Skip closes popup and redirects to Welcome page | P2 | Application is accessible and prerequisite setup completed | Click the Close/Skip button on the popup | Popup closes and user is redirected to the Welcome page |
| ONB-011 | Verify pending cards appear after skipping popup | P2 | Application is accessible and prerequisite setup completed | Skip the Welcome popup | Pending task cards appear on the Welcome page |
| ONB-012 | Refresh page after signup and verify popup does not repeatedly appear (as per business rule) | P3 | Application is accessible and prerequisite setup completed | Sign up, dismiss the popup, then refresh the page | Welcome popup does not repeatedly reappear, per business rule |
| ONB-013 | Verify popup UI on different resolutions | P3 | Application is accessible and prerequisite setup completed | Open the Welcome popup on different screen resolutions | Popup UI renders correctly at each resolution |
| ONB-014 | Verify special characters in username display properly | P3 | Application is accessible and prerequisite setup completed | Sign up with a username containing special characters | Special characters in the username display properly in the popup |
| ONB-015 | Verify popup doesn't appear for already onboarded users | P2 | Application is accessible and prerequisite setup completed | Log in as a user who has already completed onboarding | Welcome popup does not appear |

## Mobile Verification

| TC ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| OTP-001 | Verify OTP popup opens | P1 | Application is accessible and prerequisite setup completed | Trigger the Verify Mobile action from the Welcome popup | OTP popup opens |
| OTP-002 | Verify masked mobile number is displayed | P2 | Application is accessible and prerequisite setup completed | Open the OTP popup | Masked mobile number is displayed |
| OTP-003 | Verify correct OTP successfully verifies mobile | P1 | Application is accessible and prerequisite setup completed | Enter the correct OTP and submit | Mobile number is successfully verified |
| OTP-004 | Verify +$10 credits added after successful verification | P1 | Application is accessible and prerequisite setup completed | Successfully verify mobile via OTP | +$10 credits are added |
| OTP-005 | Verify credit updates to $20/$30 | P2 | Application is accessible and prerequisite setup completed | Successfully verify mobile via OTP | Credit progress updates to $20/$30 |
| OTP-006 | Verify success message appears | P2 | Application is accessible and prerequisite setup completed | Successfully verify mobile via OTP | Success message appears |
| OTP-007 | Verify Complete Profile popup opens automatically | P1 | Application is accessible and prerequisite setup completed | Successfully verify mobile via OTP | Complete Profile popup opens automatically |
| OTP-008 | Verify Resend OTP works after timer | P2 | Application is accessible and prerequisite setup completed | Wait for the resend timer to expire, then click Resend OTP | New OTP is resent successfully |
| OTP-009 | Verify WhatsApp OTP works | P3 | Application is accessible and prerequisite setup completed | Select WhatsApp as the OTP delivery channel and request OTP | OTP is delivered via WhatsApp and verifies successfully |
| OTP-010 | Verify Change link opens Update Mobile popup | P2 | Application is accessible and prerequisite setup completed | Click the Change link on the OTP popup | Update Mobile popup opens |
| OTP-011 | Verify Back button returns previous screen | P3 | Application is accessible and prerequisite setup completed | Click the Back button on the OTP popup | User is returned to the previous screen |
| OTP-012 | Verify Skip returns Welcome page | P2 | Application is accessible and prerequisite setup completed | Click Skip on the OTP popup | User is returned to the Welcome page |
| OTP-013 | Enter incorrect OTP | P2 | Application is accessible and prerequisite setup completed | Enter an incorrect OTP and submit | Validation error is shown; mobile is not verified |
| OTP-014 | Enter expired OTP | P2 | Application is accessible and prerequisite setup completed | Enter an expired OTP and submit | Validation error indicating the OTP has expired |
| OTP-015 | Enter less than 6 digits | P3 | Application is accessible and prerequisite setup completed | Enter fewer than 6 digits in the OTP field and submit | Validation error is shown |
| OTP-016 | Enter more than 6 digits | P3 | Application is accessible and prerequisite setup completed | Attempt to enter more than 6 digits in the OTP field | Input is restricted to 6 digits or validation error is shown |
| OTP-017 | Paste invalid characters | P3 | Application is accessible and prerequisite setup completed | Paste non-numeric/invalid characters into the OTP field | Invalid characters are rejected or sanitized |
| OTP-018 | Verify OTP cannot be reused | P2 | Application is accessible and prerequisite setup completed | Verify mobile with an OTP, then attempt to reuse the same OTP | Reused OTP is rejected |
| OTP-019 | Attempt verification multiple times with wrong OTP | P2 | Application is accessible and prerequisite setup completed | Submit an incorrect OTP repeatedly | System locks out or throttles further attempts after repeated failures |
| OTP-020 | Verify duplicate reward is not given after re-verification | P1 | Application is accessible and prerequisite setup completed | Re-verify an already-verified mobile number | Duplicate +$10 credit reward is not granted |

## Update Mobile Number

| TC ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| MOB-001 | Open Update Mobile popup | P2 | Application is accessible and prerequisite setup completed | Click Change on the OTP popup or mobile verification screen | Update Mobile popup opens |
| MOB-002 | Enter valid mobile and send OTP | P1 | Application is accessible and prerequisite setup completed | Enter a valid new mobile number and click Send OTP | OTP is sent to the new number |
| MOB-003 | Verify OTP sent successfully | P2 | Application is accessible and prerequisite setup completed | Submit a valid mobile number for update | Confirmation that OTP was sent successfully |
| MOB-004 | Verify new number saved only after OTP verification | P1 | Application is accessible and prerequisite setup completed | Enter a new mobile number, request OTP, but do not verify | New number is not saved until OTP verification is completed |
| MOB-005 | Click Back returns OTP screen | P3 | Application is accessible and prerequisite setup completed | Click Back on the Update Mobile popup | User is returned to the OTP screen |
| MOB-006 | Skip returns Welcome page | P2 | Application is accessible and prerequisite setup completed | Click Skip on the Update Mobile popup | User is returned to the Welcome page |
| MOB-007 | Blank mobile number | P2 | Application is accessible and prerequisite setup completed | Leave the mobile number field blank and submit | Validation error is shown |
| MOB-008 | Invalid mobile number | P2 | Application is accessible and prerequisite setup completed | Enter an invalid mobile number format and submit | Validation error is shown |
| MOB-009 | Already registered mobile | P2 | Application is accessible and prerequisite setup completed | Enter a mobile number already registered to another account and submit | Error indicating the mobile number is already registered |
| MOB-010 | OTP sending failure | P2 | Application is accessible and prerequisite setup completed | Trigger an OTP send while simulating a delivery failure | Error message displayed; user can retry |
| MOB-011 | Verify original mobile remains unchanged if OTP not verified | P1 | Application is accessible and prerequisite setup completed | Start the mobile update flow, request OTP, then abandon without verifying | Original mobile number remains unchanged |

## Profile Completion

| TC ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| PRO-001 | Select Importer | P1 | Application is accessible and prerequisite setup completed | On the Profile Completion screen, select "Importer" | Importer role is selected and profile flow proceeds accordingly |
| PRO-002 | Select Exporter | P1 | Application is accessible and prerequisite setup completed | On the Profile Completion screen, select "Exporter" | Exporter role is selected and profile flow proceeds accordingly |
| PRO-003 | Select Both | P2 | Application is accessible and prerequisite setup completed | On the Profile Completion screen, select "Both" | Both Importer and Exporter options are selected and reflected in the flow |
| PRO-004 | Continue without selection | P2 | Application is accessible and prerequisite setup completed | Click Continue without selecting Importer/Exporter/Both | Validation error is shown; user cannot proceed |
| PRO-005 | Importer goals shown correctly | P2 | Application is accessible and prerequisite setup completed | Select Importer and proceed to the goals step | Importer-specific goals are displayed correctly |
| PRO-006 | Exporter goals shown correctly | P2 | Application is accessible and prerequisite setup completed | Select Exporter and proceed to the goals step | Exporter-specific goals are displayed correctly |
| PRO-007 | Both goals shown correctly | P2 | Application is accessible and prerequisite setup completed | Select Both and proceed to the goals step | Combined Importer and Exporter goals are displayed correctly |
| PRO-008 | Only one goal selectable | P3 | Application is accessible and prerequisite setup completed | Attempt to select more than one goal option | Only a single goal can be selected at a time |
| PRO-009 | Continue without selecting goal | P2 | Application is accessible and prerequisite setup completed | Click Continue without selecting a goal | Validation error is shown; user cannot proceed |
| PRO-010 | Enter valid product | P1 | Application is accessible and prerequisite setup completed | Enter a valid product name in the product field | Product is accepted |
| PRO-011 | Enter HS code | P2 | Application is accessible and prerequisite setup completed | Enter a valid HS code in the product field | HS code is accepted and mapped correctly |
| PRO-012 | HS Locator opens | P2 | Application is accessible and prerequisite setup completed | Click the HS Locator link/icon | HS Locator tool opens |
| PRO-013 | Both Import & Export fields displayed for Both option | P2 | Application is accessible and prerequisite setup completed | Select "Both" role and proceed to the product step | Both Import and Export product fields are displayed |
| PRO-014 | Blank product | P2 | Application is accessible and prerequisite setup completed | Leave the product field blank and click Continue | Validation error is shown |
| PRO-015 | Invalid HS code | P2 | Application is accessible and prerequisite setup completed | Enter an invalid/non-existent HS code and submit | Validation error is shown |
| PRO-016 | Select valid country | P1 | Application is accessible and prerequisite setup completed | Select a valid country from the country field | Country is accepted |
| PRO-017 | Both import/export countries displayed | P2 | Application is accessible and prerequisite setup completed | Select "Both" role and proceed to the country step | Both import and export country fields are displayed |
| PRO-018 | Blank country | P2 | Application is accessible and prerequisite setup completed | Leave the country field blank and click Continue | Validation error is shown |
| PRO-019 | Select predefined role | P2 | Application is accessible and prerequisite setup completed | Select a predefined role from the role dropdown | Predefined role is accepted |
| PRO-020 | Select Other and enter role | P2 | Application is accessible and prerequisite setup completed | Select "Other" and enter a custom role in the textbox | Custom role is accepted |
| PRO-021 | Other selected but textbox blank | P2 | Application is accessible and prerequisite setup completed | Select "Other" and leave the role textbox blank, then submit | Validation error is shown |
| PRO-022 | Verify +$10 credits added | P1 | Application is accessible and prerequisite setup completed | Complete the profile successfully | +$10 credits are added |
| PRO-023 | Verify credit updates to $30/$30 | P1 | Application is accessible and prerequisite setup completed | Complete the profile after account creation and mobile verification | Credit progress updates to $30/$30 |
| PRO-024 | Verify personalized workspace popup | P2 | Application is accessible and prerequisite setup completed | Complete the profile successfully | Personalized workspace popup is shown |
| PRO-025 | Verify progress resumes after closing popup | P2 | Application is accessible and prerequisite setup completed | Close the personalized workspace popup partway through profile completion, then reopen | Profile completion progress resumes from where it was left off |
| PRO-026 | Verify completed steps aren't asked again | P2 | Application is accessible and prerequisite setup completed | Complete a profile step, then revisit the profile completion flow | Already-completed steps are not asked again |
| PRO-027 | Verify duplicate profile reward not given | P1 | Application is accessible and prerequisite setup completed | Complete the profile a second time (e.g. by re-editing) | Duplicate +$10 profile reward is not granted |
| WEL-001 | Complete Profile card visible if profile incomplete | P2 | Application is accessible and prerequisite setup completed | Log in with an incomplete profile and view the Welcome page | Complete Profile card is visible |
| WEL-002 | Earn Credits card visible | P2 | Application is accessible and prerequisite setup completed | View the Welcome page | Earn Credits card is visible |
| WEL-003 | Affiliate card visible | P3 | Application is accessible and prerequisite setup completed | View the Welcome page | Affiliate card is visible |
| WEL-004 | Review Waiting card visible after review started | P2 | Application is accessible and prerequisite setup completed | Start a review and return to the Welcome page | Review Waiting card is visible |
| WEL-005 | Complete Now opens profile popup | P2 | Application is accessible and prerequisite setup completed | Click "Complete Now" on the Complete Profile card | Complete Profile popup opens |
| WEL-006 | Earn Credits opens popup | P2 | Application is accessible and prerequisite setup completed | Click on the Earn Credits card | Earn Credits popup opens |
| WEL-007 | Join Now redirects correctly | P2 | Application is accessible and prerequisite setup completed | Click "Join Now" on the Affiliate card | User is redirected to the correct affiliate page |
| WEL-008 | Claim Credits opens review URL popup | P2 | Application is accessible and prerequisite setup completed | Click "Claim Credits" on the Review Waiting card | Review URL submission popup opens |
| WEL-009 | Completed profile hides profile card | P2 | Application is accessible and prerequisite setup completed | Complete the profile fully and return to the Welcome page | Complete Profile card is no longer shown |

_Note: the source groups both the `PRO-` and `WEL-` prefixed cases under the same "Module 4 - Profile Completion" section; that grouping is preserved here rather than splitting `WEL-` into its own sub-header._

## Earn Credits Popup

| TC ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| EC-001 | Popup opens successfully | P1 | Application is accessible and prerequisite setup completed | Click the Earn Credits card/button | Earn Credits popup opens successfully |
| EC-002 | All review platforms displayed | P2 | Application is accessible and prerequisite setup completed | Open the Earn Credits popup | All supported review platforms are displayed |
| EC-003 | Review button works | P2 | Application is accessible and prerequisite setup completed | Click the Review button for a platform | User is directed to the review flow for that platform |
| EC-004 | Submit URL works | P2 | Application is accessible and prerequisite setup completed | Enter a review URL and click Submit | URL is submitted successfully |
| EC-005 | Referral link generated | P2 | Application is accessible and prerequisite setup completed | Open the referral section of the Earn Credits popup | A unique referral link is generated |
| EC-006 | Copy button copies link | P3 | Application is accessible and prerequisite setup completed | Click the Copy button next to the referral link | Referral link is copied to clipboard |
| EC-007 | Invite Now opens invite flow | P2 | Application is accessible and prerequisite setup completed | Click "Invite Now" | Invite flow opens (e.g. share/invite dialog) |
| EC-008 | Idea submission works | P3 | Application is accessible and prerequisite setup completed | Enter an idea/feedback and submit | Idea is submitted successfully |
| EC-009 | Popup responsive | P3 | Application is accessible and prerequisite setup completed | Open the Earn Credits popup on different screen sizes | Popup layout remains responsive and usable |

## Review Flow

| TC ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| REV-001 | Instruction popup opens | P1 | Application is accessible and prerequisite setup completed | Click Review for a selected platform | Instruction popup opens |
| REV-002 | Correct platform title shown | P2 | Application is accessible and prerequisite setup completed | Open the review instruction popup for a specific platform | Popup title matches the selected platform |
| REV-003 | Go to Platform opens new tab | P2 | Application is accessible and prerequisite setup completed | Click "Go to Platform" in the instruction popup | Platform review page opens in a new tab |
| REV-004 | Review Started status saved | P2 | Application is accessible and prerequisite setup completed | Click "Go to Platform" and return to the app | Review status is saved as "Review Started" |
| REV-005 | Blank URL validation | P2 | Application is accessible and prerequisite setup completed | Leave the review URL field blank and submit | Validation error is shown |
| REV-006 | Invalid URL validation | P2 | Application is accessible and prerequisite setup completed | Enter a malformed URL and submit | Validation error is shown |
| REV-007 | Wrong platform URL | P2 | Application is accessible and prerequisite setup completed | Submit a URL that belongs to a different platform than selected | Validation error indicating the URL doesn't match the selected platform |
| REV-008 | Duplicate URL | P2 | Application is accessible and prerequisite setup completed | Submit a review URL that has already been submitted | Validation error indicating a duplicate URL |
| REV-009 | Rejected URL resubmission | P2 | Application is accessible and prerequisite setup completed | After a URL is rejected, submit a new/corrected URL | Resubmission is accepted for review |
| REV-010 | Credits added after approval | P1 | Application is accessible and prerequisite setup completed | Have a submitted review URL approved by an admin/reviewer | Review credits are added to the account |
| REV-011 | Duplicate credits prevented | P1 | Application is accessible and prerequisite setup completed | Attempt to claim review credits again for an already-approved review | Duplicate credit reward is prevented |

## Low Credit Alert

| TC ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| LOW-001 | Popup appears at exactly 75% usage | P1 | Application is accessible and prerequisite setup completed | Consume credits until usage reaches exactly 75% | Low Credit Alert popup appears |
| LOW-002 | Popup does not appear before 75% | P2 | Application is accessible and prerequisite setup completed | Consume credits up to just below 75% usage | Low Credit Alert popup does not appear |
| LOW-003 | Upgrade button redirects | P2 | Application is accessible and prerequisite setup completed | Click the Upgrade button on the Low Credit Alert popup | User is redirected to the upgrade/plans page |
| LOW-004 | Pending tasks displayed | P2 | Application is accessible and prerequisite setup completed | Open the Low Credit Alert popup with incomplete onboarding tasks | Pending tasks are displayed in the popup |
| LOW-005 | Completed tasks shown completed | P2 | Application is accessible and prerequisite setup completed | Open the Low Credit Alert popup after completing some tasks | Completed tasks are shown with a completed status |
| LOW-006 | Complete Profile opens correct popup | P2 | Application is accessible and prerequisite setup completed | Click "Complete Profile" within the Low Credit Alert popup | Complete Profile popup opens |
| LOW-007 | Earn Credits opens popup | P2 | Application is accessible and prerequisite setup completed | Click "Earn Credits" within the Low Credit Alert popup | Earn Credits popup opens |
| LOW-008 | Popup not shown repeatedly after dismissal | P2 | Application is accessible and prerequisite setup completed | Dismiss the Low Credit Alert popup and continue using the app | Popup does not repeatedly reappear |
| LOW-009 | Popup hidden after upgrade | P2 | Application is accessible and prerequisite setup completed | Upgrade the plan after seeing the Low Credit Alert popup | Low Credit Alert popup no longer appears |

## Credit Rules

| TC ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| CR-001 | Account reward once only | P1 | Application is accessible and prerequisite setup completed | Attempt to trigger the account-creation reward more than once | Account reward is granted only once |
| CR-002 | Mobile reward once only | P1 | Application is accessible and prerequisite setup completed | Attempt to trigger the mobile-verification reward more than once | Mobile reward is granted only once |
| CR-003 | Profile reward once only | P1 | Application is accessible and prerequisite setup completed | Attempt to trigger the profile-completion reward more than once | Profile reward is granted only once |
| CR-004 | Review reward once per platform | P2 | Application is accessible and prerequisite setup completed | Submit and get approved reviews on the same platform more than once | Review reward is granted only once per platform |
| CR-005 | Referral reward after signup | P2 | Application is accessible and prerequisite setup completed | Refer a user who then signs up | Referral reward is granted after the referred user's signup |
| CR-006 | Idea reward after approval | P2 | Application is accessible and prerequisite setup completed | Submit an idea and have it approved | Idea reward is granted after approval |
| CR-007 | No duplicate reward for same action | P1 | Application is accessible and prerequisite setup completed | Repeat any single rewarded action | No duplicate reward is granted for the same action |
| CR-008 | Credit balance updates correctly | P1 | Application is accessible and prerequisite setup completed | Earn a credit reward through any rewarded action | Credit balance updates correctly to reflect the reward |

## Review Status

| TC ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| RS-001 | Status changes to Review Started | P2 | Application is accessible and prerequisite setup completed | Click "Go to Platform" for a review | Review status changes to "Review Started" |
| RS-002 | Status changes to URL Pending | P2 | Application is accessible and prerequisite setup completed | Start a review without submitting a URL | Review status changes to "URL Pending" |
| RS-003 | Status changes to URL Submitted | P2 | Application is accessible and prerequisite setup completed | Submit a review URL | Review status changes to "URL Submitted" |
| RS-004 | Status changes to Approved | P1 | Application is accessible and prerequisite setup completed | Have a submitted review URL approved | Review status changes to "Approved" |
| RS-005 | Status changes to Rejected | P2 | Application is accessible and prerequisite setup completed | Have a submitted review URL rejected | Review status changes to "Rejected" |
| RS-006 | Pending review card visibility logic | P2 | Application is accessible and prerequisite setup completed | Progress a review through various statuses and check the Welcome page | Pending review card is shown/hidden according to the current status |

## Logging

| TC ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| LOG-001 | Account reward logged | P2 | Application is accessible and prerequisite setup completed | Trigger the account-creation reward | Account reward is logged in the system |
| LOG-002 | Mobile reward logged | P2 | Application is accessible and prerequisite setup completed | Trigger the mobile-verification reward | Mobile reward is logged in the system |
| LOG-003 | Profile reward logged | P2 | Application is accessible and prerequisite setup completed | Trigger the profile-completion reward | Profile reward is logged in the system |
| LOG-004 | Review reward logged | P2 | Application is accessible and prerequisite setup completed | Trigger the review-approval reward | Review reward is logged in the system |
| LOG-005 | Referral reward logged | P2 | Application is accessible and prerequisite setup completed | Trigger the referral reward | Referral reward is logged in the system |
| LOG-006 | Idea reward logged | P2 | Application is accessible and prerequisite setup completed | Trigger the idea-approval reward | Idea reward is logged in the system |
| LOG-007 | Status stored correctly | P2 | Application is accessible and prerequisite setup completed | Change a review's status | Status is stored correctly in the system |
| LOG-008 | Approved date stored | P2 | Application is accessible and prerequisite setup completed | Approve a submitted review | Approval date is stored correctly |
| LOG-009 | Platform stored | P2 | Application is accessible and prerequisite setup completed | Submit a review for a specific platform | Platform is stored correctly with the review record |
| LOG-010 | Duplicate logs not created | P2 | Application is accessible and prerequisite setup completed | Repeat a rewarded action that has already been logged | No duplicate log entry is created |

## End-to-End (Critical)

| TC ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| E2E-001 | Signup → Welcome → Mobile Verify → Profile Complete → $30 Credits | P1 | Application is accessible and prerequisite setup completed | Sign up, view the Welcome popup, verify mobile, complete profile | All steps complete successfully and credits reach $30/$30 |
| E2E-002 | Signup → Skip → Complete Later | P1 | Application is accessible and prerequisite setup completed | Sign up, skip onboarding tasks, then return later to complete them | Skipped tasks can be completed later and progress is preserved |
| E2E-003 | Signup → Profile First → Mobile Later | P1 | Application is accessible and prerequisite setup completed | Sign up, complete profile before verifying mobile, then verify mobile afterward | Tasks can be completed out of order and both rewards are granted correctly |
| E2E-004 | Signup → Change Mobile → Verify → Profile Complete | P1 | Application is accessible and prerequisite setup completed | Sign up, change the mobile number, verify the new number, then complete profile | Updated mobile is verified and profile completion proceeds correctly |
| E2E-005 | Review Flow End-to-End | P1 | Application is accessible and prerequisite setup completed | Start a review, submit a URL, and have it approved | Review status progresses correctly through each stage and credits are awarded on approval |
| E2E-006 | Referral Flow End-to-End | P1 | Application is accessible and prerequisite setup completed | Generate a referral link, share it, and have a referred user sign up | Referral reward is granted correctly after signup |
| E2E-007 | Low Credit Alert Flow | P1 | Application is accessible and prerequisite setup completed | Consume credits to reach the 75% threshold and interact with the resulting popup | Low Credit Alert popup appears and its actions function correctly |
| E2E-008 | Upgrade after Low Credit | P1 | Application is accessible and prerequisite setup completed | Trigger the Low Credit Alert popup and complete an upgrade | Plan is upgraded and the Low Credit Alert popup no longer appears |
| E2E-009 | Resume Profile after Closing Popup | P1 | Application is accessible and prerequisite setup completed | Begin profile completion, close the popup partway through, then reopen it | Profile completion resumes from where it was left off |
| E2E-010 | Duplicate Credit Prevention | P1 | Application is accessible and prerequisite setup completed | Attempt to repeat any already-rewarded onboarding action | No duplicate credit is granted for the repeated action |
