"use client";
import { useState } from "react";
import { MEDIGAP } from "@/lib/medigap-brand";

export const PERSONA_LABEL: Record<string, string> = {
  agent: "Agent",
  carrier: "Carrier",
  investor: "Investor",
  network: "Network / Platform",
  strategic: "Strategic Partner",
  advertiser: "Advertiser",
};

const INTERESTS = [
  "I am interested in buying calls",
  "Brand take over",
  "Acquiring brand",
  "Licensing",
  "Strategic Partnership",
  "Advertising",
  "Private Cloud",
];

const BUDGETS = ["$10,000 – $100K", "$100K – $500K", "$500K – $1M", "$1M – $5M", "$5M+"];

export default function OpportunityForm({ persona, onClose }: { persona: string; onClose: () => void }) {
  const label = PERSONA_LABEL[persona] ?? "Partnership";
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // fields
  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [company, setCompany] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [hasSmid, setHasSmid] = useState(false);
  const [smidStates, setSmidStates] = useState("");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState("");

  const toggle = (v: string) => setInterests((a) => (a.includes(v) ? a.filter((x) => x !== v) : [...a, v]));

  async function post(body: Record<string, unknown>) {
    const r = await fetch("/api/opportunity", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || "Something went wrong."); }
  }

  const base = { persona, firstName, lastName, phone, email, website };

  async function submitStep1(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!firstName.trim() || !lastName.trim()) return setErr("Please enter your first and last name.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setErr("Please enter a valid email.");
    setBusy(true);
    try { await post({ ...base, step: "1" }); setStep(2); }
    catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
    finally { setBusy(false); }
  }

  async function submitFinal(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      await post({ ...base, step: "final", company, interests, hasSmid, smidStates, budget, startDate });
      setStep(4);
    } catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
    finally { setBusy(false); }
  }

  const C = MEDIGAP.colors;
  const inputCls = "w-full rounded-xl border px-3 py-2.5 text-base";
  // Force a white field with dark, legible text (some global styles render inputs dark).
  const inputStyle: React.CSSProperties = { borderColor: "#d7dbe2", background: "#ffffff", color: "#111111" };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label={`${label} opportunity`}>
      <div className="w-full max-w-md rounded-3xl bg-white p-5 md:p-7 shadow-2xl max-h-[92vh] overflow-y-auto overflow-x-hidden box-border" style={{ color: C.ink }}>
        <button onClick={onClose} aria-label="Close" className="float-right -mt-2 -mr-1 text-3xl leading-none" style={{ color: C.muted }}>×</button>

        <h2 className="text-xl md:text-2xl font-extrabold tracking-tight pr-6">
          1-800-<span style={{ color: C.gold }}>MEDIGAP</span> · {label}
        </h2>

        {step < 4 && (
          <>
            <p className="mt-2 text-sm" style={{ color: C.muted }}>
              Thank you for your interest in the 1-800-MEDIGAP <b>{label}</b> opportunity. Please complete the following so we can direct your request to the appropriate department.
            </p>
            {/* step dots */}
            <div className="mt-3 flex items-center gap-1.5">
              {[1, 2, 3].map((n) => (
                <span key={n} className="h-1.5 flex-1 rounded-full" style={{ background: n <= step ? C.brand : "#e5e7eb" }} />
              ))}
            </div>
          </>
        )}

        {err && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

        {/* STEP 1 — contact */}
        {step === 1 && (
          <form onSubmit={submitStep1} className="mt-4 grid grid-cols-1 gap-3">
            {/* honeypot */}
            <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }} />
            <div className="grid grid-cols-2 gap-3">
              <input className={inputCls} style={inputStyle} placeholder="First name" value={firstName} onChange={(e) => setFirst(e.target.value)} required />
              <input className={inputCls} style={inputStyle} placeholder="Last name" value={lastName} onChange={(e) => setLast(e.target.value)} required />
            </div>
            <input className={inputCls} style={inputStyle} type="tel" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <input className={inputCls} style={inputStyle} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <button disabled={busy} className="mt-1 rounded-xl px-6 py-3 text-base font-bold text-white disabled:opacity-60" style={{ background: C.brand }}>
              {busy ? "…" : "Continue →"}
            </button>
          </form>
        )}

        {/* STEP 2 — company + interests */}
        {step === 2 && (
          <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="mt-4 grid grid-cols-1 gap-3">
            <input className={inputCls} style={inputStyle} placeholder="Company name" value={company} onChange={(e) => setCompany(e.target.value)} />
            <div>
              <div className="text-sm font-semibold mb-1.5">I am interested in <span style={{ color: C.muted }}>(select all that apply)</span></div>
              <div className="grid grid-cols-1 gap-1.5">
                {INTERESTS.map((it) => (
                  <label key={it} className="flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm cursor-pointer" style={{ borderColor: interests.includes(it) ? C.brand : "#e5e7eb", background: interests.includes(it) ? C.soft : "#fff" }}>
                    <input type="checkbox" checked={interests.includes(it)} onChange={() => toggle(it)} className="h-4 w-4 shrink-0" />
                    <span>{it}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(1)} className="rounded-xl border px-4 py-3 text-base font-semibold" style={{ borderColor: "#d7dbe2" }}>← Back</button>
              <button className="flex-1 rounded-xl px-6 py-3 text-base font-bold text-white" style={{ background: C.brand }}>Continue →</button>
            </div>
          </form>
        )}

        {/* STEP 3 — SMID / budget / start */}
        {step === 3 && (
          <form onSubmit={submitFinal} className="mt-4 grid grid-cols-1 gap-3">
            <label className="flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm cursor-pointer" style={{ borderColor: hasSmid ? C.brand : "#e5e7eb", background: hasSmid ? C.soft : "#fff" }}>
              <input type="checkbox" checked={hasSmid} onChange={(e) => setHasSmid(e.target.checked)} className="h-4 w-4 shrink-0" />
              <span>I have approved SMID for my state(s)</span>
            </label>
            <input className={inputCls} style={inputStyle} placeholder="Which state(s)? e.g. TX, FL, CA" value={smidStates} onChange={(e) => setSmidStates(e.target.value)} />
            <div>
              <div className="text-sm font-semibold mb-1.5">I have a budget of</div>
              <select className={inputCls} style={inputStyle} value={budget} onChange={(e) => setBudget(e.target.value)}>
                <option value="">Select a range…</option>
                {BUDGETS.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </div>
            <div>
              <div className="text-sm font-semibold mb-1.5">I want to start</div>
              <input className={inputCls} style={inputStyle} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(2)} className="rounded-xl border px-4 py-3 text-base font-semibold" style={{ borderColor: "#d7dbe2" }}>← Back</button>
              <button disabled={busy} className="flex-1 rounded-xl px-6 py-3 text-base font-bold text-white disabled:opacity-60" style={{ background: C.brand }}>{busy ? "Sending…" : "Submit →"}</button>
            </div>
          </form>
        )}

        {/* STEP 4 — thank you */}
        {step === 4 && (
          <div className="mt-5 text-center">
            <div className="text-4xl">✅</div>
            <h3 className="mt-2 text-xl font-extrabold">Thank you, {firstName || "and welcome"}!</h3>
            <p className="mt-2 text-sm" style={{ color: C.muted }}>
              Your {label} inquiry is on its way to the right department. A member of our team will reach out shortly.
            </p>
            <a href={`tel:${MEDIGAP.tel}`} className="mt-4 inline-flex items-center gap-2 text-lg font-extrabold" style={{ color: C.brand }}>📞 {MEDIGAP.telDisplay}</a>
            <button onClick={onClose} className="mt-4 block w-full rounded-xl px-6 py-3 text-base font-bold text-white" style={{ background: C.brand }}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
