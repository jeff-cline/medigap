import ExcelJS from "exceljs";
import { monthlyModel, annualModel, RAMP_MONTHS, PEAK_PER_MONTH, ANNUAL_PREMIUM, COMMISSION_RATE, POLICY_LIFE_MONTHS, MARKETING_FEE, EARLY_RAMP } from "./addmortgage";
import { ROCKETSHIP_LOGO_PNG_B64 } from "./rocketship-logo";

// AD&D Mortgage insurance workbook — WHITE theme, R0cketShip logo.
// White palette + R0cketShip accent colors.
const WHITE = "FFFFFFFF", PANEL = "FFEFF3F9", BAND = "FFF6F9FD", BORDER = "FFD7DEEA";
const INK = "FF14202E", MUTED = "FF5B6B80";
const CYAN = "FF0E8FA8", GOLD = "FFB8862B", GREEN = "FF1F9D6B", ORANGE = "FFFF7A18";
const DATA = 16, HEAD = 13, TITLE = 26, SUB = 12;
const USD = '"$"#,##0', NUM = "#,##0";

export async function buildAddWorkbook(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "R0cketShip — Mortgage Plus · AD&D";
  wb.created = new Date(2026, 5, 25);
  const months = monthlyModel();
  const years = annualModel();
  const logoId = wb.addImage({ base64: ROCKETSHIP_LOGO_PNG_B64, extension: "png" });

  // ---- Monthly (10 yr) ----
  const mo = wb.addWorksheet("Monthly (10 yr)", { properties: { tabColor: { argb: CYAN } }, views: [{ showGridLines: false, state: "frozen", ySplit: 5 }] });
  mo.columns = [{ width: 10 }, { width: 8 }, { width: 16 }, { width: 16 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 20 }];
  brand(mo, logoId, "AD&D MORTGAGE — MONTHLY PROFORMA (120 MONTHS)", "Q1 bootstrap → profits fund scaling to 1,000/mo · $100/yr premium · 35% commission · 6-yr life · $250 marketing fee", 8);
  header(mo, ["Month", "Year", "New policies", "Active policies", "Marketing fee", "Commission", "Total income", "Cumulative income"]);
  let cum = 0;
  for (const r of months) {
    cum += r.totalIncome;
    const row = mo.addRow([r.month, r.year, r.newPolicies, r.activePolicies, r.marketingFee, r.commission, r.totalIncome, cum]);
    row.height = 20;
    row.eachCell((cell, col) => {
      cell.font = { name: "Consolas", size: DATA, color: { argb: col === 7 ? GOLD : col === 5 ? GREEN : col === 6 ? CYAN : col >= 8 ? GOLD : INK } };
      cell.numFmt = col >= 5 ? USD : NUM;
      cell.alignment = { horizontal: "right", vertical: "middle" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: r.month % 12 === 0 ? PANEL : r.month % 2 === 0 ? BAND : WHITE } };
      cell.border = { bottom: { style: r.month % 12 === 0 ? "medium" : "thin", color: { argb: BORDER } } };
    });
  }
  disclaimer(mo, 8);

  // ---- Annual pivot (10 yr) ----
  const yr = wb.addWorksheet("Annual pivot (10 yr)", { properties: { tabColor: { argb: GOLD } }, views: [{ showGridLines: false }] });
  yr.columns = [{ width: 12 }, { width: 16 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 20 }];
  brand(yr, logoId, "AD&D MORTGAGE — ANNUAL PIVOT (10-YEAR PROJECTION)", "Monthly model pivoted to annual totals", 7);
  header(yr, ["Year", "New policies", "Active (year-end)", "Marketing fee", "Commission", "Total income", "Cumulative income"]);
  for (const y of years) {
    const row = yr.addRow([`Year ${y.year}`, y.newPolicies, y.activeEnd, y.marketingFee, y.commission, y.totalIncome, y.cumIncome]);
    row.height = 26;
    row.eachCell((cell, col) => {
      cell.font = { name: col === 1 ? "Calibri" : "Consolas", size: DATA + 2, bold: col === 6 || col === 7, color: { argb: col === 1 ? INK : col === 4 ? GREEN : col === 5 ? CYAN : GOLD } };
      if (col >= 4) cell.numFmt = USD; else if (col >= 2) cell.numFmt = NUM;
      cell.alignment = { horizontal: col === 1 ? "left" : "right", vertical: "middle" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: y.year % 2 === 0 ? BAND : WHITE } };
      cell.border = { bottom: { style: "thin", color: { argb: BORDER } } };
    });
  }
  const t = yr.addRow(["10-yr total", years.reduce((a, y) => a + y.newPolicies, 0), years[years.length - 1].activeEnd, years.reduce((a, y) => a + y.marketingFee, 0), years.reduce((a, y) => a + y.commission, 0), years.reduce((a, y) => a + y.totalIncome, 0), years[years.length - 1].cumIncome]);
  t.height = 30;
  t.eachCell((cell, col) => {
    cell.font = { name: col === 1 ? "Calibri" : "Consolas", size: DATA + 3, bold: true, color: { argb: col === 1 ? INK : GOLD } };
    if (col >= 4) cell.numFmt = USD; else if (col >= 2) cell.numFmt = NUM;
    cell.alignment = { horizontal: col === 1 ? "left" : "right", vertical: "middle" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PANEL } };
    cell.border = { top: { style: "medium", color: { argb: GOLD } } };
  });
  disclaimer(yr, 7);

  // ---- Chart data ----
  const ch = wb.addWorksheet("Chart data", { properties: { tabColor: { argb: GREEN } }, views: [{ showGridLines: false }] });
  ch.columns = [{ width: 26 }, ...years.map(() => ({ width: 13 }))];
  brand(ch, logoId, "CHART DATA — ANNUAL", "Select rows → Insert chart in Sheets / Excel", years.length + 1);
  header(ch, ["Metric", ...years.map((y) => `Y${y.year}`)]);
  chartRow(ch, "Marketing fee", years.map((y) => y.marketingFee), USD, GREEN);
  chartRow(ch, "Commission (35%)", years.map((y) => y.commission), USD, CYAN);
  chartRow(ch, "Total income", years.map((y) => y.totalIncome), USD, GOLD);
  chartRow(ch, "Active policies (year-end)", years.map((y) => y.activeEnd), NUM, INK);
  disclaimer(ch, years.length + 1);

  // ---- Assumptions ----
  const asm = wb.addWorksheet("Assumptions", { properties: { tabColor: { argb: "FF6A5BD0" } }, views: [{ showGridLines: false }] });
  asm.columns = [{ width: 42 }, { width: 30 }];
  brand(asm, logoId, "ASSUMPTIONS — EDIT THESE", "AD&D Mortgage insurance economics", 2);
  kv(asm, "Q1 / early ramp (new policies, months 1–6)", EARLY_RAMP.join(", "));
  kv(asm, "Scale-up", `month 6 (100) → ${PEAK_PER_MONTH.toLocaleString()}/mo by month ${RAMP_MONTHS} (funded from profits)`);
  kv(asm, "Peak new policies / month", PEAK_PER_MONTH.toLocaleString());
  kv(asm, "Annual premium / policy", `$${ANNUAL_PREMIUM}`);
  kv(asm, "Commission (your share)", `${Math.round(COMMISSION_RATE * 100)}%  →  $${Math.round(ANNUAL_PREMIUM * COMMISSION_RATE)}/yr per policy`);
  kv(asm, "Policy life", `${POLICY_LIFE_MONTHS} months (${POLICY_LIFE_MONTHS / 12} years)`);
  kv(asm, "Marketing fee / new policy (partner-paid)", `$${MARKETING_FEE}`);
  kv(asm, "Steady-state active policies", (PEAK_PER_MONTH * POLICY_LIFE_MONTHS).toLocaleString());
  kv(asm, "Steady-state income / yr", `$${(PEAK_PER_MONTH * 12 * MARKETING_FEE + PEAK_PER_MONTH * POLICY_LIFE_MONTHS * ANNUAL_PREMIUM * COMMISSION_RATE).toLocaleString()}`);
  disclaimer(asm, 2);

  return (await wb.xlsx.writeBuffer()) as unknown as Buffer;
}

