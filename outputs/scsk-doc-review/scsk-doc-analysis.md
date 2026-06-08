# SCSK PayNow Transcript Review

## Document Type

The file `/Users/mac/Downloads/SCSK .docx` is a Teams/meeting transcript. It contains 479 transcript lines and no embedded images/media. The transcript quality is noisy, so the analysis below normalizes obvious speech-to-text errors:

- `sáp`, `SAP`, `SJP` -> SAP
- `UIB`, `UAB`, `UYOPI` -> UOB
- `Hitbay`, `Hibay`, `HitBank` -> HitPay / payment gateway provider
- `counter sale`, `coter sale`, `cotter sale` -> Counter Sales
- `webhok`, `hút` -> webhook
- `middleware`, `midle wei`, `minowa` -> middleware / integration service
- `invoice QR` is different from `payment QR`

## Executive Summary

The team is aligning on the architecture and scope for a PayNow integration around SAP Sales Invoice.

The most important conclusion is:

> The start and end of the flow are both SAP: SAP creates the invoice, and after payment SAP must receive confirmation that the invoice/payment transaction is completed.

The middle of the flow is the solution area:

1. SAP creates invoice / invoice QR.
2. Middleware receives invoice data.
3. Middleware calls a payment provider/bank API.
4. Provider/bank returns PayNow QR or QR data plus transaction identifiers.
5. Customer scans and pays.
6. Provider/bank sends payment notification/webhook.
7. Middleware validates/matches payment.
8. Middleware updates SAP / SAP receives payment confirmation.

## Key Clarifications From The Transcript

### 1. SAP Invoice QR is not the same as PayNow Payment QR

The team explicitly corrected this point.

SAP may generate a QR code that contains invoice information, but that QR is not necessarily a payment QR. It may contain invoice number, amount, and reference information.

To make a real PayNow payment, there must be a provider/bank/payment layer that converts invoice data into payment QR data or returns a PayNow QR.

Implication:

- Do not design the system as "customer scans SAP invoice QR and payment happens directly."
- The SAP invoice QR/payment information must go through middleware and UOB/PayNow provider logic.

### 2. Middleware is the main Rikkeisoft scope

The discussion repeatedly confirms that Rikkeisoft likely handles the middleware/integration part.

Middleware responsibilities:

- Receive invoice data from SAP.
- Transform invoice data into payment request format.
- Authenticate with provider/bank API, likely OAuth2.
- Request QR data or PayNow QR.
- Store transaction ID/payment reference.
- Expose or return QR to SAP/POS/mobile/channel.
- Receive webhook/payment notification.
- Validate status.
- Match payment to invoice.
- Send confirmation back to SAP.
- Keep audit logs.

Implication:

- Estimation must include integration service and audit/error handling.
- Do not estimate this as only SAP ABAP QR generation.

### 3. HitPay/payment gateway vs UOB/local SG Bank is a major open decision

The team debated whether PayNow replaces HitPay or whether UOB replaces HitPay.

The corrected understanding is:

- If using HitPay/payment gateway, HitPay may act as the payment provider and offer multiple payment methods.
- If using UOB/local SG Bank API, UOB is the bank/payment provider for PayNow.
- Using both HitPay and UOB in the same flow may be unnecessary unless there is a specific reason.

The team concluded that the diagram can use a generic term such as:

> Payment Provider, with options: UOB/local SG Bank or HitPay.

But customer text specifically says they researched using PayNow API from local SG Bank, e.g. UOB.

Implication:

- Ask customer whether UOB is mandatory or whether other SG payment providers like HitPay are acceptable.
- Commercially, compare options by speed, cost, API readiness, support, and bank onboarding effort.

### 4. Counter Sales is Phase 1, but the platform is unclear

The transcript confirms that Counter Sales is mentioned in the customer scope. However, the team still needs to confirm what "Counter Sales" means operationally.

Open interpretations:

- Physical cashier counter/POS.
- Web-based counter sales system.
- SAP screen used by staff.
- Mobile/tablet at the counter.
- Existing customer system that displays QR.

Implication:

- We cannot finalize UI/device/platform effort until customer explains how Counter Sales works today.
- If Rikkeisoft must build POS/counter UI, estimation increases.
- If SAP or existing POS only needs QR returned/displayed, effort is lower.

### 5. Field Power/mobile sales is Phase 2

The transcript confirms Field Power/mobile sales is not the first focus. The team discussed it as a later/mobile extension.

Likely meaning:

- A field/mobile sales or service scenario where staff are outside the cashier counter.
- Mobile app/tablet flow.
- Similar PayNow payment, but with mobile/field sync concerns.

Implication:

