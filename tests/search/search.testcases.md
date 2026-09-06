# Search — Test Cases

Covers Module 5 (Universal Search, both plan tiers) and Module 6.1–6.4 (Search
Tab: Product Description, HS Code, Shipper Name, Consignee Name) plus the
Search Tab's Auto Select query-builder flow, "Search with Multiple Queries",
"Point Based Plan" search behavior, and the backlog's Edit Column / Mirror
Country cases. Sourced from `Daily Testing and app test cases(Module wise
TestCases).csv` (Module 5, Module 6, "New Added Test Cases" blocks).

**Dropped/superseded sources — not migrated:**
- `tests/universalsearch.spec.js` and `tests/universalsearch.specs.js` are
  earlier iterations of the same Universal Search test as
  `tests/universalsearch-all.specs.js`. `-all.specs.js` is the canonical,
  most complete version (all 7 fields, `test.describe.serial` session reuse,
  the most robust search-icon click fallbacks) and is the one migrated below
  as `universal-search.spec.js`. The two superseded files are left in place
  under `tests/` (cleanup happens separately) but their coverage is fully
  represented by TC-SEARCH-001–007.

**Not yet automated:** "Search with Multiple Queries" and "Test with Point
Based Plan" (both documented at the end of the CSV's Module 6 block) don't
map cleanly onto any single existing spec case — each is its own multi-step
scenario without a corresponding spec file — so they're recorded below as
TC-SEARCH-040 and TC-SEARCH-041 with `Spec Reference: Not automated`. "Edit
column in search tab" and "Mirror Country" (TC-SEARCH-042, TC-SEARCH-043) are
Search-tab-adjacent features documented in the backlog's "New Added Test
Cases (Set Alert)" block; also not automated — no spec exists for either yet.

## Universal Search — SME/Corporate Plan, all fields

`universal-search.spec.js` — migrated from `tests/universalsearch-all.specs.js`.
Common precondition: registered email already onboarded on app.volza.com, SME
or Corporate plan (Company Name/Consignee/Shipper search access). Session is
established once (`test.describe.serial` + shared `storageState`) and reused
across the 7 field tests.

| TC ID | Title | Priority | Preconditions | Steps | Expected Result | Spec Reference |
|---|---|---|---|---|---|---|
| TC-SEARCH-001 | Universal Search by HS 2 (2-digit HS code) | P1 | Logged in, SME/Corporate plan | 1. Open Universal Search. 2. Open the field dropdown, select "HS 2". 3. Enter a 2-digit HS code (e.g. "74") and search. | HS code is tokenized; country-wise results grid is displayed. | `universal-search.spec.js` |
| TC-SEARCH-002 | Universal Search by HS 4 (4-digit HS code) | P1 | Logged in, SME/Corporate plan | 1. Open Universal Search. 2. Select "HS 4, 6 Or 8" field. 3. Enter a 4-digit HS code (e.g. "7408") and search. | HS code is tokenized; results grid is displayed. | `universal-search.spec.js` |
| TC-SEARCH-003 | Universal Search by HS 6 (6-digit HS code) | P1 | Logged in, SME/Corporate plan | 1. Open Universal Search. 2. Select "HS 4, 6 Or 8" field. 3. Enter a 6-digit HS code (e.g. "740811") and search. | HS code is tokenized; results grid is displayed. | `universal-search.spec.js` |
| TC-SEARCH-004 | Universal Search by HS 8 (8-digit HS code) | P1 | Logged in, SME/Corporate plan | 1. Open Universal Search. 2. Select "HS 4, 6 Or 8" field. 3. Enter an 8-digit HS code (e.g. "74081100") and search. | HS code is tokenized; results grid is displayed. | `universal-search.spec.js` |
| TC-SEARCH-005 | Universal Search by Company Name | P1 | Logged in, SME/Corporate plan | 1. Open Universal Search. 2. Select "Company Name" field. 3. Enter a company keyword (e.g. "Tata") and search. | Keyword is tokenized; results grid is displayed. | `universal-search.spec.js` |
| TC-SEARCH-006 | Universal Search by Consignee | P1 | Logged in, SME/Corporate plan | 1. Open Universal Search. 2. Select "Consignee" field. 3. Enter a consignee keyword (e.g. "JSW") and search. | Keyword is tokenized; results grid is displayed. | `universal-search.spec.js` |
| TC-SEARCH-007 | Universal Search by Shipper | P1 | Logged in, SME/Corporate plan | 1. Open Universal Search. 2. Select "Shipper" field. 3. Enter a shipper keyword (e.g. "Hindalco") and search. | Keyword is tokenized; results grid is displayed. | `universal-search.spec.js` |

