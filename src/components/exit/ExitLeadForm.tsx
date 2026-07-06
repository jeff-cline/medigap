"use client";
import { useState } from "react";
import { EXIT } from "@/lib/exit";

// Lead form — sits on top of the Core. Submissions attach to the exitoptimization.com Site
// so leads flow into the Core CRM.
export default function ExitLeadForm({ compact = false }: { compact?: boolean }) {
  const [f, setF] = useState({ name: "", email: "", phone: "", company: "", revenue: "" });
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");
  const inp = "w-full rounded-md border bg-black/30 px-3 py-2.5 text-white placeholder:text-slate-500 outline-none focus:border-[color:var(--orange,#f97316)]";

  async function submit() {
    if (!f.name.trim() || !f.email.trim()) { setErr("Name and email are required."); return; }
    setBusy(true); setErr("");
    const r = await fetch("/api/exit/lead", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) }).then((x) => x.json()).catch(() => ({}));
    setBusy(false);
    if (r.ok) setOk(true); else setErr(r.error || "Something went wrong.");
  }

  if (ok) return <div className="rounded-xl border p-6 text-center" style={{ borderColor: EXIT.colors.border }}><div className="text-3xl">✅</div><div className="mt-2 text-lg font-bold text-white">Request received.</div><p className="text-slate-400 mt-1">We'll reach out shortly — or <a href="/book" className="underline" style={{ color: EXIT.colors.orange3 }}>book a time now</a>.</p></div>;

  return (
    <div className="rounded-xl border p-5" style={{ borderColor: EXIT.colors.border, background: "#0b1220" }}>
      {!compact && <div className="text-sm font-bold text-white mb-3">Get a free exit assessment</div>}
      <div className="grid gap-2.5 sm:grid-cols-2" style={{ ["--orange" as string]: EXIT.colors.orange }}>
        <input placeholder="Full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inp} />
        <input placeholder="Work email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={inp} />
        <input placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className={inp} />
        <input placeholder="Company" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} className={inp} />
        <input placeholder="Annual revenue (optional)" value={f.revenue} onChange={(e) => setF({ ...f, revenue: e.target.value })} className={`${inp} sm:col-span-2`} />
      </div>
      {err && <div className="mt-2 text-sm text-red-400">{err}</div>}
      <button onClick={submit} disabled={busy} className="mt-3 w-full rounded-md px-5 py-3 font-bold" style={{ background: EXIT.colors.orange, color: EXIT.colors.bg }}>{busy ? "Sending…" : "Book a free consultation →"}</button>
      <p className="mt-2 text-[11px] text-slate-500 text-center">Free · No pressure · We'll show you how to multiply your exit.</p>
    </div>
  );
}
