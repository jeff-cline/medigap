"use client";
import { useState } from "react";
import { EXIT } from "@/lib/exit";

const O = EXIT.colors.orange;
const CATS = [["service", "Service partner"], ["advertiser", "Advertiser"], ["adjacent", "Adjacent business"]];

export default function PartnerSignupForm() {
  const [v, setV] = useState<Record<string, string>>({ category: "advertiser" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const inp = "w-full rounded-md border bg-black/30 px-3 py-2.5 text-white placeholder:text-slate-500 outline-none focus:border-[color:var(--orange)]";
  const set = (k: string, val: string) => setV((s) => ({ ...s, [k]: val }));

  async function submit() {
    if (!v.name?.trim() || !v.businessName?.trim() || !v.email?.trim() || (v.password || "").length < 6) { setErr("Contact name, business, email, and a 6+ char password are required."); return; }
    setBusy(true); setErr("");
    const r = await fetch("/api/exit/partner-signup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(v) }).then((x) => x.json()).catch(() => ({}));
    setBusy(false);
    if (r.ok) window.location.href = "/account"; else setErr(r.error || "Could not sign up.");
  }

  return (
    <div className="rounded-2xl border p-6" style={{ borderColor: EXIT.colors.border, background: EXIT.colors.panel, ["--orange" as string]: O }}>
      <div className="text-sm font-bold text-white mb-1">Create your partner account</div>
      <p className="text-xs text-slate-400 mb-3">Set up your account now — you'll add your ad (title, description, link &amp; image) from <b>Manage Ads</b> after you log in.</p>
      <div className="grid gap-2.5 sm:grid-cols-2">
        <input placeholder="Contact name" value={v.name || ""} onChange={(e) => set("name", e.target.value)} className={inp} />
        <input placeholder="Business name" value={v.businessName || ""} onChange={(e) => set("businessName", e.target.value)} className={inp} />
        <input placeholder="Email" value={v.email || ""} onChange={(e) => set("email", e.target.value)} className={inp} />
        <input placeholder="Phone" value={v.phone || ""} onChange={(e) => set("phone", e.target.value)} className={inp} />
        <select value={v.category} onChange={(e) => set("category", e.target.value)} className={inp}>{CATS.map(([val, l]) => <option key={val} value={val}>{l}</option>)}</select>
        <input type="password" placeholder="Create a password" value={v.password || ""} onChange={(e) => set("password", e.target.value)} className={inp} />
      </div>
      {err && <div className="mt-2 text-sm text-red-400">{err}</div>}
      <button onClick={submit} disabled={busy} className="mt-4 w-full rounded-md px-5 py-3 font-bold" style={{ background: O, color: EXIT.colors.bg }}>{busy ? "Creating…" : "Create account →"}</button>
      <p className="mt-2 text-[11px] text-slate-500 text-center">Already a partner? <a href="/login" className="underline">Log in</a></p>
    </div>
  );
}
