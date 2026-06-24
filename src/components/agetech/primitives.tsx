"use client";
import { motion, useInView, useMotionValue, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";

// Count-up number that animates when it scrolls into view.
export function Counter({ to, duration = 2, format = (n: number) => Math.round(n).toLocaleString("en-US"), className = "" }: { to: number; duration?: number; format?: (n: number) => string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  const mv = useMotionValue(0);
  const [text, setText] = useState(format(0));
  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, to, { duration, ease: [0.16, 1, 0.3, 1] });
    const unsub = mv.on("change", (v) => setText(format(v)));
    return () => { controls.stop(); unsub(); };
  }, [inView, to, duration]); // eslint-disable-line react-hooks/exhaustive-deps
  return <span ref={ref} className={className}>{text}</span>;
}

// Fade/slide reveal on scroll.
export function Reveal({ children, delay = 0, y = 24, className = "" }: { children: React.ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }} className={className}>
      {children}
    </motion.div>
  );
}

// Section wrapper with eyebrow + numbered label, consistent rhythm.
export function Section({ id, n, eyebrow, title, sub, children, center = false }: { id?: string; n?: string; eyebrow?: string; title: React.ReactNode; sub?: React.ReactNode; children?: React.ReactNode; center?: boolean }) {
  return (
    <section id={id} className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
      <Reveal>
        <div className={center ? "text-center max-w-3xl mx-auto" : "max-w-3xl"}>
          {(n || eyebrow) && (
            <div className="flex items-center gap-3 mb-4 justify-inherit" style={center ? { justifyContent: "center" } : undefined}>
              {n && <span className="ag-mono text-xs text-[var(--ag-cyan)]">{n}</span>}
              {eyebrow && <span className="ag-chip">{eyebrow}</span>}
            </div>
          )}
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">{title}</h2>
          {sub && <p className="mt-4 text-lg text-[var(--ag-muted)] leading-relaxed">{sub}</p>}
        </div>
      </Reveal>
      {children && <div className="mt-12">{children}</div>}
    </section>
  );
}

// Labeled slider for the simulators.
export function Slider({ label, value, min, max, step = 1, onChange, format }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; format?: (v: number) => string }) {
  return (
    <label className="block">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-sm text-[var(--ag-muted)]">{label}</span>
        <span className="ag-mono text-sm text-[var(--ag-cyan)]">{format ? format(value) : value}</span>
      </div>
      <input type="range" className="w-full" value={value} min={min} max={max} step={step} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

// Output stat tile.
export function Stat({ label, value, tone = "cyan", sub }: { label: string; value: string; tone?: "cyan" | "gold" | "green" | "text"; sub?: string }) {
  const color = tone === "gold" ? "text-[var(--ag-gold)]" : tone === "green" ? "text-[var(--ag-green)]" : tone === "text" ? "text-[var(--ag-text)]" : "text-[var(--ag-cyan)]";
  return (
    <div className="ag-panel p-4">
      <div className="text-[11px] uppercase tracking-widest text-[var(--ag-muted)]">{label}</div>
      <motion.div key={value} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className={`ag-mono text-2xl md:text-3xl font-bold mt-1 ${color}`}>{value}</motion.div>
      {sub && <div className="text-[11px] text-[var(--ag-muted)] mt-1">{sub}</div>}
    </div>
  );
}

export function IllustrativeBadge() {
  return <span className="ag-chip !text-[var(--ag-gold)] !border-[var(--ag-gold)]/40" title="Editable illustrative assumptions — not historical results or a forecast">⚠ Illustrative · editable</span>;
}
