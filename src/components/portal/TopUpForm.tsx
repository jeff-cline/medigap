"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const PRESETS = [50, 100, 250, 500]; // dollars

export default function TopUpForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(100); // dollars
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/advertiser/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents: Math.round(amount * 100) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Top-up failed.");
        return;
      }
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-brand" onClick={() => setOpen(true)}>
        Top up balance
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="card p-3 flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setAmount(p)}
            className={`btn btn-ghost !py-1 !px-2.5 text-xs ${amount === p ? "!text-[var(--brand)]" : ""}`}
          >
            ${p}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1 rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-2">
        <span className="text-sm text-[var(--muted)]">$</span>
        <input
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(Math.max(1, Number(e.target.value) || 0))}
          className="w-20 bg-transparent py-1.5 text-sm outline-none"
        />
      </div>
      <button type="submit" disabled={busy} className="btn btn-brand disabled:opacity-60">
        {busy ? "Adding…" : `Add $${amount}`}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">
        Cancel
      </button>
      {error && <p className="w-full text-xs text-[var(--danger)]">{error}</p>}
    </form>
  );
}
