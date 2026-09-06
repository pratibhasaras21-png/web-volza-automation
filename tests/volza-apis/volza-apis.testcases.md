# Volza APIs — Test Cases

_No automated spec yet — sourced from QA backlog._

| TC ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| TC_001 | Verify Volza API button visibility | High | User logged in with API plan | Open Home Page and check left panel | Volza API button visible |
| TC_002 | Verify API button hidden for non-plan users | High | User logged in without API plan | Open Home Page | Button hidden or restricted |
| TC_003 | Redirect to dashboard for active plan | High | User has active API plan | Click Volza API button | User lands on API Dashboard |
| TC_004 | Redirect external site if no plan | High | User has no API plan | Click Volza API button | Redirect to volza.com landing page |
| TC_005 | Direct URL access validation | High | User without plan | Open /api-dashboard URL | Access denied or redirected |
| TC_006 | Session timeout handling | Medium | Session expired | Open API dashboard | User asked to login again |
| TC_007 | Verify Current Plan details | High | Active API subscription | Open Dashboard | Plan details load correctly |
| TC_008 | Verify Subscription End Date | High | Active plan | Check subscription period section | Correct Ends On date displayed |
| TC_009 | Verify Requests Per Minute display | Medium | Plan with rate limit | Open Dashboard | RPM shown correctly |
| TC_010 | Open Add Credit popup | High | Active plan | Click Add Credit | Popup opens |
| TC_011 | Minimum credit validation | High | Add credit popup open | Enter less than 1000 USD | Validation error shown |
| TC_012 | Proceed to Paddle payment | High | Valid amount entered | Click Proceed to Pay | Redirect to Paddle payment page |
| TC_013 | Successful payment flow | High | Payment approved | Complete payment | Credit balance updated |
| TC_014 | Payment cancellation handling | Medium | Payment started | Cancel payment | No credit added |
| TC_015 | Duplicate payment prevention | High | Payment in progress | Click pay multiple times | Only one transaction created |
| TC_016 | Generate Sandbox API key | High | User in API dashboard | Create key with name | Sandbox key generated |
| TC_017 | Generate Production API key | High | Production access granted | Generate key | Production key created |
| TC_018 | API key masking | High | Key generated | View key list | Key masked by default |
| TC_019 | Copy API key functionality | Medium | Key exists | Click Copy | Key copied to clipboard |
| TC_020 | Regenerate API key | Critical | Existing key present | Click Regenerate | Old key invalidated |
| TC_021 | Duplicate key name validation | Medium | Key exists | Create key with same name | Validation handled correctly |
| TC_022 | Verify total request count | High | Usage data exists | Open Credit Consumption tab | Correct request count displayed |
| TC_023 | Verify success rate calculation | High | API usage present | Check success rate metric | Correct percentage calculated |
| TC_024 | Date range filter validation | High | Analytics page open | Select custom date range | Data updates correctly |
| TC_025 | Month filter validation | Medium | Analytics page open | Select month | Filtered data displayed |
| TC_026 | Status filter 2xx | Medium | Usage data exists | Apply Success filter | Only success data shown |
| TC_027 | Environment filter production | Medium | Usage data exists | Select Production Only | Production data visible |
| TC_028 | Combined filters logic | High | Usage data exists | Apply Status+API+Environment filters | Filtered results accurate |
| TC_029 | Subscription pricing tab default | Medium | API pricing opened | Open API Pricing page | Subscription tab selected by default |
| TC_030 | Verify country API pricing table | Low | Pricing data exists | Check Country API section | Correct pricing rows shown |
| TC_031 | Custom API pricing visibility | Medium | Enterprise user | Open pricing page | Custom API row visible |
| TC_032 | Redirect to API documentation | Low | User inside API section | Click Documentation tab | User redirected to docs page |
| TC_033 | Unauthorized API access | Critical | No auth token | Call API endpoint | 401 Unauthorized response |
| TC_034 | API key exposure check | Critical | Key generated | Inspect network response | Key not fully exposed |
| TC_035 | Sandbox vs Production isolation | Critical | Both keys created | Use sandbox key on production | Access denied |
| TC_036 | Expired token validation | High | Token expired | Open dashboard | User logged out or blocked |
| TC_037 | Dashboard load performance | Medium | Normal network | Open API dashboard | Loads within acceptable time |
| TC_038 | Analytics filter performance | Medium | Large data volume | Apply filters | Results load quickly |
| TC_039 | Pricing table performance | Low | Large pricing dataset | Open pricing page | No UI lag |
| TC_040 | Concurrent API key generation | High | Multiple requests | Generate keys simultaneously | System handles without crash |
