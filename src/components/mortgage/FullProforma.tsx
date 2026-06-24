"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { fullProforma, YEARS, PRODUCTS, fmtUsd, fmtNum, fmtPct } from "@/lib/mortgage";
import { IllustrativeBadge } from "@/components/agetech/primitives";

type View = "pnl" | "product";

export default function FullProforma() {
  const [view, setView] = useState<View>("pnl");
  const { rows, byProduct } = useMemo(() => fullProforma(), []);

  function fmtCell(kind: string, v: number) {
    if (kind === "metric" && v < 1) return fmtPct(v);          // margin
    if (kind === "metric" && v < 100000) return fmtNum(v);     // funded loans
    return fmtUsd(v);
  }

  function exportCsv() {
    const head = ["Line item", ...YEARS];
    const body = rows.map((r) => [r.label, ...r.values.map((v, i) => (r.kind === "metric" && r.values[i] < 1 ? (r.values[i] * 100).toFixed(1) + "%" : Math.round(r.values[i]).toString()))]);
    const pivot = [[], ["Product (5-yr totals)", "Funded loans", "Origination volume", "Revenue", "EBITDA contribution"], ...byProduct.map((p) => [p.name, Math.round(p.units), Math.round(p.volume), Math.round(p.revenue), Math.round(p.ebitdaContribution)])];
    const csv = [head, ...body, ...pivot].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "MortgagePlus-Proforma.csv"; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="ag-panel p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex gap-1">
          <button onClick={() => setView("pnl")} className={`text-xs px-3 py-1.5 rounded-lg border ${view === "pnl" ? "border-[var(--ag-cyan)] text-[var(--ag-cyan)]" : "border-[var(--ag-border)] text-[var(--ag-muted)] hover:text-[var(--ag-text)]"}`}>P&amp;L by year</button>
          <button onClick={() => setView("product")} className={`text-xs px-3 py-1.5 rounded-lg border ${view === "product" ? "border-[var(--ag-cyan)] text-[var(--ag-cyan)]" : "border-[var(--ag-border)] text-[var(--ag-muted)] hover:text-[var(--ag-text)]"}`}>Pivot by product</button>
        </div>
        <div className="flex items-center gap-2">
          <IllustrativeBadge />
          <button onClick={exportCsv} className="ag-btn text-xs !py-1.5 !px-3">⬇ Export CSV</button>
        </div>
      </div>

      <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="overflow-x-auto">
        {view === "pnl" ? (
          <table className="w-full ag-mono text-[12px] min-w-[640px]">
            <thead>
              <tr className="text-[var(--ag-muted)] text-[10px] uppercase tracking-wider">
                <th className="text-left font-medium pb-2 pr-3">Line item</th>
                {YEARS.map((y) => <th key={y} className="text-right font-medium pb-2 px-2">{y}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isEbitda = r.label === "EBITDA";
                const tone = r.kind === "rev" ? "text-[var(--ag-text)]" : r.kind === "cost" ? "text-[var(--ag-muted)]" : isEbitda ? "text-[var(--ag-gold)]" : r.kind === "metric" ? "text-[var(--ag-cyan)]" : "text-[var(--ag-text)]";
                return (
                  <tr key={r.label} className={`border-t border-[var(--ag-border)]/50 ${r.kind === "total" ? "font-bold" : ""} ${isEbitda ? "bg-[var(--ag-gold)]/5" : ""}`}>
                    <td className={`py-1.5 pr-3 font-sans ${r.indent ? "pl-4 text-[var(--ag-muted)]" : "text-[var(--ag-text)]"} ${isEbitda ? "text-[var(--ag-gold)]" : ""}`}>{r.label}</td>
                    {r.values.map((v, i) => (
                      <td key={i} className={`text-right px-2 py-1.5 ${tone} ${isEbitda ? "text-sm" : ""}`}>{fmtCell(r.kind, v)}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="w-full ag-mono text-[13px] min-w-[560px]">
            <thead>
              <tr className="text-[var(--ag-muted)] text-[10px] uppercase tracking-wider">
                <th className="text-left font-medium pb-2 pr-3">Product line · 5-yr totals</th>
                <th className="text-right font-medium pb-2 px-2">Funded loans</th>
                <th className="text-right font-medium pb-2 px-2">Volume</th>
                <th className="text-right font-medium pb-2 px-2">Revenue</th>
                <th className="text-right font-medium pb-2 px-2">EBITDA contrib.</th>
              </tr>
            </thead>
            <tbody>
              {byProduct.map((p) => (
                <tr key={p.name} className="border-t border-[var(--ag-border)]/50">
                  <td className="py-2 pr-3 font-sans text-[var(--ag-text)]">{p.name}</td>
                  <td className="text-right px-2 text-[var(--ag-text)]">{fmtNum(p.units)}</td>
                  <td className="text-right px-2 text-[var(--ag-cyan)]">{fmtUsd(p.volume)}</td>
                  <td className="text-right px-2 text-[var(--ag-cyan)]">{fmtUsd(p.revenue)}</td>
                  <td className="text-right px-2 text-[var(--ag-gold)]">{fmtUsd(p.ebitdaContribution)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-[var(--ag-border)] font-bold">
                <td className="py-2 pr-3 font-sans text-[var(--ag-text)]">Total</td>
                <td className="text-right px-2 text-[var(--ag-text)]">{fmtNum(byProduct.reduce((a, p) => a + p.units, 0))}</td>
                <td className="text-right px-2 text-[var(--ag-cyan)]">{fmtUsd(byProduct.reduce((a, p) => a + p.volume, 0))}</td>
                <td className="text-right px-2 text-[var(--ag-cyan)]">{fmtUsd(byProduct.reduce((a, p) => a + p.revenue, 0))}</td>
                <td className="text-right px-2 text-[var(--ag-gold)]">{fmtUsd(byProduct.reduce((a, p) => a + p.ebitdaContribution, 0))}</td>
              </tr>
            </tbody>
          </table>
        )}
      </motion.div>

      <p className="mt-4 text-[11px] text-[var(--ag-muted)] leading-relaxed">
        Three product lines — {PRODUCTS.map((p) => p.name).join(", ")} — across five years. Switch to <b className="text-[var(--ag-text)]">Pivot by product</b> to see each line&apos;s
        contribution, or <b className="text-[var(--ag-text)]">Export CSV</b> to drop straight into Google Sheets and add native pivots. All figures illustrative &amp; editable.
      </p>
    </div>
  );
}
