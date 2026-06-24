import ExcelJS from "exceljs";
import { fullProforma, PRODUCTS, YEARS, LEADS_BY_YEAR, CAC_PER_LEAD, FIXED_OPEX } from "./mortgage";

// Build a formatted Mortgage Plus proforma workbook (P&L · pivot · editable assumptions).
const INK = "FF05070D", PANEL = "FF0D1320", BORDER = "FF1B2740";
const CYAN = "FF38E1FF", GOLD = "FFD8B46A", TEXT = "FFE9EEFB", MUTED = "FF8595B4";

export async function buildProformaWorkbook(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "R0cketShip — Mortgage Plus";
  wb.created = new Date(2026, 5, 24);
  const { rows, byProduct } = fullProforma();
  const USD = '"$"#,##0';
  const PCT = "0.0%";

  // ---- Sheet 1: Proforma P&L ----
  const pnl = wb.addWorksheet("Proforma P&L", { properties: { tabColor: { argb: CYAN } }, views: [{ showGridLines: false }] });
  pnl.columns = [{ width: 34 }, ...YEARS.map(() => ({ width: 15 }))];

  titleBlock(pnl, "MORTGAGE PLUS — 5-YEAR PROFORMA P&L", "R0cketShip AgeTech · Illustrative & editable", YEARS.length + 1);

  const head = pnl.addRow(["Line item ($)", ...YEARS]);
  styleHeader(head);

  for (const r of rows) {
    const isPct = r.kind === "metric" && r.values.every((v) => v <= 1);
    const isCount = r.label === "Funded loans";
    const row = pnl.addRow([(r.indent ? "    " : "") + r.label, ...r.values]);
    row.eachCell((cell, col) => {
      cell.font = { name: "Consolas", size: 11, color: { argb: r.kind === "total" || r.label === "EBITDA" ? TEXT : MUTED }, bold: r.kind === "total" };
      if (col > 1) {
        cell.numFmt = isPct ? PCT : isCount ? "#,##0" : USD;
        cell.alignment = { horizontal: "right" };
        cell.font = { ...cell.font, color: { argb: r.label === "EBITDA" ? GOLD : r.kind === "metric" ? CYAN : r.kind === "total" ? TEXT : MUTED } };
      } else {
        cell.font = { ...cell.font, color: { argb: r.label === "EBITDA" ? GOLD : r.indent ? MUTED : TEXT }, name: "Calibri" };
      }
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: r.label === "EBITDA" ? "FF15171F" : INK } };
      cell.border = { bottom: { style: "thin", color: { argb: BORDER } } };
    });
  }
  disclaimer(pnl, YEARS.length + 1);

  // ---- Sheet 2: Pivot by product ----
  const piv = wb.addWorksheet("Pivot — by product", { properties: { tabColor: { argb: GOLD } }, views: [{ showGridLines: false }] });
  piv.columns = [{ width: 24 }, { width: 16 }, { width: 18 }, { width: 16 }, { width: 18 }];
  titleBlock(piv, "PIVOT — BY PRODUCT (5-YEAR TOTALS)", "Reverse / HECM · Refinance · Purchase", 5);
  const ph = piv.addRow(["Product line", "Funded loans", "Origination volume", "Revenue", "EBITDA contribution"]);
  styleHeader(ph);
  for (const p of byProduct) addPivotRow(piv, [p.name, p.units, p.volume, p.revenue, p.ebitdaContribution], false);
  addPivotRow(piv, ["Total", byProduct.reduce((a, p) => a + p.units, 0), byProduct.reduce((a, p) => a + p.volume, 0), byProduct.reduce((a, p) => a + p.revenue, 0), byProduct.reduce((a, p) => a + p.ebitdaContribution, 0)], true);
  disclaimer(piv, 5);

  // ---- Sheet 3: Assumptions (editable) ----
  const asm = wb.addWorksheet("Assumptions", { properties: { tabColor: { argb: "FF3EE6A6" } }, views: [{ showGridLines: false }] });
  asm.columns = [{ width: 24 }, { width: 14 }, { width: 14 }, { width: 16 }, { width: 16 }, ...YEARS.map(() => ({ width: 12 }))];
  titleBlock(asm, "ASSUMPTIONS — EDIT THESE", "Per-product economics + annual ramp", 5 + YEARS.length);
  const ah = asm.addRow(["Product", "Avg loan", "Rev / loan", "Fulfillment / loan", "", ...YEARS.map((y) => `${y} units`)]);
  styleHeader(ah);
  for (const p of PRODUCTS) {
    const row = asm.addRow([p.name, p.avgLoan, p.revPerLoan, p.fulfillPerLoan, "", ...p.units]);
    row.eachCell((cell, col) => {
      cell.font = { name: col === 1 ? "Calibri" : "Consolas", size: 11, color: { argb: col === 1 ? TEXT : CYAN } };
      if (col >= 2 && col <= 4) cell.numFmt = USD;
      if (col > 5) cell.numFmt = "#,##0";
      cell.alignment = { horizontal: col === 1 ? "left" : "right" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: INK } };
      cell.border = { bottom: { style: "thin", color: { argb: BORDER } } };
    });
  }
  asm.addRow([]);
  labelVal(asm, "Annual qualified leads", LEADS_BY_YEAR.join("  ·  "));
  labelVal(asm, "Acquisition cost / lead", `$${CAC_PER_LEAD}`);
  labelVal(asm, "Fixed opex / yr", FIXED_OPEX.map((f) => `$${(f / 1e6).toFixed(0)}M`).join("  ·  "));
  disclaimer(asm, 5 + YEARS.length);

  return (await wb.xlsx.writeBuffer()) as unknown as Buffer;
}

