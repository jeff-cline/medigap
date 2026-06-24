"use client";
import { motion, AnimatePresence } from "framer-motion";
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
  const [done, setDone] = useState(false);
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
    setBusy(false);
    if (d.ok) setDone(true);
    else setErr(d.error || "Something went wrong — try again.");
  }

  function book() {
    const q = new URLSearchParams({ name: f.name, email: f.email }).toString();
    router.push(`/book?${q}`);
  }

  return (
    <div className="ag-panel p-6 md:p-10 max-w-2xl mx-auto relative overflow-hidden">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full" style={{ background: "radial-gradient(circle, rgba(56,225,255,.14), transparent 65%)" }} />
      <AnimatePresence mode="wait">
        {!done ? (
          <motion.form key="form" onSubmit={submit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }} className="relative space-y-4">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold">Start the <span className="ag-gradient">conversation.</span></h3>
              <p className="text-[var(--ag-muted)] mt-2">Tell us a little about you and we&apos;ll set up time with founder <span className="text-[var(--ag-text)]">Jeff Cline</span>.</p>
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
              {busy ? "Sending…" : "Request a conversation →"}
            </button>
            <p className="text-[11px] text-[var(--ag-muted)] text-center">Your details go straight to the founder. No spam, no list.</p>
          </motion.form>
        ) : (
          <motion.div key="thanks" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="relative text-center py-6">
            <div className="text-5xl mb-3">🚀</div>
            <h3 className="text-2xl md:text-3xl font-bold">Thanks for your interest{f.name ? `, ${f.name.split(" ")[0]}` : ""}.</h3>
            <p className="text-[var(--ag-muted)] mt-2 max-w-md mx-auto">You&apos;re in. The fastest next step is to grab time directly with Jeff — pick a slot that works for you.</p>
            <button onClick={book} className="ag-btn ag-btn-primary mt-6 !py-3 px-8 text-base">📅 Book a call with the founder →</button>
            <div className="mt-3"><a href="/book" className="text-xs text-[var(--ag-muted)] underline">or open the calendar</a></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
