"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type ListOpt = { id: string; name: string; total: number; sendable: number };

// "Add to Bucket": drop another list into an existing campaign and start sending it.
export default function AddToBucket({ campaignId, campaignName, lists }: { campaignId: string; campaignName: string; lists: ListOpt[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [listId, setListId] = useState(lists[0]?.id || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const add = async () => {
    if (!listId) { setErr("Pick a list."); return; }
    setBusy(true); setErr(null); setDone(null);
    try {
      const res = await fetch(`/api/fire/campaigns/${campaignId}/enroll`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ listId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || `Failed (${res.status})`);
      setDone(`Added ${data.added} new lead${data.added === 1 ? "" : "s"}${data.skipped ? ` · ${data.skipped} already in this campaign` : ""} — sending started.`);
      router.refresh();
      if (data.added === 0) setErr("No new leads to add (all were already in this campaign).");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally { setBusy(false); }
  };

  return (
    <>
      <button onClick={() => { setOpen(true); setDone(null); setErr(null); }} className="rounded bg-[var(--panel2)] px-2.5 py-1 text-xs font-semibold hover:bg-[var(--border)]">➕ Add to Bucket</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold">➕ Add to Bucket — {campaignName}</h2>
              <button className="text-[var(--muted)] hover:text-[var(--text)]" onClick={() => setOpen(false)}>✕</button>
            </div>
            <p className="mb-3 text-xs text-[var(--muted)]">Drop another list into this campaign. Its contacts are added as fresh recipients (duplicates skipped) and sending starts right away on this same campaign.</p>

            {err && <div className="mb-3 rounded border border-[var(--danger)] text-[var(--danger)] text-sm px-3 py-2">{err}</div>}
            {done && <div className="mb-3 rounded border border-[color:#22c55e] text-[color:#22c55e] text-sm px-3 py-2">{done}</div>}

            <label className="block text-xs text-[var(--muted)] mb-1">List</label>
            {lists.length === 0 ? (
              <div className="text-sm text-[var(--muted)] mb-3">No lists yet — upload one in the Lists section below first.</div>
            ) : (
              <select className="w-full rounded border border-[var(--border)] bg-[var(--panel2)] px-2 py-1.5 text-sm mb-4" value={listId} onChange={(e) => setListId(e.target.value)}>
                {lists.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.total} contacts · {l.sendable} sendable)</option>)}
              </select>
            )}

            <div className="flex justify-end gap-2">
              <button className="rounded px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--text)]" onClick={() => setOpen(false)}>Close</button>
              <button className="rounded bg-gradient-to-r from-[#14b8a6] to-[#0d9488] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50" disabled={busy || !listId} onClick={add}>{busy ? "Adding…" : "Add & start 🚀"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
