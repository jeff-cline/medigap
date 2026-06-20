"use client";
import { useState } from "react";

const F = "mt-1 w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]";
type Fields = Record<string, string>;

export default function OnboardForm() {
  const [v, setV] = useState<Fields>({ primaryCta: "call", vertical: "medicare" });
  const [customVertical, setCustomVertical] = useState("");
  const [siteType, setSiteType] = useState("subdomain");
  const [domain, setDomain] = useState("");
  const [color, setColor] = useState("#16d6a5");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setV({ ...v, [k]: e.target.value });

  function addColor() {
    const list = (v.brandColors || "").split(/[\s,]+/).filter(Boolean);
    if (!list.includes(color)) setV({ ...v, brandColors: [...list, color].join(", ") });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const hostname = siteType === "subdomain" ? `${domain.replace(/[^a-z0-9-]/gi, "").toLowerCase()}.medigap.plus` : domain.trim().toLowerCase();
    const vertical = v.vertical === "__add" ? customVertical.trim().toLowerCase().replace(/\s+/g, "_") : v.vertical;
    const r = await fetch("/api/onboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...v, vertical, hostname, siteType }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok || d.error) { setErr(d.error || "Something went wrong."); return; }
    setDone(true);
  }

  if (done) return (
    <div className="card glow p-8 text-center max-w-lg mx-auto">
      <div className="text-3xl">🚀</div>
      <h2 className="text-xl font-semibold mt-2">Got it — we&apos;re on it.</h2>
      <p className="text-sm text-[var(--muted)] mt-2">We&apos;re running deep research on your market and building your custom lead-gen site. We&apos;ll email your login. {siteType === "subdomain" ? "Your subdomain will be provisioned automatically." : "Point your domain's A/CNAME record to the IP you were given."}</p>
    </div>
  );

  const Field = ({ k, label, ph, full }: { k: string; label: string; ph?: string; full?: boolean }) => (
    <div className={full ? "sm:col-span-2" : ""}><label className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</label><input className={F} value={v[k] || ""} onChange={set(k)} placeholder={ph} /></div>
  );
  const Area = ({ k, label, ph }: { k: string; label: string; ph?: string }) => (
    <div className="sm:col-span-2"><label className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</label><textarea className={F} rows={2} value={v[k] || ""} onChange={set(k)} placeholder={ph} /></div>
  );

  return (
    <form onSubmit={submit} className="space-y-6 max-w-3xl mx-auto">
      <section className="card p-5"><h3 className="font-semibold mb-3">Your business</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field k="businessName" label="Business name" ph="Acme Senior Insurance" />
          <Field k="website" label="Current website" ph="acmesenior.com" />
          <Field k="contactName" label="Your name" />
          <Field k="email" label="Email" ph="you@business.com" />
          <Field k="phone" label="Phone" />
          <div><label className="text-xs uppercase tracking-wide text-[var(--muted)]">Vertical</label>
            <select className={F} value={v.vertical} onChange={set("vertical")}>
              <option value="medicare">Medicare / Medigap</option><option value="medicare_advantage">Medicare Advantage</option><option value="life">Life / Final Expense</option><option value="housing">Senior Housing</option><option value="care">Senior Care</option>
              <option value="__add">+ Add a vertical…</option>
            </select>
            {v.vertical === "__add" && <input className={F + " mt-2"} value={customVertical} onChange={(e) => setCustomVertical(e.target.value)} placeholder="e.g. Dental, Hearing, Solar — used network-wide" />}
          </div>
        </div>
      </section>

      <section className="card p-5"><h3 className="font-semibold mb-3">Site & domain</h3>
        <div className="flex gap-2 mb-3">
          <button type="button" onClick={() => setSiteType("subdomain")} className={`btn text-xs !py-1.5 ${siteType === "subdomain" ? "btn-brand" : "btn-ghost"}`}>Subdomain (we host it)</button>
          <button type="button" onClick={() => setSiteType("whole")} className={`btn text-xs !py-1.5 ${siteType === "whole" ? "btn-brand" : "btn-ghost"}`}>Whole site (my own domain)</button>
        </div>
        {siteType === "subdomain" ? (
          <div className="flex items-center gap-2">
            <input className={F + " !mt-0"} value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="yourbrand" />
            <span className="text-sm text-[var(--muted)]">.medigap.plus</span>
          </div>
        ) : (
          <><input className={F} value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="yourbrand.com" />
            <p className="text-xs text-[var(--muted)] mt-2">On submit we&apos;ll give you the A/CNAME record to point at our server IP so it&apos;s fully branded.</p></>
        )}
      </section>

      <section className="card p-5"><h3 className="font-semibold mb-3">What you sell & who you serve</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Area k="services" label="Products / services you sell" ph="Medigap Plan G & N, MA, DVH add-ons" />
          <Area k="audience" label="Your ideal customer" ph="Seniors 64-75 turning 65, snowbirds" />
          <Area k="usp" label="What makes you different" ph="Local agents, same-day enrollment, 4.9★" />
          <Area k="competitors" label="Main competitors" />
        </div>
      </section>

      <section className="card p-5"><h3 className="font-semibold mb-3">Geography & territory</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field k="geography" label="States / regions you serve" ph="Arizona, Nevada" full />
          <Area k="territoryZips" label="ZIP codes you want to KEEP (leads only you see)" ph="85001, 85003…" />
          <Area k="unwantedLeads" label="Leads you DON'T want (we affiliate these — you earn rev-share)" ph="Out-of-state, under-65, DME callers…" />
        </div>
      </section>

      <section className="card p-5"><h3 className="font-semibold mb-3">Brand & calls to action</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field k="logoUrl" label="Logo URL (or upload later in your portal)" />
          <div><label className="text-xs uppercase tracking-wide text-[var(--muted)]">Brand color</label>
            <div className="flex items-center gap-2 mt-1"><input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-12 rounded bg-transparent border border-[var(--border)]" /><button type="button" onClick={addColor} className="btn btn-ghost text-xs !py-1.5">+ Add color</button><span className="text-xs text-[var(--muted)] font-mono">{v.brandColors || "none yet"}</span></div></div>
          <div><label className="text-xs uppercase tracking-wide text-[var(--muted)]">Primary CTA</label>
            <select className={F} value={v.primaryCta} onChange={set("primaryCta")}><option value="call">Click-to-call</option><option value="form">Lead form</option></select></div>
          <Area k="moneyWords" label="Money words to emphasize" ph="incontinence, hearing aids, dental" />
          <Area k="notes" label="Anything else we should know" />
        </div>
      </section>

      {err && <p className="text-sm text-[var(--danger)]">{err}</p>}
      <button disabled={busy || !v.businessName} className="btn btn-brand w-full justify-center">{busy ? "Submitting…" : "Build my lead-gen site →"}</button>
      <p className="text-xs text-[var(--muted)] text-center">By submitting you agree to the affiliate revenue-share for overflow leads, set in your partner agreement.</p>
    </form>
  );
}
