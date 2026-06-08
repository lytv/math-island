import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "/Users/mac/tools/math-island/outputs/paynow-estimation";
const outputPath = `${outputDir}/paynow-integration-estimation.xlsx`;

const workbook = Workbook.create();

const COLORS = {
  navy: "#0f172a",
  blue: "#2563eb",
  blueLight: "#dbeafe",
  green: "#16a34a",
  greenLight: "#dcfce7",
  orange: "#ea580c",
  orangeLight: "#ffedd5",
  purple: "#7c3aed",
  purpleLight: "#ede9fe",
  red: "#dc2626",
  redLight: "#fee2e2",
  grayText: "#4b5563",
  muted: "#6b7280",
  border: "#d1d5db",
  soft: "#f8fafc",
  white: "#ffffff",
};

function addSheet(name) {
  const sheet = workbook.worksheets.add(name);
  sheet.showGridLines = false;
  return sheet;
}

function write(sheet, range, values) {
  sheet.getRange(range).values = values;
}

function formulas(sheet, range, values) {
  sheet.getRange(range).formulas = values;
}

function style(range, opts = {}) {
  const f = range.format;
  if (opts.fill) f.fill.color = opts.fill;
  if (opts.fontColor) f.font.color = opts.fontColor;
  if (opts.bold !== undefined) f.font.bold = opts.bold;
  if (opts.italic !== undefined) f.font.italic = opts.italic;
  if (opts.size) f.font.size = opts.size;
  if (opts.wrap !== undefined) f.wrapText = opts.wrap;
  if (opts.hAlign) f.horizontalAlignment = opts.hAlign;
  if (opts.vAlign) f.verticalAlignment = opts.vAlign;
  if (opts.numberFormat) f.numberFormat = opts.numberFormat;
}

function border(range, color = COLORS.border) {
  range.format.borders.setPreset("All", { color, style: "Continuous", weight: "Thin" });
}

function setWidths(sheet, widths) {
  widths.forEach((width, index) => {
    sheet.getRangeByIndexes(0, index, 200, 1).format.columnWidthPx = width;
  });
}

function title(sheet, text, subtitle) {
  write(sheet, "A1:H2", [[text, null, null, null, null, null, null, null], [subtitle, null, null, null, null, null, null, null]]);
  sheet.getRange("A1:H1").merge();
  sheet.getRange("A2:H2").merge();
  style(sheet.getRange("A1"), { bold: true, size: 22, fontColor: COLORS.navy });
  style(sheet.getRange("A2"), { size: 11, fontColor: COLORS.muted });
}

function header(sheet, range) {
  style(sheet.getRange(range), { fill: COLORS.navy, fontColor: COLORS.white, bold: true, wrap: true, vAlign: "Middle" });
  border(sheet.getRange(range), "#334155");
}

function sectionLabel(sheet, cell, text) {
  write(sheet, cell, [[text]]);
  style(sheet.getRange(cell), { bold: true, size: 14, fontColor: COLORS.navy });
}

const phaseRows = [
  ["P0", "Phase 0 Discovery and Design", "Fixed-scope technical discovery before build commitment", "Recommended first", "Fixed price", "1-2 weeks"],
  ["P1L", "Lean Phase 1 MVP", "Counter Sales MVP with core QR/payment/callback/SAP confirmation", "Best fit for low budget", "Fixed scope or capped T&M", "6-8 weeks"],
  ["P1S", "Standard Phase 1", "Lean MVP plus stronger validation, exception handling, and reconciliation", "Use if reliability matters more than lowest cost", "Scoped fixed price", "8-12 weeks"],
  ["P2", "Phase 2 Field Power Integration", "Extend payment flow to Field Power/mobile/field sales", "Estimate after Phase 1", "Separate phase", "TBD after Phase 1"],
];

