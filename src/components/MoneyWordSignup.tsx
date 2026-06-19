"use client";
import { useState } from "react";

export default function MoneyWordSignup({ word }: { word: string }) {
  const [email, setEmail] = useState("");
  const [scope, setScope] = useState("zip");
  const [scopeValue, setScopeValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ tempPassword: string; email: string; demoLeadId: string | null } | null>(null);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const r = await fetch("/api/money-word-signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, word, scope, scopeValue }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok || d.error) { setErr(d.error || "Something went wrong."); return; }
    setDone(d);
  }

  if (done) return (
    <div className="card p-6 glow">
      <div className="text-2xl">✅</div>
      <h3 className="mt-2 text-lg font-semibold">You&apos;ve claimed “{word}”!</h3>
      <p className="text-sm text-[var(--muted)] mt-1">Account created for <b>{done.email}</b>. Log in with temporary password <b>{done.tempPassword}</b>, add funds, and switch on to start receiving hot-transfer calls.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a href="/login" className="btn btn-brand text-sm">Log in to my portal →</a>
        {done.demoLeadId && <a href={`/dashboard/leads/${done.demoLeadId}`} className="btn btn-ghost text-sm">🎁 See my free demo lead</a>}
      </div>
    </div>
  );

  return (
    <form onSubmit={submit} className="card p-6 glow">
      <div className="font-semibold">Claim “{word}” in your area</div>
      <p className="text-xs text-[var(--muted)] mt-1 mb-4">Start receiving live hot-transfer calls for this money word.</p>
      <label className="text-xs text-[var(--muted)]">Email</label>
      <input className="mb-3 mt-1" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-[var(--muted)]">Coverage</label>
          <select className="mt-1" value={scope} onChange={(e) => { setScope(e.target.value); setScopeValue(""); }}><option value="zip">ZIP</option><option value="state">State</option><option value="national">Nationwide</option></select>
        </div>
        <div>
          <label className="text-xs text-[var(--muted)]">{scope === "state" ? "State (TX)" : scope === "national" ? "All 50 states" : "ZIP / City"}</label>
          <input className="mt-1" disabled={scope === "national"} value={scopeValue} onChange={(e) => setScopeValue(e.target.value)} placeholder={scope === "state" ? "TX" : "78701"} />
        </div>
      </div>
      {err && <p className="text-sm text-[var(--danger)] mt-3">{err}</p>}
      <button disabled={busy} className="btn btn-brand w-full mt-4 justify-center">{busy ? "Claiming…" : "Get the next hot-transfer call →"}</button>
    </form>
  );
}
