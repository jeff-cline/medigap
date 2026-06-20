"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Pixel = { id: string; name: string; code: string; siteId: string | null; active: boolean };
type Site = { id: string; name: string; hostname: string };

export default function PixelManager({ pixels, sites }: { pixels: Pixel[]; sites: Site[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Pixel | null>(null);
  const [adding, setAdding] = useState(false);
  const siteName = (id: string | null) => (id ? sites.find((s) => s.id === id)?.name || "site" : "All sites (global)");

  async function call(body: object) {
    await fetch("/api/pixels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-[var(--muted)]">{pixels.length} pixel{pixels.length === 1 ? "" : "s"} across your sites</div>
        {!adding && !editing && <button onClick={() => setAdding(true)} className="btn btn-brand text-sm !py-1.5">+ Add Pixel</button>}
      </div>

      {(adding || editing) && (
        <PixelForm
          sites={sites}
          initial={editing}
          onCancel={() => { setAdding(false); setEditing(null); }}
          onSave={async (data) => { await call(editing ? { action: "update", id: editing.id, ...data } : { action: "create", ...data }); setAdding(false); setEditing(null); }}
        />
      )}

      <div className="space-y-2 mt-3">
        {pixels.length === 0 && !adding && <div className="card !p-4 text-sm text-[var(--muted)]">No pixels yet. Click <b>Add Pixel</b> to install one (it injects into the &lt;head&gt; of your sites).</div>}
        {pixels.map((p) => (
          <div key={p.id} className="card !p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium flex items-center gap-2">{p.name}
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.siteId ? "bg-[var(--brand2)]/15 text-[var(--brand2)]" : "bg-[var(--gold)]/15 text-[var(--gold)]"}`}>{siteName(p.siteId)}</span>
                {!p.active && <span className="text-[10px] text-[var(--danger)]">paused</span>}
              </div>
              <div className="text-xs text-[var(--muted)] truncate font-mono max-w-[520px]">{p.code.replace(/\s+/g, " ").slice(0, 90)}…</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => { setEditing(p); setAdding(false); }} className="btn btn-ghost text-xs !py-1 !px-2.5">Edit</button>
              <button onClick={() => call({ action: "toggle", id: p.id })} className="btn btn-ghost text-xs !py-1 !px-2.5">{p.active ? "Pause" : "Activate"}</button>
              <button onClick={() => call({ action: "delete", id: p.id })} className="text-[var(--danger)] text-xs hover:opacity-70 px-1">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PixelForm({ sites, initial, onSave, onCancel }: { sites: Site[]; initial: Pixel | null; onSave: (d: { name: string; code: string; siteId: string | null }) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name || "");
  const [code, setCode] = useState(initial?.code || "");
  const [siteId, setSiteId] = useState(initial?.siteId || "");
  const [busy, setBusy] = useState(false);
  return (
    <div className="card glow p-4">
      <label className="text-xs uppercase tracking-wide text-[var(--muted)]">Pixel name (KPI)</label>
      <input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Vibe.co — page views" />
      <label className="text-xs uppercase tracking-wide text-[var(--muted)] mt-3 block">Apply to</label>
      <select className="mt-1" value={siteId} onChange={(e) => setSiteId(e.target.value)}>
        <option value="">All sites (global)</option>
        {sites.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.hostname}</option>)}
      </select>
      <label className="text-xs uppercase tracking-wide text-[var(--muted)] mt-3 block">Pixel code (pasted between &lt;head&gt; tags)</label>
      <textarea className="mt-1 font-mono text-xs" rows={6} value={code} onChange={(e) => setCode(e.target.value)} placeholder="<script>…</script>" />
      <div className="flex items-center gap-2 mt-3">
        <button disabled={busy || !name || !code} onClick={async () => { setBusy(true); await onSave({ name, code, siteId: siteId || null }); setBusy(false); }} className="btn btn-brand text-sm">{initial ? "Save pixel" : "Install pixel"}</button>
        <button onClick={onCancel} className="btn btn-ghost text-sm">Cancel</button>
      </div>
    </div>
  );
}