## Universal Search — SME/Corporate Plan (dropdown, download, filter, refine flows)

`universal-search-sme-plan.spec.js` — migrated from
`src/pages/UniversalSearch_SMEPlan.specs.js`. Common precondition: registered
email, active SME or Corporate plan.

| TC ID | Title | Priority | Preconditions | Steps | Expected Result | Spec Reference |
|---|---|---|---|---|---|---|
| TC-SEARCH-008 | Universal Search field dropdown lists all search-by options | P2 | Logged in, SME/Corporate plan | 1. Select Universal Search. 2. Click the search field dropdown. | Options for HS 2 / HS 4,6 or 8 / Products / Company name / consignee / shipper are all available. | `universal-search-sme-plan.spec.js` |
| TC-SEARCH-009 | Product search ("brass") tokenizes and shows country-wise grid | P1 | Logged in, SME/Corporate plan | 1. Select a Product (e.g. "brass") and apply search. | Product is tokenized; search displays country-wise data in a grid. | `universal-search-sme-plan.spec.js` |
| TC-SEARCH-010 | Download with country checkbox selection deducts points correctly | P1 | Logged in, SME/Corporate plan, search results displayed | 1. Click Download. 2. Select the import/export country by checkbox. 3. Download the data. | Data downloads successfully for the selected country, with proper point deduction. | `universal-search-sme-plan.spec.js` |
| TC-SEARCH-011 | My Download tab lists the Universal Search download query | P2 | Logged in, a Universal Search download was performed | 1. Go to the My Download tab. | The downloaded Excel query is generated for Universal Search, and the Excel shows the data. | `universal-search-sme-plan.spec.js` |
| TC-SEARCH-012 | Filter panel (HS code, Import, Export, COO/COD) applies correctly | P2 | Logged in, SME/Corporate plan, search results displayed | 1. Click the filter option. 2. Apply filters like HS code, Import, Export, COO/COD. | Filters apply successfully; data updates according to the applied filter. | `universal-search-sme-plan.spec.js` |
| TC-SEARCH-013 | Lock icon / "View More and Refine" CTA shows validation popup | P2 | Logged in, SME/Corporate plan, search results displayed | 1. Click the lock icon or the "View More and Refine" CTA. | Popup appears with all validations and date range limitations. | `universal-search-sme-plan.spec.js` |
| TC-SEARCH-014 | "View More/Refine" redirects to Search tab with pre-applied filters (product/HS search) | P1 | Logged in, SME/Corporate plan, product or HS-code search results displayed | 1. Click the lock icon or "View More and Refine" CTA on a product/HS-code search. | Redirects to the Search tab with the selected country search and pre-applied filters. | `universal-search-sme-plan.spec.js` |
| TC-SEARCH-015 | "View in Global Search" redirects with pre-applied filters | P1 | Logged in, SME/Corporate plan, Company Name search results displayed | 1. Click "View in Global Search". | Redirects to the Search tab with a global search and the Universal Search filters re-applied. | `universal-search-sme-plan.spec.js` |

## Universal Search — Small/Startup Plan

`universal-search-small-plan.spec.js` — migrated from
`src/pages/UniversalSearch_SmallPlan.specs.js`. Common precondition:
registered email, active Startup/Spark/Delight/Micro plan.

