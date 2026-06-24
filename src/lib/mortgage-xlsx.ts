import ExcelJS from "exceljs";
import { fullProforma, PRODUCTS, YEARS, LEADS_BY_YEAR, CAC_PER_LEAD, AMP_ATTACH, AMP_ANNUAL_PREMIUM, AMP_COMMISSION, AMP_LIFE_YEARS, STIPEND_PER_LOAN, SM_RATE, RND_RATE, GA_RATE } from "./mortgage";

// Formatted Mortgage Plus proforma workbook — LARGE fonts for readability.
const INK = "FF05070D", PANEL = "FF111A2B", BORDER = "FF24324E";
const CYAN = "FF38E1FF", GOLD = "FFD8B46A", GREEN = "FF3EE6A6", TEXT = "FFEAF1FF", MUTED = "FF9BAAC6";
const DATA = 18, HEAD = 14, TITLE = 30, SUB = 13; // big point sizes

export async function buildProformaWorkbook(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "R0cketShip — Mortgage Plus";
  wb.created = new Date(2026, 5, 24);
  const { rows, byProduct, series } = fullProforma();
  const USD = '"$"#,##0';
  const PCT = "0.0%";

  // ---- Sheet 1: Proforma P&L ----
  const pnl = wb.addWorksheet("Proforma P&L", { properties: { tabColor: { argb: CYAN } }, views: [{ showGridLines: false }] });
  pnl.columns = [{ width: 46 }, ...YEARS.map(() => ({ width: 20 }))];
  titleBlock(pnl, "MORTGAGE PLUS — 5-YEAR PROFORMA P&L", "R0cketShip AgeTech · SaaS model · Illustrative & editable", YEARS.length + 1);
  const head = pnl.addRow(["Line item ($)", ...YEARS]); styleHeader(head);

  for (const r of rows) {
    const isPct = r.kind === "metric" && r.values.every((v) => v <= 1);
    const isCount = /units|funded|in force|sold|AMP/i.test(r.label) && r.kind === "metric" && !/volume/i.test(r.label);
    const isSection = r.kind === "section";
    const isEbitda = r.label === "EBITDA";
    const row = pnl.addRow([(r.indent ? "   " : "") + r.label, ...(isSection ? YEARS.map(() => "") : r.values)]);
    row.height = isSection ? 26 : 24;
    row.eachCell((cell, col) => {
      const colorFor = () => {
        if (isSection) return CYAN;
        if (isEbitda) return GOLD;
        if (col === 1) return r.kind === "subtotal" || r.kind === "total" ? TEXT : MUTED;
        if (r.kind === "metric") return CYAN;
        if (r.kind === "subtotal") return GREEN;
        if (r.kind === "total") return TEXT;
        return MUTED;
      };
      cell.font = { name: col === 1 ? "Calibri" : "Consolas", size: isSection ? HEAD : DATA, bold: isSection || r.kind === "total" || r.kind === "subtotal" || isEbitda, color: { argb: colorFor() } };
      cell.alignment = { horizontal: col === 1 ? "left" : "right", vertical: "middle" };
      if (col > 1 && !isSection) cell.numFmt = isPct ? PCT : isCount ? "#,##0" : USD;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: isEbitda ? "FF1A1D27" : isSection ? PANEL : INK } };
      cell.border = { bottom: { style: r.kind === "total" || r.kind === "subtotal" ? "medium" : "thin", color: { argb: BORDER } } };
    });
  }
  disclaimer(pnl, YEARS.length + 1);

  // ---- Sheet 2: Pivot by line ----
  const piv = wb.addWorksheet("Pivot — by line", { properties: { tabColor: { argb: GOLD } }, views: [{ showGridLines: false }] });
  piv.columns = [{ width: 28 }, { width: 18 }, { width: 22 }, { width: 18 }, { width: 22 }];
  titleBlock(piv, "PIVOT — BY REVENUE LINE (5-YEAR TOTALS)", "Mortgage products · stipend · insurance", 5);
  const ph = piv.addRow(["Revenue line", "Units", "Origination volume", "Revenue", "EBITDA contribution"]); styleHeader(ph);
  for (const p of byProduct) pivotRow(piv, [p.name, p.units, p.volume, p.revenue, p.ebitdaContribution], false);
  pivotRow(piv, ["Total", byProduct.reduce((a, p) => a + p.units, 0), byProduct.reduce((a, p) => a + p.volume, 0), byProduct.reduce((a, p) => a + p.revenue, 0), byProduct.reduce((a, p) => a + p.ebitdaContribution, 0)], true);
  disclaimer(piv, 5);

  // ---- Sheet 3: Chart data (mortgage vs insurance income + units → chart in Sheets) ----
  const ch = wb.addWorksheet("Chart data", { properties: { tabColor: { argb: GREEN } }, views: [{ showGridLines: false }] });
  ch.columns = [{ width: 30 }, ...YEARS.map(() => ({ width: 18 }))];
  titleBlock(ch, "CHART DATA — MORTGAGE vs INSURANCE", "Select a row range → Insert chart in Google Sheets / Excel", YEARS.length + 1);
  const chh = ch.addRow(["Metric", ...YEARS]); styleHeader(chh);
  chartRow(ch, "Mortgage income", series.mortgageIncome, USD, CYAN);
  chartRow(ch, "Insurance income (AMP)", series.insuranceIncome, USD, GREEN);
  chartRow(ch, "Total revenue", series.totalRevenue, USD, TEXT);
  chartRow(ch, "EBITDA", series.ebitda, USD, GOLD);
  chartRow(ch, "Mortgage units (loans)", series.mortgageUnits, "#,##0", CYAN);
  chartRow(ch, "Insurance units (AMP in force)", series.insuranceUnits, "#,##0", GREEN);
  disclaimer(ch, YEARS.length + 1);

  // ---- Sheet 4: Assumptions (editable) ----
  const asm = wb.addWorksheet("Assumptions", { properties: { tabColor: { argb: "FFB48CFF" } }, views: [{ showGridLines: false }] });
  asm.columns = [{ width: 30 }, { width: 18 }, { width: 18 }, { width: 20 }, ...YEARS.map(() => ({ width: 13 }))];
  titleBlock(asm, "ASSUMPTIONS — EDIT THESE", "Per-product economics, insurance, stipend & SaaS opex", 4 + YEARS.length);
  const ah = asm.addRow(["Mortgage product", "Avg loan", "Rev / loan", "Fulfillment / loan", ...YEARS.map((y) => `${y} units`)]); styleHeader(ah);
  for (const p of PRODUCTS) {
    const row = asm.addRow([p.name, p.avgLoan, p.revPerLoan, p.fulfillPerLoan, ...p.units]); row.height = 22;
    row.eachCell((cell, col) => {
      cell.font = { name: col === 1 ? "Calibri" : "Consolas", size: DATA - 2, color: { argb: col === 1 ? TEXT : CYAN } };
      if (col >= 2 && col <= 4) cell.numFmt = USD;
      if (col > 4) cell.numFmt = "#,##0";
      cell.alignment = { horizontal: col === 1 ? "left" : "right" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: INK } };
      cell.border = { bottom: { style: "thin", color: { argb: BORDER } } };
    });
  }
  asm.addRow([]);
  kv(asm, "Accidental Mortgage Protection attach rate", `${Math.round(AMP_ATTACH * 100)}% of mortgages`);
  kv(asm, "AMP annual premium (illustrative)", `$${AMP_ANNUAL_PREMIUM} / yr`);
  kv(asm, "AMP commission (your share)", `${Math.round(AMP_COMMISSION * 100)}%`);
  kv(asm, "AMP policy life (commission amortized)", `${AMP_LIFE_YEARS} years`);
  kv(asm, "Marketing stipend per mortgage (1:1)", `$${STIPEND_PER_LOAN}`);
  kv(asm, "Annual qualified leads", LEADS_BY_YEAR.join("  ·  "));
  kv(asm, "Borrower acquisition cost / lead", `$${CAC_PER_LEAD}`);
  kv(asm, "Sales & Marketing (% of revenue)", SM_RATE.map((r) => `${Math.round(r * 100)}%`).join("  ·  "));
  kv(asm, "Research & Development (% of revenue)", RND_RATE.map((r) => `${Math.round(r * 100)}%`).join("  ·  "));
  kv(asm, "General & Administrative (% of revenue)", GA_RATE.map((r) => `${Math.round(r * 100)}%`).join("  ·  "));
  disclaimer(asm, 4 + YEARS.length);

  return (await wb.xlsx.writeBuffer()) as unknown as Buffer;
}

