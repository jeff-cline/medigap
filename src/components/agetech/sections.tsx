"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Reveal } from "./primitives";
import Logo from "./Logo";
import { ROADMAP } from "@/lib/agetech";

// ---- Section 3: Trust Engine ----
const TRUST = [
  { k: "Audience Growth", v: "Owned, compounding reach" },
  { k: "Email Assets", v: "Opt-in, deliverable, segmented" },
  { k: "Social Reach", v: "Multi-channel presence" },
  { k: "Customer Records", v: "Unified first-party profiles" },
  { k: "Opt-In Relationships", v: "Permissioned, re-monetizable" },
  { k: "Engagement Metrics", v: "Behavioral, predictive inputs" },
];
export function TrustEngine() {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {TRUST.map((t, i) => (
        <Reveal key={t.k} delay={i * 0.06}>
          <div className="ag-panel p-6 h-full">
            <div className="ag-mono text-xs text-[var(--ag-cyan)]">0{i + 1}</div>
            <div className="text-lg font-semibold mt-2">{t.k}</div>
            <div className="text-sm text-[var(--ag-muted)] mt-1">{t.v}</div>
          </div>
        </Reveal>
      ))}
      <Reveal delay={0.4} className="md:col-span-3">
        <div className="ag-panel p-6 text-center !border-[var(--ag-cyan)]/40">
          <span className="text-lg">Trust converts to <span className="ag-gradient font-semibold">durable economic assets</span> — the relationship is the asset.</span>
        </div>
      </Reveal>
    </div>
  );
}

// ---- Section 6: Demand Engine (left→right flow) ----
const DEMAND = ["Traffic Sources", "Lead Generation", "Audience Building", "Predictive Segmentation", "Partner Matching", "Revenue Activation"];
export function DemandEngine() {
  return (
    <div className="flex flex-wrap items-stretch gap-3">
      {DEMAND.map((d, i) => (
        <Reveal key={d} delay={i * 0.08} className="flex-1 min-w-[150px]">
          <div className="ag-panel p-5 h-full relative">
            <div className="ag-mono text-xs text-[var(--ag-cyan)]">{i + 1}</div>
            <div className="font-semibold mt-2 leading-tight">{d}</div>
            {i < DEMAND.length - 1 && <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-[var(--ag-cyan)] z-10">→</div>}
          </div>
        </Reveal>
      ))}
    </div>
  );
}

// ---- Section 7: Data Moat ----
const MOAT = ["First-Party Data", "Behavioral Data", "Intent Signals", "Predictive Scoring", "Audience Segmentation", "Lifecycle Tracking", "Machine-Learning Models"];
export function DataMoat() {
  return (
    <div className="grid lg:grid-cols-[1fr_1fr] gap-8 items-center">
      <div className="flex flex-wrap gap-2">
        {MOAT.map((m, i) => (
          <motion.span key={m} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
            className="ag-panel px-4 py-2 text-sm">{m}</motion.span>
        ))}
      </div>
      <Reveal>
        <p className="text-lg text-[var(--ag-muted)] leading-relaxed">
          Each interaction enriches the profile. Richer profiles sharpen prediction. Sharper prediction improves matching and conversion — which generates more interactions.
          <span className="text-[var(--ag-text)]"> The data compounds the platform's efficiency over time.</span>
        </p>
        <p className="mt-3 text-xs text-[var(--ag-muted)]">Focus is on process and capability — no unsupported performance claims.</p>
      </Reveal>
    </div>
  );
}

// ---- Section 8: Accretive Acquisition Engine (what each acquisition adds) ----
const ACQ_ADDS = ["Customers", "Data", "Distribution", "Talent", "Technology", "Revenue", "Relationships", "Real Estate"];
export function AcquisitionEngine() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {ACQ_ADDS.map((a, i) => (
        <motion.div key={a} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
          className="ag-panel p-5 text-center">
          <div className="text-2xl">＋</div>
          <div className="font-semibold mt-1">{a}</div>
          <div className="text-[11px] text-[var(--ag-muted)] mt-1">flows to every customer & node</div>
        </motion.div>
      ))}
    </div>
  );
}