const breakdown = [
  ["P0", "Requirement workshop and scope confirmation", 1, 2, "Must-have", "Confirm Counter Sales and Phase 2 boundary"],
  ["P0", "SAP invoice/output review", 1, 2, "Must-have", "Identify ECC/S4/B1 and form technology"],
  ["P0", "UOB API / PayNow QR feasibility review", 1, 2, "Must-have", "Confirm sandbox, OAuth2, QR data, webhook"],
  ["P0", "Solution architecture and data flow", 1, 1, "Must-have", "Architecture, integration options, risk list"],
  ["P0", "Final MVP estimation and delivery plan", 1, 1, "Must-have", "Basis for Phase 1 quote"],
  ["P1L", "Project setup and detailed design", 2, 4, "Must-have", "Keep design lean and implementation-ready"],
  ["P1L", "SAP invoice data mapping", 2, 4, "Must-have", "Invoice no, amount, customer, reference"],
  ["P1L", "SAP invoice output enhancement / QR placement", 6, 10, "Must-have", "Likely ABAP/form enhancement effort"],
  ["P1L", "Integration service setup", 3, 5, "Must-have", "Lightweight middleware/API service"],
  ["P1L", "UOB OAuth2 / API integration", 4, 7, "Must-have", "Token, certificates, bank API security"],
  ["P1L", "PayNow QR data generation/handling", 3, 6, "Must-have", "Dynamic amount and payment reference"],
  ["P1L", "Bank notification callback endpoint", 4, 6, "Must-have", "Receive UOB/SG Bank payment notification"],
  ["P1L", "Basic payment matching by invoice reference", 4, 6, "Must-have", "Match payment reference to SAP invoice"],
  ["P1L", "SAP payment confirmation/status update", 5, 8, "Must-have", "Confirm paid status or posting interface"],
  ["P1L", "Basic logs and error handling", 3, 5, "Must-have", "Audit API calls, callbacks, errors"],
  ["P1L", "SIT/UAT support and bug fixing", 6, 9, "Must-have", "Joint test with SAP and UOB sandbox"],
  ["P1L", "PM/communication", 3, 5, "Must-have", "English-speaking PM/coordination"],
  ["P1S", "Lean Phase 1 MVP baseline", 45, 75, "Baseline", "Same scope as P1L"],
  ["P1S", "Stronger callback validation and idempotency", 4, 5, "Recommended", "Prevent duplicated callback updates"],
  ["P1S", "Exception handling for wrong amount/duplicate/unknown ref", 5, 7, "Recommended", "Reduce manual Finance AR work"],
  ["P1S", "SAP FI/AR posting or clearing enhancement", 8, 12, "Optional", "Depends on SAP FI/AR process"],
  ["P1S", "Operational monitoring and alerting", 3, 5, "Optional", "Support run operations"],
  ["P1S", "Additional regression/security testing", 5, 6, "Recommended", "Needed for production confidence"],
  ["P2", "Field Power process analysis", 4, 5, "Phase 2", "Confirm field/mobile flow"],
  ["P2", "Mobile/field payment flow design", 4, 5, "Phase 2", "Define user journey and states"],
  ["P2", "Integration extension", 8, 15, "Phase 2", "Reuse Phase 1 service where possible"],
  ["P2", "SAP/Field Power mapping and update", 8, 15, "Phase 2", "Map transactions back to SAP"],
  ["P2", "Testing and rollout support", 6, 10, "Phase 2", "UAT and deployment support"],
];

const assumptions = [
  ["Phase 1 covers Counter Sales only."],
  ["Currency is SGD."],
  ["PayNow Corporate / UEN registration is handled by SCSKAP/customer."],
  ["UOB provides API documentation, sandbox, credentials, certificate requirements, and webhook rules."],
  ["SAP version and output technology are available for review."],
  ["Existing invoice output exists and only needs QR/payment fields added."],
  ["One payment reference maps to one SAP invoice."],
  ["No partial payment, refund, chargeback, or multi-bank flow in Lean Phase 1."],
  ["SAP production transport and approval process are handled by SCSKAP/customer."],
];

