"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AgentAccount({ balanceCents, available, phone }: { balanceCents: number; available: boolean; phone: string }) {
  const router = useRouter();
  const [amt, setAmt] = useState("100");
  const [coupon, setCoupon] = useState("");
  const [on, setOn] = useState(available);
  const [tel, setTel] = useState(phone || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function post(body: object) {
    setBusy(true); setMsg("");
    const r = await fetch("/api/agent/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    setBusy(false); if (d.error) setMsg(d.error); else router.refresh();
    return d;
  }
  async function deposit() { const d = await post({ action: "deposit", amount: Number(amt), couponCode: coupon.trim() || undefined }); if (d.ok) setMsg(`Added $${amt}${d.couponMsg ? " · " + d.couponMsg : ""}.`); }
  async function toggle() { const next = !on; setOn(next); await post({ action: "availability", available: next }); }
  async function savePhone() { const d = await post({ action: "phone", phone: tel }); if (d.ok) setMsg("Transfer number saved."); }

  const low = balanceCents < 2500;
  return (
    <div className="grid gap-4 md:grid-cols-2 items-stretch">
      <div className="card p-5 md:col-span-2">
        <div className="text-xs uppercase tracking-wide text-[var(--muted)]">📞 Transfer my calls to this number</div>
        <div className="flex gap-2 mt-2">
          <input className="flex-1" value={tel} onChange={(e) => setTel(e.target.value)} placeholder="+1 972 555 0123" />
          <button onClick={savePhone} disabled={busy} className="btn btn-brand text-sm !py-1.5 shrink-0">Save number</button>
        </div>
        {!phone && <p className="text-xs text-[var(--danger)] mt-2">⚠ No number set — won calls have nowhere to ring. Add it to start receiving calls.</p>}
      </div>
      <div className="card p-5">
        <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Pay-Per-Call Balance</div>
        <div className={`mt-1 text-3xl font-bold ${low ? "text-[var(--danger)]" : "text-[var(--brand)]"}`}>${(balanceCents / 100).toFixed(2)}</div>
        {low && <div className="text-xs text-[var(--danger)] mt-1">Too low to receive calls — add funds.</div>}
        <div className="flex gap-2 mt-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">$</span>
            <input className="!pl-6" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="100" />
          </div>
          <button onClick={deposit} disabled={busy} className="btn btn-brand text-sm !py-1.5 shrink-0">Add funds</button>
        </div>
        <input className="mt-2 text-sm" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Coupon code (optional)" />
        <p className="text-[11px] text-[var(--muted)] mt-2">Each won call deducts your bid from this balance. Stripe top-up wires up here once connected.</p>
        {msg && <div className="text-xs text-[var(--brand)] mt-2">{msg}</div>}
      </div>

      <div className="card p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="font-semibold">Taking Calls</span>
            <button type="button" onClick={toggle} disabled={busy} className={`inline-flex h-7 w-12 items-center rounded-full transition ${on ? "bg-[var(--brand)]" : "bg-[var(--border)]"}`}>
              <span className={`h-6 w-6 rounded-full bg-white transition ${on ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
          <p className="text-sm text-[var(--muted)] mt-2">
            {on ? "You're LIVE — your active bids compete for inbound calls right now." : "You're OFF — you won't receive any calls until you switch on."}
          </p>
        </div>
        <div className={`mt-3 text-sm font-medium ${on ? "text-[var(--brand)]" : "text-[var(--muted)]"}`}>{on ? "● Online" : "○ Offline"}</div>
      </div>
    </div>
  );
}
