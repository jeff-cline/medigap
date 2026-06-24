"use client";
import { motion } from "framer-motion";
import { cumulativeLtv, fmtUsd } from "@/lib/agetech";
import { Counter } from "./primitives";

// Vertical scrollytelling journey: each life stage adds value; a sticky panel shows the
// cumulative lifetime value climbing as you scroll.
export default function LtvJourney() {
  const steps = cumulativeLtv();
  const total = steps[steps.length - 1].cumulative;
  const max = total;

  return (
    <div className="grid lg:grid-cols-[1fr_1.1fr] gap-10 items-start">
      {/* sticky cumulative panel */}
      <div className="lg:sticky lg:top-24">
        <div className="ag-panel p-6">
          <div className="text-xs uppercase tracking-widest text-[var(--ag-muted)]">Cumulative lifetime value</div>
          <div className="ag-mono text-4xl md:text-5xl font-bold ag-gradient mt-1">
            <Counter to={total} format={(n) => fmtUsd(n)} />
          </div>
          <p className="text-sm text-[var(--ag-muted)] mt-2">per nurtured relationship, across two+ decades — illustrative gross profit.</p>
          <div className="mt-6 space-y-2">
            {steps.map((s, i) => (
              <motion.div key={s.age} initial={{ opacity: 0.3 }} whileInView={{ opacity: 1 }} viewport={{ margin: "-30%" }} className="flex items-center gap-3">
                <span className="ag-mono text-xs text-[var(--ag-muted)] w-8">{s.age}</span>
                <div className="flex-1 h-2 rounded-full bg-[var(--ag-border)] overflow-hidden">
                  <motion.div className="h-full rounded-full bg-[var(--ag-cyan)]" initial={{ width: 0 }} whileInView={{ width: `${(s.cumulative / max) * 100}%` }} viewport={{ once: true }} transition={{ duration: 1, delay: i * 0.05 }} />
                </div>
                <span className="ag-mono text-xs text-[var(--ag-cyan)] w-14 text-right">{fmtUsd(s.cumulative)}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* the journey */}
      <div className="space-y-4">
        {steps.map((s, i) => (
          <motion.div key={s.age} initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-20%" }} transition={{ duration: 0.6 }}
            className="ag-panel p-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="ag-mono text-3xl font-bold text-[var(--ag-muted)]">{s.age}</div>
              <div>
                <div className="text-xs uppercase tracking-widest text-[var(--ag-cyan)]">Stage {i + 1}</div>
                <div className="text-lg font-semibold">{s.stage}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="ag-mono text-xl font-bold text-[var(--ag-green)]">+{fmtUsd(s.value)}</div>
              <div className="text-[11px] text-[var(--ag-muted)]">this stage</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