// ---- Section 11: Roadmap ----
export function Roadmap() {
  const [h, setH] = useState(0);
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {ROADMAP.map((r, i) => (
          <button key={r.horizon} onClick={() => setH(i)} className={`ag-btn text-sm ${h === i ? "ag-btn-primary" : ""}`}>{r.horizon}</button>
        ))}
      </div>
      <motion.div key={h} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid sm:grid-cols-2 gap-3">
        {ROADMAP[h].points.map((p) => (
          <div key={p} className="ag-panel p-5 flex items-start gap-3"><span className="text-[var(--ag-cyan)]">▹</span><span>{p}</span></div>
        ))}
      </motion.div>
    </div>
  );
}

// ---- Download Center ----
const DOCS = ["Executive Summary", "Investor One-Sheet", "Institutional Pitch Deck", "Acquisition Strategy", "Data Strategy", "Partnership Ecosystem"];
export function DownloadCenter() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {DOCS.map((d) => (
        <button key={d} onClick={() => window.print()} className="ag-panel p-5 text-left hover:!border-[var(--ag-cyan)] transition group">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{d}</span>
            <span className="text-[var(--ag-cyan)] group-hover:translate-x-0.5 transition">↓</span>
          </div>
          <div className="text-[11px] text-[var(--ag-muted)] mt-1">Save as PDF</div>
        </button>
      ))}
      <p className="sm:col-span-2 lg:col-span-3 text-xs text-[var(--ag-muted)]">Tailored institutional decks (data room, acquisition model) are available on request — contact the Rocketship team.</p>
    </div>
  );
}

// ---- top scroll progress + section nav ----
const NAV = [
  ["opportunity", "Opportunity"], ["ecosystem", "Ecosystem"], ["trust", "Trust"], ["ltv", "Lifetime Value"],
  ["calculator", "Calculator"], ["demand", "Demand"], ["data", "Data Moat"], ["acquisition", "Acquisitions"],
  ["portfolio", "Portfolio"], ["flywheel", "Flywheel"], ["roadmap", "Roadmap"],
];
export function ProgressNav() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => { const h = document.documentElement; setP(h.scrollTop / (h.scrollHeight - h.clientHeight || 1)); };
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-transparent">
        <div className="h-full bg-[var(--ag-cyan)]" style={{ width: `${p * 100}%`, boxShadow: "0 0 12px rgba(56,225,255,.7)" }} />
      </div>
      <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur bg-[var(--ag-bg)]/70 border-b border-[var(--ag-border)]">
        <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between">
          <a href="#top"><Logo size="sm" /></a>
          <nav className="hidden lg:flex items-center gap-4 text-[11px] text-[var(--ag-muted)]">
            {NAV.map(([id, label]) => <a key={id} href={`#${id}`} className="hover:text-[var(--ag-text)] transition">{label}</a>)}
          </nav>
          <a href="#start" className="ag-btn ag-btn-primary text-xs !py-1.5 !px-4">Start the conversation</a>
        </div>
      </header>
    </>
  );
}

export function FinalTakeaway() {
  return (
    <section className="relative py-32 px-6 text-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0 ag-grid-bg opacity-50" />
      <Reveal className="relative max-w-3xl mx-auto">
        <p className="text-2xl md:text-4xl font-bold leading-tight">
          Rocketship is not acquiring companies.<br />
          <span className="ag-gradient ag-glow">It is building the trusted relationship infrastructure for the aging economy.</span>
        </p>
        <p className="mt-6 text-lg text-[var(--ag-muted)]">Every acquisition strengthens the ecosystem. A rising tide lifts all boats.</p>
        <a href="#start" className="ag-btn ag-btn-primary mt-8 inline-flex">Start the conversation →</a>
      </Reveal>
    </section>
  );
}
