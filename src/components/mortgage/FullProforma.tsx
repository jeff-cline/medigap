"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { fullProforma, YEARS, PRODUCTS, fmtUsd, fmtNum, fmtPct, type Series } from "@/lib/mortgage";
import { IllustrativeBadge } from "@/components/agetech/primitives";

type View = "pnl" | "product";

export default function FullProforma() {
  const [view, setView] = useState<View>("pnl");
  const { rows, byProduct, series } = useMemo(() => fullProforma(), []);

  function cellText(label: string, kind: string, v: number) {
    if (kind === "metric" && Math.abs(v) <= 1) return fmtPct(v);
    if (/units|funded|AMP|in force|sold/i.test(label) && !/volume/i.test(label)) return fmtNum(v);
    return fmtUsd(v);
  }

  function exportCsv() {
    const head = ["Line item", ...YEARS];
    const body = rows.filter((r) => r.kind !== "section").map((r) => [r.label, ...r.values.map((v) => (r.kind === "metric" && Math.abs(v) <= 1 ? (v * 100).toFixed(1) + "%" : Math.round(v).toString()))]);
    const csv = [head, ...body].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "MortgagePlus-Proforma.csv"; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      {/* GRAPH */}
      <div className="ag-panel p-5 md:p-6">
        <div className="text-xs uppercase tracking-widest text-[var(--ag-muted)] mb-4">Revenue by source · EBITDA · units</div>
        <Chart series={series} />
      </div>

      {/* TABLE */}
      <div className="ag-panel p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex gap-1">
            <button onClick={() => setView("pnl")} className={`text-sm px-4 py-2 rounded-lg border ${view === "pnl" ? "border-[var(--ag-cyan)] text-[var(--ag-cyan)]" : "border-[var(--ag-border)] text-[var(--ag-muted)] hover:text-[var(--ag-text)]"}`}>P&amp;L by year</button>
            <button onClick={() => setView("product")} className={`text-sm px-4 py-2 rounded-lg border ${view === "product" ? "border-[var(--ag-cyan)] text-[var(--ag-cyan)]" : "border-[var(--ag-border)] text-[var(--ag-muted)] hover:text-[var(--ag-text)]"}`}>Pivot by line</button>
          </div>
          <div className="flex items-center gap-2">
            <IllustrativeBadge />
            <a href="/api/mortgage/xlsx" className="ag-btn ag-btn-primary text-sm !py-2 !px-4">⬇ Excel (.xlsx)</a>
            <button onClick={exportCsv} className="ag-btn text-sm !py-2 !px-3">CSV</button>
          </div>
        </div>

        <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="overflow-x-auto">
          {view === "pnl" ? (
            <table className="w-full ag-mono text-[17px] md:text-[18px] min-w-[760px]">
              <thead>
                <tr className="text-[var(--ag-muted)] text-[13px] uppercase tracking-wider">
                  <th className="text-left font-semibold pb-3 pr-3">Line item</th>
                  {YEARS.map((y) => <th key={y} className="text-right font-semibold pb-3 px-3">{y}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  if (r.kind === "section") return (
                    <tr key={r.label}><td colSpan={6} className="pt-5 pb-2 text-[13px] uppercase tracking-[0.2em] text-[var(--ag-cyan)] font-bold font-sans">{r.label}</td></tr>
                  );
                  const isEbitda = r.label === "EBITDA";
                  const tone = isEbitda ? "text-[var(--ag-gold)]" : r.kind === "subtotal" ? "text-[var(--ag-green)]" : r.kind === "metric" ? "text-[var(--ag-cyan)]" : r.kind === "total" ? "text-[var(--ag-text)]" : "text-[var(--ag-muted)]";
                  return (
                    <tr key={r.label} className={`border-t border-[var(--ag-border)]/50 ${r.kind === "total" || r.kind === "subtotal" ? "font-bold" : ""} ${isEbitda ? "bg-[var(--ag-gold)]/5" : ""}`}>
                      <td className={`py-2.5 pr-3 font-sans ${r.indent ? "pl-5 text-[var(--ag-muted)]" : "text-[var(--ag-text)]"} ${isEbitda ? "text-[var(--ag-gold)]" : ""}`}>{r.label}</td>
                      {r.values.map((v, i) => <td key={i} className={`text-right px-3 py-2.5 ${tone}`}>{cellText(r.label, r.kind, v)}</td>)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full ag-mono text-[17px] min-w-[640px]">
              <thead>
                <tr className="text-[var(--ag-muted)] text-[13px] uppercase tracking-wider">
                  <th className="text-left font-semibold pb-3 pr-3">Revenue line · 5-yr totals</th>
                  <th className="text-right font-semibold pb-3 px-3">Units</th>
                  <th className="text-right font-semibold pb-3 px-3">Volume</th>
                  <th className="text-right font-semibold pb-3 px-3">Revenue</th>
                  <th className="text-right font-semibold pb-3 px-3">EBITDA contrib.</th>
                </tr>
              </thead>
              <tbody>
                {byProduct.map((p) => (
                  <tr key={p.name} className="border-t border-[var(--ag-border)]/50">
                    <td className="py-3 pr-3 font-sans text-[var(--ag-text)]">{p.name}</td>
                    <td className="text-right px-3 text-[var(--ag-text)]">{fmtNum(p.units)}</td>
                    <td className="text-right px-3 text-[var(--ag-cyan)]">{p.volume ? fmtUsd(p.volume) : "—"}</td>
                    <td className="text-right px-3 text-[var(--ag-cyan)]">{fmtUsd(p.revenue)}</td>
                    <td className="text-right px-3 text-[var(--ag-gold)]">{fmtUsd(p.ebitdaContribution)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>
        <p className="mt-4 text-[13px] text-[var(--ag-muted)] leading-relaxed">
          Full SaaS P&amp;L: mortgage income (3 products + $250/loan stipend) and insurance income (Accidental Mortgage Protection, 35% commission
          amortized over its ~7-yr life), against typical SaaS expenses (S&amp;M, R&amp;D, G&amp;A). <b className="text-[var(--ag-text)]">Excel (.xlsx)</b> includes a Chart-data tab. All figures illustrative &amp; editable.
        </p>
      </div>
    </div>
  );
}

// Stacked revenue bars (mortgage + insurance) with an EBITDA marker line, per year.
function Chart({ series }: { series: Series }) {
  const W = 720, H = 300, padL = 56, padB = 46, padT = 16, padR = 16;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const max = Math.max(...series.totalRevenue) * 1.1;
  const n = series.years.length;
  const bw = (innerW / n) * 0.52;
  const x = (i: number) => padL + (innerW / n) * (i + 0.5);
  const y = (v: number) => padT + innerH - (v / max) * innerH;
  const ticks = 4;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[560px]" role="img" aria-label="Revenue and EBITDA by year">
        {/* gridlines */}
        {Array.from({ length: ticks + 1 }).map((_, t) => {
          const v = (max / ticks) * t; const yy = y(v);
          return (
            <g key={t}>
              <line x1={padL} y1={yy} x2={W - padR} y2={yy} stroke="#1b2740" strokeWidth={1} />
              <text x={padL - 8} y={yy + 4} textAnchor="end" fontSize={11} fill="#8595b4" fontFamily="monospace">{fmtUsd(v)}</text>
            </g>
          );
        })}
        {/* stacked bars */}
        {series.years.map((yr, i) => {
          const m = series.mortgageIncome[i], ins = series.insuranceIncome[i];
          const mH = (m / max) * innerH, insH = (ins / max) * innerH;
          const bx = x(i) - bw / 2;
          return (
            <g key={yr}>
              <rect x={bx} y={padT + innerH - mH} width={bw} height={mH} fill="#38e1ff" rx={3} />
              <rect x={bx} y={padT + innerH - mH - insH} width={bw} height={insH} fill="#3ee6a6" rx={3} />
              <text x={x(i)} y={H - padB + 18} textAnchor="middle" fontSize={12} fill="#9baac6" fontFamily="sans-serif">{yr.replace("Year ", "Y")}</text>
              <text x={x(i)} y={padT + innerH - mH - insH - 6} textAnchor="middle" fontSize={11} fill="#eaf1ff" fontFamily="monospace">{fmtUsd(m + ins)}</text>
            </g>
          );
        })}
        {/* EBITDA line */}
        <polyline fill="none" stroke="#d8b46a" strokeWidth={2.5} points={series.ebitda.map((e, i) => `${x(i)},${y(e)}`).join(" ")} />
        {series.ebitda.map((e, i) => <circle key={i} cx={x(i)} cy={y(e)} r={4} fill="#d8b46a" />)}
      </svg>
      <div className="flex flex-wrap gap-4 mt-2 text-[13px]">
        <Legend color="#38e1ff" label="Mortgage income" />
        <Legend color="#3ee6a6" label="Insurance income (AMP)" />
        <Legend color="#d8b46a" label="EBITDA" />
        <span className="ml-auto text-[var(--ag-muted)] ag-mono">
          Yr5: {fmtNum(series.mortgageUnits[4])} loans · {fmtNum(series.insuranceUnits[4])} AMP policies in force
        </span>
      </div>
    </div>
  );
}
function Legend({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-1.5 text-[var(--ag-muted)]"><span className="w-3 h-3 rounded-sm" style={{ background: color }} />{label}</span>;
}
