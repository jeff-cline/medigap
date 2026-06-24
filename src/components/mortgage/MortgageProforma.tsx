"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { PROFORMA_DEFAULTS, runProforma, rampProjection, fmtUsd, fmtNum, fmtPct, type ProformaInputs } from "@/lib/mortgage";
import { Slider, Stat, IllustrativeBadge } from "@/components/agetech/primitives";

export default function MortgageProforma() {
  const [i, setI] = useState<ProformaInputs>(PROFORMA_DEFAULTS);
  const set = (k: keyof ProformaInputs) => (v: number) => setI((p) => ({ ...p, [k]: v }));
  const o = runProforma(i);
  const ramp = rampProjection(i);
  const rampMax = Math.max(...ramp.map((r) => r.ebitda), 1);

  return (
    <div className="space-y-5">
      <div className="ag-panel p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2"><span className="ag-live-dot" /><span className="text-sm text-[var(--ag-muted)]">Live proforma — edit any lever</span></div>
          <div className="flex items-center gap-2"><IllustrativeBadge /><button onClick={() => setI(PROFORMA_DEFAULTS)} className="ag-btn text-xs !py-1.5 !px-3">Reset</button></div>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-5">
            <Slider label="Monthly leads (owned audience)" value={i.monthlyLeads} min={500} max={30000} step={500} onChange={set("monthlyLeads")} format={fmtNum} />
            <Slider label="Lead → funded loan conversion" value={i.conversionPct} min={0.01} max={0.12} step={0.005} onChange={set("conversionPct")} format={fmtPct} />
            <Slider label="Average loan size" value={i.avgLoanSize} min={120000} max={650000} step={10000} onChange={set("avgLoanSize")} format={fmtUsd} />
            <Slider label="Revenue / funded loan (GOS + fees)" value={i.revenuePerLoan} min={3000} max={18000} step={250} onChange={set("revenuePerLoan")} format={fmtUsd} />
            <Slider label="Acquisition cost / lead (CAC)" value={i.cacPerLead} min={0} max={120} step={2} onChange={set("cacPerLead")} format={fmtUsd} />
            <Slider label="Fulfillment cost / funded loan" value={i.fulfillmentPerLoan} min={1500} max={8000} step={100} onChange={set("fulfillmentPerLoan")} format={fmtUsd} />
            <Slider label="Fixed annual opex" value={i.fixedOpexAnnual} min={1000000} max={20000000} step={500000} onChange={set("fixedOpexAnnual")} format={fmtUsd} />
          </div>
          <div className="grid grid-cols-2 gap-3 content-start">
            <Stat label="Funded loans / yr" value={fmtNum(o.fundedLoans)} tone="text" />
            <Stat label="Origination volume" value={fmtUsd(o.originationVolume)} tone="cyan" />
            <Stat label="Gross revenue" value={fmtUsd(o.grossRevenue)} tone="cyan" sub={`${fmtUsd(o.revenuePerLead)} / lead`} />
            <Stat label="Total cost" value={fmtUsd(o.totalCost)} tone="text" sub="CAC + fulfillment + opex" />
            <motion.div key={o.ebitda} initial={{ scale: 0.97, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }} className="col-span-2 ag-panel p-5 !border-[var(--ag-gold)]/40 text-center">
              <div className="text-[11px] uppercase tracking-widest text-[var(--ag-muted)]">EBITDA · {fmtPct(o.ebitdaMargin)} margin</div>
              <div className={`ag-mono text-4xl font-bold mt-1 ${o.ebitda >= 0 ? "ag-gradient" : "text-[var(--ag-red)]"}`}>{fmtUsd(o.ebitda)}</div>
            </motion.div>
          </div>
        </div>
        <p className="mt-6 text-xs text-[var(--ag-muted)] leading-relaxed border-t border-[var(--ag-border)] pt-4">
          <b className="text-[var(--ag-text)]">The edge:</b> traditional lenders pay $200–$1,000+ to acquire a mortgage borrower. R0cketShip originates from its
          <b className="text-[var(--ag-text)]"> owned 65+ audience and predictive data</b> at a fraction of that CAC — structurally higher margin per funded loan.
          All inputs are <span className="text-[var(--ag-gold)]">illustrative and editable</span>.
        </p>
      </div>

      {/* 5-year ramp from the current assumptions */}
      <div className="ag-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] uppercase tracking-widest text-[var(--ag-muted)]">5-year EBITDA ramp · scaling leads + conversion as the engine matures</div>
          <span className="ag-mono text-xs text-[var(--ag-muted)]">from your current per-loan economics</span>
        </div>
        <div className="space-y-3">
          {ramp.map((r, idx) => (
            <div key={r.year}>
              <div className="flex items-center justify-between text-[13px] mb-1">
                <span className="text-[var(--ag-text)] font-medium">{r.year} <span className="text-[var(--ag-muted)] font-normal">· {fmtNum(r.fundedLoans)} loans · {fmtUsd(r.volume)} volume · {fmtUsd(r.revenue)} rev</span></span>
                <span className={`ag-mono font-bold ${idx === ramp.length - 1 ? "text-[var(--ag-gold)] text-base" : "text-[var(--ag-cyan)]"}`}>{fmtUsd(r.ebitda)}</span>
              </div>
              <div className="h-2.5 rounded-full bg-[var(--ag-border)] overflow-hidden">
                <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.max(0, (r.ebitda / rampMax) * 100)}%` }} transition={{ duration: 0.6 }}
                  style={{ background: idx === ramp.length - 1 ? "linear-gradient(90deg,#38e1ff,#d8b46a)" : "#38e1ff" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
