"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Small companion form for buying a $99/mo ZIP seat — lives here to stay within
// the owned component set. Imported by the agent portal page.
export function SeatForm() {
  const router = useRouter();
  const [zip, setZip] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/agent/seat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zip }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not buy seat.");
        return;
      }
      setZip("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card p-5 flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[160px]">
        <label className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">Add a ZIP seat ($99/mo)</label>
        <input
          value={zip}
          onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
          placeholder="78701"
          className="w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
        />
      </div>
      <button type="submit" disabled={busy || zip.length !== 5} className="btn btn-brand disabled:opacity-60">
        {busy ? "Buying…" : "Buy seat"}
      </button>
      {error && <p className="w-full text-xs text-[var(--danger)]">{error}</p>}
    </form>
  );
}

type ExistingBid = {
  id: string;
  scope: string;
  scopeValue: string;
  amountCents: number;
  dailyCap: number;
};

export default function BidForm({
  minBidCents = 2500,
  bid: existing,
}: {
  minBidCents?: number;
  bid?: ExistingBid;
}) {
  const router = useRouter();
  const minDollars = Math.round(minBidCents / 100);

  const [scope, setScope] = useState(existing?.scope ?? "zip");
  const [scopeValue, setScopeValue] = useState(existing?.scopeValue ?? "");
  const [keyword, setKeyword] = useState((existing as ExistingBid & { keyword?: string })?.keyword ?? "");
  const [bidDollars, setBidDollars] = useState(
    Math.max(minDollars, Math.round((existing?.amountCents ?? minBidCents) / 100))
  );
  const [cap, setCap] = useState(existing?.dailyCap ?? 10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = (d: number) => setBidDollars((b) => Math.max(minDollars, b + d));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/agent/bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: existing?.id,
          scope,
          scopeValue: scope === "national" ? "" : scopeValue,
          keyword,
          amountCents: bidDollars * 100,
          dailyCap: cap,
          active: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      if (!existing) {
        setScopeValue("");
        setBidDollars(Math.max(minDollars, minDollars));
        setCap(10);
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card p-5 grid gap-4 sm:grid-cols-2">
      <div>
        <label className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">
          {scope === "state" ? "State (e.g. TX)" : scope === "city" ? "City" : "ZIP"}
        </label>
        <input
          value={scope === "national" ? "" : scopeValue}
          disabled={scope === "national"}
          onChange={(e) =>
            setScopeValue(scope === "zip" ? e.target.value.replace(/\D/g, "").slice(0, 5) : e.target.value)
          }
          placeholder={scope === "state" ? "TX" : scope === "city" ? "Phoenix" : "78701"}
          className="w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)] disabled:opacity-40"
        />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">Scope</label>
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          className="w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
        >
          <option value="zip">ZIP</option>
          <option value="state">State</option>
          <option value="national">National</option>
        </select>
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">
          My bid (min ${minDollars})
        </label>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => step(-1)} className="btn btn-ghost !py-1.5 !px-3">−</button>
          <div className="flex-1 text-center rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm font-bold">
            ${bidDollars}/call
          </div>
          <button type="button" onClick={() => step(1)} className="btn btn-ghost !py-1.5 !px-3">+</button>
        </div>
        {bidDollars <= minDollars && (
          <p className="text-xs text-[var(--muted)] mt-1">Minimum bid is ${minDollars} per call.</p>
        )}
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">Daily cap (calls)</label>
        <input
          type="number"
          min={0}
          value={cap}
          onChange={(e) => setCap(Math.max(0, Number(e.target.value) || 0))}
          className="w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">Keyword / money word (optional)</label>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="e.g. peptide — leave blank for all calls in your geo"
          className="w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
        />
        <p className="text-xs text-[var(--muted)] mt-1">Set a keyword to only receive calls where the AI hears that word; leave blank to take all calls in your geo.</p>
      </div>
      {error && <p className="sm:col-span-2 text-xs text-[var(--danger)]">{error}</p>}
      <div className="sm:col-span-2 flex items-center justify-between gap-4">
        <p className="text-xs text-[var(--muted)]">
          Max daily spend ≈{" "}
          <span className="font-semibold text-[var(--text)]">
            {cap > 0 ? `$${bidDollars * cap}` : "unlimited"}
          </span>
        </p>
        <button type="submit" disabled={busy} className="btn btn-brand disabled:opacity-60">
          {busy ? "Saving…" : existing ? "Update bid" : "Place bid"}
        </button>
      </div>
    </form>
  );
}
