# Set Alert / My Alerts — Test Cases

_No automated spec yet — sourced from QA backlog. Automated: No for all rows below until specs are written._

Common preconditions across all sections unless noted otherwise: registered email already signed up on app.volza.com; active paid plan (SME or Corporate); a saved workspace exists for the relevant search/list.

## Set Alert (Advance Search)

| TC ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| TC-ALERT-001 | Set Alert button visible and popup opens with correct defaults | P1 | Saved Advance Search workspace | 1. Verify Set Alert button is visible.<br>2. Click Set Alert. | Set Alert button is visible; popup opens showing workspace name, user list, and toggles, with the current user's toggle defaulted to Yes. |
| TC-ALERT-002 | Toggle individual recipient Yes/No | P2 | Set Alert popup open | 1. Toggle a user to Yes.<br>2. Toggle a user to No. | Toggle state updates to Yes/No correctly for the selected user. |
| TC-ALERT-003 | Select multiple recipients | P2 | Set Alert popup open | 1. Select multiple recipients via their toggles. | Multiple recipient toggles remain selected. |
| TC-ALERT-004 | Recipient search — valid username/email returns match | P2 | Set Alert popup open | 1. Search the recipient field with a valid username.<br>2. Search the recipient field with a valid email. | Only the matching username is shown for a username search; the associated username is shown for an email search. |
| TC-ALERT-005 | Recipient search — invalid username/email returns no results | P3 | Set Alert popup open | 1. Search the recipient field with an invalid email/username. | No result found. |
| TC-ALERT-006 | Cancel closes popup without creating alert | P2 | Set Alert popup open | 1. Click Cancel. | Popup closes; no alert is set. |
| TC-ALERT-007 | Confirm with OK creates the alert | P1 | At least one recipient selected | 1. Click OK. | Proceeds to "Alert Created Successfully" popup; alert is visible under My Alerts (left-side panel). |
| TC-ALERT-008 | Recipient list scrolls when long | P3 | Long recipient list | 1. Scroll the recipient list. | Scrollbar appears and works. |

## Set Alert (Global Search)

| TC ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| TC-ALERT-009 | Set Alert button visible and date-selection popup loads | P1 | Saved Global Search workspace | 1. Verify Set Alert button is visible.<br>2. Click Set Alert. | Set Alert button is visible; date popup loads correctly with dropdowns and buttons. |
| TC-ALERT-010 | Select single/multiple valid dates | P2 | Date popup open | 1. Select one valid date (e.g. 7th of every month).<br>2. Select multiple dates. | Selection is retained for a single date; multiple selected dates remain selected. |
| TC-ALERT-011 | Validation error when no date selected | P3 | Date popup open, no date selected | 1. Click Next without selecting a date. | Validation error shown: "Please select at least one date before proceeding." |
| TC-ALERT-012 | SME plan limited to 2 alert dates per month | P2 | SME plan user, date popup open | 1. Attempt to select more than 2 dates. | SME users can select only 2 dates per month for each alert. |
| TC-ALERT-013 | Date dropdown supports search/type-ahead | P2 | Date popup open | 1. Search or type in the date dropdown (e.g. "15"). | Matches and selects "15th of every month". |
| TC-ALERT-014 | Cancel on date popup discards selection | P2 | Date popup open | 1. Click Cancel. | Popup closes without saving the date selection. |
| TC-ALERT-015 | Next with valid date proceeds to recipient popup with correct defaults | P1 | Valid date selected | 1. Click Next. | Proceeds to the recipient popup, displayed with workspace name, user list, and toggles, with the current user's toggle defaulted to Yes. |
| TC-ALERT-016 | Toggle individual/multiple recipients Yes/No | P2 | Recipient popup open | 1. Toggle a user to Yes.<br>2. Toggle a user to No.<br>3. Select multiple recipients. | Toggle states update correctly; multiple recipient toggles remain selected. |
| TC-ALERT-017 | Recipient search — valid username/email returns match | P2 | Recipient popup open | 1. Search with a valid username.<br>2. Search with a valid email. | Only the matching username is shown; associated username is shown for an email search. |
| TC-ALERT-018 | Recipient search — invalid input returns no results | P3 | Recipient popup open | 1. Search with an invalid email/username. | No result found. |
| TC-ALERT-019 | Cancel recipient popup discards alert | P2 | Recipient popup open | 1. Click Cancel. | Popup closes; no alert is set. |
| TC-ALERT-020 | Confirm with OK creates the alert | P1 | At least one recipient selected | 1. Click OK. | Proceeds to "Alert Created Successfully" popup; alert is visible under My Alerts (left-side panel). |
| TC-ALERT-021 | Recipient list scrolls when long | P3 | Long recipient list | 1. Scroll the recipient list. | Scrollbar appears and works. |

