# My Account / Profile — Test Cases

_No automated spec yet — sourced from QA backlog. Automated: No for all rows below until specs are written._

## User Profile (My Account → Profile → User Information)

Common precondition: user is logged into the app and on the Profile page.

| TC ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| TC-ACCOUNT-001 | Profile loads with correct user name | P2 | Logged in, on Profile page | 1. Open the Profile page. | User's profile loads correctly showing the name (e.g. "Sanjay Tiwari"). |
| TC-ACCOUNT-002 | Profile shows correct email address | P2 | Logged in, on Profile page | 1. Open the Profile page. | Email address is displayed correctly (e.g. "sanjay.tiwari@volza.com"). |
| TC-ACCOUNT-003 | Profile shows correct company name | P2 | Logged in, on Profile page | 1. Open the Profile page. | Company name is displayed correctly (e.g. "SME Trail Plan"). |
| TC-ACCOUNT-004 | Profile shows correct user role | P2 | Logged in, on Profile page | 1. Open the Profile page. | Role is displayed correctly (e.g. "Admin"). |
| TC-ACCOUNT-005 | Profile shows correct mobile number, properly formatted | P2 | Logged in, on Profile page | 1. Open the Profile page. | Mobile number is shown and formatted correctly (e.g. "+91 79051-75159"). |
| TC-ACCOUNT-006 | Profile shows correct designation | P2 | Logged in, on Profile page | 1. Open the Profile page. | Designation is displayed correctly (e.g. "Tester"). |
| TC-ACCOUNT-007 | Profile shows correct Sales Executive name | P2 | Logged in, on Profile page | 1. Open the Profile page. | Sales Executive's name is displayed correctly (e.g. "Michael Robinson"). |
| TC-ACCOUNT-008 | Edit icon next to User Name allows profile updates | P1 | Logged in, on Profile page | 1. Click the Edit icon next to the User Name. | User is able to update their profile information. |
| TC-ACCOUNT-009 | "Verify your number" button leads to mobile verification | P1 | Logged in, on Profile page | 1. Click "Verify your number". | Button functions properly and leads to a screen for verifying the mobile number. |
| TC-ACCOUNT-010 | "Login with Different Company" redirects to login screen | P1 | Logged in, on Profile page | 1. Click "Login with Different Company". | Redirects to the appropriate login screen. |
| TC-ACCOUNT-011 | Profile page layout is clean with proper spacing | P3 | Logged in, on Profile page | 1. Visually inspect the Profile page layout. | Layout is clear, with proper spacing between sections. |
| TC-ACCOUNT-012 | Profile picture is visible in account section | P3 | Logged in, on Profile page | 1. Check the account section for a profile picture. | Profile picture (if any) is visible. |
| TC-ACCOUNT-013 | Account section reflects latest info without delay | P2 | Logged in, on Profile page | 1. Compare displayed profile data against the latest known account data. | Account section reflects the latest information without delay. |
| TC-ACCOUNT-014 | Profile does not show outdated/incorrect information | P2 | Logged in, on Profile page, profile info recently changed | 1. Compare displayed data (e.g. email) against current account data. | Profile does not display incorrect or outdated information (e.g. a previous email address). |
| TC-ACCOUNT-015 | Role and designation cannot be changed without authorization | P2 | Logged in, on Profile page, non-admin user | 1. Attempt to change role/designation without admin authorization. | Role and designation cannot be changed unless authorized. |
| TC-ACCOUNT-016 | Incorrect mobile number fails verification | P3 | Logged in, on Profile page | 1. Enter an incorrect mobile number.<br>2. Attempt to verify. | Verification fails, or the number is flagged as invalid. |
| TC-ACCOUNT-017 | Edit icon does not error in read-only mode | P3 | Logged in, Profile page in read-only mode | 1. Click the Edit icon for User Name while the page is read-only. | No errors occur. |
| TC-ACCOUNT-018 | "Verify your number" without a valid mobile number shows an error | P3 | Logged in, on Profile page, no valid mobile number entered | 1. Click "Verify your number" without entering a valid mobile number. | Error message is shown. |
| TC-ACCOUNT-019 | "Login with Different Company" does not cause navigation errors | P3 | Logged in, on Profile page | 1. Click "Login with Different Company". | No navigation errors occur. |
| TC-ACCOUNT-020 | Verifying an already-verified number shows an appropriate message | P3 | Logged in, mobile number already verified | 1. Click "Verify your number" with an already-verified number. | Message indicates the number is already verified. |
| TC-ACCOUNT-021 | Broken profile picture does not break page text | P3 | Logged in, on Profile page, profile image broken/missing | 1. Load the Profile page with a broken profile image. | Text still displays correctly without UI breakdowns. |
| TC-ACCOUNT-022 | Profile info is not misaligned on browser resize | P3 | Logged in, on Profile page | 1. Resize the browser window. | Profile information is not misaligned. |
| TC-ACCOUNT-023 | Company name/designation/mobile update immediately on change | P2 | Logged in, on Profile page | 1. Change company name, designation, or mobile number. | Displayed value updates immediately. |
| TC-ACCOUNT-024 | Email address cannot be updated without proper authentication | P2 | Logged in, on Profile page | 1. Attempt to update the email address without proper authentication/permission. | Email address cannot be updated or modified. |

