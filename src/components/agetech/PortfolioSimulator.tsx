"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { TARGETS, runPortfolio, fmtUsd, fmtNum } from "@/lib/agetech";
import { Stat, IllustrativeBadge } from "./primitives";

const BASE_CUSTOMERS = 500000, BASE_REVENUE = 120_000_000;

export default function PortfolioSimulator() {
  const [selected, setSelected] = useState<string[]>(["medsupp"]);
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const o = runPortfolio({ baseCustomers: BASE_CUSTOMERS, baseRevenue: BASE_REVENUE, selected });

  return (
    <div className="ag-panel p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <p className="text-sm text-[var(--ag-muted)] max-w-xl">Select acquisition targets. Watch direct revenue, cross-sell expansion, data assets, partner revenue and enterprise value compound as the network grows.</p>
        <IllustrativeBadge />
      </div>
      <div className="grid lg:grid-cols-[1fr_1fr] gap-8">
        {/* targets */}
        <div className="grid sm:grid-cols-2 gap-3">
          {TARGETS.map((t) => {
            const on = selected.includes(t.id);
            return (
              <button key={t.id} onClick={() => toggle(t.id)} className={`ag-panel p-4 text-left transition ${on ? "!border-[var(--ag-cyan)]" : "opacity-70 hover:opacity-100"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{t.name}</span>
                  <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${on ? "bg-[var(--ag-cyan)] border-[var(--ag-cyan)] text-[#04121a]" : "border-[var(--ag-border)]"}`}>{on ? "✓" : ""}</span>
                </div>
                <div className="text-[11px] uppercase tracking-widest text-[var(--ag-muted)] mt-1">{t.sector}</div>
                <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-[var(--ag-muted)]">
                  <span>{fmtNum(t.customers)} customers</span><span>{fmtUsd(t.revenue)} rev</span>
                  <span>data {t.dataScore}/10</span><span>{t.partners} partners</span>
                </div>
              </button>
            );
          })}
        </div>
        {/* outputs */}
        <div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Acquisitions" value={String(o.picks)} tone="text" />
            <Stat label="Total customers" value={fmtNum(o.totalCustomers)} tone="cyan" sub={`+${fmtNum(o.addedCustomers)} added`} />
            <Stat label="Direct revenue" value={fmtUsd(o.directRevenue)} tone="cyan" />
            <Stat label="Cross-sell expansion" value={fmtUsd(o.crossSell)} tone="green" />
            <Stat label="Partner revenue" value={fmtUsd(o.partnerRevenue)} tone="green" />
            <Stat label="Synergies" value={fmtUsd(o.synergy)} tone="gold" sub="multi-acquisition network effect" />
          </div>
          <motion.div key={o.totalRevenue} initial={{ scale: 0.98, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }} className="ag-panel mt-3 p-5 !border-[var(--ag-gold)]/40">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-[var(--ag-muted)]">Pro-forma enterprise value</div>
                <div className="ag-mono text-3xl md:text-4xl font-bold ag-gradient mt-1">{fmtUsd(o.enterpriseValue)}</div>
              </div>
              <div className="text-right text-xs text-[var(--ag-muted)]">
                <div>Total revenue</div><div className="ag-mono text-[var(--ag-cyan)]">{fmtUsd(o.totalRevenue)}</div>
                <div className="mt-1">Data asset</div><div className="ag-mono text-[var(--ag-gold)]">{o.dataAsset} pts</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
