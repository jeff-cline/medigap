"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// God-only "mark this partner paid" button — records a payout transaction.
export default function PayButton({ userId, amountCents, label, period }: { userId: string; amountCents: number; label: string; period: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function pay() {
    if (!confirm(`Record a ${label} payout for the ${period} statement? This logs it to the ledger.`)) return;
    setBusy(true); setErr("");
    const r = await fetch("/api/payouts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, amountCents, note: `Partner payout — ${period}` }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (d.error) setErr(d.error); else router.refresh();
  }

  return (
    <div className="text-right">
      <button onClick={pay} disabled={busy} className="btn btn-brand text-xs !py-1.5">{busy ? "…" : label}</button>
      {err && <div className="text-[11px] text-[var(--danger)] mt-1">{err}</div>}
    </div>
  );
}
