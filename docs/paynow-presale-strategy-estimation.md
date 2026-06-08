# PayNow Integration Presale Strategy and Estimation

## Objective

Win the SCSKAP PayNow opportunity with a low-budget-friendly approach while protecting delivery margin. The best strategy is not to estimate the full unknown system upfront, but to propose a tightly scoped Phase 0 discovery and Phase 1 Counter Sales MVP.

## Recommended Sales Strategy

### Positioning

Rikkeisoft should position this as an enterprise integration project:

- SAP Sales Invoice output enhancement
- PayNow QR generation with amount and payment reference
- UOB / SG Bank API integration
- Bank notification callback
- Payment matching and SAP confirmation

Do not position it as only "QR code generation". QR generation is the visible part, but the real work and risk are bank onboarding, API security, callback validation, SAP ABAP/output changes, and payment reconciliation.

### Main Message to Customer

We can develop this kind of system. To keep cost controlled, we recommend starting with Counter Sales as Phase 1 and limiting the first release to invoice QR generation, UOB/Bank payment notification, and basic SAP transaction confirmation. Field Power integration should be handled as Phase 2 after the payment flow is stable.

### Low Budget Strategy

Use a two-step engagement:

1. Phase 0: Fixed-scope technical discovery and design
2. Phase 1: Counter Sales MVP with strict scope and optional add-ons

This avoids committing to a large fixed price before UOB API details, SAP version, invoice output technology, and reconciliation rules are confirmed.

### Scope Control

Must-have for Phase 1:

- Generate or request PayNow QR using invoice amount and reference
- Embed QR into SAP Sales Invoice PDF/print output
- Customer can scan and pay with amount/reference auto-populated
- Receive UOB/SG Bank notification after payment
- Match notification to invoice reference
- Update or confirm payment status in SAP
- Basic audit logs and error handling

Defer to Phase 2 or add-ons:

- Field Power integration
- Full auto-clearing for all AR scenarios
- Refund handling
- Partial payment handling
- Multi-bank support
- Multi-currency support
- Dashboard/reporting portal
- Advanced monitoring and alerting
- High-volume performance tuning

## Recommended Architecture

### Lean Architecture

- SAP handles invoice creation and invoice output.
- A lightweight integration service handles UOB API calls, OAuth2, QR data, callbacks, and matching.
- SAP ABAP change is kept focused on invoice output enhancement and SAP update interface.
- UOB/SG Bank sends payment notification to the integration service.
- Integration service validates the notification, matches invoice reference, and updates SAP.

This is cheaper and safer than putting all integration logic directly inside SAP ABAP.

## Assumptions

The estimation below assumes:

- Phase 1 is only Counter Sales.
- Currency is SGD.
- PayNow Corporate / UEN registration is handled by customer/SCSKAP.
- UOB provides API documentation, sandbox, credentials, certificate requirements, and webhook rules.
- SAP version and output technology are available for review.
- Invoice output already exists and only needs QR/payment fields added.
- One payment reference maps to one SAP invoice.
- No partial payment, refund, chargeback, or multi-bank flow in Phase 1.
- SAP production transport and approval process are handled by customer/SCSKAP.

## Estimation Options

### Option A: Phase 0 Discovery and Design

Recommended first step before committing to build.

| Work Item | Effort |
| --- | ---: |
| Requirement workshop and scope confirmation | 1-2 MD |
| SAP invoice/output review | 1-2 MD |
| UOB API / PayNow QR feasibility review | 1-2 MD |
| Solution architecture and data flow | 1 MD |
| Final MVP estimation and delivery plan | 1 MD |
| **Total** | **5-8 MD** |

Deliverables:

- Confirmed Phase 1 scope
- Architecture diagram
- API/SAP gap list
- Risk list
- Final implementation estimate

### Option B: Lean Phase 1 MVP

Best fit for low budget. This delivers the main business outcome, but keeps advanced exception handling minimal.