## Set Alert (Company List) (All tab)

| TC ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| TC-ALERT-022 | Bell icon visible and opens Import/Export direction popup | P1 | On Company List "All" tab | 1. Verify the bell icon is visible.<br>2. Click the bell icon. | Bell icon is visible; popup appears with Import/Export direction options and buttons. |
| TC-ALERT-023 | Select Import/Export direction highlights the choice | P2 | Direction popup open | 1. Select "Import" direction.<br>2. Select "Export" direction. | Selected direction button is highlighted/marked selected. |
| TC-ALERT-024 | Cancel on direction popup discards selection | P2 | Direction popup open | 1. Click Cancel. | Popup closes without saving the alert. |
| TC-ALERT-025 | Set Alert after selecting direction proceeds to recipient popup | P1 | Direction selected | 1. Click Set Alert. | Proceeds to the recipient popup, displayed with the workspace name (import/export), user list, and toggles, with the current user's toggle defaulted to Yes. |
| TC-ALERT-026 | Toggle individual/multiple recipients Yes/No | P2 | Recipient popup open | 1. Toggle a user to Yes.<br>2. Toggle a user to No.<br>3. Select multiple recipients. | Toggle states update correctly; multiple recipient toggles remain selected. |
| TC-ALERT-027 | Recipient search — valid username/email returns match | P2 | Recipient popup open | 1. Search with a valid username.<br>2. Search with a valid email. | Only the matching username is shown; associated username is shown for an email search. |
| TC-ALERT-028 | Recipient search — invalid input returns no results | P3 | Recipient popup open | 1. Search with an invalid email/username. | No result found. |
| TC-ALERT-029 | Cancel recipient popup discards alert | P2 | Recipient popup open | 1. Click Cancel. | Popup closes; no alert is set. |
| TC-ALERT-030 | Confirm with OK creates the alert | P1 | At least one recipient selected | 1. Click OK. | Proceeds to "Alert Created Successfully" popup; alert is visible under My Alerts (left-side panel). |
| TC-ALERT-031 | Recipient list scrolls when long | P3 | Long recipient list | 1. Scroll the recipient list. | Scrollbar appears and works. |

## Set Alert (Buyers, Suppliers, Export and Import Competitors)

_Source status for this section is recorded as Fail in the QA backlog — flagged for follow-up when specs are written._

| TC ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| TC-ALERT-032 | Alert bell icon visible and popup opens with correct defaults | P1 | On a Buyers/Suppliers/Export-Import Competitors list | 1. Verify the alert bell icon is visible.<br>2. Click Set Alert. | Bell icon is visible; popup appears showing company name, user list, and toggles, with the current user's toggle defaulted to Yes. |
| TC-ALERT-033 | Toggle individual recipient Yes/No | P2 | Set Alert popup open | 1. Toggle a user to Yes.<br>2. Toggle a user to No. | Toggle state updates correctly. |
| TC-ALERT-034 | Select multiple recipients | P2 | Set Alert popup open | 1. Select multiple recipients via their toggles. | Multiple recipient toggles remain selected. |
| TC-ALERT-035 | Recipient search — valid username/email returns match | P2 | Set Alert popup open | 1. Search with a valid username.<br>2. Search with a valid email. | Only the matching username is shown; associated username is shown for an email search. |
| TC-ALERT-036 | Recipient search — invalid input returns no results | P3 | Set Alert popup open | 1. Search with an invalid email/username. | No result found. |
| TC-ALERT-037 | Cancel closes popup without creating alert | P2 | Set Alert popup open | 1. Click Cancel. | Popup closes; no alert is set. |
| TC-ALERT-038 | Confirm with OK creates the alert | P1 | At least one recipient selected | 1. Click OK. | Proceeds to "Alert Created Successfully" popup; alert is visible under My Alerts (left-side panel). |
| TC-ALERT-039 | Recipient list scrolls when long | P3 | Long recipient list | 1. Scroll the recipient list. | Scrollbar appears and works. |

