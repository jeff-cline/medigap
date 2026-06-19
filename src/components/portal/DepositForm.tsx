"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { usd } from "@/lib/format";

export default function DepositForm({ mgmtFeePct = 2 }: { mgmtFeePct?: number }) {
  const router = useRouter();
  const [amount, setAmount] = useState(50000); // dollars
  const [accredited, setAccredited] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const cents = Math.round(amount * 100);
  const mgmt = Math.round(cents * (mgmtFeePct / 100));
  const deployed = cents - mgmt;
  const deployedPct = (100 - mgmtFeePct).toFixed(mgmtFeePct % 1 === 0 ? 0 : 1);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(false);
    if (cents <= 0) {
      setError("Enter an amount greater than $0.");
      return;
    }
    if (!accredited) {
      setError("You must acknowledge accredited-investor status to deposit.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/investor/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents: cents }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Deposit failed.");
        return;
      }
      setDone(true);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card p-5 grid gap-4">
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
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{deployedPct}% Deployed</div>
          <div className="mt-1 text-xl font-bold text-[var(--brand)]">{usd(deployed)}</div>
        </div>
        <div className="rounded-lg bg-[var(--panel2)] border border-[var(--border)] p-3">
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{mgmtFeePct}% Mgmt fee</div>
          <div className="mt-1 text-xl font-bold text-[var(--gold)]">{usd(mgmt)}</div>
        </div>
      </div>
      <label className="flex items-start gap-2 text-xs text-[var(--muted)]">
        <input
          type="checkbox"
          checked={accredited}
          onChange={(e) => setAccredited(e.target.checked)}
          className="mt-0.5 accent-[var(--brand)]"
        />
        <span>
          I acknowledge I am an <span className="text-[var(--text)] font-medium">accredited investor</span>. Funds are
          deployed into the arbitrage pool as next-money-in-line; I receive a 50% profit share. ACH via Stripe wired next.
        </span>
      </label>
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
      {done && <p className="text-xs text-[var(--brand)]">Deposit recorded — {usd(deployed)} deployed.</p>}
      <div className="flex justify-end">
        <button type="submit" disabled={busy} className="btn btn-brand disabled:opacity-60">
          {busy ? "Depositing…" : "Deposit funds"}
        </button>
      </div>
    </form>
  );
}