## My Balance (My Account → Profile → My Balance)

Common precondition: user is logged into the app and on the "My Balance" page.

| TC ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| TC-ACCOUNT-025 | Annual Download Balance Points displayed correctly | P2 | Logged in, on My Balance page | 1. Open My Balance. | "Annual Download Balance Points" shown correctly (e.g. "1,027,445/1,040,000"). |
| TC-ACCOUNT-026 | Searches left in Trending Companies Annual displayed correctly | P2 | Logged in, on My Balance page | 1. Open My Balance. | "Searches left in Trending Companies Annual" shown correctly (e.g. "249/300"). |
| TC-ACCOUNT-027 | Searches left in Trending Products Annual displayed correctly | P2 | Logged in, on My Balance page | 1. Open My Balance. | "Searches Left in Trending Products Annual" shown correctly (e.g. "1,054/1,200"). |
| TC-ACCOUNT-028 | Profile View Balance displayed correctly | P2 | Logged in, on My Balance page | 1. Open My Balance. | "Profile View Balance" shown correctly (e.g. "9,966/10,000"). |
| TC-ACCOUNT-029 | Balance Full Profile displayed correctly | P2 | Logged in, on My Balance page | 1. Open My Balance. | "Balance Full Profile" shown correctly (e.g. "945/1,000"). |
| TC-ACCOUNT-030 | Daily Search balance displayed correctly | P2 | Logged in, on My Balance page | 1. Open My Balance. | "Daily Search" shown correctly (e.g. "260/300"). |
| TC-ACCOUNT-031 | Monthly Pagination Limit displayed correctly | P2 | Logged in, on My Balance page | 1. Open My Balance. | "Monthly Pagination Limit" shown correctly (e.g. "26,992/27,000"). |
| TC-ACCOUNT-032 | Daily Rate Limit displayed correctly | P2 | Logged in, on My Balance page | 1. Open My Balance. | "Daily Rate Limit" shown correctly (e.g. "11,539/12,000"). |
| TC-ACCOUNT-033 | Monthly Rate Limit displayed correctly | P2 | Logged in, on My Balance page | 1. Open My Balance. | "Monthly Rate Limit" shown correctly (e.g. "116,086/120,000"). |
| TC-ACCOUNT-034 | Each balance value is current, not outdated | P2 | Logged in, on My Balance page | 1. Compare each balance value against the account's actual usage. | Each balance shows up-to-date data; no outdated/incorrect values. |
| TC-ACCOUNT-035 | Balance section layout is clean with proper spacing | P3 | Logged in, on My Balance page | 1. Visually inspect balance section layout. | Layout is clean with proper spacing between sections. |
| TC-ACCOUNT-036 | Balance text is readable without truncation/overlap | P3 | Logged in, on My Balance page | 1. Visually inspect balance text. | Text is readable, no truncation or overlaps. |
| TC-ACCOUNT-037 | Balance section buttons are visible, functional and placed appropriately | P3 | Logged in, on My Balance page | 1. Locate and click balance section buttons (if any). | Buttons are visible, functional, and appropriately placed. |
| TC-ACCOUNT-038 | Warning shown when a balance limit is reached | P2 | Logged in, a balance limit reached (e.g. Annual Download Balance Points) | 1. Reach a balance limit. | User sees a warning or message. |
| TC-ACCOUNT-039 | Balance values are accurate per latest updates | P2 | Logged in, on My Balance page | 1. Compare balance values against the latest account activity. | Values are accurate and reflect the correct counts. |
| TC-ACCOUNT-040 | Balance updates instantly after a relevant action | P2 | Logged in, on My Balance page | 1. Perform an action affecting balance (e.g. a search).<br>2. Return to My Balance. | New values are reflected instantly. |
| TC-ACCOUNT-041 | Clicking a balance category redirects to its detail section | P2 | Logged in, on My Balance page | 1. Click a balance category (e.g. "Profile View Balance"). | Redirects to the correct section for more details. |
| TC-ACCOUNT-042 | Error message shown if balance data fails to load | P3 | Logged in, balance data source unavailable | 1. Load My Balance while the data source is failing. | Appropriate error message is displayed. |
| TC-ACCOUNT-043 | Balance sections are not empty/incorrect if data source fails | P3 | Logged in, balance data source unavailable | 1. Load My Balance while the data source is failing. | Sections are not empty or showing incorrect values. |
| TC-ACCOUNT-044 | Balance font size/style is consistent and legible | P3 | Logged in, on My Balance page | 1. Visually inspect font size/style across balance sections. | Font size and style are consistent and legible. |
| TC-ACCOUNT-045 | Balance section updates after a user action affecting it | P2 | Logged in, on My Balance page | 1. Perform an action affecting a specific balance (e.g. "Searches Left in Trending Products Annual"). | That balance section updates once the action is performed. |

