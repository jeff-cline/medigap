"use client";
import { useState } from "react";

const R = "#e11d2a";

export default function XmLeadForm({ kind, cta, done }: { kind: string; cta: string; done: string }) {
  const [f, setF] = useState({ name: "", email: "", phone: "", website: "" });
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");
  const inputC = "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/40";

  async function submit() {
    if (!f.name.trim() || !f.email.trim()) { setErr("Name and email are required."); return; }
    setBusy(true); setErr("");
    const r = await fetch("/api/xm/lead", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...f, kind }) }).then((x) => x.json()).catch(() => ({}));
    setBusy(false);
    if (r.ok) setOk(true); else setErr(r.error || "Something went wrong.");
  }

  if (ok) return <div className="rounded-2xl border border-white/15 bg-white/5 p-8 text-center"><div className="text-4xl">✅</div><div className="mt-2 text-xl font-black text-white">{done}</div><p className="text-white/60 mt-1">We'll be in touch shortly.</p></div>;

  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-6 sm:p-8">
      <div className="grid gap-3 sm:grid-cols-2">
        <input placeholder="Full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputC} />
        <input placeholder="Work email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={inputC} />
        <input placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className={inputC} />
        <input placeholder="Website" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} className={inputC} />
      </div>
      {err && <div className="mt-3 text-sm text-red-400">{err}</div>}
      <button onClick={submit} disabled={busy} className="mt-5 rounded-full px-7 py-3 font-bold text-white" style={{ background: R }}>{busy ? "Sending…" : cta}</button>
    </div>
  );
}