const questions = [
  ["SAP version", "Which SAP version is used: ECC, S/4HANA On-Premise, S/4HANA Cloud, or SAP Business One?", "High"],
  ["Output technology", "Which invoice output technology is used: SAPscript, Smart Forms, Adobe Forms, or S/4HANA Output Management?", "High"],
  ["PayNow registration", "Does SCSKAP already have UOB PayNow Corporate registration and UEN suffix?", "High"],
  ["UOB API access", "Does UOB provide sandbox and API documentation for dynamic PayNow QR?", "High"],
  ["Notification method", "Is payment notification delivered by webhook/API, email, bank statement, or batch file?", "High"],
  ["SAP update", "Should SAP only mark payment status, or perform FI/AR clearing automatically?", "High"],
  ["Exception scope", "Are partial payment, overpayment, duplicate payment, and refund required in Phase 1?", "Medium"],
  ["Rollout scope", "Is Counter Sales one location/company code, or multiple?", "Medium"],
  ["Volume", "What is the expected transaction volume per day?", "Medium"],
  ["Timeline", "What is the target go-live date?", "Medium"],
];

const references = [
  ["ABS PayNow", "PayNow Corporate supports entities receiving SGD through UEN and QR payments.", "https://www.abs.org.sg/e-payments/pay-now"],
  ["UOB PayNow Corporate", "UOB supports PayNow Corporate and SGQR collection via UEN/QR.", "https://www.uobgroup.com.sg/business/transact/payments/paynow-corporate.page"],
  ["UOB API Services", "UOB API services include FAST/PayNow services and Credit/Debit Notification API.", "https://www.uobgroup.com/business/digital/uob-api-services.page"],
  ["SAP Invoice Forms", "SAP invoice forms/output can be configured for billing document printing/PDF output.", "https://help.sap.com/docs/SAP_S4HANA_CLOUD/ddd685ebd8614e7b8d8eaf4d001e7c40/7ea0b78d5d8e48b5a5078f618ce2a747.html"],
];

const dashboard = addSheet("Dashboard");
setWidths(dashboard, [190, 140, 120, 120, 145, 165, 180, 180, 20, 140, 90, 90]);
title(dashboard, "PayNow Integration Estimation", "Presale strategy for SCSKAP: low-budget-friendly phased approach with controlled scope and visible risk items.");

write(dashboard, "A4:H4", [["Recommended Strategy", null, null, null, null, null, null, null]]);
dashboard.getRange("A4:H4").merge();
style(dashboard.getRange("A4"), { fill: COLORS.blueLight, bold: true, fontColor: COLORS.navy, size: 14 });
write(dashboard, "A5:H8", [[
  "Start with Phase 0 fixed-scope discovery, then quote Phase 1 Lean MVP for Counter Sales only. Keep Field Power Integration as Phase 2. This protects margin because UOB API access, bank callback rules, SAP output technology, and SAP FI/AR clearing are not yet confirmed.",
  null, null, null, null, null, null, null,
], [null, null, null, null, null, null, null, null], [null, null, null, null, null, null, null, null], [null, null, null, null, null, null, null, null]]);
dashboard.getRange("A5:H8").merge();
style(dashboard.getRange("A5:H8"), { fill: COLORS.soft, wrap: true, vAlign: "Top" });
border(dashboard.getRange("A4:H8"));

write(dashboard, "A10:E10", [["Option", "Min MD", "Max MD", "Avg MD", "Positioning"]]);
header(dashboard, "A10:E10");
write(dashboard, "A11:A14", [["Phase 0 Discovery"], ["Lean Phase 1 MVP"], ["Standard Phase 1"], ["Phase 2 Field Power"]]);
formulas(dashboard, "B11:D14", [
  ["='Phase Estimates'!C5", "='Phase Estimates'!D5", "='Phase Estimates'!E5"],
  ["='Phase Estimates'!C6", "='Phase Estimates'!D6", "='Phase Estimates'!E6"],
  ["='Phase Estimates'!C7", "='Phase Estimates'!D7", "='Phase Estimates'!E7"],
  ["='Phase Estimates'!C8", "='Phase Estimates'!D8", "='Phase Estimates'!E8"],
]);
write(dashboard, "E11:E14", [["Recommended first step"], ["Best fit for low budget"], ["If customer wants reliability"], ["Separate later phase"]]);
style(dashboard.getRange("A11:E14"), { wrap: true, vAlign: "Top" });
style(dashboard.getRange("B11:D14"), { numberFormat: "0" });
border(dashboard.getRange("A10:E14"));

