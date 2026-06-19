"use client";
import { useState } from "react";

const MIN_BID = 25;

export default function BidForm() {
  const [zip, setZip] = useState("");
  const [scope, setScope] = useState("zip");
  const [bid, setBid] = useState(MIN_BID);
  const [cap, setCap] = useState(10);

  const step = (d: number) => setBid((b) => Math.max(MIN_BID, b + d));

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="card p-5 grid gap-4 sm:grid-cols-2"
    >
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
        <label className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">Scope</label>
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          className="w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
        >
          <option value="zip">ZIP</option>
          <option value="county">County</option>
          <option value="state">State</option>
          <option value="national">National</option>
        </select>
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">
          My bid (min ${MIN_BID})
        </label>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => step(-1)} className="btn btn-ghost !py-1.5 !px-3">−</button>
          <div className="flex-1 text-center rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm font-bold">
            ${bid}/call
          </div>
          <button type="button" onClick={() => step(1)} className="btn btn-ghost !py-1.5 !px-3">+</button>
        </div>
        {bid <= MIN_BID && (
          <p className="text-xs text-[var(--muted)] mt-1">Minimum bid is ${MIN_BID} per call.</p>
        )}
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">Daily cap (calls)</label>
        <input
          type="number"
          min={1}
          value={cap}
          onChange={(e) => setCap(Math.max(1, Number(e.target.value) || 1))}
          className="w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
        />
      </div>
      <div className="sm:col-span-2 flex items-center justify-between gap-4">
        <p className="text-xs text-[var(--muted)]">
          Max daily spend ≈ <span className="font-semibold text-[var(--text)]">${bid * cap}</span>
        </p>
        <button type="submit" className="btn btn-brand">Place / Update bid</button>
      </div>
    </form>
  );
}
