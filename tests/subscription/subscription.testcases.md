# Subscription — Test Cases

## Section 1: Share Demo / Payment Link (Client Tab)

Sourced from the QA backlog CSV (`Daily Testing and app test cases(Module wise TestCases).csv`, "Module 3: Share Demo/Payment Link (Client tab)"). Automated by `tests/subscription/share-demo-payment-link.spec.js`. The source spec's `TC-1`/`TC-2` were combined into a single test (tab load + blurred data + load-data click); everything else maps 1:1 to the CSV's numbered steps. The CSV's step 13 ("click Pay in the email template and complete a real purchase") is documented for completeness but is not automated — the spec verifies the email send only, not an end-to-end payment.

Common precondition: user is logged in on app.volza.com with valid OTP, and has a Sales Demo plan assigned at executive level.

| TC ID | Title | Priority | Preconditions | Steps | Expected Result | Spec Reference |
|---|---|---|---|---|---|---|
| TC-SUBSCRIPTION-001 | Open Share Demo tab on All tab with blurred data, then load data | P1 | Logged in, Sales Demo (executive) plan | 1. Click the "Share Demo/Payment Link" tab.<br>2. Verify it opens on the "All" tab with the grid data blurred.<br>3. Click "Click here to load data". | Tab opens on "All" with blurred data; clicking "Click here to load data" loads the data into the grid. | `share-demo-payment-link.spec.js` |
| TC-SUBSCRIPTION-002 | Date picker from 2010 to present loads without Oh Snap error | P2 | Logged in, on Share Demo/Payment Link tab, data loaded | 1. From the date picker, select the time period from 2010 to the present year.<br>2. Apply. | Grid loads data for the selected range without any "Oh snap" error. | `share-demo-payment-link.spec.js` |
| TC-SUBSCRIPTION-003 | Column sorting on Company Name, Email, Plan Name, etc. | P2 | Logged in, on Share Demo/Payment Link tab, data loaded | 1. Click sort on each column: Company name, Person name, Email, User mobile, Plan Name, Last link sent on, Plan Start date, Plan end date, Status, Last Login On, etc. | Each column sorts the grid accordingly. | `share-demo-payment-link.spec.js` |
| TC-SUBSCRIPTION-004 | Column search filter on Company Name and reset | P2 | Logged in, on Share Demo/Payment Link tab, data loaded | 1. Click the Company Name column filter, type a company name, click "Search".<br>2. Click "Reset" to clear the filter. | Search shows matching results; Reset clears the company name filter. | `share-demo-payment-link.spec.js` |
| TC-SUBSCRIPTION-005 | Last Login column shows date after user login and search | P2 | Logged in, on Share Demo/Payment Link tab, data loaded | 1. Go to the "Last Login" column and check that a date is shown. | Last login date is shown, reflecting when the user last logged in and ran a search on that plan. | `share-demo-payment-link.spec.js` |
| TC-SUBSCRIPTION-006 | Clear All button clears all applied filters | P2 | Logged in, on Share Demo/Payment Link tab, one or more filters applied | 1. Click "Clear All". | All applied filters are cleared. | `share-demo-payment-link.spec.js` |
| TC-SUBSCRIPTION-007 | Share Payment Link - fill details, send, verify email | P1 | Logged in, on Share Demo/Payment Link tab, data loaded | 1. Click "Share payment link".<br>2. Fill in all details.<br>3. Click "Send". | "Send" is clickable; an email is sent to the given recipient, and the email template details match those entered. (Not automated further: clicking "Pay" in the email template and completing a real purchase, per CSV step 13.) | `share-demo-payment-link.spec.js` |
| TC-SUBSCRIPTION-008 | Tab navigation shows data per tab (Free, Active, Expired, Payment Failure) | P2 | Logged in, on Share Demo/Payment Link tab, data loaded | 1. Click each of "Free", "Expired", "Active", "Payment failure" tabs in turn. | Grid shows data matching the selected tab (e.g. "Free" tab shows free users, "Expired" shows users whose plans have expired). | `share-demo-payment-link.spec.js` |
| TC-SUBSCRIPTION-009 | Free Trial Demo - send link and verify email redirect to login | P1 | Logged in, on Share Demo/Payment Link tab, data loaded | 1. Click "Free Trial Demo".<br>2. Fill in the given fields.<br>3. Click "Send Link". | An email is sent to the given user; clicking "Click here to login to the free trial plan" in the email redirects to login with a prefilled ID, and "Send OTP" lets the user log in to the free trial plan. | `share-demo-payment-link.spec.js` |

## Section 2: My Subscription Plan

Sourced from the QA backlog CSV, "New Added Test Cases" block, item 8 "My Subscription Plan" (rows ~1525-1547). This item has no existing Playwright automation — rows below continue the `TC-SUBSCRIPTION-###` ID sequence from Section 1.

Common precondition: user is logged in and on the My Subscription tab (My Account → My Subscription).

| TC ID | Title | Priority | Preconditions | Steps | Expected Result | Spec Reference |
|---|---|---|---|---|---|---|
| TC-SUBSCRIPTION-010 | My Subscription tab displays all plan sections | P1 | Logged in, on My Subscription tab | 1. Click on "My Subscription" tab. | Displays all plan lists: active, queued, invoice, subscription history. | Not automated |
| TC-SUBSCRIPTION-011 | Active subscription section shows correct plan details | P1 | Logged in, on My Subscription tab | 1. Check the active subscription section. | Active plan (e.g., SME) is displayed with all relevant details (Plan type, Purchase date, Status, etc.). | Not automated |
| TC-SUBSCRIPTION-012 | Upgrade button redirects to upgrade plan screen | P1 | Logged in, on My Subscription tab | 1. Click the "Upgrade" button. | Redirects to the upgrade plan screen, showing the Corporate plan and its pricing. | Not automated |
| TC-SUBSCRIPTION-013 | Plan details/pricing features display correct values | P2 | Logged in, on upgrade plan screen | 1. Check all plan details/pricing features listed. | All details show correct values. | Not automated |
| TC-SUBSCRIPTION-014 | Upgrade button redirects to payment screen with correct details | P1 | Logged in, on upgrade plan screen | 1. Click the "Upgrade" button. | Redirects to the payment screen, showing name, mobile, plan, company name, amount, and amount payable. | Not automated |
| TC-SUBSCRIPTION-015 | Proceed to Pay button shows order summary | P1 | Logged in, on payment screen | 1. Click "Proceed to Pay". | Order summary details are shown. | Not automated |
| TC-SUBSCRIPTION-016 | Zip/Postal code field accepts entry | P2 | Logged in, on order summary / payment details screen | 1. Enter a Zip/Postal code. | Zip code is entered successfully. | Not automated |
| TC-SUBSCRIPTION-017 | Terms/agreement checkbox can be selected | P2 | Logged in, on order summary / payment details screen | 1. Click the checkbox. | Checkbox is selected successfully. | Not automated |
| TC-SUBSCRIPTION-018 | Queued subscription section shows upcoming plan details | P2 | Logged in, on My Subscription tab, a queued plan exists | 1. Check the queued subscription section. | Displays the coming subscription plan's details. | Not automated |
| TC-SUBSCRIPTION-019 | Invoice section displays list of invoices | P2 | Logged in, on My Subscription tab | 1. Check the invoice section. | Displays the list of invoices for the subscription plan. | Not automated |
| TC-SUBSCRIPTION-020 | Subscription history section displays list of past plans | P2 | Logged in, on My Subscription tab | 1. Check the subscription history section. | Displays the list of all expired or older plans with full details. | Not automated |
