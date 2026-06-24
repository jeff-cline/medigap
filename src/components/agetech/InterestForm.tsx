"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";

const INTERESTS = [
  { key: "investor", label: "Investor / Capital" },
  { key: "private_credit", label: "Private Credit" },
  { key: "strategic", label: "Strategic Partner" },
  { key: "acquisition", label: "Acquisition Target" },
  { key: "family_office", label: "Family Office" },
];

// CTA form → creates a JV CRM lead (tagged jv-pe-vc-op) + appends data via /api/jv,
// then shows a thank-you and routes to the /book founder-calendar page (prefilled).
export default function InterestForm() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", phone: "", org: "", interest: "investor", notes: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim() || (!f.email.trim() && !f.phone.trim())) { setErr("Please add your name and an email or phone."); return; }
    setBusy(true); setErr("");
    const r = await fetch("/api/jv", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: f.name, email: f.email, phone: f.phone, interest: f.interest, source: "R0cketShip AgeTech", notes: `${f.org ? "Org: " + f.org + ". " : ""}${f.notes}` }),
    });
    const d = await r.json().catch(() => ({}));
    if (d.ok) {
      // Saved to the CRM — send them straight to the founder's booking page (prefilled).
      const q = new URLSearchParams({ name: f.name, email: f.email, thanks: "1" }).toString();
      router.push(`/book?${q}`);
      return; // keep the button in "Sending…" through navigation
    }
    setBusy(false);
    setErr(d.error || "Something went wrong — try again.");
  }

  return (
    <div className="ag-panel p-6 md:p-10 max-w-2xl mx-auto relative overflow-hidden">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full" style={{ background: "radial-gradient(circle, rgba(56,225,255,.14), transparent 65%)" }} />
      <motion.form onSubmit={submit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative space-y-4">
        <div>
          <h3 className="text-2xl md:text-3xl font-bold">Start the <span className="ag-gradient">conversation.</span></h3>
          <p className="text-[var(--ag-muted)] mt-2">Tell us a little about you and we&apos;ll take you straight to founder <span className="text-[var(--ag-text)]">Jeff Cline</span>&apos;s calendar.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <input placeholder="Full name *" value={f.name} onChange={set("name")} />
          <input placeholder="Organization" value={f.org} onChange={set("org")} />
          <input placeholder="Email" type="email" value={f.email} onChange={set("email")} />
          <input placeholder="Phone" value={f.phone} onChange={set("phone")} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-[var(--ag-muted)]">I'm interested as a…</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {INTERESTS.map((it) => (
              <button type="button" key={it.key} onClick={() => setF({ ...f, interest: it.key })}
                className={`ag-chip !normal-case !tracking-normal !text-sm transition ${f.interest === it.key ? "!text-[var(--ag-cyan)] !border-[var(--ag-cyan)]" : "hover:!border-[var(--ag-cyan)]/50"}`}>
                {it.label}
              </button>
            ))}
          </div>
        </div>
        <textarea placeholder="What would you like to explore? (optional)" rows={3} value={f.notes}
          onChange={set("notes")} className="ag-root w-full" style={{ background: "var(--ag-bg2)", border: "1px solid var(--ag-border)", borderRadius: 10, padding: ".6rem .7rem", color: "var(--ag-text)" }} />
        {err && <p className="text-sm text-[var(--ag-red)]">{err}</p>}
        <button type="submit" disabled={busy} className="ag-btn ag-btn-primary w-full justify-center !py-3 text-base disabled:opacity-50">
          {busy ? "Saving & opening calendar…" : "Continue to booking →"}
        </button>
        <p className="text-[11px] text-[var(--ag-muted)] text-center">Your details go straight to the founder. No spam, no list.</p>
      </motion.form>
    </div>
  );
}
