"use client";
import { useState } from "react";
import { AUDIENCES, PILLARS, TIERS, TECH, PROOF, CREDENTIALS } from "@/lib/secretweapon";
import SecretWeaponCalc from "./SecretWeaponCalc";

export default function SecretWeapon() {
  const [ai, setAi] = useState(0);
  const a = AUDIENCES[ai];
  const groups = [...new Set(TIERS.map((t) => t.group))];

  return (
    <div>
      {/* audience tabs */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {AUDIENCES.map((aud, i) => (
          <button key={aud.key} onClick={() => setAi(i)} className={`text-sm px-4 py-2 rounded-full border transition ${i === ai ? "btn-brand !border-transparent" : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"}`}>{aud.label}</button>
        ))}
      </div>

      {/* audience framing */}
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-extrabold leading-tight">{a.headline}</h2>
        <p className="mt-4 text-lg text-[var(--muted)]">{a.lead}</p>
        <div className="mt-8 grid sm:grid-cols-2 gap-4 text-left">
          <div className="card p-5"><div className="text-xs uppercase tracking-widest text-[var(--danger)] mb-2">The problem</div><ul className="space-y-1.5 text-sm">{a.pains.map((p) => <li key={p} className="flex gap-2"><span className="text-[var(--danger)]">×</span>{p}</li>)}</ul></div>
          <div className="card p-5"><div className="text-xs uppercase tracking-widest text-[var(--brand)] mb-2">The secret weapon</div><ul className="space-y-1.5 text-sm">{a.wins.map((w) => <li key={w} className="flex gap-2"><span className="text-[var(--brand)]">✓</span>{w}</li>)}</ul></div>
        </div>
        <a href="#apply" className="btn btn-brand text-base mt-8">Apply for the Secret Weapon →</a>
      </div>

      {/* four pillars */}
      <Section title="The four pillars" sub="Krystalore Crews — your executive advisor.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map(([n, t, d]) => (
            <div key={n} className="card p-5"><div className="text-2xl font-extrabold text-gradient">{n}</div><div className="font-semibold mt-1">{t}</div><div className="text-sm text-[var(--muted)] mt-1">{d}</div></div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 justify-center mt-6">{CREDENTIALS.map((c) => <span key={c} className="text-[11px] rounded-full border border-[var(--border)] px-2.5 py-1 text-[var(--muted)]">{c}</span>)}</div>
      </Section>

      {/* amplify / tech */}
      <Section title="Activate + Amplify" sub="Your idea, amplified by proprietary growth technology.">
        <div className="grid gap-4 sm:grid-cols-3">
          {TECH.map(([t, d]) => (
            <div key={t} className="card p-5"><div className="font-bold text-gradient">{t}</div><div className="text-sm text-[var(--muted)] mt-1">{d}</div></div>
          ))}
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-6">
          {PROOF.map(([v, l]) => (
            <div key={l} className="text-center"><div className="text-2xl font-extrabold text-gradient">{v}</div><div className="text-[10px] text-[var(--muted)] leading-tight mt-1">{l}</div></div>
          ))}
        </div>
      </Section>

      {/* calculator */}
      <Section title="The Secret Weapon Calculator" sub="We invest to double your revenue — then double it again. See the math on your numbers.">
        <SecretWeaponCalc />
      </Section>

      {/* investment tiers */}
      <Section title="Investment" sub="One package: everything Krystalore brings, everything the growth stack brings.">
        <div className="space-y-6">
          {groups.map((g) => (
            <div key={g}>
              <div className="text-xs uppercase tracking-widest text-[var(--muted)] mb-2">{g}</div>
              <div className="grid gap-3 sm:grid-cols-3">
                {TIERS.filter((t) => t.group === g).map((t) => (
                  <div key={t.name} className={`card p-5 ${t.star ? "ring-1 ring-[var(--brand)]" : ""}`}>
                    {t.star && <div className="text-[10px] font-bold text-[var(--brand)] mb-1">★ RECOMMENDED</div>}
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-2xl font-extrabold text-gradient mt-1">{t.price}</div>
                    <div className="text-xs text-[var(--muted)] mt-1">{t.note}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* apply */}
      <div id="apply" className="max-w-2xl mx-auto mt-20">
        <div className="text-center mb-6"><h2 className="text-3xl md:text-4xl font-bold">By <span className="text-gradient">application only.</span></h2><p className="mt-3 text-[var(--muted)]">We take a handful of players who are ready to double. Tell us about you.</p></div>
        <ApplyForm audienceLabel={a.label} />
      </div>
    </div>
  );
}

function Section({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="mt-20">
      <div className="text-center max-w-2xl mx-auto mb-8"><h3 className="text-2xl md:text-3xl font-bold">{title}</h3><p className="mt-2 text-[var(--muted)]">{sub}</p></div>
      {children}
    </section>
  );
}

function ApplyForm({ audienceLabel }: { audienceLabel: string }) {
  const [f, setF] = useState({ name: "", email: "", phone: "", revenue: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim() || (!f.email.trim() && !f.phone.trim())) { setErr("Add your name and an email or phone."); return; }
    setBusy(true); setErr("");
    const host = typeof window !== "undefined" ? window.location.host : "";
    const r = await fetch("/api/jv", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      name: f.name, email: f.email, phone: f.phone, interest: "secret_weapon",
      source: `Secret Weapon · ${host} · ${audienceLabel}`,
      notes: `SECRET WEAPON (${audienceLabel}). ${f.revenue ? "Revenue: " + f.revenue + ". " : ""}${f.message}`,
    }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (d.ok) setDone(true); else setErr(d.error || "Something went wrong — try again.");
  }

  if (done) return <div className="card p-8 text-center"><div className="text-4xl mb-3">🗝️</div><h3 className="text-2xl font-bold">Application received{f.name ? `, ${f.name.split(" ")[0]}` : ""}.</h3><p className="text-[var(--muted)] mt-2">If it&apos;s a fit, we&apos;ll reach out personally. This is by application only.</p></div>;

  return (
    <form onSubmit={submit} className="card p-6 md:p-8">
      <div className="text-xs uppercase tracking-widest text-[var(--brand)] mb-3">Applying as · {audienceLabel}</div>
      <div className="grid sm:grid-cols-2 gap-3">
        <input placeholder="Full name *" value={f.name} onChange={set("name")} />
        <input placeholder="Current annual revenue" value={f.revenue} onChange={set("revenue")} />
        <input placeholder="Email" type="email" value={f.email} onChange={set("email")} />
        <input placeholder="Phone" value={f.phone} onChange={set("phone")} />
      </div>
      <textarea className="mt-3" rows={2} placeholder="What are you ready to double? (optional)" value={f.message} onChange={set("message")} />
      {err && <p className="text-sm text-[var(--danger)] mt-2">{err}</p>}
      <button type="submit" disabled={busy} className="btn btn-brand w-full justify-center mt-4 text-base !py-3 disabled:opacity-50">{busy ? "Submitting…" : "Apply now →"}</button>
      <p className="text-[11px] text-[var(--muted)] text-center mt-3">Krystalore Crews · CEO Whisperer · Executive Advisor — powered by the R0cketShip Core.</p>
    </form>
  );
}
