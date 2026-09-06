# CAS Search — Test Cases

_No automated spec yet — sourced from QA backlog._

| TC ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| TC-CASSEARCH-001 | CAS Strict Match AND Product Contains "Resin" | P1 | User logged in with valid access | Search CAS: 50-00-0 (Strict Match) AND Product Contains "Resin" | Results returned matching CAS 50-00-0 (strict) AND product containing "Resin" |
| TC-CASSEARCH-002 | CAS Strict Match OR Product Exact Phrase "Urea Formaldehyde Resin" | P2 | User logged in | Search CAS: 50-00-0 (Strict Match) OR Product Exact Phrase "Urea Formaldehyde Resin" | Results returned matching CAS 50-00-0 (strict) OR product exact phrase "Urea Formaldehyde Resin" |
| TC-CASSEARCH-003 | CAS Strict Match AND NOT Product Partial Phrase "Form" | P2 | User logged in | Search CAS: 50-00-0 (Strict Match) AND NOT Product Partial Phrase "Form" | Results match CAS 50-00-0 (strict) and exclude products with partial phrase "Form" |
| TC-CASSEARCH-004 | CAS Expanded Match AND Product Contains "Plastik" (typo) | P2 | User logged in | Search CAS: 108-88-3 (Expanded Match) AND Product Contains "Plastik" | Expanded match returns results for CAS 108-88-3 despite the typo in product term "Plastik" |
| TC-CASSEARCH-005 | CAS Expanded Match OR Product Exact Keyword "Resin" | P2 | User logged in | Search CAS: 108-88-3 (Expanded Match) OR Product Exact Keyword "Resin" | Results returned matching either the expanded CAS match or the exact keyword "Resin" |
| TC-CASSEARCH-006 | CAS Expanded Match AND NOT Product Chemical Search "Methanal" | P2 | User logged in | Search CAS: 108-88-3 (Expanded Match) AND NOT Product Chemical Search "Methanal" | Results match CAS 108-88-3 (expanded) and exclude chemical search term "Methanal" |
| TC-CASSEARCH-007 | CAS Expanded Synonym AND Product Contains "Methyl Aldehyde" | P2 | User logged in | Search CAS: 50-00-0 (Expanded Synonym) AND Product Contains "Methyl Aldehyde" | Results include synonym-matched CAS 50-00-0 and product containing "Methyl Aldehyde" |
| TC-CASSEARCH-008 | CAS Expanded Synonym OR Product Exact Keyword "Formalin" | P2 | User logged in | Search CAS: 50-00-0 (Expanded Synonym) OR Product Exact Keyword "Formalin" | Results match either the synonym-expanded CAS or the exact keyword "Formalin" |
| TC-CASSEARCH-009 | CAS Expanded Synonym AND NOT Product Contains "Hazardous" | P2 | User logged in | Search CAS: 50-00-0 (Expanded Synonym) AND NOT Product Contains "Hazardous" | Results match the synonym-expanded CAS and exclude products containing "Hazardous" |
| TC-CASSEARCH-010 | Invalid CAS AND Valid Product (negative) | P1 | User logged in | Search CAS: 999-99-9 (Strict) AND Product Contains "Resin" | No results returned / appropriate no-match handling since CAS 999-99-9 is invalid |
| TC-CASSEARCH-011 | Invalid CAS OR Valid Product (negative) | P1 | User logged in | Search CAS: 999-99-9 (Expanded) OR Product Contains "Resin" | Results returned based on the valid product match only (OR condition), since the CAS is invalid |
| TC-CASSEARCH-012 | Invalid CAS AND NOT Product condition (negative) | P1 | User logged in | Search CAS: 999-99-9 (Strict) AND NOT Product Contains "Toxic" | No results / appropriate handling for the invalid CAS combined with the AND NOT condition |
| TC-CASSEARCH-013 | Multi-condition search (CAS + Product + Synonym) | P2 | User logged in | Search CAS: 50-00-0 (Expanded Synonym) AND Product Exact Phrase "Polyvinyl Chloride" AND NOT Product Contains "Toxic" | Results satisfy all combined conditions: synonym-expanded CAS match, exact phrase "Polyvinyl Chloride", and exclusion of "Toxic" |
