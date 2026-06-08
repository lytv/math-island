# SCSK PayNow Integration - Scope, Functional, Timeline Questions

## Purpose

Use these questions to clarify the project scope before preparing a proposal and estimation. The key goal is to identify exactly which part Rikkeisoft is expected to build, what systems already exist, what is Phase 1 vs Phase 2, and what assumptions must be excluded from the base quote.

## 1. High-Level Scope Questions

1. What is the expected scope for Rikkeisoft in this project?
   - Middleware/payment orchestration only?
   - SAP invoice output enhancement?
   - Counter Sales UI/POS changes?
   - Payment provider/UOB integration?
   - SAP FI/AR payment confirmation or clearing?

2. For Phase 1, should we focus only on Counter Sales?

3. Is Field Power/mobile/field sales confirmed as Phase 2 and excluded from Phase 1?

4. Does SCSKAP expect Rikkeisoft to build or modify the Counter Sales application, or only provide QR/payment integration to an existing Counter Sales channel?

5. What systems are already available today?
   - SAP S/4HANA
   - Counter Sales/POS system
   - Existing payment gateway/provider
   - Existing mobile/field application
   - Existing integration/middleware platform

6. What is the desired end-to-end flow for Phase 1, from invoice creation to SAP receiving paid confirmation?

7. What is the minimum successful MVP for the customer?

8. Are we expected to deliver only a proof of concept, or a production-ready implementation?

9. Is UOB/local SG Bank API mandatory, or can SCSKAP consider another PayNow provider such as HitPay if it is faster or cheaper?

10. Who owns bank onboarding, PayNow Corporate registration, UEN setup, sandbox access, and production credentials?

## 2. Counter Sales Functional Questions

1. What does "Counter Sales" mean in the customer environment?
   - Physical cashier counter?
   - SAP screen?
   - POS application?
   - Web application?
   - Mobile/tablet application?

2. Who is the seller/operator in this process?

3. What action does the seller perform first?
   - Create invoice?
   - Select existing invoice?
   - Request payment?
   - Print invoice?
   - Show QR?

4. Does the seller need a screen to see payment status: pending, paid, failed, expired?

5. Does Rikkeisoft need to build this seller screen, or does it already exist?

6. Where should the QR be shown?
   - Printed invoice
   - SAP invoice PDF
   - POS screen
   - Web page
   - Mobile/tablet screen
   - Customer-facing display

7. Does the seller need to manually trigger QR generation, or should QR be generated automatically when invoice is created?

8. Should one invoice support only one payment request, or can the seller regenerate QR multiple times?

9. How should the seller handle failed or expired QR/payment requests?

10. Should the seller be able to cancel a payment request?

## 3. Buyer / Customer Payment Functional Questions

1. What does the buyer scan?
   - QR on printed invoice?
   - QR on counter screen?
   - QR on mobile/tablet screen?

2. Which banking apps should be supported?
   - Any Singapore bank app supporting PayNow?
   - UOB only?
   - PayNow-compatible apps through SG banking network?

3. After scanning QR, should amount and payment reference be locked, or can the buyer edit them?

4. What exact information should the buyer see in the banking app?
   - Payee name
   - Amount
   - Invoice reference
   - Payment description

5. Does the buyer need an e-receipt after payment?

6. Who provides the receipt: SAP, Counter Sales system, middleware, or payment provider?

7. What happens if buyer scans QR but does not complete payment?

8. What happens if buyer pays after QR expires?

9. What happens if buyer pays wrong amount, partial amount, or duplicate payment?

10. Are refunds or reversals required in Phase 1?

## 4. SAP Functional Questions

1. Which SAP version is used?
   - SAP S/4HANA On-Premise
   - SAP S/4HANA Cloud
   - SAP ECC
   - Other

2. How is Sales Invoice created today?

3. Is invoice creation fully inside SAP, or through another Counter Sales/POS system integrated with SAP?

4. Which invoice output technology is used?
   - SAPscript
   - Smart Forms
   - Adobe Forms
   - S/4HANA Output Management
   - Custom PDF service

5. Does SAP currently generate any QR code on invoice?

6. If SAP already generates QR, what data does it contain?
   - Invoice number
   - Amount
   - Customer ID
   - Payment reference
   - Other invoice data

