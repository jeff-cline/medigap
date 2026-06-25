"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export type OfferRow = { id: string; name: string; description: string; url: string; payoutCents: number; category: string; scope: string; active: boolean };

// Brand/God offer manager. canNetwork (God) can publish an offer to the whole network (JV backfill).
export default function OfferManager({ offers, canNetwork = false }: { offers: OfferRow[]; canNetwork?: boolean }) {
  const router = useRouter();
  const [edit, setEdit] = useState<Partial<OfferRow> | null>(null);
  const [busy, setBusy] = useState(false);

  async function api(body: object) { setBusy(true); const r = await fetch("/api/offers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); setBusy(false); if (r.ok) router.refresh(); return r.ok; }
  async function save() {
    if (!edit?.name?.trim()) return;
    const ok = await api({ action: "save", id: edit.id, name: edit.name, description: edit.description, url: edit.url, payoutDollars: ((edit.payoutCents || 0) / 100) || (edit as { payoutDollars?: number }).payoutDollars, category: edit.category, scope: edit.scope, active: edit.active });
    if (ok) setEdit(null);
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => setEdit({ name: "", description: "", url: "", payoutCents: 0, category: "", scope: "account", active: true })} className="btn btn-brand text-sm !py-1.5">+ New offer</button>
      </div>
      <div className="card !p-0 overflow-hidden">
        <table>
          <thead><tr><th>Offer</th><th>Category</th><th className="text-right">Payout</th><th>Scope</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {offers.map((o) => (
              <tr key={o.id}>
                <td className="font-medium">{o.name}<div className="text-xs text-[var(--muted)] truncate max-w-xs">{o.url || o.description}</div></td>
                <td className="text-[var(--muted)] text-sm">{o.category || "—"}</td>
                <td className="text-right">{o.payoutCents ? `$${(o.payoutCents / 100).toFixed(0)}` : "—"}</td>
                <td><span className={`text-xs ${o.scope === "network" ? "text-[var(--brand)]" : "text-[var(--muted)]"}`}>{o.scope}</span></td>
                <td><span className={`text-xs ${o.active ? "text-[var(--brand)]" : "text-[var(--danger)]"}`}>{o.active ? "live" : "paused"}</span></td>
                <td className="text-right whitespace-nowrap">
                  <button onClick={() => setEdit({ ...o, payoutCents: o.payoutCents })} className="text-[var(--brand)] text-sm hover:underline mr-3">edit</button>
                  <button onClick={() => api({ action: "toggle", id: o.id })} disabled={busy} className="text-[var(--muted)] text-sm hover:underline">{o.active ? "pause" : "resume"}</button>
                </td>
              </tr>
            ))}
            {offers.length === 0 && <tr><td colSpan={6} className="text-center text-[var(--muted)] py-8">No offers yet — create one to put it in front of creators.</td></tr>}
          </tbody>
        </table>
      </div>

      {edit && (
        <div className="card !p-4 mt-3 space-y-2 max-w-lg">
          <div className="font-semibold text-sm">{edit.id ? "Edit offer" : "New offer"}</div>
          <input placeholder="Offer name *" value={edit.name || ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
          <input placeholder="Destination URL (where the lead lands)" value={edit.url || ""} onChange={(e) => setEdit({ ...edit, url: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Category" value={edit.category || ""} onChange={(e) => setEdit({ ...edit, category: e.target.value })} />
            <input type="number" placeholder="Payout $ / activation" defaultValue={edit.payoutCents ? edit.payoutCents / 100 : ""} onChange={(e) => setEdit({ ...edit, payoutCents: Math.round(Number(e.target.value) * 100) })} />
          </div>
          <textarea placeholder="Short description" rows={2} value={edit.description || ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
          {canNetwork && (
            <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <input type="checkbox" className="!w-auto" checked={edit.scope === "network"} onChange={(e) => setEdit({ ...edit, scope: e.target.checked ? "network" : "account" })} />
              Publish to the whole network (JV backfill — promotable by all creators)
            </label>
          )}
          <div className="flex gap-2">
            <button onClick={save} disabled={busy || !edit.name?.trim()} className="btn btn-brand text-sm">{busy ? "Saving…" : "Save offer"}</button>
            <button onClick={() => setEdit(null)} className="btn btn-ghost text-sm">Cancel</button>
            {edit.id && <button onClick={() => { api({ action: "delete", id: edit.id }); setEdit(null); }} className="btn btn-ghost text-sm text-[var(--danger)] ml-auto">Delete</button>}
          </div>
        </div>
      )}
    </div>
  );
}