| Work Item | Effort |
| --- | ---: |
| Project setup and detailed design | 3-5 MD |
| SAP invoice data mapping | 2-4 MD |
| SAP invoice output enhancement / QR placement | 6-10 MD |
| Integration service setup | 4-6 MD |
| UOB OAuth2 / API integration | 5-8 MD |
| PayNow QR data generation/handling | 4-7 MD |
| Bank notification callback endpoint | 4-6 MD |
| Basic payment matching by invoice reference | 4-6 MD |
| SAP payment confirmation/status update | 5-8 MD |
| Basic logs and error handling | 3-5 MD |
| SIT/UAT support and bug fixing | 6-9 MD |
| PM/communication | 4-6 MD |
| **Total** | **45-75 MD** |

Estimated elapsed time:

- 6-8 weeks if UOB sandbox/API access and SAP access are ready.
- 8-10 weeks if bank onboarding or SAP transport process is slow.

### Option C: Standard Phase 1

Recommended if customer wants stronger reliability and fewer manual operations.

| Work Item | Effort |
| --- | ---: |
| Everything in Lean MVP | 45-75 MD |
| Stronger callback validation and idempotency | 4-7 MD |
| Better exception handling for wrong amount/duplicate/unknown reference | 5-8 MD |
| SAP FI/AR posting or clearing enhancement | 8-15 MD |
| Operational monitoring and alerting | 3-6 MD |
| Additional regression/security testing | 5-8 MD |
| **Total** | **70-110 MD** |

Estimated elapsed time:

- 8-12 weeks, depending on bank and SAP dependencies.

### Option D: Phase 2 Field Power Integration

Estimate only after Phase 1 design is confirmed.

| Work Item | Effort |
| --- | ---: |
| Field Power process analysis | 3-5 MD |
| Mobile/field payment flow design | 3-5 MD |
| Integration extension | 8-15 MD |
| SAP/Field Power mapping and update | 8-15 MD |
| Testing and rollout support | 6-10 MD |
| **Total** | **30-50 MD** |

## Suggested Commercial Approach

Use fixed price for Phase 0 and either capped time-and-materials or tightly scoped fixed price for Phase 1.

Recommended proposal structure:

1. Phase 0 discovery: fixed price, 5-8 MD.
2. Phase 1 Lean MVP: fixed scope, 45-75 MD.
3. Optional add-ons: priced separately.
4. Phase 2 Field Power: estimate after Phase 1.

Avoid including these in the base price:

- Bank onboarding delays
- UOB production certification outside normal support
- SAP production transport delays
- New dashboard/reporting portal
- Partial payment/refund/multi-bank scenarios
- Major SAP form redesign

## Questions to Ask Before Final Quote

1. Which SAP version is used: ECC, S/4HANA On-Premise, S/4HANA Cloud, or SAP Business One?
2. Which invoice output technology is used: SAPscript, Smart Forms, Adobe Forms, or S/4HANA Output Management?
3. Does SCSKAP already have UOB PayNow Corporate registration and UEN suffix?
4. Does UOB provide a sandbox and API documentation for dynamic PayNow QR?
5. Is payment notification delivered by webhook/API, email, bank statement, or batch file?
6. Should SAP only mark payment status, or perform FI/AR clearing automatically?
7. Are partial payment, overpayment, duplicate payment, and refund required in Phase 1?
8. Is Counter Sales only one location/company code, or multiple?
9. What is the expected transaction volume per day?
10. What is the target go-live date?

## Recommended Answer to Customer

Yes, this system can be developed. Our recommended approach is to start with a short technical discovery to confirm the SAP invoice output method and UOB API details, then deliver Phase 1 for Counter Sales with a focused MVP: PayNow QR embedded into SAP Sales Invoice, payment reference/amount auto-populated, UOB payment notification routed back to the integration service, and SAP transaction confirmation. Field Power integration should be planned as Phase 2 to keep the first phase affordable and reduce delivery risk.

