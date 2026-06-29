"use client";
import { useState } from "react";
import { usd2, num } from "@/lib/format";

type Vert = { id: string; vertical: string; label: string; active: boolean; bidCents: number; calls: number; revenueCents: number };
type Aff = { id: string; name: string; slug: string; active: boolean; verticals: Vert[] };

async function post(body: Record<string, unknown>) {
  const r = await fetch("/api/affiliates", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return r.json().catch(() => ({}));
}

function Toggle({ on, onClick, busy }: { on: boolean; onClick: () => void; busy?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      aria-pressed={on}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${on ? "bg-[var(--brand)]" : "bg-[var(--border)]"} ${busy ? "opacity-50" : ""}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${on ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

export default function AffiliateConsole({ affiliate }: { affiliate: Aff }) {
  const [aff, setAff] = useState(affiliate);
  const [busy, setBusy] = useState<string | null>(null);

  async function toggleAffiliate() {
    setBusy("aff");
    const r = await post({ action: "toggleAffiliate", id: aff.id });
    if (r.ok) setAff({ ...aff, active: r.active });
    setBusy(null);
  }
  async function toggleVertical(id: string) {
    setBusy(id);
    const r = await post({ action: "toggleVertical", id });
    if (r.ok) setAff({ ...aff, verticals: aff.verticals.map((v) => (v.id === id ? { ...v, active: r.active } : v)) });
    setBusy(null);
  }
  async function setBid(id: string, dollars: string) {
    const cents = Math.round(parseFloat(dollars || "0") * 100);
    const r = await post({ action: "setBid", id, cents });
    if (r.ok) setAff({ ...aff, verticals: aff.verticals.map((v) => (v.id === id ? { ...v, bidCents: r.bidCents } : v)) });
  }

  return (
    <div className="card overflow-hidden">
      {/* partner header + master toggle */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--brand)]/10 text-lg">🤝</div>
          <div>
            <div className="font-semibold">{aff.name}</div>
            <div className="text-xs text-[var(--muted)]">Ping-post-tree affiliate · backstop monetization</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${aff.active ? "text-[var(--brand)]" : "text-[var(--muted)]"}`}>{aff.active ? "ON" : "OFF"}</span>
          <Toggle on={aff.active} busy={busy === "aff"} onClick={toggleAffiliate} />
        </div>
      </div>

      {/* per-vertical rows */}
      <div className="divide-y divide-[var(--border)]">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-4 py-2 text-[10px] uppercase tracking-wide text-[var(--muted)]">
          <span>Vertical</span><span className="text-right">Bid</span><span className="text-right">Calls</span><span className="text-right">Received</span><span className="text-right">On/Off</span>
        </div>
        {aff.verticals.map((v) => {
          const live = aff.active && v.active;
          return (
            <div key={v.id} className={`grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-4 py-3 ${live ? "" : "opacity-50"}`}>
              <div>
                <div className="font-medium text-sm">{v.label}</div>
                <div className="text-[10px] text-[var(--muted)]">{v.vertical}</div>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-1">
                  <span className="text-[var(--muted)] text-xs">$</span>
                  <input
                    defaultValue={(v.bidCents / 100).toFixed(2)}
                    onBlur={(e) => setBid(v.id, e.target.value)}
                    className="w-20 rounded border border-[var(--border)] bg-[var(--panel2)] px-2 py-1 text-right text-sm"
                  />
                </div>
              </div>
              <a href="#rawflow" title="see the pings behind this" className="text-right text-sm tabular-nums hover:underline">{num(v.calls)}</a>
              <a href="#rawflow" title="see the pings behind this" className="text-right text-sm tabular-nums text-[var(--brand)] hover:underline">{usd2(v.revenueCents)}</a>
              <div className="flex justify-end">
                <Toggle on={v.active} busy={busy === v.id} onClick={() => toggleVertical(v.id)} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-[var(--border)] bg-[var(--panel2)] px-4 py-2 text-[11px] text-[var(--muted)]">
        Bid values are editable placeholders. Once QuinStreet&apos;s ping API is wired, each bid is fetched live per call and the router picks the highest payer automatically.
      </div>
    </div>
  );
}