function titleBlock(ws: ExcelJS.Worksheet, title: string, sub: string, span: number) {
  const t = ws.addRow([title]); ws.mergeCells(t.number, 1, t.number, span);
  t.getCell(1).font = { name: "Calibri", size: 16, bold: true, color: { argb: CYAN } };
  t.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: INK } };
  t.height = 26;
  const s = ws.addRow([sub]); ws.mergeCells(s.number, 1, s.number, span);
  s.getCell(1).font = { name: "Calibri", size: 10, color: { argb: GOLD } };
  s.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: INK } };
  ws.addRow([]);
}
function styleHeader(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { name: "Calibri", size: 9, bold: true, color: { argb: MUTED } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PANEL } };
    cell.alignment = { horizontal: "right" };
    cell.border = { bottom: { style: "medium", color: { argb: BORDER } } };
  });
  row.getCell(1).alignment = { horizontal: "left" };
}
function addPivotRow(ws: ExcelJS.Worksheet, vals: (string | number)[], total: boolean) {
  const row = ws.addRow(vals);
  row.eachCell((cell, col) => {
    cell.font = { name: col === 1 ? "Calibri" : "Consolas", size: 11, bold: total, color: { argb: col === 1 ? TEXT : col === 5 ? GOLD : CYAN } };
    if (col === 2) cell.numFmt = "#,##0";
    if (col >= 3) cell.numFmt = '"$"#,##0';
    cell.alignment = { horizontal: col === 1 ? "left" : "right" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: INK } };
    cell.border = { top: total ? { style: "medium", color: { argb: BORDER } } : undefined, bottom: { style: "thin", color: { argb: BORDER } } };
  });
}
function labelVal(ws: ExcelJS.Worksheet, label: string, val: string) {
  const row = ws.addRow([label, val]);
  row.getCell(1).font = { name: "Calibri", size: 11, color: { argb: MUTED } };
  row.getCell(2).font = { name: "Consolas", size: 11, color: { argb: TEXT } };
  [1, 2].forEach((c) => (row.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: INK } }));
}
function disclaimer(ws: ExcelJS.Worksheet, span: number) {
  ws.addRow([]);
  const d = ws.addRow(["Illustrative assumptions only · not an offer to sell securities · not investment advice · projected scenarios, not historical results."]);
  ws.mergeCells(d.number, 1, d.number, span);
  d.getCell(1).font = { name: "Calibri", size: 8, italic: true, color: { argb: MUTED } };
}
