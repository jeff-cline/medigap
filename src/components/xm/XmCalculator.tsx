"use client";
import { useState } from "react";

const R = "#e11d2a";
const money = (n: number) => "$" + Math.round(n).toLocaleString();
const num = (n: number) => Math.round(n).toLocaleString();

type Proposal = { name: string; markets: number; budget: number; targetEyeballs: number; cost: number; cpm: number; affordableReach: number; perMarketEyeballs: number; recommended: string[]; disclaimer: string };

export default function XmCalculator() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [budget, setBudget] = useState(500000);
  const [markets, setMarkets] = useState(10);
  const [eyeballs, setEyeballs] = useState(15000000);
  const [f, setF] = useState({ name: "", email: "", phone: "", website: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [p, setP] = useState<Proposal | null>(null);

  const liveCost = Math.round((eyeballs / 1000) * 33);

  async function submit() {
    if (!f.name.trim() || !f.email.trim() || !f.phone.trim() || !f.website.trim()) { setErr("All fields are required to generate your proposal."); return; }
    setBusy(true); setErr("");
    const r = await fetch("/api/xm/lead", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...f, kind: "calculator", budget, markets, eyeballs }) }).then((x) => x.json()).catch(() => ({}));
    setBusy(false);
    if (r.ok && r.proposal) { setP(r.proposal); setStep(3); } else setErr(r.error || "Something went wrong.");
  }

  const inputC = "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-[color:var(--red,#e11d2a)]";

  if (step === 3 && p) {
    return (
      <div className="rounded-2xl border border-white/15 bg-white text-black p-8 print:p-0">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-widest" style={{ color: R }}>Custom Experiential Proposal</div>
          <button onClick={() => window.print()} className="rounded-full px-4 py-2 text-sm font-bold text-white print:hidden" style={{ background: R }}>⤓ Download / Print</button>
        </div>
        <h3 className="mt-2 text-3xl font-black">Prepared for {p.name || "your brand"}</h3>
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[["Target reach", num(p.targetEyeballs) + " eyeballs"], ["Markets", num(p.markets)], ["Per market", num(p.perMarketEyeballs)], ["Est. investment", money(p.cost)]].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-neutral-100 p-4"><div className="text-[11px] uppercase tracking-wide text-neutral-500">{l}</div><div className="text-xl font-black">{v}</div></div>
          ))}
        </div>
        <p className="mt-4 text-sm text-neutral-600">Priced at <b>${p.cpm} per 1,000 eyeballs</b>. {p.budget ? <>Your <b>{money(p.budget)}</b> budget supports roughly <b>{num(p.affordableReach)}</b> eyeballs.</> : null}</p>
        <div className="mt-6">
          <div className="text-sm font-bold">What we could activate to hit your KPIs</div>
          <ul className="mt-2 grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            {p.recommended.map((a) => <li key={a} className="flex gap-2"><span style={{ color: R }}>▪</span>{a}</li>)}
          </ul>
        </div>
        <p className="mt-6 text-[11px] text-neutral-500 border-t pt-4">{p.disclaimer}</p>
        <p className="mt-1 text-[11px] text-neutral-400">Experiential Marketing (XM) · experientialmarketing.ai · A R0cketShip partner.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-6 sm:p-8">
      {step === 1 && (
        <>
          <div className="grid gap-5 sm:grid-cols-3">
            <label className="text-sm text-white/70">Your budget<div className="mt-1 flex items-center rounded-xl border border-white/15 bg-white/5 px-3"><span className="text-white/40">$</span><input type="number" value={budget} onChange={(e) => setBudget(+e.target.value)} className="w-full bg-transparent px-2 py-3 text-white outline-none" /></div></label>
            <label className="text-sm text-white/70">How many markets<input type="number" value={markets} onChange={(e) => setMarkets(+e.target.value)} className={inputC + " mt-1"} /></label>
            <label className="text-sm text-white/70">Eyeballs to reach<input type="number" value={eyeballs} onChange={(e) => setEyeballs(+e.target.value)} className={inputC + " mt-1"} /></label>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="text-white/70 text-sm">Est. at $33 / 1,000 eyeballs: <span className="text-2xl font-black text-white">{money(liveCost)}</span></div>
            <button onClick={() => setStep(2)} className="rounded-full px-7 py-3 font-bold text-white" style={{ background: R }}>Get my custom proposal →</button>
          </div>
        </>
      )}
      {step === 2 && (
        <>
          <div className="text-xs font-bold uppercase tracking-widest" style={{ color: R }}>One step left</div>
          <h3 className="mt-1 text-2xl font-black text-white">Where should we send your proposal?</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <input placeholder="Full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputC} />
            <input placeholder="Work email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={inputC} />
            <input placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className={inputC} />
            <input placeholder="Website" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} className={inputC} />
          </div>
          {err && <div className="mt-3 text-sm text-red-400">{err}</div>}
          <div className="mt-5 flex items-center gap-3">
            <button onClick={submit} disabled={busy} className="rounded-full px-7 py-3 font-bold text-white" style={{ background: R }}>{busy ? "Generating…" : "Generate proposal ↓"}</button>
            <button onClick={() => setStep(1)} className="text-white/50 text-sm hover:text-white">← Back</button>
          </div>
        </>
      )}
    </div>
  );
}