// Header band: white, with the R0cketShip logo image + title + subtitle.
function brand(ws: ExcelJS.Worksheet, logoId: number, t: string, s: string, span: number) {
  ws.addImage(logoId, { tl: { col: 0.15, row: 0.15 }, ext: { width: 200, height: 50 } });
  const r0 = ws.addRow([]); r0.height = 44; // logo sits here
  const r1 = ws.addRow([t]); ws.mergeCells(r1.number, 1, r1.number, span); r1.height = 34;
  r1.getCell(1).font = { name: "Calibri", size: TITLE, bold: true, color: { argb: INK } };
  r1.getCell(1).alignment = { vertical: "middle" };
  const r2 = ws.addRow([s]); ws.mergeCells(r2.number, 1, r2.number, span); r2.height = 20;
  r2.getCell(1).font = { name: "Calibri", size: SUB, color: { argb: GOLD } };
  ws.addRow([]);
}
function header(ws: ExcelJS.Worksheet, cols: string[]) {
  const row = ws.addRow(cols); row.height = 26;
  row.eachCell((cell, col) => {
    cell.font = { name: "Calibri", size: HEAD, bold: true, color: { argb: WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CYAN } };
    cell.alignment = { horizontal: col === 1 ? "left" : "right", vertical: "middle" };
    cell.border = { bottom: { style: "medium", color: { argb: BORDER } } };
  });
}
function chartRow(ws: ExcelJS.Worksheet, label: string, vals: number[], fmt: string, color: string) {
  const row = ws.addRow([label, ...vals]); row.height = 24;
  row.eachCell((cell, col) => {
    cell.font = { name: col === 1 ? "Calibri" : "Consolas", size: DATA, color: { argb: col === 1 ? INK : color } };
    if (col > 1) { cell.numFmt = fmt; cell.alignment = { horizontal: "right" }; }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: WHITE } };
    cell.border = { bottom: { style: "thin", color: { argb: BORDER } } };
  });
}
function kv(ws: ExcelJS.Worksheet, label: string, val: string) {
  const row = ws.addRow([label, val]); row.height = 24;
  row.getCell(1).font = { name: "Calibri", size: DATA, color: { argb: MUTED } };
  row.getCell(2).font = { name: "Consolas", size: DATA, color: { argb: INK } };
  [1, 2].forEach((c) => { row.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: WHITE } }; row.getCell(c).border = { bottom: { style: "thin", color: { argb: BORDER } } }; });
}
function disclaimer(ws: ExcelJS.Worksheet, span: number) {
  ws.addRow([]);
  const d = ws.addRow(["Illustrative assumptions only · not an offer to sell securities · not investment advice · projected scenarios, not historical results."]);
  ws.mergeCells(d.number, 1, d.number, span);
  d.getCell(1).font = { name: "Calibri", size: 11, italic: true, color: { argb: MUTED } };
}
