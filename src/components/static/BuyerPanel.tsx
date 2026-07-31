"use client";
import { useCallback, useEffect, useState } from "react";

type Buyer = {
  id: string; name: string; defaultNumber: string; afterHoursNumber: string | null; backupNumber: string | null;
  afterHoursDays: string; afterHoursStart: number | null; afterHoursEnd: number | null;
  active: boolean; dailyCap: number; priorityWeight: number; payoutCents: number;
  states: string; billableSeconds: number;
};
type ZipRule = { id: string; buyerId: string; zip: string; radiusMiles: number };

async function post(body: unknown) {
  const res = await fetch("/api/static/buyers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
}

const L = "block text-xs uppercase text-[var(--muted)] mb-1";
const F = "w-full rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1";

export default function BuyerPanel({ moneyWordId }: { moneyWordId: string }) {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [zips, setZips] = useState<ZipRule[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/static/buyers?moneyWordId=${encodeURIComponent(moneyWordId)}`);
      if (!res.ok) throw new Error(`Load failed (${res.status})`);
      const data = await res.json();
      setBuyers(data.buyers); setZips(data.zipRules);
    } catch (e) { setErr(e instanceof Error ? e.message : "Load failed."); }
  }, [moneyWordId]);

  useEffect(() => { load(); }, [load]);

  const run = async (body: unknown) => {
    setBusy(true); setErr(null);
    try { await post(body); await load(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setBusy(false); }
  };

  return (
    <div className="mt-4 border-t border-[var(--border)] pt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">Buyers <span className="text-[var(--muted)]">(this money word routes to these)</span></div>
        <button className="btn" disabled={busy} onClick={() => run({ action: "createBuyer", moneyWordId })}>+ Add buyer</button>
      </div>
      {err && <div className="rounded border border-[var(--danger)] text-[var(--danger)] text-sm px-3 py-2 mb-2">{err}</div>}
      {buyers.length === 0 && <div className="text-xs text-[var(--muted)] mb-2">No buyers yet — calls to this money word have nowhere to route.</div>}

      <div className="space-y-3">
        {buyers.map((b) => (
          <BuyerRow key={b.id} buyer={b} busy={busy} onSave={(patch) => run({ action: "updateBuyer", id: b.id, patch })} onDelete={() => { if (confirm(`Remove buyer “${b.name}”?`)) run({ action: "deleteBuyer", id: b.id }); }} />
        ))}
      </div>

      <ZipRules moneyWordId={moneyWordId} buyers={buyers} zips={zips} busy={busy} run={run} />
      <div className="text-xs text-[var(--muted)] mt-3">ZIP radius resolution, after-hours/backup dialing & DID passthrough go live in <b>Phase 2B</b>. Weights use Smooth Weighted Round-Robin.</div>
    </div>
  );
}

function BuyerRow({ buyer, busy, onSave, onDelete }: { buyer: Buyer; busy: boolean; onSave: (patch: Record<string, unknown>) => void; onDelete: () => void }) {
  const [name, setName] = useState(buyer.name);
  const [def, setDef] = useState(buyer.defaultNumber);
  const [after, setAfter] = useState(buyer.afterHoursNumber ?? "");
  const [backup, setBackup] = useState(buyer.backupNumber ?? "");
  const [weight, setWeight] = useState(String(buyer.priorityWeight));
  const [cap, setCap] = useState(String(buyer.dailyCap));
  const [payout, setPayout] = useState(((buyer.payoutCents ?? 0) / 100).toString());
  const [statesCsv, setStatesCsv] = useState((() => { try { return (JSON.parse(buyer.states || "[]") as string[]).join(", "); } catch { return ""; } })());
  const [billSec, setBillSec] = useState(String(buyer.billableSeconds ?? 0));

  const save = () => onSave({
    name: name.trim(),
    defaultNumber: def.trim(),
    afterHoursNumber: after.trim() || null,
    backupNumber: backup.trim() || null,
    priorityWeight: Math.max(0, parseInt(weight, 10) || 0),
    dailyCap: Math.max(0, parseInt(cap, 10) || 0),
    payoutCents: Math.round((parseFloat(payout) || 0) * 100),
    states: statesCsv.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean),
    billableSeconds: Math.max(0, parseInt(billSec, 10) || 0),
  });

  return (
    <div className={`rounded border border-[var(--border)] p-3 ${buyer.active ? "" : "opacity-60"}`}>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div><label className={L}>Name</label><input className={F} value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><label className={L}>Default # (E.164)</label><input className={F} value={def} onChange={(e) => setDef(e.target.value)} placeholder="+15551230000" /></div>
        <div><label className={L}>After-hours #</label><input className={F} value={after} onChange={(e) => setAfter(e.target.value)} placeholder="optional" /></div>
        <div><label className={L}>Backup #</label><input className={F} value={backup} onChange={(e) => setBackup(e.target.value)} placeholder="optional" /></div>
        <div><label className={L}>Weight</label><input className={F} value={weight} onChange={(e) => setWeight(e.target.value)} /></div>
        <div><label className={L}>Daily cap (0=∞)</label><input className={F} value={cap} onChange={(e) => setCap(e.target.value)} /></div>
        <div><label className={L}>Payout/call ($, 0=use word value)</label><input className={F} value={payout} onChange={(e) => setPayout(e.target.value)} /></div>
        <div><label className={L}>States (CSV, blank=all)</label><input className={F} value={statesCsv} onChange={(e) => setStatesCsv(e.target.value)} placeholder="TX, FL" /></div>
        <div><label className={L}>Billable secs (0=off)</label><input className={F} value={billSec} onChange={(e) => setBillSec(e.target.value)} /></div>
      </div>
      <div className="flex gap-2 items-center">
        <button className="btn" disabled={busy} onClick={save}>Save</button>
        <button className="btn" disabled={busy} onClick={() => onSave({ active: !buyer.active })}>{buyer.active ? "🟢 On" : "⚪ Off"}</button>
        <button className="btn" disabled={busy} onClick={onDelete}>Remove</button>
      </div>
    </div>
  );
}

function ZipRules({ moneyWordId, buyers, zips, busy, run }: { moneyWordId: string; buyers: Buyer[]; zips: ZipRule[]; busy: boolean; run: (body: unknown) => void }) {
  const [zip, setZip] = useState("");
  const [buyerId, setBuyerId] = useState("");
  const [radius, setRadius] = useState("0");
  const nameOf = (id: string) => buyers.find((b) => b.id === id)?.name ?? "(removed)";

  return (
    <div className="mt-4">
      <div className="text-sm font-semibold mb-2">Granular ZIP rules <span className="text-[var(--muted)]">(exact ZIP now; radius stored for Phase 2B)</span></div>
      <div className="flex flex-wrap gap-2 items-end mb-2">
        <div><label className={L}>ZIP</label><input className={F} value={zip} onChange={(e) => setZip(e.target.value)} placeholder="75001" /></div>
        <div><label className={L}>Radius (mi)</label><input className={F} value={radius} onChange={(e) => setRadius(e.target.value)} /></div>
        <div><label className={L}>Buyer</label>
          <select className={F} value={buyerId} onChange={(e) => setBuyerId(e.target.value)}>
            <option value="">— pick —</option>
            {buyers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <button className="btn" disabled={busy || !zip.trim() || !buyerId} onClick={() => run({ action: "createZip", moneyWordId, buyerId, zip: zip.trim(), radiusMiles: Math.max(0, parseInt(radius, 10) || 0) })}>+ Add ZIP rule</button>
      </div>
      {zips.length === 0 ? <div className="text-xs text-[var(--muted)]">No ZIP rules — buyers apply by state/weight only.</div> : (
        <ul className="text-sm space-y-1">
          {zips.map((z) => (
            <li key={z.id} className="flex items-center gap-2">
              <span className="font-mono">{z.zip}{z.radiusMiles > 0 ? ` +${z.radiusMiles}mi` : ""}</span>
              <span className="text-[var(--muted)]">→ {nameOf(z.buyerId)}</span>
              <button className="text-[var(--danger)]" disabled={busy} onClick={() => run({ action: "deleteZip", id: z.id })}>remove</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
