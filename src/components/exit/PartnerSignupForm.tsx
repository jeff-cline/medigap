"use client";
import { useState } from "react";
import { EXIT } from "@/lib/exit";

const O = EXIT.colors.orange;
const CATS = [["service", "Service partner"], ["advertiser", "Advertiser"], ["adjacent", "Adjacent business"]];

export default function PartnerSignupForm() {
  const [v, setV] = useState<Record<string, string>>({ category: "advertiser", adCtaLabel: "Learn more" });
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const inp = "w-full rounded-md border bg-black/30 px-3 py-2.5 text-white placeholder:text-slate-500 outline-none focus:border-[color:var(--orange)]";
  const set = (k: string, val: string) => setV((s) => ({ ...s, [k]: val }));

  async function upload(file: File) { setBusy("up"); const fd = new FormData(); fd.append("file", file); const r = await fetch("/api/upload", { method: "POST", body: fd }).then((x) => x.json()).catch(() => ({})); setBusy(""); if (r.url) set("adImageUrl", r.url); }
  async function submit() {
    if (!v.name?.trim() || !v.businessName?.trim() || !v.email?.trim() || (v.password || "").length < 6) { setErr("Contact name, business, email, and a 6+ char password are required."); return; }
    setBusy("go"); setErr("");
    const r = await fetch("/api/exit/partner-signup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(v) }).then((x) => x.json()).catch(() => ({}));
    setBusy("");
    if (r.ok) window.location.href = "/account"; else setErr(r.error || "Could not sign up.");
  }

  return (
    <div className="rounded-2xl border p-6" style={{ borderColor: EXIT.colors.border, background: EXIT.colors.panel, ["--orange" as string]: O }}>
      <div className="text-sm font-bold text-white mb-1">Your business</div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        <input placeholder="Contact name" value={v.name || ""} onChange={(e) => set("name", e.target.value)} className={inp} />
        <input placeholder="Business name" value={v.businessName || ""} onChange={(e) => set("businessName", e.target.value)} className={inp} />
        <input placeholder="Email" value={v.email || ""} onChange={(e) => set("email", e.target.value)} className={inp} />
        <input placeholder="Phone" value={v.phone || ""} onChange={(e) => set("phone", e.target.value)} className={inp} />
        <select value={v.category} onChange={(e) => set("category", e.target.value)} className={inp}>{CATS.map(([val, l]) => <option key={val} value={val}>{l}</option>)}</select>
        <input type="password" placeholder="Create a password" value={v.password || ""} onChange={(e) => set("password", e.target.value)} className={inp} />
      </div>
      <div className="text-sm font-bold text-white mt-4 mb-1">Your ad</div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        <input placeholder="Ad title" value={v.adTitle || ""} onChange={(e) => set("adTitle", e.target.value)} className={inp} />
        <input placeholder="CTA button label" value={v.adCtaLabel || ""} onChange={(e) => set("adCtaLabel", e.target.value)} className={inp} />
        <input placeholder="Ad description" value={v.adDescription || ""} onChange={(e) => set("adDescription", e.target.value)} className={inp + " sm:col-span-2"} />
        <input placeholder="Link to your site (the CTA)" value={v.adUrl || ""} onChange={(e) => set("adUrl", e.target.value)} className={inp + " sm:col-span-2"} />
        <div className="flex items-center gap-2 sm:col-span-2">
          <input placeholder="Ad image URL (or upload →)" value={v.adImageUrl || ""} onChange={(e) => set("adImageUrl", e.target.value)} className={inp} />
          <label className="shrink-0 rounded-md border px-3 py-2.5 text-sm font-bold cursor-pointer" style={{ borderColor: EXIT.colors.border }}>{busy === "up" ? "…" : "⬆ Upload"}<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} /></label>
        </div>
      </div>
      {err && <div className="mt-2 text-sm text-red-400">{err}</div>}
      <button onClick={submit} disabled={!!busy} className="mt-4 w-full rounded-md px-5 py-3 font-bold" style={{ background: O, color: EXIT.colors.bg }}>{busy === "go" ? "Creating…" : "Become a partner →"}</button>
      <p className="mt-2 text-[11px] text-slate-500 text-center">Already a partner? <a href="/login" className="underline">Log in</a></p>
    </div>
  );
}