| TC ID | Title | Priority | Preconditions | Steps | Expected Result | Spec Reference |
|---|---|---|---|---|---|---|
| TC-SEARCH-016 | Field dropdown shows only limited options (no Company/Consignee/Shipper) | P2 | Logged in, small/startup plan | 1. Select Universal Search. 2. Click the search field dropdown. | Only HS 2 / HS 4,6 or 8 / Products options are available (no Company name/consignee/shipper). | `universal-search-small-plan.spec.js` |
| TC-SEARCH-017 | Product search ("brass") tokenizes and shows country-wise grid | P1 | Logged in, small/startup plan | 1. Select a Product (e.g. "brass") and apply search. | Product is tokenized; search displays country-wise data in a grid. | `universal-search-small-plan.spec.js` |
| TC-SEARCH-018 | Downloading a premium country (e.g. Bangladesh, Lesotho) shows an upgrade popup | P1 | Logged in, small/startup plan, search results displayed | 1. Click Download. 2. Select a premium import/export country checkbox (e.g. Bangladesh). | Popup: "Data is Available from SME onward data. Please upgrade your plan." | `universal-search-small-plan.spec.js` |
| TC-SEARCH-019 | Downloading a non-premium country (e.g. India, Mexico) succeeds | P1 | Logged in, small/startup plan, search results displayed | 1. Click Download. 2. Select a non-premium country checkbox (e.g. India, Mexico, Bolivia, Philippines). 3. Download the data. | Data downloads successfully with proper point deduction. | `universal-search-small-plan.spec.js` |
| TC-SEARCH-020 | My Download tab lists the Universal Search download query | P2 | Logged in, small/startup plan, a download performed | 1. Go to the My Download tab. | The downloaded Excel query is listed and shows data. | `universal-search-small-plan.spec.js` |
| TC-SEARCH-021 | Filter panel (HS code, Import, Export, COO/COD) applies correctly | P2 | Logged in, small/startup plan, search results displayed | 1. Click the filter option. 2. Apply filters like HS code, Import, Export, COO/COD. | Filters apply successfully; data updates per the applied filter. | `universal-search-small-plan.spec.js` |
| TC-SEARCH-022 | Lock icon / "View More" popup shown with validations (small plan) | P2 | Logged in, small/startup plan, search results displayed | 1. Click the lock icon or "View More"/"Refine" CTA. | Popup appears with all validations and date range limitations. | `universal-search-small-plan.spec.js` |
| TC-SEARCH-023 | "View More/Refine" for a premium country (e.g. Bangladesh) shows upgrade popup | P1 | Logged in, small/startup plan, search results include a premium-country row | 1. On a premium-country result row (e.g. Afghanistan, Bangladesh, Lesotho), click the lock icon or "View More"/"Refine". | Popup: "Data is Available from SME onward data. Please upgrade your plan." | `universal-search-small-plan.spec.js` |
| TC-SEARCH-024 | "View More/Refine" for a non-premium country redirects to Search with filters | P1 | Logged in, small/startup plan, search results include a non-premium-country row | 1. On a non-premium-country result row (e.g. Mexico, India, Bolivia, Philippines), click the lock icon or "View More"/"Refine". | Redirects to the Search tab with the selected country search and pre-applied filters. | `universal-search-small-plan.spec.js` |

## Search Tab — 6.1 Product Description

`search-tab-product-description.spec.js` — migrated from
`src/pages/SearchTab_ProductDescription.specs.js`. Common precondition:
registered email, SME/Corporate plan, logged in via global setup.

| TC ID | Title | Priority | Preconditions | Steps | Expected Result | Spec Reference |
|---|---|---|---|---|---|---|
| TC-SEARCH-025 | Product Description search ("cotton") in Global Import T3 returns results with counter deduction | P1 | Logged in, SME/Corporate plan | 1. Go to Search tab. 2. Select "Global Import T3" country database. 3. Select start/end dates. 4. Select "Product description" field, type "cotton" and pick it from suggestions. 5. Click Search. | Product name is tokenized; results are displayed with one search deducted from the search counter. | `search-tab-product-description.spec.js` |
| TC-SEARCH-026 | Applying a left filter narrows Product Description results with counter deduction | P2 | Logged in, "cotton" search results displayed | 1. Apply any left-panel filter. | Results are filtered accordingly, with a search deduction from the search counter. | `search-tab-product-description.spec.js` |
| TC-SEARCH-027 | "Save Workspace" popup appears without point deduction | P2 | Logged in, "cotton" search results displayed | 1. Click "Save Workspace". | Save Workspace popup appears; no point is calculated/deducted. | `search-tab-product-description.spec.js` |
| TC-SEARCH-028 | Download all dashboards and verify the query in My Download | P1 | Logged in, "cotton" search results displayed | 1. Click Download. 2. Check all dashboard checkboxes. 3. Click "Excel Download". 4. Go to My Download tab. 5. Click the download link. | "Download will complete shortly" popup is shown; a new download query with the workspace name appears in My Download; the Excel downloads with the same shipment count. | `search-tab-product-description.spec.js` |

