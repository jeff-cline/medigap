"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Buy a coverage seat — ZIP, whole State, or Nationwide — with tiered monthly pricing.
export function SeatForm({ zipCents = 9900, stateCents = 49900, nationalCents = 199900 }: { zipCents?: number; stateCents?: number; nationalCents?: number }) {
  const router = useRouter();
  const [scope, setScope] = useState("zip");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fee = scope === "national" ? nationalCents : scope === "state" ? stateCents : zipCents;
  const valid = scope === "national" || (scope === "zip" ? value.length === 5 : value.length === 2);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/agent/seat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, scopeValue: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "Could not buy seat."); return; }
      setValue("");
      router.refresh();
    } finally { setBusy(false); }
  }

  const inputCls = "w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)] disabled:opacity-40";
  return (
    <form onSubmit={submit} className="card p-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto] items-end">
      <div>
        <label className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">Coverage</label>
        <select value={scope} onChange={(e) => { setScope(e.target.value); setValue(""); }} className={inputCls}>
          <option value="zip">ZIP — ${(zipCents / 100).toFixed(0)}/mo</option>
          <option value="state">Whole State — ${(stateCents / 100).toFixed(0)}/mo</option>
          <option value="national">Nationwide — ${(nationalCents / 100).toFixed(0)}/mo</option>
        </select>
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">{scope === "state" ? "State (e.g. TX)" : scope === "national" ? "All 50 states" : "ZIP"}</label>
        <input value={value} disabled={scope === "national"} onChange={(e) => setValue(scope === "zip" ? e.target.value.replace(/\D/g, "").slice(0, 5) : e.target.value.toUpperCase().slice(0, 2))} placeholder={scope === "state" ? "TX" : scope === "national" ? "—" : "78701"} className={inputCls} />
      </div>
      <button type="submit" disabled={busy || !valid} className="btn btn-brand disabled:opacity-60">
        {busy ? "Buying…" : `Buy — $${(fee / 100).toFixed(0)}/mo`}
      </button>
      {error && <p className="sm:col-span-3 text-xs text-[var(--danger)]">{error}</p>}
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
