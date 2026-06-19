"use client";
import { useState } from "react";
import { usd } from "@/lib/format";

export default function DepositForm() {
  const [amount, setAmount] = useState(50000);
  const cents = Math.round(amount * 100);
  const mgmt = Math.round(cents * 0.02);
  const deployed = cents - mgmt;

  return (
    <form onSubmit={(e) => e.preventDefault()} className="card p-5 grid gap-4">
      <div>
        <label className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">Deposit amount (USD)</label>
        <input
          type="number"
          min={0}
          step={1000}
          value={amount}
          onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
          className="w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-lg font-bold outline-none focus:border-[var(--brand)]"
        />
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-[var(--panel2)] border border-[var(--border)] p-3">
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">98% Deployed</div>
          <div className="mt-1 text-xl font-bold text-[var(--brand)]">{usd(deployed)}</div>
        </div>
        <div className="rounded-lg bg-[var(--panel2)] border border-[var(--border)] p-3">
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">2% Mgmt fee</div>
          <div className="mt-1 text-xl font-bold text-[var(--gold)]">{usd(mgmt)}</div>
        </div>
      </div>
      <p className="text-xs text-[var(--muted)]">
        Deposits require accredited-investor verification. Funds are deployed into the arbitrage pool; you
        receive a 50% profit share. ACH via Stripe wired next.
      </p>
      <div className="flex justify-end">
        <button type="submit" className="btn btn-brand">Deposit funds</button>
      </div>
    </form>
  );
}
