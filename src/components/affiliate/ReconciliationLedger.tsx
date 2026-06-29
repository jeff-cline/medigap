"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { usd2 } from "@/lib/format";

type Ping = {
  id: string; vertical: string; status: string; offerCents: number; soldCents: number;
  reportedCents: number; reconciled: boolean; isTest: boolean; externalId: string;
  trackingNumber: string; moneyWord: string; createdAt: string;
};
type VertOpt = { id: string; label: string; affiliateId: string };

async function post(body: Record<string, unknown>) {
  const r = await fetch("/api/affiliates", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return r.json().catch(() => ({}));
}

const STATUS_TONE: Record<string, string> = {
  sold: "text-[var(--brand)]", posted: "text-[var(--gold)]", pinged: "text-[var(--muted)]",
  rejected: "text-red-400", no_bid: "text-[var(--muted)]",
};

export default function ReconciliationLedger({ pings, verticals }: { pings: Ping[]; verticals: VertOpt[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [vid, setVid] = useState(verticals[0]?.id || "");
  const [reported, setReported] = useState<Record<string, string>>({});

  async function simulate() {
    const v = verticals.find((x) => x.id === vid);
    if (!v) return;
    setBusy(true);
    await post({ action: "simulatePing", affiliateId: v.affiliateId, verticalId: v.id });
    setBusy(false);
    router.refresh();
  }
  async function clearTest() {
    setBusy(true);
    await post({ action: "clearTestPings" });
    setBusy(false);
    router.refresh();
  }
  async function reconcile(id: string) {
    const dollars = reported[id];
    if (dollars == null) return;
    setBusy(true);
    await post({ action: "reconcile", id, reportedCents: Math.round(parseFloat(dollars || "0") * 100), reconciled: true });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select value={vid} onChange={(e) => setVid(e.target.value)} className="rounded border border-[var(--border)] bg-[var(--panel2)] px-2 py-1.5 text-sm">
          {verticals.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
        </select>
        <button onClick={simulate} disabled={busy || !vid} className="btn btn-ghost text-xs !py-1.5">▶ Simulate a ping</button>
        <button onClick={clearTest} disabled={busy} className="btn btn-ghost text-xs !py-1.5 text-[var(--muted)]">Clear test rows</button>
        <span className="text-[11px] text-[var(--muted)]">Simulated rows are tagged TEST and never affect real reconciliation.</span>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]">
              <th className="text-left p-3">When</th>
              <th className="text-left p-3">Vertical</th>
              <th className="text-left p-3">Word</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3">Offer</th>
              <th className="text-right p-3">We sold</th>
              <th className="text-right p-3">They report</th>
              <th className="text-right p-3">Variance</th>
              <th className="text-left p-3">Their ref / reconcile</th>
            </tr>
          </thead>
          <tbody>
            {pings.length === 0 ? (
              <tr><td colSpan={9} className="p-6 text-center text-[var(--muted)] text-sm">No pings yet. Set mode to Observe and take a live call, or simulate one to see the flow.</td></tr>
            ) : pings.map((p) => {
              const variance = p.soldCents - p.reportedCents;
              return (
                <tr key={p.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="p-3 text-[var(--muted)] whitespace-nowrap text-xs">{new Date(p.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}{p.isTest && <span className="ml-1 rounded bg-[var(--gold)]/15 text-[var(--gold)] px-1 text-[9px]">TEST</span>}</td>
                  <td className="p-3 whitespace-nowrap">{p.vertical.replace(/_/g, " ")}</td>
                  <td className="p-3 whitespace-nowrap text-[var(--muted)]">{p.moneyWord || "—"}</td>
                  <td className={`p-3 font-medium ${STATUS_TONE[p.status] || ""}`}>{p.status}</td>
                  <td className="p-3 text-right tabular-nums">{p.offerCents ? usd2(p.offerCents) : "—"}</td>
                  <td className="p-3 text-right tabular-nums">{p.soldCents ? usd2(p.soldCents) : "—"}</td>
                  <td className="p-3 text-right tabular-nums">{p.reconciled ? usd2(p.reportedCents) : <span className="text-[var(--muted)]">pending</span>}</td>
                  <td className={`p-3 text-right tabular-nums ${variance > 0 ? "text-red-400" : variance < 0 ? "text-[var(--gold)]" : "text-[var(--muted)]"}`}>{p.reconciled ? usd2(variance) : "—"}</td>
                  <td className="p-3">
                    {p.status === "sold" && !p.reconciled ? (
                      <div className="flex items-center gap-1">
                        <span className="text-[var(--muted)] text-xs">$</span>
                        <input value={reported[p.id] ?? ""} onChange={(e) => setReported({ ...reported, [p.id]: e.target.value })} placeholder={(p.soldCents / 100).toFixed(2)} className="w-16 rounded border border-[var(--border)] bg-[var(--panel2)] px-1.5 py-1 text-right text-xs" />
                        <button onClick={() => reconcile(p.id)} disabled={busy} className="btn btn-brand !py-1 text-[11px]">Reconcile</button>
                      </div>
                    ) : p.reconciled ? (
                      <span className="text-[11px] text-[var(--brand)]">✓ reconciled{p.externalId ? ` · ${p.externalId}` : ""}</span>
                    ) : <span className="text-[11px] text-[var(--muted)]">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
