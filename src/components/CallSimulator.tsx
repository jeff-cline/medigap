"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { usd } from "@/lib/format";

const SOURCES = ["organic", "house", "paid"];

export default function CallSimulator() {
  const router = useRouter();
  const [zip, setZip] = useState("");
  const [state, setState] = useState("");
  const [moneyWord, setMoneyWord] = useState("");
  const [source, setSource] = useState("organic");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ winner: string | null; priceCents: number } | null>(null);

  async function fire(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/calls/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zip: zip.trim(),
          state: state.trim().toUpperCase(),
          moneyWord: moneyWord.trim() || undefined,
          source,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not place call.");
        return;
      }
      setResult({ winner: data.winner ?? null, priceCents: data.priceCents ?? 0 });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={fire} className="grid gap-3 sm:grid-cols-4 items-end">
      <div>
        <label className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">ZIP</label>
        <input
          value={zip}
          onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
          placeholder="78701"
          className="w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
        />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">State</label>
        <input
          value={state}
          onChange={(e) => setState(e.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 2))}
          placeholder="TX"
          className="w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)] uppercase"
        />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">Money word (opt)</label>
        <input
          value={moneyWord}
          onChange={(e) => setMoneyWord(e.target.value)}
          placeholder="diabetes"
          className="w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
        />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">Source</label>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)] capitalize"
        >
          {SOURCES.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs">
          {error && <span className="text-[var(--danger)]">{error}</span>}
          {result && !error && (
            <span className="text-[var(--muted)]">
              {result.winner ? (
                <>
                  Routed to agent <span className="text-[var(--text)] font-semibold">{result.winner}</span> for{" "}
                  <span className="text-[var(--brand)] font-semibold">{usd(result.priceCents)}</span>.
                </>
              ) : (
                <span className="text-[var(--gold)]">No eligible bidder — call logged unrouted.</span>
              )}
            </span>
          )}
        </div>
        <button type="submit" disabled={busy} className="btn btn-brand disabled:opacity-60">
          {busy ? "Routing…" : "Fire simulated call"}
        </button>
      </div>
    </form>
  );
}