## My Activities (My Account → Profile → My Activities)

Common precondition: user is logged into the app and on the "My Activities" page. Counts reflect current live data at time of test (e.g. login count, searches).

| TC ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| TC-ACCOUNT-046 | Login count till date displayed correctly | P2 | Logged in, on My Activities page | 1. Open My Activities. | "Login count till date" shown correctly (e.g. "11"). |
| TC-ACCOUNT-047 | Searches in last 30 days displayed correctly | P2 | Logged in, on My Activities page | 1. Open My Activities. | "Searches in last 30 days" shown correctly (e.g. "208"). |
| TC-ACCOUNT-048 | Points consumed displayed correctly | P2 | Logged in, on My Activities page | 1. Open My Activities. | "Points consumed" shown correctly (e.g. "397"). |
| TC-ACCOUNT-049 | Workspace count displayed correctly | P2 | Logged in, on My Activities page | 1. Open My Activities. | "Workspace" count shown correctly (e.g. "135"). |
| TC-ACCOUNT-050 | Downloads count displayed correctly | P2 | Logged in, on My Activities page | 1. Open My Activities. | "Downloads" count shown correctly (e.g. "39"). |
| TC-ACCOUNT-051 | Trouble Tickets count displayed correctly | P2 | Logged in, on My Activities page | 1. Open My Activities. | "Trouble Tickets" count shown correctly (e.g. "1"). |
| TC-ACCOUNT-052 | Favorites Companies count displayed correctly | P2 | Logged in, on My Activities page | 1. Open My Activities. | "Favorites Companies" count shown correctly (e.g. "0"). |
| TC-ACCOUNT-053 | Comments count displayed correctly | P2 | Logged in, on My Activities page | 1. Open My Activities. | "Comments" count shown correctly (e.g. "5"). |
| TC-ACCOUNT-054 | Users Created count displayed correctly | P2 | Logged in, on My Activities page | 1. Open My Activities. | "Users Created" count shown correctly (e.g. "9"). |
| TC-ACCOUNT-055 | "Rate Us!" count displayed correctly | P2 | Logged in, on My Activities page | 1. Open My Activities. | "Rate Us!" count shown correctly (e.g. "0"). |
| TC-ACCOUNT-056 | Current subscription details display correctly | P1 | Logged in, on My Activities page | 1. Open My Activities. | Current subscription details display correctly, including plan (e.g. "SME Flexible") and end date (e.g. "30-Nov-2025"). |
| TC-ACCOUNT-057 | Time till renewal displayed correctly | P2 | Logged in, on My Activities page | 1. Open My Activities. | Time till renewal shown correctly (e.g. "82 Days: 13 Hrs: 57 Min"). |
| TC-ACCOUNT-058 | Upgrade and Renew buttons are functional | P1 | Logged in, on My Activities page | 1. Click Upgrade.<br>2. Click Renew. | Both buttons lead to the appropriate action. |
| TC-ACCOUNT-059 | Status toggle changes subscription status | P2 | Logged in, on My Activities page | 1. Click the Status toggle. | Subscription status changes accordingly. |
| TC-ACCOUNT-060 | Activity icons are displayed clearly and aligned | P3 | Logged in, on My Activities page | 1. Visually inspect activity icons. | Icons (login count, searches, etc.) are displayed clearly and aligned properly. |
| TC-ACCOUNT-061 | Activity text is readable without truncation/overlap | P3 | Logged in, on My Activities page | 1. Visually inspect activity section text. | Text is readable, no truncation or overlap. |
| TC-ACCOUNT-062 | My Activities layout is consistent with other pages | P3 | Logged in, on My Activities page | 1. Compare layout/spacing with other app pages. | Layout is consistent, maintaining proper spacing. |
| TC-ACCOUNT-063 | Activity data updates in real time after an action | P2 | Logged in, on My Activities page | 1. Perform an action (e.g. consume points, create a user).<br>2. Return to My Activities. | Data updates in real time. |
| TC-ACCOUNT-064 | Activity data does not show outdated/incorrect values | P2 | Logged in, multiple sessions/refreshes performed | 1. Refresh or re-open My Activities across sessions. | Data does not show outdated or incorrect values. |
| TC-ACCOUNT-065 | Error message shown if activity data fails to load | P3 | Logged in, activity data source unavailable | 1. Load My Activities with data (e.g. "Points consumed") failing to load. | Error message is displayed. |
| TC-ACCOUNT-066 | Fallback message shown if renewal time cannot be calculated | P3 | Logged in, renewal time calculation fails | 1. Load My Activities where subscription time-left cannot be calculated. | Fallback message is displayed. |
| TC-ACCOUNT-067 | Upgrade button redirects to upgrade screen | P1 | Logged in, on My Activities page | 1. Click Upgrade. | Redirects to a screen where the user can upgrade their subscription. |
| TC-ACCOUNT-068 | Renew button redirects to renew screen | P1 | Logged in, on My Activities page | 1. Click Renew. | Redirects to a screen where the user can renew their subscription. |