function titleBlock(ws: ExcelJS.Worksheet, title: string, sub: string, span: number) {
  const t = ws.addRow([title]); ws.mergeCells(t.number, 1, t.number, span); t.height = 40;
  t.getCell(1).font = { name: "Calibri", size: TITLE, bold: true, color: { argb: CYAN } };
  t.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: INK } };
  t.getCell(1).alignment = { vertical: "middle" };
  const s = ws.addRow([sub]); ws.mergeCells(s.number, 1, s.number, span); s.height = 22;
  s.getCell(1).font = { name: "Calibri", size: SUB, color: { argb: GOLD } };
  s.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: INK } };
  ws.addRow([]);
}
function styleHeader(row: ExcelJS.Row) {
  row.height = 26;
  row.eachCell((cell) => {
    cell.font = { name: "Calibri", size: HEAD, bold: true, color: { argb: TEXT } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PANEL } };
    cell.alignment = { horizontal: "right", vertical: "middle" };
    cell.border = { bottom: { style: "medium", color: { argb: BORDER } } };
  });
  row.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
}
function pivotRow(ws: ExcelJS.Worksheet, vals: (string | number)[], total: boolean) {
  const row = ws.addRow(vals); row.height = 24;
  row.eachCell((cell, col) => {
    cell.font = { name: col === 1 ? "Calibri" : "Consolas", size: DATA, bold: total, color: { argb: col === 1 ? TEXT : col === 5 ? GOLD : CYAN } };
    if (col === 2) cell.numFmt = "#,##0";
    if (col >= 3) cell.numFmt = '"$"#,##0';
    cell.alignment = { horizontal: col === 1 ? "left" : "right", vertical: "middle" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: INK } };
    cell.border = { top: total ? { style: "medium", color: { argb: BORDER } } : undefined, bottom: { style: "thin", color: { argb: BORDER } } };
  });
}
function chartRow(ws: ExcelJS.Worksheet, label: string, vals: number[], fmt: string, color: string) {
  const row = ws.addRow([label, ...vals]); row.height = 24;
  row.eachCell((cell, col) => {
    cell.font = { name: col === 1 ? "Calibri" : "Consolas", size: DATA, color: { argb: col === 1 ? TEXT : color } };
    if (col > 1) { cell.numFmt = fmt; cell.alignment = { horizontal: "right" }; }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: INK } };
    cell.border = { bottom: { style: "thin", color: { argb: BORDER } } };
  });
}
function kv(ws: ExcelJS.Worksheet, label: string, val: string) {
  const row = ws.addRow([label, val]); row.height = 22;
  row.getCell(1).font = { name: "Calibri", size: DATA - 2, color: { argb: MUTED } };
  row.getCell(2).font = { name: "Consolas", size: DATA - 2, color: { argb: TEXT } };
  [1, 2].forEach((c) => (row.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: INK } }));
}
function disclaimer(ws: ExcelJS.Worksheet, span: number) {
  ws.addRow([]);
  const d = ws.addRow(["Illustrative assumptions only · not an offer to sell securities · not investment advice · projected scenarios, not historical results."]);
  ws.mergeCells(d.number, 1, d.number, span);
  d.getCell(1).font = { name: "Calibri", size: 11, italic: true, color: { argb: MUTED } };
}