- Keep Field Power outside Phase 1 base scope.
- Estimate separately after Phase 1 and after customer explains the platform.

### 6. The diagram should be business + solution, not too detailed

Oliver suggests the diagram should include:

- Actors: seller/shop/counter staff and customer/buyer.
- Systems: SAP, middleware, UOB/payment provider.
- Flow from SAP invoice creation to SAP payment confirmation.

The diagram should not be overly technical. It should be understandable at business level and solution level.

Implication:

- Best proposal diagram should show 2 levels:
  - Business flow: invoice -> QR -> payment -> confirmation.
  - Solution flow: SAP -> middleware -> UOB/provider -> webhook -> SAP.

## Corrected Target Flow

### Phase 1 Counter Sales

1. Counter staff creates/generates Sales Invoice in SAP or existing counter system.
2. SAP provides invoice data: invoice number, amount, customer/reference.
3. Middleware receives invoice data.
4. Middleware authenticates to UOB/payment provider using OAuth2 or required auth.
5. Middleware requests PayNow QR / QR data.
6. UOB/payment provider returns QR code or QR data plus transaction ID/reference.
7. QR is displayed/embedded for the customer.
8. Customer scans QR using banking app.
9. Customer confirms PayNow payment.
10. UOB/payment provider sends webhook/payment notification.
11. Middleware validates notification and matches invoice/payment reference.
12. Middleware sends payment confirmation/status back to SAP.
13. SAP invoice/payment lifecycle is completed.

## Main Risks

1. UOB API access is not confirmed.
2. Whether UOB returns full QR code or only QR data is not confirmed.
3. Whether customer allows HitPay/payment gateway alternative is not confirmed.
4. Counter Sales platform is not confirmed.
5. SAP invoice output technology is not confirmed.
6. SAP update mechanism is not confirmed: status update only vs FI/AR clearing.
7. Webhook/payment notification fields and statuses are not known.
8. Exception cases are not scoped: failed payment, match fail, duplicate notification, wrong amount, unknown invoice.
9. Transaction volume, number of stores/counters, and rollout locations are unknown.
10. Timeline is unknown.

## Questions To Ask Customer

### Technical

1. Which SAP version is used?
2. Which SAP invoice output technology is used?
3. Does SAP generate only invoice QR/data, or does it already support payment QR?
4. What exact invoice fields are available: invoice number, amount, currency, customer ID, reference?
5. Does UOB return QR code image, QR string/data, transaction ID, or all of them?
6. What authentication does UOB require: OAuth2, certificates, IP allowlist, client credentials?
7. Does UOB provide sandbox?
8. What webhook/payment notification fields does UOB return?
9. What statuses can be returned: paid, failed, expired, match fail, cancelled?
10. How should SAP be updated: status only, accounting posting, or FI/AR clearing?

### Scope

1. Is Phase 1 only Counter Sales?
2. What is the current Counter Sales platform: SAP, POS, web app, mobile app, or another system?
3. Does Rikkeisoft need to build any POS/UI screen?
4. How many counters/stores/company codes are in Phase 1?
5. What products/services are sold in this flow?
6. Is payment made at physical counter, online, or both?
7. Is Field Power/mobile sales definitely Phase 2?
8. Are partial payment, overpayment, refund, duplicate payment, or wrong amount included?

### Timeline / Commercial

1. Target go-live date?
2. Expected transaction volume per day/month?
3. Who owns UOB onboarding?
4. Who owns SAP transport and production deployment approval?
5. Is UOB mandatory or can customer consider HitPay/payment gateway provider?
6. Customer budget range?

## Impact On Existing Estimation

The current estimation remains directionally correct:

- Phase 0 Discovery: 5-8 MD
- Lean Phase 1 MVP: 45-75 MD
- Standard Phase 1: 70-110 MD
- Phase 2 Field Power: 30-50 MD

But one condition should be made explicit:

> Lean Phase 1 assumes Rikkeisoft is not building a full POS/counter sales application. If POS/counter UI must be built, the estimate needs a separate UI/application workstream.

Recommended adjustment:

- Keep base Lean Phase 1 as middleware + SAP output/update + UOB integration.
- Add optional workstream for Counter Sales UI/POS if required.

Optional Counter Sales UI add-on:

- Simple QR display/status screen: 8-15 MD
- Full POS/counter sales flow: requires separate discovery; likely much larger.

## Recommended Next Action

Prepare a customer question list grouped into:

1. Technical
2. Scope
3. Timeline/commercial

Also update diagrams to use:

> Payment Provider / UOB SG Bank API

Instead of over-committing to HitPay or UOB until customer confirms the provider choice.