## Search Tab — 6.2 HS Code

`search-tab-hs-code-dashboard.spec.js` — migrated from
`src/pages/SearchTab_DashboardTab.specs.js`. Common precondition: registered
email, SME/Corporate plan, logged in via global setup. Country database:
India Export (Mirror); field: HS 2 = "85".

| TC ID | Title | Priority | Preconditions | Steps | Expected Result | Spec Reference |
|---|---|---|---|---|---|---|
| TC-SEARCH-029 | HS Code search (HS 2 = "85") in India Export (Mirror) returns results | P1 | Logged in, SME/Corporate plan | 1. Go to Search tab. 2. Select "India Export (Mirror)" database. 3. Select "HS 2" field, enter "85" and pick the autocomplete suggestion. 4. Click Search. | HS code is tokenized on the search box; results grid is displayed. | `search-tab-hs-code-dashboard.spec.js` |
| TC-SEARCH-030 | Save workspace, verify Consignee/Shipper/Notify Party are locked, download Excel from every result tab | P1 | Logged in, HS 2 = "85" search results displayed | 1. Save the workspace. 2. Walk every result tab (Partial View, Shipments, Summary, Analysis, Shipper, Consignee, Country of Origin/Destination, Port of Origin/Destination, HS Code, Time Series). 3. On Partial View, verify Consignee/Shipper/Notify Party grid columns and the left FILTERS Consignee/Shipper categories show the locked placeholder. 4. On Analysis, trigger "Click here to load data". 5. Download Excel from each tab's widgets. | Workspace saves; locked columns/filters show the lock indicator (partial-view plan); every tab's data loads and its available Excel exports succeed. | `search-tab-hs-code-dashboard.spec.js` |
| TC-SEARCH-031 | Applying a left filter updates HS Code results with counter deduction | P2 | Logged in, HS 2 = "85" search results displayed | 1. Apply any left-panel filter. | Results update; a search is deducted from the search counter. | `search-tab-hs-code-dashboard.spec.js` |
| TC-SEARCH-032 | Save workspace, download all dashboards, verify in My Download | P1 | Logged in, HS 2 = "85" search results displayed | 1. Save the workspace. 2. Click Download, check all dashboard checkboxes, confirm. 3. Go to My Download (Account → My Downloads). 4. Click the download link. | "Download will complete shortly" popup is shown; the download query appears in My Downloads; the Excel downloads. | `search-tab-hs-code-dashboard.spec.js` |

## Search Tab — 6.3 Shipper Name

`search-tab-shipper-name.spec.js` — migrated from
`src/pages/SearchTab_ShipperName.specs.js`, using the shared
`SearchPage.selectCountryDatabase()` helper. Common precondition: registered
email, SME/Corporate plan. For each database, an HS 2 seed search captures a
real Shipper Name from the first result row, which is then used as the
Shipper Name search value.

