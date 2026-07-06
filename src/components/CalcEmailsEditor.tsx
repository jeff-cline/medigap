"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Email = { weekIndex: number; subject: string; storyHeader: string; active: boolean };

export default function CalcEmailsEditor({ emails }: { emails: Email[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(() => Object.fromEntries(emails.map((e) => [e.weekIndex, e])));
  const [busy, setBusy] = useState<number | "seed" | null>(null);
  const [saved, setSaved] = useState<number | null>(null);
  const upd = (wi: number, k: keyof Email, v: string | boolean) => setRows((s) => ({ ...s, [wi]: { ...s[wi], [k]: v } }));

  async function api(body: Record<string, unknown>) { return fetch("/api/calc/email", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()).catch(() => ({})); }
  async function save(wi: number) { setBusy(wi); const r = await rows[wi]; await api({ action: "save", ...r }); setBusy(null); setSaved(wi); setTimeout(() => setSaved(null), 1500); }
  async function seed() { setBusy("seed"); await api({ action: "seed" }); setBusy(null); router.refresh(); }

  if (emails.length === 0) return <div className="card p-5"><p className="text-sm text-[var(--muted)] mb-3">No drip emails yet.</p><button onClick={seed} className="btn btn-brand text-sm">{busy === "seed" ? "Seeding…" : "Load the 10 default emails"}</button></div>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted)]">Ten emails rotate one every 10 weeks. Edit the subject and the business-story intro; advertiser blocks are appended automatically (rotated each send).</p>
      {emails.map((e) => { const r = rows[e.weekIndex]; return (
        <div key={e.weekIndex} className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Week {e.weekIndex + 1}</div>
            <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={r.active} onChange={(x) => upd(e.weekIndex, "active", x.target.checked)} /> active</label>
          </div>
          <input value={r.subject} onChange={(x) => upd(e.weekIndex, "subject", x.target.value)} placeholder="Subject line" className="w-full rounded border border-[var(--border)] bg-[var(--panel2)] px-3 py-2 text-sm mb-2" />
          <textarea value={r.storyHeader} onChange={(x) => upd(e.weekIndex, "storyHeader", x.target.value)} placeholder="Business story (HTML allowed — interlink our services)" rows={4} className="w-full rounded border border-[var(--border)] bg-[var(--panel2)] px-3 py-2 text-sm font-mono" />
          <div className="mt-2 flex items-center gap-3"><button onClick={() => save(e.weekIndex)} disabled={busy !== null} className="btn btn-brand text-sm">{busy === e.weekIndex ? "Saving…" : saved === e.weekIndex ? "✓ Saved" : "Save"}</button></div>
        </div>
      ); })}
    </div>
  );
}
