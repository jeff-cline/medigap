"use client";
import { useState } from "react";
import { CALC_DEFAULTS, runCalc, fmtUsd, fmtNum, type CalcInputs } from "@/lib/agetech";
import { Slider, Stat, IllustrativeBadge } from "./primitives";

export default function ValueCalculator() {
  const [i, setI] = useState<CalcInputs>(CALC_DEFAULTS);
  const set = (k: keyof CalcInputs) => (v: number) => setI((p) => ({ ...p, [k]: v }));
  const o = runCalc(i);

  return (
    <div className="ag-panel p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2"><span className="ag-live-dot" /><span className="text-sm text-[var(--ag-muted)]">Live model</span></div>
        <div className="flex items-center gap-2">
          <IllustrativeBadge />
          <button onClick={() => setI(CALC_DEFAULTS)} className="ag-btn text-xs !py-1.5 !px-3">Reset</button>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-5">
          <Slider label="Customer base" value={i.customers} min={50000} max={3000000} step={50000} onChange={set("customers")} format={fmtNum} />
          <Slider label="Acquisitions" value={i.acquisitions} min={0} max={20} onChange={set("acquisitions")} />
          <Slider label="Strategic partners" value={i.partners} min={0} max={60} onChange={set("partners")} />
          <Slider label="Avg lifetime value / customer" value={i.avgLtv} min={400} max={6000} step={50} onChange={set("avgLtv")} format={fmtUsd} />
          <Slider label="Cross-sell rate" value={i.crossSellRate} min={0} max={0.6} step={0.01} onChange={set("crossSellRate")} format={(v) => `${Math.round(v * 100)}%`} />
          <Slider label="Partner revenue / customer" value={i.partnerRevPerCustomer} min={0} max={80} onChange={set("partnerRevPerCustomer")} format={fmtUsd} />
        </div>
        <div className="grid grid-cols-2 gap-3 content-start">
          <Stat label="Projected revenue" value={fmtUsd(o.projectedRevenue)} tone="cyan" sub="base + cross-sell + partner" />
          <Stat label="Value / customer" value={fmtUsd(o.projectedCustomerValue)} tone="text" />
          <Stat label="Cross-sell potential" value={fmtUsd(o.crossSell)} tone="green" />
          <Stat label="Partner revenue" value={fmtUsd(o.partnerRevenue)} tone="green" />
          <Stat label="Portfolio impact" value={fmtUsd(o.portfolioImpact)} tone="gold" sub="acquisition compounding" />
          <Stat label="Enterprise value" value={fmtUsd(o.enterpriseValue)} tone="gold" sub={`${4.5}× blended multiple`} />
        </div>
      </div>
      <p className="mt-6 text-xs text-[var(--ag-muted)] leading-relaxed border-t border-[var(--ag-border)] pt-4">
        <b className="text-[var(--ag-text)]">How to read this:</b> all inputs are <span className="text-[var(--ag-gold)]">illustrative assumptions</span> you can change — not historical results and not a forecast.
        Enterprise value applies an illustrative {4.5}× revenue multiple. The model is intentionally transparent so assumptions can be stress-tested.
      </p>
    </div>
  );
}