| TC ID | Title | Priority | Preconditions | Steps | Expected Result | Spec Reference |
|---|---|---|---|---|---|---|
| TC-SEARCH-033 | Shipper Name search — India Export (Mirror), seeded from HS 2 = "85" | P1 | Logged in, SME/Corporate plan | 1. Go to Search tab, select "India Export (Mirror)". 2. Select "Last 60 Days" period. 3. Search HS 2 = "85"; capture the first row's Shipper Name. 4. Switch field to "Shipper Name", search/select the captured name, Apply. 5. Click Search. 6. Apply left filter (Country of Destination: United States). 7. Save workspace. 8. Download, select all, confirm. | Shipper name tokenizes and search returns results; COD filter tokenizes in "Filters Applied"; workspace saves; download completes ("Download will complete shortly"). | `search-tab-shipper-name.spec.js` |
| TC-SEARCH-034 | Shipper Name search — All Country (Global Search), seeded from HS 2 = "44" | P1 | Logged in, SME/Corporate plan | Same flow as TC-SEARCH-033, database "All Country (Global Search)", seed HS 2 = "44". | Same expected results as TC-SEARCH-033. | `search-tab-shipper-name.spec.js` |
| TC-SEARCH-035 | Shipper Name search — Bangladesh Export Detailed, seeded from HS 2 = "85" | P1 | Logged in, SME/Corporate plan | Same flow as TC-SEARCH-033, database "Bangladesh Export Detailed", seed HS 2 = "85". | Same expected results as TC-SEARCH-033. | `search-tab-shipper-name.spec.js` |

## Search Tab — 6.4 Consignee Name

`search-tab-consignee-name.spec.js` — migrated from
`src/pages/SearchTab_ConsigneeName.specs.js`, using the same shared
`SearchPage.selectCountryDatabase()` helper as Shipper Name. Common
precondition: registered email, SME/Corporate plan. Same flow as 6.3, using
Consignee Name in place of Shipper Name.

| TC ID | Title | Priority | Preconditions | Steps | Expected Result | Spec Reference |
|---|---|---|---|---|---|---|
| TC-SEARCH-036 | Consignee Name search — India Export (Mirror), seeded from HS 2 = "85" | P1 | Logged in, SME/Corporate plan | 1. Go to Search tab, select "India Export (Mirror)". 2. Select "Last 60 Days" period. 3. Search HS 2 = "85"; capture the first row's Consignee Name. 4. Switch field to "Consignee Name", search/select the captured name, Apply. 5. Click Search. 6. Apply left filter (Country of Destination: United States). 7. Save workspace. 8. Download, select all, confirm. | Consignee name tokenizes and search returns results; COD filter tokenizes in "Filters Applied"; workspace saves; download completes ("Download will complete shortly"). | `search-tab-consignee-name.spec.js` |
| TC-SEARCH-037 | Consignee Name search — All Country (Global Search), seeded from HS 2 = "44" | P1 | Logged in, SME/Corporate plan | Same flow as TC-SEARCH-036, database "All Country (Global Search)", seed HS 2 = "44". | Same expected results as TC-SEARCH-036. | `search-tab-consignee-name.spec.js` |
| TC-SEARCH-038 | Consignee Name search — Bangladesh Export Detailed, seeded from HS 2 = "85" | P1 | Logged in, SME/Corporate plan | Same flow as TC-SEARCH-036, database "Bangladesh Export Detailed", seed HS 2 = "85". | Same expected results as TC-SEARCH-036. | `search-tab-consignee-name.spec.js` |

## Search Tab — Auto Select (query builder)

`search-tab-auto-select.spec.js` — migrated from
`src/pages/SearchTab_AutoSelect.specs.js`. No module number in the source
backlog; grouped here as it exercises the same Search tab query builder.

| TC ID | Title | Priority | Preconditions | Steps | Expected Result | Spec Reference |
|---|---|---|---|---|---|---|
| TC-SEARCH-039 | Combined query: HS 2 = "85" plus every readable second-level field, added one at a time, then search/save/download | P1 | Logged in, SME/Corporate plan | 1. Go to Search tab, select "All Country (Global Search)", "Last 30 Days". 2. Search HS 2 = "85"; capture Shipper/Consignee/Country of Origin/Country of Destination/Port of Origin/Port of Destination/Qty from the first result row. 3. Add Shipper Name as a second-level query row, click Search, confirm results are still present. 4. Add Consignee Name, click Search, confirm results are still present. 5. Add each remaining captured field one at a time (Country of Destination, Country of Origin, Port of Origin, Port of Destination, Qty), clicking Search and confirming results after each addition - any single field whose addition empties the results is reverted (removed) rather than kept, so the query only ever grows more specific while always showing data. 6. Apply every left FILTERS category (one option + Apply each). 7. Save workspace. 8. Download, select all, confirm. | Each field is added and searched individually rather than all at once - Shipper and Consignee first, then the rest - so a single incompatible field can't zero out the whole query; results are present after every step; each filter category tokenizes in "Filters Applied"; workspace saves; download completes. | `search-tab-auto-select.spec.js` |