7. Should SAP generate the PayNow QR directly, or should middleware/provider generate it and return it to SAP/Counter Sales?

8. What SAP fields should be used as payment reference?

9. After payment is completed, what exactly should SAP update?
   - Invoice status only
   - Payment status
   - Accounting document
   - FI/AR clearing
   - Receipt record

10. Is auto-clearing required in Phase 1, or is status confirmation enough for MVP?

## 5. Payment Provider / UOB / HitPay Questions

1. Is UOB the mandatory provider for PayNow, or is it only an example?

2. Has SCSKAP already contacted UOB and obtained API documentation?

3. Does UOB provide sandbox access?

4. Does UOB return a full QR image, a QR string/payload, or only payment request data?

5. Does UOB return a transaction ID/payment request ID?

6. What authentication is required?
   - OAuth2
   - Client certificate
   - IP allowlist
   - API key
   - HMAC/signature

7. What webhook/payment notification does UOB provide?

8. What statuses can be returned?
   - Paid
   - Failed
   - Expired
   - Cancelled
   - Duplicate
   - Match fail

9. Does UOB support retrying webhook notifications?

10. Are there transaction fees or monthly fees that affect provider selection?

11. If HitPay or another provider is faster/cheaper, is the customer open to using it?

## 6. Middleware / Integration Functional Questions

1. Does customer already have an integration platform, or should Rikkeisoft build a new middleware service?

2. Where will middleware be hosted?
   - Customer infrastructure
   - SCSKAP infrastructure
   - Cloud
   - Rikkeisoft-managed environment

3. Does middleware need to store payment transactions?

4. What audit logs are required?
   - Invoice data received
   - QR request
   - QR response
   - Payment status
   - Webhook payload
   - SAP update result

5. How long should transaction logs be retained?

6. Does middleware need an admin screen for monitoring?

7. Are email/Teams alerts required for failed payment or failed SAP update?

8. What retry logic is expected if SAP update fails?

9. What retry logic is expected if provider webhook is duplicated or delayed?

10. Does the customer require encryption, masking, or special compliance handling for payment data?

## 7. Exception Handling Questions

1. What should happen if QR generation fails?

2. What should happen if payment provider is unavailable?

3. What should happen if buyer payment is successful but SAP update fails?

4. What should happen if UOB sends duplicate webhook notifications?

5. What should happen if webhook amount does not match invoice amount?

6. What should happen if payment reference cannot be matched to any invoice?

7. What should happen if invoice is cancelled after QR is generated?

8. What should happen if buyer pays after invoice cancellation?

9. Are manual reconciliation screens or reports required?

10. Who is responsible for resolving exceptions: Counter Sales staff, Finance AR, IT support, or SCSKAP?

## 8. Timeline Questions

1. What is the target go-live date?

2. Is there a required demo/POC date before go-live?

3. When can UOB sandbox/API access be provided?

4. When can SAP DEV/QAS access be provided?

5. When can Counter Sales process/system access be provided?

6. How long is expected for SIT?

7. How long is expected for UAT?

8. Who needs to approve UAT?

9. Is production deployment allowed anytime, or only during a change window?

10. Are there blackout dates or business peak periods to avoid?

## 9. Rollout / Volume Questions

1. How many stores/counters are included in Phase 1?

2. How many users/operators will use the Counter Sales flow?

3. Expected number of transactions per day/month?

4. Peak transaction volume?

5. Is Phase 1 for one company code/location only, or multiple?

6. Are there multiple currencies, or SGD only?

7. Is PayNow for Singapore only?

8. Is multi-language UI required?

9. Is training required for seller/counter staff?

10. Is production support required after go-live?

## 10. Proposal-Critical Questions

These should be asked first because they directly impact estimation.

1. Are we building middleware only, or also Counter Sales UI/POS?

2. Is Phase 1 only Counter Sales?

3. Is Field Power/mobile excluded from Phase 1?

4. Is UOB mandatory, or can another provider like HitPay be considered?

5. Does UOB provide sandbox/API documentation now?

6. Does SAP only need status update, or full FI/AR clearing?

7. Does SAP invoice output need ABAP/form modification?

8. Where should QR be displayed: invoice PDF, POS screen, web page, or mobile?

9. What exception scenarios are in Phase 1?

10. What is the target timeline and expected budget range?

