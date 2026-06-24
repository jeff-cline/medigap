"use client";
import { motion } from "framer-motion";

const STEPS = ["New Customer", "More Data", "Better Predictions", "Higher Conversion", "More Revenue", "More Acquisitions", "More Customers", "More Data"];

// Rotating ring of compounding steps with a counter-rotating label set, so the loop reads
// as an infinite engine. SVG + framer-motion (no GSAP).
export default function Flywheel() {
  const n = STEPS.length, R = 150;
  return (
    <div className="grid lg:grid-cols-[1fr_1fr] gap-10 items-center">
      <div className="relative mx-auto" style={{ width: 360, height: 360 }}>
        <motion.div className="absolute inset-0" animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}>
          {STEPS.map((s, i) => {
            const a = (i / n) * Math.PI * 2 - Math.PI / 2;
            const x = 180 + Math.cos(a) * R, y = 180 + Math.sin(a) * R;
            return (
              <motion.div key={i} className="absolute ag-panel px-3 py-2 text-xs font-medium whitespace-nowrap"
                style={{ left: x, top: y, transform: "translate(-50%,-50%)" }}
                animate={{ rotate: -360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}>
                {s}
              </motion.div>
            );
          })}
        </motion.div>
        {/* center */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full flex items-center justify-center text-center ag-panel !border-[var(--ag-cyan)]"
          style={{ boxShadow: "0 0 50px rgba(56,225,255,.3)" }}>
          <span className="ag-gradient font-bold leading-tight">Compounding<br />Loop</span>
        </div>
        {/* rotating glow ring */}
        <motion.div className="absolute inset-6 rounded-full border border-dashed border-[var(--ag-border)]" animate={{ rotate: -360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} />
      </div>
      <div>
        <ol className="space-y-2">
          {STEPS.slice(0, 7).map((s, i) => (
            <motion.li key={i} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="flex items-center gap-3">
              <span className="ag-mono text-xs text-[var(--ag-cyan)] w-5">{i + 1}</span>
              <span className="text-lg">{s}</span>
              {i < 6 && <span className="text-[var(--ag-muted)]">↓</span>}
            </motion.li>
          ))}
          <li className="flex items-center gap-3 text-[var(--ag-muted)] ag-mono text-sm pl-8">↺ and the loop accelerates, forever</li>
        </ol>
      </div>
    </div>
  );
}