## Advanced Search Used (My Account → My Activities → Searched — Advanced Search Used)

Common precondition: user is logged into the app and on the "Advanced Search Used" page. Data columns: Query Id, User Name, Country, Period, Start Date, End Date, Search Test.

| TC ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| TC-ACCOUNT-069 | Query Id displayed correctly per record | P2 | Logged in, on Advanced Search Used page | 1. Open Advanced Search Used. | "Query Id" for each search is displayed correctly (e.g. "20378828"). |
| TC-ACCOUNT-070 | User Name displayed correctly per record | P2 | Logged in, on Advanced Search Used page | 1. Open Advanced Search Used. | "User Name" for each search is displayed correctly (e.g. "Sanjay Tiwari"). |
| TC-ACCOUNT-071 | Country displayed correctly per record | P2 | Logged in, on Advanced Search Used page | 1. Open Advanced Search Used. | "Country" for each search is displayed correctly (e.g. "Argentina Export T1"). |
| TC-ACCOUNT-072 | Period displayed correctly per record | P2 | Logged in, on Advanced Search Used page | 1. Open Advanced Search Used. | "Period" for each search is displayed correctly (e.g. "Last 30 Days"). |
| TC-ACCOUNT-073 | Start Date displayed correctly per record | P2 | Logged in, on Advanced Search Used page | 1. Open Advanced Search Used. | "Start Date" is displayed correctly (e.g. "05-01-2025"). |
| TC-ACCOUNT-074 | End Date displayed correctly per record | P2 | Logged in, on Advanced Search Used page | 1. Open Advanced Search Used. | "End Date" is displayed correctly (e.g. "05-30-2025"). |
| TC-ACCOUNT-075 | Search Test column shows correct search type | P2 | Logged in, on Advanced Search Used page | 1. Open Advanced Search Used. | "Search Test" column shows the search type (e.g. "oil"). |
| TC-ACCOUNT-076 | All rows display correct data across all columns | P2 | Logged in, on Advanced Search Used page | 1. Review all rows in the table. | All rows show correct data for Query Id, User Name, Country, etc. |
| TC-ACCOUNT-077 | "Select User" dropdown filters the table correctly | P2 | Logged in, on Advanced Search Used page | 1. Select a user from the "Select User" dropdown. | Table updates correctly to the selected user. |
| TC-ACCOUNT-078 | "Select Country" dropdown filters the table correctly | P2 | Logged in, on Advanced Search Used page | 1. Select a country from the "Select Country" dropdown. | Table updates correctly to the selected country. |
| TC-ACCOUNT-079 | Selecting a different Period updates results | P2 | Logged in, on Advanced Search Used page | 1. Select a different Period (e.g. "Last 10 Days"). | Search results update accordingly. |
| TC-ACCOUNT-080 | Sorting by Start Date / End Date works | P2 | Logged in, on Advanced Search Used page | 1. Sort by Start Date.<br>2. Sort by End Date. | Sorting works as expected, ascending or descending. |
| TC-ACCOUNT-081 | Core columns correctly displayed for each record | P2 | Logged in, on Advanced Search Used page | 1. Review Query Id, User Name, Country, Period, Start Date, End Date for each record. | All fields are correctly displayed for each record. |
| TC-ACCOUNT-082 | Search Test values correctly populated per query | P2 | Logged in, on Advanced Search Used page | 1. Review Search Test values against the search query. | Values are correctly populated (e.g. "oil"). |
| TC-ACCOUNT-083 | Table is properly formatted with visible columns | P3 | Logged in, on Advanced Search Used page | 1. Visually inspect the table. | Table is properly formatted, columns clearly visible, no truncation. |
| TC-ACCOUNT-084 | "Select User"/"Select Country" dropdowns are easy to use | P3 | Logged in, on Advanced Search Used page | 1. Open the "Select User" and "Select Country" dropdowns. | Dropdowns are easy to use and display relevant options. |
| TC-ACCOUNT-085 | Table headers align correctly with columns | P3 | Logged in, on Advanced Search Used page | 1. Visually inspect table header alignment. | Headers (Query Id, User Name, etc.) align correctly with their columns. |
| TC-ACCOUNT-086 | Invalid date range shows an error message | P3 | Logged in, on Advanced Search Used page | 1. Select a Start Date after the End Date. | Error message is shown. |
| TC-ACCOUNT-087 | No-data message shown when filters return nothing | P3 | Logged in, filters selected with no matching data | 1. Select filters with no matching results (e.g. a specific user with no searches). | Message indicating no data is found is displayed. |
| TC-ACCOUNT-088 | Searching by Query Id filters and updates the table | P2 | Logged in, on Advanced Search Used page | 1. Search by a specific Query Id. | Results are filtered based on input and the table updates. |
| TC-ACCOUNT-089 | Clicking a Query Id opens a detailed view | P2 | Logged in, on Advanced Search Used page | 1. Click a specific Query Id. | Detailed view opens with more information related to that query. |
| TC-ACCOUNT-090 | Start Date / End Date fields use correct date format | P3 | Logged in, on Advanced Search Used page | 1. Inspect Start Date and End Date field formatting. | Fields correctly reflect the date format (MM-DD-YYYY). |
| TC-ACCOUNT-091 | Country column matches the user's search criteria | P2 | Logged in, on Advanced Search Used page | 1. Compare the Country column against the search criteria used. | Countries listed match the user's search criteria (e.g. "Argentina Export T1"). |
| TC-ACCOUNT-092 | Empty/invalid User Name shows an error message | P3 | Logged in, a record with empty/invalid User Name | 1. View a record with an empty or invalid User Name. | Error message is displayed. |
| TC-ACCOUNT-093 | All Query Ids are unique with no duplicates | P2 | Logged in, on Advanced Search Used page | 1. Review Query Ids across all records. | All Query Ids are unique; no duplicates are present. |
