"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Coupon = { id: string; code: string; kind: string; amountCents: number; percent: number; maxRedemptions: number; redemptions: number; oncePerUser: boolean; active: boolean; note: string };

export default function CouponManager({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [kind, setKind] = useState("credit");
  const [amount, setAmount] = useState("100");
  const [percent, setPercent] = useState("100");
  const [maxRedemptions, setMax] = useState("0");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function api(body: object) { setBusy(true); setErr(""); const r = await fetch("/api/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const d = await r.json().catch(() => ({})); setBusy(false); if (d.error) setErr(d.error); else router.refresh(); return d; }
  async function create() { const d = await api({ action: "create", code, kind, amount: Number(amount), percent: Number(percent), maxRedemptions: Number(maxRedemptions), note }); if (!d.error) { setCode(""); setNote(""); } }

  const valueLabel = (c: Coupon) => c.kind === "credit" ? `$${(c.amountCents / 100).toFixed(0)} credit` : `${c.percent}% match${c.amountCents ? ` up to $${(c.amountCents / 100).toFixed(0)}` : ""}`;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card glow p-5">
        <div className="font-semibold mb-3">Create a coupon</div>
        <label className="text-xs text-[var(--muted)]">Code</label>
        <input className="mb-3 mt-1 font-mono" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="LAUNCH100" />
        <label className="text-xs text-[var(--muted)]">Type</label>
        <select className="mb-3 mt-1" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="credit">Flat credit (give free balance)</option>
          <option value="match">Match deposit (% up to a cap)</option>
        </select>
        {kind === "credit" ? (
          <><label className="text-xs text-[var(--muted)]">Credit amount ($)</label><input className="mb-3 mt-1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100" /></>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><label className="text-xs text-[var(--muted)]">Match %</label><input className="mt-1" value={percent} onChange={(e) => setPercent(e.target.value)} placeholder="100" /></div>
            <div><label className="text-xs text-[var(--muted)]">Cap ($, 0 = none)</label><input className="mt-1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="500" /></div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-[var(--muted)]">Max redemptions (0=∞)</label><input className="mt-1" value={maxRedemptions} onChange={(e) => setMax(e.target.value)} /></div>
          <div><label className="text-xs text-[var(--muted)]">Note</label><input className="mt-1" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Launch promo" /></div>
        </div>
        {err && <p className="text-sm text-[var(--danger)] mt-3">{err}</p>}
        <button disabled={busy || !code} onClick={create} className="btn btn-brand text-sm mt-4">Create coupon</button>
        <p className="text-[11px] text-[var(--muted)] mt-2">Applied when a partner enters the code at deposit. Match example: 100% up to $500 doubles a $500 deposit to $1,000.</p>
      </div>

      <div className="card p-5">
        <div className="font-semibold mb-3">Active coupons</div>
        {coupons.length === 0 && <p className="text-sm text-[var(--muted)]">None yet.</p>}
        <div className="space-y-2">
          {coupons.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 border-b border-[var(--border)]/60 pb-2">
              <div className="min-w-0">
                <span className="font-mono font-bold">{c.code}</span> <span className="text-sm text-[var(--gold)]">{valueLabel(c)}</span>
                <div className="text-xs text-[var(--muted)]">{c.redemptions}{c.maxRedemptions ? `/${c.maxRedemptions}` : ""} used{c.note ? ` · ${c.note}` : ""}{c.oncePerUser ? " · 1 per user" : ""}{!c.active ? " · paused" : ""}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => api({ action: "toggle", id: c.id })} className="btn btn-ghost text-xs !py-1 !px-2.5">{c.active ? "Pause" : "On"}</button>
                <button onClick={() => api({ action: "delete", id: c.id })} className="text-[var(--danger)] text-xs px-1">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
