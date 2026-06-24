"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { Counter } from "./primitives";
import Logo from "./Logo";
import { COHORTS, TURNING_65_PER_DAY } from "@/lib/agetech";

export default function Hero() {
  const [active, setActive] = useState<string>("65-74");
  const max = Math.max(...COHORTS.map((c) => c.millions));
  const sel = COHORTS.find((c) => c.key === active)!;

  return (
    <section className="ag-grid-bg relative min-h-screen flex flex-col justify-center px-6 overflow-hidden">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[520px] rounded-full" style={{ background: "radial-gradient(circle, rgba(56,225,255,.18), transparent 65%)" }} />
      <div className="mx-auto max-w-6xl w-full relative">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="flex items-center gap-3 mb-6">
          <Logo />
          <span className="ag-chip">AgeTech Capital Platform</span>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.1 }} className="text-5xl md:text-7xl font-bold leading-[1.02] tracking-tight">
          <span className="ag-gradient ag-glow">{<Counter to={TURNING_65_PER_DAY} duration={2.4} />}</span>
          <br />Americans turn 65 <span className="text-[var(--ag-muted)]">every day.</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }} className="mt-6 max-w-2xl text-lg md:text-xl text-[var(--ag-muted)] leading-relaxed">
          Most navigate Medicare, healthcare, housing, caregiving, financial planning and longevity
          alone. <span className="text-[var(--ag-text)]">Rocketship owns the trusted relationship layer</span> — capturing,
          nurturing and monetizing these relationships across an expanding ecosystem, for decades.
        </motion.p>

        {/* interactive demographic layers */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.7 }} className="mt-12">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-widest text-[var(--ag-muted)]">Explore the market — U.S. population by cohort</span>
            <span className="ag-mono text-xs text-[var(--ag-muted)]">illustrative scale</span>
          </div>
          <div className="grid sm:grid-cols-4 gap-3">
            {COHORTS.map((c, i) => (
              <button key={c.key} onMouseEnter={() => setActive(c.key)} onClick={() => setActive(c.key)}
                className={`ag-panel p-4 text-left transition ${active === c.key ? "!border-[var(--ag-cyan)]" : ""}`}>
                <div className="text-sm text-[var(--ag-muted)]">{c.label}</div>
                <div className="ag-mono text-2xl font-bold mt-1">{c.millions}M</div>
                <div className="mt-3 h-1.5 rounded-full bg-[var(--ag-border)] overflow-hidden">
                  <motion.div className="h-full rounded-full"
                    initial={{ width: 0 }} animate={{ width: `${(c.millions / max) * 100}%`, background: active === c.key ? "#38e1ff" : "#33415f" }} transition={{ duration: 0.8, delay: 0.8 + i * 0.08 }} />
                </div>
              </button>
            ))}
          </div>
          <motion.p key={sel.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[var(--ag-muted)]">
            <span className="text-[var(--ag-cyan)] font-semibold">{sel.label}:</span> {sel.blurb}
          </motion.p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-10 flex flex-wrap gap-3">
          <a href="#calculator" className="ag-btn ag-btn-primary">Run the value model →</a>
          <a href="#ecosystem" className="ag-btn">Explore the ecosystem</a>
        </motion.div>
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[var(--ag-muted)] text-xs ag-mono animate-bounce">scroll ↓</div>
    </section>
  );
}
