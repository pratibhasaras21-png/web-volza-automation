# Home Module — Test Cases

Covers the Welcome tab (post-login landing page) — searching by each field
type and the premium-country upgrade gate on small plans. Source spec:
`welcome-tab.spec.js`.

IDs are freshly assigned in migration order (`TC-HOME-001`–`TC-HOME-007`) per
the plan's ID convention.

Preconditions/Steps/Expected-Result content is sourced from the QA backlog CSV
(`Daily Testing and app test cases(Module wise TestCases).csv`), **Module 11:
Welcome tab** (rows 759–778) — sub-case 11.1 (SME/Corporate plan) covers the
per-field-type searches (TC-HOME-001–006); sub-case 11.2 (Small/Startup plan)
covers the premium-country upgrade popup (TC-HOME-007). Note the CSV reuses
"Module 11" for both this section and Company Profile elsewhere in the
spreadsheet — handled per the plan by destination folder, not by source
number.

## Test Cases

| TC ID | Title | Priority | Preconditions | Steps | Expected Result | Spec Reference |
|---|---|---|---|---|---|---|
| TC-HOME-001 | Welcome tab search by Product Name redirects to Search tab with results | P1 | Registered email with an active SME/Corporate plan | 1. Select the "Welcome" tab 2. Click the search field dropdown 3. Select "Product Name" and enter a keyword (e.g. "wood") 4. Click the search icon 5. From the "Select Database" tab, select a country database (e.g. "All Country") | Redirects to the Search tab with the chosen country database selected and results displayed for the entered product | `welcome-tab.spec.js` |
| TC-HOME-002 | Welcome tab search by HS 2 redirects to Search tab with results | P1 | Registered email with an active SME/Corporate plan | 1. Select the "Welcome" tab 2. Click the search field dropdown 3. Select "HS 2" and enter a code (e.g. "84") 4. Click the search icon 5. From the "Select Database" tab, select a country database | Redirects to the Search tab with the chosen country database selected and results displayed for the entered HS code | `welcome-tab.spec.js` |
| TC-HOME-003 | Welcome tab search by HS 4, 6 Or 8 redirects to Search tab with results | P1 | Registered email with an active SME/Corporate plan | 1. Select the "Welcome" tab 2. Click the search field dropdown 3. Select "HS 4, 6 Or 8" and enter a code (e.g. "8471") 4. Click the search icon 5. From the "Select Database" tab, select a country database | Redirects to the Search tab with the chosen country database selected and results displayed for the entered HS code | `welcome-tab.spec.js` |
| TC-HOME-004 | Welcome tab search by Shipper redirects to Search tab with results | P1 | Registered email with an active SME/Corporate plan | 1. Select the "Welcome" tab 2. Click the search field dropdown 3. Select "Shipper" 4. In the entity picker, type a company name (e.g. "Tata"), select the match, click Apply 5. Click the search icon | Redirects straight to the Search tab, country defaulted to "All Countries", with shipper results displayed; download should succeed with proper point deduction | `welcome-tab.spec.js` |
| TC-HOME-005 | Welcome tab search by Consignee redirects to Search tab with results | P1 | Registered email with an active SME/Corporate plan | 1. Select the "Welcome" tab 2. Click the search field dropdown 3. Select "Consignee" 4. In the entity picker, type a company name (e.g. "Tata"), select the match, click Apply 5. Click the search icon | Redirects straight to the Search tab, country defaulted to "All Countries", with consignee results displayed; download should succeed with proper point deduction | `welcome-tab.spec.js` |
| TC-HOME-006 | Welcome tab search by Company Name redirects to Search tab with results | P1 | Registered email with an active SME/Corporate plan | 1. Select the "Welcome" tab 2. Click the search field dropdown 3. Select "Company Name" 4. In the entity picker, type a company name (e.g. "Tata Motors"), select "Select All", click Apply 5. Click the search icon | Redirects to the Search tab with country set to "All countries" and the company name selected; download should succeed with proper point deduction | `welcome-tab.spec.js` |
| TC-HOME-007 | Selecting a premium country database shows an upgrade popup on Small/Startup plans | P2 | Registered email with an active Small/Startup-tier plan (Startup, Spark, Delight, or Micro) | 1. Select the "Welcome" tab 2. Click the search field dropdown 3. Select a Product/HS code (e.g. "wood") and click the search icon 4. From the opened "Select Database" tab, select a premium country database (e.g. "Bangladesh") | A popup appears: "Please upgrade your plan for access of Bangladesh country data" | `welcome-tab.spec.js` |