## Set Alert (Company Profile) (Contact, Import, Export)

_Source status for this section is recorded as Fail in the QA backlog. Source describes this as reusing the flows already covered above rather than a distinct script — flagged as a judgment call._

| TC ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| TC-ALERT-040 | Set Alert from Company Profile — Contact tab | P2 | On a Company Profile's Contact tab | 1. Click Set Alert on the Contact tab.<br>2. Follow the same recipient-selection flow as Set Alert (Company List, All tab). | Same behavior as TC-ALERT-022–031: popup opens, recipient toggles/search work, OK creates the alert. |
| TC-ALERT-041 | Set Alert from Company Profile — Import/Export tab | P2 | On a Company Profile's Import/Export tab | 1. Click Set Alert on the Import/Export tab.<br>2. Follow the same recipient-selection flow as Set Alert (Buyers/Suppliers). | Same behavior as TC-ALERT-032–039: popup opens, recipient toggles/search work, OK creates the alert. |

## My Alerts Module (left side)

| TC ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| TC-ALERT-042 | My Alerts module loads all alerts in a tabular list | P1 | At least one alert already created | 1. Click My Alerts on the left-side panel. | Page loads with all alerts listed in a tabular format. |
| TC-ALERT-043 | Alert status toggle ON/OFF updates correctly | P2 | On My Alerts list | 1. Toggle an alert from ON to OFF.<br>2. Toggle it back from OFF to ON. | Alert status changes to OFF, then back to ON. |
| TC-ALERT-044 | Delete an alert removes it from the list | P2 | On My Alerts list | 1. Delete an alert. | Alert is removed from the list. |
| TC-ALERT-045 | Edit alert opens popup with correct pre-filled data | P2 | On My Alerts list | 1. Click edit on an alert's name/details. | Edit popup opens with the correct existing data. |
| TC-ALERT-046 | Add/modify recipient opens recipient popup with correct defaults | P1 | Editing an alert | 1. Click Add/Modify Recipient. | Recipient popup appears, with the current user's toggle defaulted to Yes. |
| TC-ALERT-047 | Toggle individual/multiple recipients Yes/No in edit flow | P2 | Recipient popup open (edit flow) | 1. Toggle a user to Yes.<br>2. Toggle a user to No.<br>3. Select multiple recipients. | Toggle states update correctly; multiple recipient toggles remain selected. |
| TC-ALERT-048 | Recipient search — valid username/email returns match | P2 | Recipient popup open (edit flow) | 1. Search with a valid username.<br>2. Search with a valid email. | Only the matching username is shown; associated username is shown for an email search. |
| TC-ALERT-049 | Recipient search — invalid input returns no results | P3 | Recipient popup open (edit flow) | 1. Search with an invalid email/username. | No result found. |
| TC-ALERT-050 | Cancel recipient edit popup discards changes | P2 | Recipient popup open (edit flow) | 1. Click Cancel. | Popup closes; no alert changes are saved. |
| TC-ALERT-051 | Confirm with OK adds new recipient and sends notification | P1 | At least one new recipient selected | 1. Click OK. | New user is added to the alert's recipient list and receives a notification email. |
| TC-ALERT-052 | Filter alert list by "Created by" user | P2 | Multiple alerts from different creators exist | 1. Filter by user in the "Created by" field. | List filters to alerts created by the selected user. |
| TC-ALERT-053 | Create New Alert opens the alert-type options popup | P1 | On My Alerts list | 1. Click Create New Alert. | Popup opens with options: All Country Global Search or Advance Search. |
| TC-ALERT-054 | Create New Alert — Advanced Search option | P2 | Create New Alert popup open | 1. Select Advance Search. | Redirects to Search with a message to create and save a workspace to set an alert; the Advance Search alert flow (TC-ALERT-001–008) is then followed. |
| TC-ALERT-055 | Create New Alert — All Country Global Search option | P2 | Create New Alert popup open | 1. Select All Country Global Search. | Redirects to Search with all-country selected and a message to create and save a workspace, execute the query, and save the workspace; the Global Search alert flow (TC-ALERT-009–021) is then followed. |
