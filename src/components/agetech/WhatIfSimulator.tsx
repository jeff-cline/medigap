"use client";
import { useState } from "react";
import { WHATIF_DEFAULTS, runWhatIf, fmtUsd, fmtNum, type WhatIfInputs } from "@/lib/agetech";
import { Slider, Stat, IllustrativeBadge } from "./primitives";
import { motion } from "framer-motion";

export default function WhatIfSimulator() {
  const [i, setI] = useState<WhatIfInputs>(WHATIF_DEFAULTS);
  const set = (k: keyof WhatIfInputs) => (v: number) => setI((p) => ({ ...p, [k]: v }));
  const o = runWhatIf(i);

  return (
    <div className="ag-panel ag-grid-bg p-6 md:p-10 relative overflow-hidden">
      <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full" style={{ background: "radial-gradient(circle, rgba(216,180,106,.16), transparent 65%)" }} />
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8 relative">
        <div>
          <div className="ag-chip mb-2">Special feature</div>
          <h3 className="text-2xl md:text-3xl font-bold">What if you <span className="ag-gradient">pressed the accelerator?</span></h3>
        </div>
        <IllustrativeBadge />
      </div>
      <div className="grid md:grid-cols-[1fr_1.2fr] gap-10 relative">
        <div className="space-y-6">
          <Slider label="Acquisitions" value={i.acquisitions} min={0} max={25} onChange={set("acquisitions")} />
          <Slider label="Customer growth" value={i.customerGrowthPct} min={0} max={200} onChange={set("customerGrowthPct")} format={(v) => `+${v}%`} />
          <Slider label="Partnership growth" value={i.partnerGrowthPct} min={0} max={300} onChange={set("partnerGrowthPct")} format={(v) => `+${v}%`} />
          <Slider label="Revenue / customer" value={i.revenuePerCustomer} min={400} max={6000} step={50} onChange={set("revenuePerCustomer")} format={fmtUsd} />
        </div>
        <div className="grid grid-cols-2 gap-3 content-start">
          <Stat label="Ecosystem customers" value={fmtNum(o.customers)} tone="cyan" />
          <Stat label="Strategic partners" value={fmtNum(o.partners)} tone="green" />
          <Stat label="Projected revenue" value={fmtUsd(o.revenue)} tone="cyan" />
          <Stat label="Portfolio growth" value={fmtUsd(o.portfolio)} tone="gold" />
          <motion.div key={o.enterpriseValue} initial={{ scale: 0.97 }} animate={{ scale: 1 }} className="col-span-2 ag-panel p-5 !border-[var(--ag-gold)]/50 text-center">
            <div className="text-[11px] uppercase tracking-widest text-[var(--ag-muted)]">Potential enterprise value</div>
            <div className="ag-mono text-4xl md:text-5xl font-bold ag-gradient ag-glow mt-1">{fmtUsd(o.enterpriseValue)}</div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
