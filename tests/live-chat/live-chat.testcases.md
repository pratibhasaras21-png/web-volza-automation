# Live Chat — Test Cases

_No automated spec yet — sourced from QA backlog._

| TC ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| TC-LIVECHAT-001 | Verify chatbot greets user with welcome message | P1 | User lands on app.volza.com | Navigate to app.volza.com and observe the chat widget | Chatbot displays a welcome greeting message |
| TC-LIVECHAT-002 | Verify chat window auto-loads on homepage | P1 | User lands on app.volza.com | Load the homepage | Chat window opens/loads automatically without manual trigger |
| TC-LIVECHAT-003 | Validate name input with alphanumeric text | P2 | Chatbot is active | Enter an alphanumeric name (e.g. "John123") in the name field and submit | Name is accepted and chatbot proceeds to the next step |
| TC-LIVECHAT-004 | Validate empty name input | P2 | Chatbot is active | Leave the name field empty and submit | Validation error/prompt is shown; chatbot does not proceed |
| TC-LIVECHAT-005 | Validate special characters in name field | P2 | Chatbot is active | Enter special characters (e.g. "@#$%") in the name field and submit | Input is rejected or sanitized with an appropriate message |
| TC-LIVECHAT-006 | Validate correct email format | P1 | User has provided name | Enter a valid email address and submit | Email is accepted and chatbot proceeds |
| TC-LIVECHAT-007 | Validate incorrect email formats | P1 | User has provided name | Enter invalid email formats (e.g. "abc@", "abc.com") and submit | Validation error is shown; submission is blocked |
| TC-LIVECHAT-008 | Validate empty email input | P1 | User has provided name | Leave the email field empty and submit | Validation error is shown |
| TC-LIVECHAT-009 | Validate numeric mobile number input | P2 | User has provided valid email | Enter a valid numeric phone number and submit | Number is accepted and chatbot proceeds |
| TC-LIVECHAT-010 | Validate international mobile number | P2 | User has provided valid email | Enter an international-format number (with country code) and submit | Number is accepted and recognized correctly |
| TC-LIVECHAT-011 | Validate invalid characters/letters in mobile field | P2 | User has provided valid email | Enter letters/invalid characters in the phone field and submit | Validation error is shown; submission is blocked |
| TC-LIVECHAT-012 | Verify valid preferred-way-forward options ("AI Assistant", "Walkthrough") | P2 | User has provided phone or skipped | Select "AI Assistant" or "Walkthrough" option | Chatbot proceeds with the selected flow |
| TC-LIVECHAT-013 | Verify invalid preferred-way-forward inputs (e.g. "Pizza") | P2 | User has provided phone or skipped | Enter an unrelated/invalid option (e.g. "Pizza") | Chatbot responds gracefully indicating an invalid selection |
| TC-LIVECHAT-014 | Validate common product inquiries (plans, pricing, data) | P2 | User has selected preferred way forward | Ask about plans, pricing, or data coverage | Chatbot returns relevant, accurate information |
| TC-LIVECHAT-015 | Validate invalid or unrelated questions | P2 | User has selected preferred way forward | Ask an unrelated/off-topic question | Chatbot responds with a fallback/clarification message |
| TC-LIVECHAT-016 | Validate bot response includes Startup, SME, and Point-based plan details | P2 | User requests information about plans | Ask the chatbot to explain the available plans | Response includes Startup, SME, and Point-based plan details |
| TC-LIVECHAT-017 | Validate data features listed (shipper, consignee, price, port, etc.) | P2 | User requests product features | Ask the chatbot about product/data features | Response lists shipper, consignee, price, port, and other relevant fields |
| TC-LIVECHAT-018 | Validate supported countries info | P2 | User requests product features | Ask the chatbot which countries are supported | Response lists supported countries/coverage |
| TC-LIVECHAT-019 | Validate booking link is provided | P1 | User requests a demo or walkthrough | Request a walkthrough/demo from the chatbot | Chatbot provides a booking link |
| TC-LIVECHAT-020 | Validate link redirects to Zoho Bookings | P1 | User requests a demo or walkthrough | Click the provided booking link | User is redirected to the Zoho Bookings page |
| TC-LIVECHAT-021 | Validate free trial response with no credit card requirement | P1 | User is new or expresses interest in trial | Ask the chatbot about the free trial | Response confirms no credit card is required |
| TC-LIVECHAT-022 | Validate free trial eligibility criteria explained | P1 | User is new or expresses interest in trial | Ask the chatbot about free trial eligibility | Response explains eligibility criteria clearly |
| TC-LIVECHAT-023 | Validate bot handles gibberish or repeated characters | P3 | At any stage of the conversation | Enter gibberish/repeated characters (e.g. "asdasdasd") | Chatbot responds gracefully without crashing |
| TC-LIVECHAT-024 | Validate unsupported intents handled gracefully | P3 | At any stage of the conversation | Enter an unsupported intent/request | Chatbot responds with a graceful fallback message |
| TC-LIVECHAT-025 | Validate accurate response about data coverage (80+ countries, up to 209 total) | P2 | User asks about country or region-specific data | Ask the chatbot about data coverage by country/region | Response accurately states coverage (80+ countries, up to 209 total) |
| TC-LIVECHAT-026 | Validate password reset flow guidance | P2 | User requests help with login or dashboard | Ask the chatbot for help resetting a password | Chatbot provides password reset guidance |
| TC-LIVECHAT-027 | Validate account or plan-related support availability | P2 | User requests help with login or dashboard | Ask the chatbot for account/plan support | Chatbot provides relevant support information or an escalation path |
| TC-LIVECHAT-028 | Validate point consumption explanation | P2 | User has subscribed or inquires about usage limits | Ask the chatbot how points are consumed | Chatbot explains point consumption clearly |
| TC-LIVECHAT-029 | Validate how to track or redeem points | P2 | User has subscribed or inquires about usage limits | Ask the chatbot how to track/redeem points | Chatbot explains the tracking/redemption process |
| TC-LIVECHAT-030 | Validate emoji handling | P3 | User inputs long queries, emojis, or experiences slow responses | Send a message containing emojis | Chatbot handles emojis without error |
| TC-LIVECHAT-031 | Validate long input text truncation or response | P3 | User inputs long queries, emojis, or experiences slow responses | Send an unusually long message | Chatbot truncates or handles the long input gracefully |
| TC-LIVECHAT-032 | Validate idle timeout handling | P3 | User inputs long queries, emojis, or experiences slow responses | Leave the chat idle for an extended period | Chatbot handles idle timeout appropriately (e.g. prompt or session end) |
| TC-LIVECHAT-033 | Validate HTML/script input is sanitized | P1 | User inputs scripts or injections | Enter HTML/script tags (e.g. `<script>alert(1)</script>`) into the chat | Input is sanitized; no script executes |
| TC-LIVECHAT-034 | Validate SQL keywords are treated as plain text | P1 | User inputs scripts or injections | Enter SQL keywords/injection strings into the chat | Input is treated as plain text; no injection effect |
| TC-LIVECHAT-035 | Validate bot handles concurrent chats without data leak or mixing sessions | P2 | Multiple chats are initiated simultaneously | Initiate multiple chat sessions concurrently from different users | Each session remains isolated; no data leakage or mixing |
