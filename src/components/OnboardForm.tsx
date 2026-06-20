"use client";
import { useState } from "react";

const F = "mt-1 w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]";
type Fields = Record<string, string>;

export default function OnboardForm() {
  const [v, setV] = useState<Fields>({ primaryCta: "call", vertical: "medicare" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setV({ ...v, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const r = await fetch("/api/onboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok || d.error) { setErr(d.error || "Something went wrong."); return; }
    setDone(true);
  }

  if (done) return (
    <div className="card glow p-8 text-center max-w-lg mx-auto">
      <div className="text-3xl">🚀</div>
      <h2 className="text-xl font-semibold mt-2">Got it — we&apos;re on it.</h2>
      <p className="text-sm text-[var(--muted)] mt-2">Our team is running deep research on your market and building your custom lead-gen site. We&apos;ll reach out shortly with your login. Keep your domain pointed at the IP you were given.</p>
    </div>
  );

  const Row = ({ children }: { children: React.ReactNode }) => <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
  const Field = ({ k, label, ph, full }: { k: string; label: string; ph?: string; full?: boolean }) => (
    <div className={full ? "sm:col-span-2" : ""}><label className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</label><input className={F} value={v[k] || ""} onChange={set(k)} placeholder={ph} /></div>
  );
  const Area = ({ k, label, ph }: { k: string; label: string; ph?: string }) => (
    <div className="sm:col-span-2"><label className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</label><textarea className={F} rows={2} value={v[k] || ""} onChange={set(k)} placeholder={ph} /></div>
  );

  return (
    <form onSubmit={submit} className="space-y-6 max-w-3xl mx-auto">
      <section className="card p-5"><h3 className="font-semibold mb-3">Your business</h3>
        <Row>
          <Field k="businessName" label="Business name" ph="Acme Senior Insurance" />
          <Field k="website" label="Current website" ph="acmesenior.com" />
          <Field k="contactName" label="Your name" />
          <Field k="email" label="Email" ph="you@business.com" />
          <Field k="phone" label="Phone" />
          <div><label className="text-xs uppercase tracking-wide text-[var(--muted)]">Vertical</label>
            <select className={F} value={v.vertical} onChange={set("vertical")}><option value="medicare">Medicare / Medigap</option><option value="medicare_advantage">Medicare Advantage</option><option value="life">Life / Final Expense</option><option value="housing">Senior Housing</option><option value="care">Senior Care</option></select></div>
        </Row>
      </section>

      <section className="card p-5"><h3 className="font-semibold mb-3">What you sell & who you serve</h3>
        <Row>
          <Area k="services" label="Products / services you sell" ph="Medigap Plan G & N, Medicare Advantage, dental/vision/hearing add-ons" />
          <Area k="audience" label="Your ideal customer" ph="Seniors 64-75 turning 65, snowbirds, T65 shoppers" />
          <Area k="usp" label="What makes you different (USP)" ph="Local agents, same-day enrollment, 4.9★ service" />
          <Area k="competitors" label="Main competitors" />
        </Row>
      </section>

      <section className="card p-5"><h3 className="font-semibold mb-3">Geography & territory</h3>
        <Field k="geography" label="States / regions you serve" ph="Arizona, Nevada" full />
        <Area k="territoryZips" label="ZIP codes you want to KEEP (leads only you see)" ph="85001, 85003, 85013…" />
        <Area k="unwantedLeads" label="Leads you DON'T want (we affiliate these for you — you earn rev-share)" ph="Out-of-state, under-65, Advantage-only, peptide/DME callers…" />
      </section>

      <section className="card p-5"><h3 className="font-semibold mb-3">Brand & calls to action</h3>
        <Row>
          <Field k="hostname" label="Desired domain" ph="acme-medigap.com (point it at the IP)" />
          <Field k="brandColors" label="Brand colors (hex)" ph="#0b5, #1e63d6" />
          <Field k="logoUrl" label="Logo URL (optional)" />
          <div><label className="text-xs uppercase tracking-wide text-[var(--muted)]">Primary call to action</label>
            <select className={F} value={v.primaryCta} onChange={set("primaryCta")}><option value="call">Click-to-call</option><option value="form">Lead form</option></select></div>
          <Area k="moneyWords" label="Money words / hot topics to emphasize" ph="incontinence, hearing aids, dental, diabetic supplies" />
          <Area k="notes" label="Anything else we should know" />
        </Row>
      </section>

      {err && <p className="text-sm text-[var(--danger)]">{err}</p>}
      <button disabled={busy || !v.businessName} className="btn btn-brand w-full justify-center">{busy ? "Submitting…" : "Build my lead-gen site →"}</button>
      <p className="text-xs text-[var(--muted)] text-center">By submitting you agree to the affiliate revenue-share for overflow leads, set in your partner agreement.</p>
    </form>
  );
}