write(dashboard, "A16:H16", [["Key Commercial Guardrails", null, null, null, null, null, null, null]]);
dashboard.getRange("A16:H16").merge();
style(dashboard.getRange("A16"), { fill: COLORS.orangeLight, bold: true, fontColor: COLORS.navy, size: 14 });
write(dashboard, "A17:H22", [
  ["1", "Do not quote full scope until Phase 0 confirms UOB API, SAP output, and SAP update mechanism.", null, null, null, null, null, null],
  ["2", "Use fixed price only for Phase 0 and tightly scoped Phase 1; exclude bank onboarding delays and major SAP redesign.", null, null, null, null, null, null],
  ["3", "Base offer should be Lean Phase 1. Price exception handling, auto-clearing, dashboards, refunds, and Field Power separately.", null, null, null, null, null, null],
  ["4", "Customer budget is low, but project should be framed as ERP payment integration, not only QR generation.", null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
]);
dashboard.getRange("B17:H17").merge();
dashboard.getRange("B18:H18").merge();
dashboard.getRange("B19:H19").merge();
dashboard.getRange("B20:H20").merge();
style(dashboard.getRange("A17:H22"), { wrap: true, vAlign: "Top" });
style(dashboard.getRange("A17:A20"), { bold: true, fontColor: COLORS.orange });
border(dashboard.getRange("A16:H22"));

write(dashboard, "J4:L8", [["Option", "Min MD", "Max MD"], ["Phase 0", 5, 8], ["Lean P1", 45, 75], ["Standard P1", 70, 110], ["Phase 2", 30, 50]]);
style(dashboard.getRange("J4:L8"), { fontColor: COLORS.white });
const chart = dashboard.charts.add("ColumnClustered", dashboard.getRange("J4:L8"), "Auto");
chart.title.text = "Effort Range by Option (MD)";
chart.setPosition(dashboard.getRange("G10:L22"));
chart.width = 520;
chart.height = 310;

const estimates = addSheet("Phase Estimates");
setWidths(estimates, [80, 280, 90, 90, 90, 180, 180, 200, 180]);
title(estimates, "Phase Estimates", "Summary options generated from the Work Breakdown sheet.");
write(estimates, "A4:I4", [["Phase", "Scope", "Min MD", "Max MD", "Avg MD", "Best Use", "Commercial Model", "Elapsed Time", "Recommendation"]]);
header(estimates, "A4:I4");
write(estimates, "A5:B8", phaseRows.map((r) => [r[0], r[1]]));
formulas(estimates, "C5:E8", [
  ["=SUMIF('Work Breakdown'!$A:$A,A5,'Work Breakdown'!$C:$C)", "=SUMIF('Work Breakdown'!$A:$A,A5,'Work Breakdown'!$D:$D)", "=(C5+D5)/2"],
  ["=SUMIF('Work Breakdown'!$A:$A,A6,'Work Breakdown'!$C:$C)", "=SUMIF('Work Breakdown'!$A:$A,A6,'Work Breakdown'!$D:$D)", "=(C6+D6)/2"],
  ["=SUMIF('Work Breakdown'!$A:$A,A7,'Work Breakdown'!$C:$C)", "=SUMIF('Work Breakdown'!$A:$A,A7,'Work Breakdown'!$D:$D)", "=(C7+D7)/2"],
  ["=SUMIF('Work Breakdown'!$A:$A,A8,'Work Breakdown'!$C:$C)", "=SUMIF('Work Breakdown'!$A:$A,A8,'Work Breakdown'!$D:$D)", "=(C8+D8)/2"],
]);
write(estimates, "F5:I8", phaseRows.map((r) => [r[3], r[4], r[5], r[2]]));
style(estimates.getRange("A5:I8"), { wrap: true, vAlign: "Top" });
style(estimates.getRange("C5:E8"), { numberFormat: "0" });
border(estimates.getRange("A4:I8"));

sectionLabel(estimates, "A11", "Suggested Proposal Position");
write(estimates, "A12:I16", [
  ["1", "Offer Phase 0 as a paid fixed-scope discovery. This gives customer a low starting cost and gives Rikkeisoft enough facts to protect margin.", null, null, null, null, null, null, null],
  ["2", "Use Lean Phase 1 as the base implementation. It covers business value without overbuilding exception handling or Field Power.", null, null, null, null, null, null, null],
  ["3", "Quote Standard Phase 1 only if customer explicitly needs production-grade reconciliation and lower manual operations.", null, null, null, null, null, null, null],
  ["4", "Keep Phase 2 as a separate post-MVP extension.", null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
]);
for (let row = 12; row <= 15; row++) estimates.getRange(`B${row}:I${row}`).merge();
style(estimates.getRange("A12:I16"), { wrap: true, vAlign: "Top" });
style(estimates.getRange("A12:A15"), { bold: true, fontColor: COLORS.blue });

const work = addSheet("Work Breakdown");
setWidths(work, [70, 330, 90, 90, 90, 115, 360]);
title(work, "Work Breakdown", "Editable man-day estimate by phase/workstream. Phase Estimates uses SUMIF formulas from this sheet.");
write(work, "A4:G4", [["Phase", "Work Item", "Min MD", "Max MD", "Avg MD", "Criticality", "Notes"]]);
header(work, "A4:G4");
write(work, `A5:D${4 + breakdown.length}`, breakdown.map((r) => [r[0], r[1], r[2], r[3]]));
formulas(work, `E5:E${4 + breakdown.length}`, breakdown.map((_, i) => [`=(C${5 + i}+D${5 + i})/2`]));
write(work, `F5:G${4 + breakdown.length}`, breakdown.map((r) => [r[4], r[5]]));
style(work.getRange(`A5:G${4 + breakdown.length}`), { wrap: true, vAlign: "Top" });
style(work.getRange(`C5:E${4 + breakdown.length}`), { numberFormat: "0.0" });
border(work.getRange(`A4:G${4 + breakdown.length}`));

const assump = addSheet("Assumptions");
setWidths(assump, [60, 900]);
title(assump, "Assumptions and Scope Control", "Use these assumptions to keep Phase 1 small and protect margin.");
write(assump, "A4:B4", [["No.", "Assumption"]]);
header(assump, "A4:B4");
write(assump, `A5:B${4 + assumptions.length}`, assumptions.map((r, i) => [i + 1, r[0]]));
style(assump.getRange(`A5:B${4 + assumptions.length}`), { wrap: true, vAlign: "Top" });
border(assump.getRange(`A4:B${4 + assumptions.length}`));

sectionLabel(assump, "A17", "Base Scope Exclusions");
write(assump, "A18:B25", [
  [1, "Bank onboarding delays and production approval/certification outside normal implementation support."],
  [2, "Refund, chargeback, multi-bank, multi-currency, or partial payment scenarios."],
  [3, "Major SAP invoice form redesign beyond QR/payment data placement."],
  [4, "Field Power Integration, dashboards, reporting portal, and advanced monitoring."],
  [5, "SAP infrastructure changes, customer network/firewall changes, or production transport approval delays."],
  [null, null],
  [null, null],
  [null, null],
]);
style(assump.getRange("A18:B25"), { wrap: true, vAlign: "Top" });
border(assump.getRange("A18:B22"));

const qs = addSheet("Questions");
setWidths(qs, [180, 760, 100, 160]);
title(qs, "Questions Before Final Quote", "These must be answered before converting the MD range into a final fixed price.");
write(qs, "A4:D4", [["Topic", "Question", "Priority", "Owner/Status"]]);
header(qs, "A4:D4");
write(qs, `A5:C${4 + questions.length}`, questions);
write(qs, `D5:D${4 + questions.length}`, questions.map(() => ["Open"]));
style(qs.getRange(`A5:D${4 + questions.length}`), { wrap: true, vAlign: "Top" });
border(qs.getRange(`A4:D${4 + questions.length}`));

const commercial = addSheet("Commercial Notes");
setWidths(commercial, [260, 860]);
title(commercial, "Commercial Notes", "Suggested language and guardrails for proposal discussions.");
write(commercial, "A4:B4", [["Area", "Guidance"]]);
header(commercial, "A4:B4");
write(commercial, "A5:B13", [
  ["Customer-facing answer", "Yes, this system can be developed. We recommend a short technical discovery first, then a focused Phase 1 for Counter Sales: PayNow QR embedded into SAP Sales Invoice, amount/reference auto-populated, UOB payment notification routed back, and SAP transaction confirmation."],
  ["Budget strategy", "Start small. Phase 0 gives customer a low-cost entry point and lets Rikkeisoft avoid unsafe assumptions."],
  ["Base offer", "Lean Phase 1 MVP. Keep advanced exception handling, dashboards, Field Power, refunds, partial payments, and multi-bank support outside base scope."],
  ["Commercial model", "Phase 0 fixed price. Phase 1 fixed scope or capped T&M. Phase 2 separate estimate after Phase 1."],
  ["Resource positioning", "English-speaking PM/engineer is required. ABAP support should be included or reserved depending on SAP output technology."],
  ["Risk wording", "QR code generation is straightforward; the main risks are UOB API access/security, bank callback validation, SAP output changes, and SAP FI/AR reconciliation."],
  ["Reference experience wording", "If exact PayNow/UOB/SAP reference is not verified, say Rikkeisoft has similar enterprise integration experience and will confirm exact reference internally."],
  ["Do not include", "Do not include bank onboarding delays, major SAP redesign, full auto-clearing, Field Power, or advanced monitoring in the lowest-cost base quote."],
  ["Presale next action", "Propose Phase 0 discovery with SCSKAP and UOB/SAP stakeholders."],
]);
style(commercial.getRange("A5:B13"), { wrap: true, vAlign: "Top" });
style(commercial.getRange("A5:A13"), { bold: true, fill: COLORS.soft });
border(commercial.getRange("A4:B13"));

const refs = addSheet("References");
setWidths(refs, [220, 620, 560]);
title(refs, "References", "Public source links used to ground the terminology and integration assumptions.");
write(refs, "A4:C4", [["Source", "Relevance", "URL"]]);
header(refs, "A4:C4");
write(refs, `A5:C${4 + references.length}`, references);
style(refs.getRange(`A5:C${4 + references.length}`), { wrap: true, vAlign: "Top" });
border(refs.getRange(`A4:C${4 + references.length}`));

for (const sheet of [dashboard, estimates, work, assump, qs, commercial, refs]) {
  const used = sheet.getUsedRange();
  if (used) style(used, { vAlign: "Top" });
}

const summaryCheck = await workbook.inspect({
  kind: "table",
  range: "Phase Estimates!A4:I8",
  include: "values,formulas",
  tableMaxRows: 10,
  tableMaxCols: 10,
});
console.log(summaryCheck.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

await workbook.render({ sheetName: "Dashboard", range: "A1:L24", scale: 1 });
await workbook.render({ sheetName: "Phase Estimates", range: "A1:I16", scale: 1 });
await workbook.render({ sheetName: "Work Breakdown", range: "A1:G32", scale: 1 });
await workbook.render({ sheetName: "Assumptions", range: "A1:B25", scale: 1 });
await workbook.render({ sheetName: "Questions", range: "A1:D15", scale: 1 });
await workbook.render({ sheetName: "Commercial Notes", range: "A1:B13", scale: 1 });
await workbook.render({ sheetName: "References", range: "A1:C8", scale: 1 });

await fs.mkdir(outputDir, { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(outputPath);