## Not automated — Multiple Queries, Point Based Plan, Edit Column, Mirror Country

No spec exists yet for any of the four rows below.

| TC ID | Title | Priority | Preconditions | Steps | Expected Result | Spec Reference |
|---|---|---|---|---|---|---|
| TC-SEARCH-040 | Search with Multiple Queries — combined product/HS/consignee/shipper/port/country/mode/unit query | P1 | Registered email, SME/Corporate plan | 1. Log in, go to Search tab. 2. Select "All country global search". 3. Select dates. 4. Select "Product description", type and select "Iron". 5. Add HS 2 = "72" via the "+" icon. 6. Add Consignee Name "Roba Metals B V", select-all matching companies, Apply. 7. Add Shipper Name "JSW Steel Coated Products Ltd", select-all matching, Apply. 8. Add Port of Origin "Bombay Sea". 9. Add Port of Destination "Antwerpen". 10. Add Country of Destination "Belgium". 11. Add Mode "Sea". 12. Add Standard Unit "KGS". 13. Click Search. 14. Apply remaining filters. 15. Save Workspace. 16. Download all dashboards. 17. Verify in My Download. | Each added field tokenizes in the query builder; combined search returns results with a search counter deduction; filters apply with a further deduction; Save Workspace shows no point calculation; download completes and the query/Excel appear in My Download with the same shipment count. | Not automated |
| TC-SEARCH-041 | Search behavior on a Point Based Plan (Smile/Happiness/Delight) | P2 | Registered email, point-based plan (Smile, Happiness or Delight) | 1. Log in on a point-based plan. 2. Go to Search tab, select India import/export. 3. Search by a product or HS code. 4. Check the results grid — Shipper/Consignee should be hidden until the workspace is saved. 5. Save the workspace (points deducted here). 6. Click Download — choose custom download or a predefined dashboard. 7. Download a predefined dashboard and verify via My Download/Excel. | Shipper/Consignee are hidden pre-save and revealed only after saving the workspace, with points deducted at save time (not at search time); predefined-dashboard download completes and is visible in My Download. Latest/real-time data and date-range changes are restricted (upgrade prompt shown); premium country data is hidden except on Happiness/Joy plans. | Not automated |
| TC-SEARCH-042 | Edit Column in Search tab — reorder, add/remove columns, default vs. customised view | P2 | Registered email, SME/Corporate plan, active search results | 1. Log in, go to Search tab. 2. Search and execute a query (select a product, click Search). 3. Verify the "Edit column" button is visible on the right side. 4. Click "Edit columns" — see all available columns with checkboxes. 5. Use move-up/move-down arrows, click Apply. 6. Select new columns; deselect existing columns. 7. Click Save Workspace. 8. Click Download; choose Default view or Customised view. 9. Click Default view, then Customised view. 10. Click Excel Download. | Edit column button and its checkbox list are visible; reordering via arrows + Apply reorders the grid; selecting/deselecting columns adds/removes them from the data table; Save Workspace popup appears; Download popup offers Default/Customised view, each showing the corresponding column set; "Download will complete shortly" popup is shown. | Not automated |
| TC-SEARCH-043 | Mirror Country option in the Countries dropdown | P2 | Registered email, SME/Corporate plan, saved workspace | 1. Open the Countries dropdown. 2. Verify a "Mirror Country" option is present. 3. Select "Mirror Country" and search for a specific one (e.g. Albania). 4. Verify the full list of mirror countries. 5. Switch from a regular country to a mirror country. 6. Filter the list by typing a letter (e.g. "A"). | "Mirror Country" option is visible in the dropdown; selecting it lists mirror countries and shows Albania's data when searched specifically; the full predefined mirror-country list displays correctly; switching country types loads data without error; the letter filter narrows the list to names starting with that letter. | Not automated |
