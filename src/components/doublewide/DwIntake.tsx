"use client";
import { useState } from "react";

// Dual intake: Brands (want micro-influencer reach) and Creators (want to get paid across
// the network). Both create a lead in the Core CRM via /api/jv (append + founder alert),
// tagged by source so they route to the right follow-up.
type Mode = "brand" | "creator";

export default function DwIntake() {
  const [mode, setMode] = useState<Mode>("creator");
  const [f, setF] = useState({ name: "", email: "", phone: "", handle: "", detail: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim() || (!f.email.trim() && !f.phone.trim())) { setErr("Add your name and an email or phone."); return; }
    setBusy(true); setErr("");
    // Creator attribution: ?ref= on the URL, else the dw_ref cookie (sent automatically).
    const ref = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("ref") || "" : "";
    const r = await fetch("/api/jv", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: f.name, email: f.email, phone: f.phone,
        interest: mode === "brand" ? "advertising" : "creator_partner",
        source: mode === "brand" ? "Doublewide.ai — Brand" : "Doublewide.ai — Creator",
        creatorRef: ref,
        notes: `${mode === "brand" ? "BRAND" : "CREATOR"}. ${f.handle ? "Social: " + f.handle + ". " : ""}${f.detail}`,
      }),
    });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (d.ok) setDone(true); else setErr(d.error || "Something went wrong — try again.");
  }

  if (done) return (
    <div className="dw-card p-8 text-center">
      <div className="text-4xl mb-3">🎉</div>
      <h3 className="text-2xl font-bold">You&apos;re in{f.name ? `, ${f.name.split(" ")[0]}` : ""}.</h3>
      <p className="text-[var(--dw-muted)] mt-2">{mode === "creator" ? "We'll set up your creator account and connect you to paying offers across the network." : "We'll be in touch about putting micro-influencers to work for your brand."}</p>
    </div>
  );

  return (
    <form onSubmit={submit} className="dw-card p-6 md:p-8" id="join">
      <div className="flex rounded-full bg-[var(--dw-bg2)] p-1 mb-6 text-sm font-semibold">
        <button type="button" onClick={() => setMode("creator")} className={`flex-1 rounded-full py-2.5 transition ${mode === "creator" ? "bg-[var(--dw-navy)] text-white" : "text-[var(--dw-muted)]"}`}>I&apos;m a Creator</button>
        <button type="button" onClick={() => setMode("brand")} className={`flex-1 rounded-full py-2.5 transition ${mode === "brand" ? "bg-[var(--dw-navy)] text-white" : "text-[var(--dw-muted)]"}`}>I&apos;m a Brand</button>
      </div>
      <h3 className="text-xl font-bold mb-1">{mode === "creator" ? "Get paid for your audience." : "Put micro-influencers to work."}</h3>
      <p className="text-sm text-[var(--dw-muted)] mb-4">{mode === "creator" ? "Connect your accounts, share offers, earn on every lead and sale across our network." : "Reach engaged audiences through vetted micro-influencers — and track every lead to revenue."}</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <input placeholder="Full name *" value={f.name} onChange={set("name")} />
        <input placeholder={mode === "creator" ? "Primary @handle" : "Company"} value={f.handle} onChange={set("handle")} />
        <input placeholder="Email" type="email" value={f.email} onChange={set("email")} />
        <input placeholder="Phone" value={f.phone} onChange={set("phone")} />
      </div>
      <textarea className="mt-3" rows={2} placeholder={mode === "creator" ? "Platforms & follower counts (optional)" : "What are you promoting? (optional)"} value={f.detail} onChange={set("detail")} />
      {err && <p className="text-sm text-[#c0392b] mt-2">{err}</p>}
      <button type="submit" disabled={busy} className={`dw-btn w-full justify-center mt-4 !py-3.5 ${mode === "creator" ? "dw-btn-green" : "dw-btn-gold"} disabled:opacity-50`}>
        {busy ? "Sending…" : mode === "creator" ? "Join as a Creator →" : "Partner as a Brand →"}
      </button>
      <p className="text-[11px] text-[var(--dw-muted)] text-center mt-3">Powered by the R0cketShip Core · your data is managed securely.</p>
    </form>
  );
}
