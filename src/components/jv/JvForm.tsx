"use client";
import { useState } from "react";
import { JV_INTERESTS as INTERESTS } from "@/lib/jv-constants";

const F = "mt-1 w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]";

export default function JvForm({
  interest = "", lockInterest = false, cta = "Request information", bookCall = false, compact = false,
}: { interest?: string; lockInterest?: boolean; cta?: string; bookCall?: boolean; compact?: boolean }) {
  const [v, setV] = useState({ name: "", phone: "", email: "", zip: "", state: "", notes: "", interest });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const r = await fetch("/api/jv", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...v, interest: bookCall ? "book_call" : v.interest, bookCall }),
    });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok || d.error) { setErr(d.error || "Something went wrong."); return; }
    if (d.calendly) { window.location.href = d.calendly; return; }
    setDone(true);
  }

  if (done) return (
    <div className="card glow p-6 text-center">
      <div className="text-3xl">🤝</div>
      <h3 className="mt-2 text-lg font-semibold">Got it — thank you.</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">Jeff or his team will reach out personally. For the fastest path, you can also call 1-800-MEDIGAP.</p>
    </div>
  );

  return (
    <form onSubmit={submit} className="card glow p-6">
      {!bookCall && !compact && <div className="text-sm font-semibold mb-1">Express your interest</div>}
      {!bookCall && !compact && <p className="text-xs text-[var(--muted)] mb-4">This goes straight to the founder&apos;s desk. No call center.</p>}
      <div className={`grid gap-3 ${compact ? "" : "sm:grid-cols-2"}`}>
        <input required placeholder="Full name" value={v.name} onChange={set("name")} className={F} />
        <input required placeholder="Phone" value={v.phone} onChange={set("phone")} className={F} />
        <input placeholder="Email" type="email" value={v.email} onChange={set("email")} className={F} />
        <input placeholder="ZIP (if relevant)" value={v.zip} onChange={set("zip")} className={F} />
        {!bookCall && !lockInterest && (
          <div className="sm:col-span-2">
            <label className="text-xs uppercase tracking-wide text-[var(--muted)]">I&apos;m interested in</label>
            <select required value={v.interest} onChange={set("interest")} className={F}>
              <option value="">Select…</option>
              {INTERESTS.map((i) => <option key={i.key} value={i.key}>{i.label}</option>)}
            </select>
          </div>
        )}
        <textarea placeholder="Anything we should know?" value={v.notes} onChange={set("notes")} rows={2} className={`${F} sm:col-span-2`} />
      </div>
      {err && <p className="text-sm text-[var(--danger)] mt-3">{err}</p>}
      <button disabled={busy} className="btn btn-brand w-full mt-4 justify-center">{busy ? "Sending…" : bookCall ? "Book my call →" : `${cta} →`}</button>
      <p className="mt-3 text-[10px] leading-tight text-[var(--muted)]">By submitting you agree to be contacted about partnership and investment opportunities.</p>
    </form>
  );
}
