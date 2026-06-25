"use client";
import { useState } from "react";

// Disruption / "uberize your industry" CTA. Creates a JV CRM lead tagged with the
// referring white-label host (so we can compensate that site owner later), then lands
// the visitor on R0cketShip.com.
export default function PlaybookForm() {
  const [f, setF] = useState({ name: "", email: "", phone: "", market: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim() || (!f.email.trim() && !f.phone.trim())) { setErr("Add your name and an email or phone."); return; }
    setBusy(true); setErr("");
    const host = typeof window !== "undefined" ? window.location.host : "";
    await fetch("/api/jv", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: f.name, email: f.email, phone: f.phone,
        interest: "disrupt",
        source: `Playbook · ${host}`, // tags the referring white-label site for attribution/payouts
        notes: `DISRUPT / Playbook. ${f.market ? "Market: " + f.market + ". " : ""}${f.message}`,
      }),
    }).catch(() => {});
    // Land them on R0cketShip.com (the movement's home).
    window.location.href = "https://r0cketship.com";
  }

  return (
    <form onSubmit={submit} className="card p-6 md:p-8" id="join">
      <h3 className="text-2xl font-bold">Join the movement.</h3>
      <p className="text-sm text-[var(--muted)] mt-1 mb-4">Tell us your market. We&apos;ll show you how to uberize it on the Core.</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <input placeholder="Full name *" value={f.name} onChange={set("name")} />
        <input placeholder="Your market / industry" value={f.market} onChange={set("market")} />
        <input placeholder="Email" type="email" value={f.email} onChange={set("email")} />
        <input placeholder="Phone" value={f.phone} onChange={set("phone")} />
      </div>
      <textarea className="mt-3" rows={2} placeholder="What would you disrupt? (optional)" value={f.message} onChange={set("message")} />
      {err && <p className="text-sm text-[var(--danger)] mt-2">{err}</p>}
      <button type="submit" disabled={busy} className="btn btn-brand w-full justify-center mt-4 text-base !py-3 disabled:opacity-50">
        {busy ? "Joining…" : "Are you ready to disrupt your market? →"}
      </button>
      <p className="text-[11px] text-[var(--muted)] text-center mt-3">Powered by the R0cketShip Core.</p>
    </form>
  );
}
