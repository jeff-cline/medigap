"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EXIT } from "@/lib/exit";

const O = EXIT.colors.orange;
type Ad = { id: string; title: string; description: string; imageUrl: string; ctaLabel: string; ctaUrl: string; active: boolean; clicks: number };
type Lead = { name: string; email: string; phone: string; at: string; adTitle: string };

export default function PartnerPanel({ partnerName, ads, leads }: { partnerName: string; ads: Ad[]; leads: Lead[] }) {
  const router = useRouter();
  const [edit, setEdit] = useState<Record<string, Ad>>(() => Object.fromEntries(ads.map((a) => [a.id, a])));
  const [busy, setBusy] = useState("");
  const inp = "w-full rounded-md border bg-black/30 px-3 py-2 text-white text-sm outline-none focus:border-[color:var(--orange)]";

  async function api(body: Record<string, unknown>, tag: string) { setBusy(tag); const r = await fetch("/api/exit/partner", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((x) => x.json()).catch(() => ({})); setBusy(""); if (r.ok) router.refresh(); }
  async function upload(id: string, file: File) { setBusy("u" + id); const fd = new FormData(); fd.append("file", file); const r = await fetch("/api/upload", { method: "POST", body: fd }).then((x) => x.json()).catch(() => ({})); setBusy(""); if (r.url) setEdit((s) => ({ ...s, [id]: { ...s[id], imageUrl: r.url } })); }
  const upd = (id: string, k: keyof Ad, v: string) => setEdit((s) => ({ ...s, [id]: { ...s[id], [k]: v } }));

  return (
    <div style={{ ["--orange" as string]: O }}>
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div className="rounded-xl border p-4" style={{ borderColor: EXIT.colors.border }}><div className="text-xs uppercase tracking-wide text-slate-400">Your ads</div><div className="text-2xl font-black">{ads.length}</div></div>
        <div className="rounded-xl border p-4" style={{ borderColor: EXIT.colors.border }}><div className="text-xs uppercase tracking-wide text-slate-400">Total clicks</div><div className="text-2xl font-black" style={{ color: O }}>{ads.reduce((s, a) => s + a.clicks, 0)}</div></div>
        <div className="rounded-xl border p-4" style={{ borderColor: EXIT.colors.border }}><div className="text-xs uppercase tracking-wide text-slate-400">Leads</div><div className="text-2xl font-black" style={{ color: O }}>{leads.length}</div></div>
      </div>

      <div className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: EXIT.colors.orange3 }}>Manage your ads</div>
      <div className="space-y-4">
        {ads.map((a) => { const e = edit[a.id]; return (
          <div key={a.id} className="rounded-xl border p-4" style={{ borderColor: EXIT.colors.border, background: EXIT.colors.panel }}>
            <div className="flex items-center justify-between mb-2"><span className="text-sm font-bold">{a.clicks} clicks</span><button onClick={() => api({ action: "updateAd", id: a.id, active: !a.active }, "t" + a.id)} className="text-xs px-2 py-1 rounded border" style={{ borderColor: EXIT.colors.border }}>{a.active ? "Live · pause" : "Paused · go live"}</button></div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input value={e.title} onChange={(x) => upd(a.id, "title", x.target.value)} placeholder="Title" className={inp} />
              <input value={e.ctaLabel} onChange={(x) => upd(a.id, "ctaLabel", x.target.value)} placeholder="CTA label" className={inp} />
              <input value={e.description} onChange={(x) => upd(a.id, "description", x.target.value)} placeholder="Description" className={inp + " sm:col-span-2"} />
              <input value={e.ctaUrl} onChange={(x) => upd(a.id, "ctaUrl", x.target.value)} placeholder="Link (CTA URL)" className={inp + " sm:col-span-2"} />
              <div className="flex items-center gap-2 sm:col-span-2">
                <input value={e.imageUrl} onChange={(x) => upd(a.id, "imageUrl", x.target.value)} placeholder="Image URL" className={inp} />
                <label className="shrink-0 rounded-md border px-3 py-2 text-xs font-bold cursor-pointer" style={{ borderColor: EXIT.colors.border }}>{busy === "u" + a.id ? "…" : "⬆"}<input type="file" accept="image/*" className="hidden" onChange={(x) => x.target.files?.[0] && upload(a.id, x.target.files[0])} /></label>
              </div>
            </div>
            <button onClick={() => api({ action: "updateAd", id: a.id, title: e.title, description: e.description, ctaLabel: e.ctaLabel, ctaUrl: e.ctaUrl, imageUrl: e.imageUrl }, "s" + a.id)} disabled={!!busy} className="mt-3 rounded-md px-4 py-2 text-sm font-bold" style={{ background: O, color: EXIT.colors.bg }}>{busy === "s" + a.id ? "Saving…" : "Save changes"}</button>
          </div>
        ); })}
        {ads.length === 0 && <button onClick={() => api({ action: "createAd", title: partnerName, ctaLabel: "Learn more" }, "new")} className="rounded-md px-4 py-2 text-sm font-bold" style={{ background: O, color: EXIT.colors.bg }}>+ Create your first ad</button>}
      </div>

      <div className="text-sm font-bold uppercase tracking-widest mt-8 mb-3" style={{ color: EXIT.colors.orange3 }}>Your leads (customers who clicked)</div>
      {leads.length === 0 ? <p className="text-slate-400 text-sm">No leads yet — they'll appear here as customers click your ad.</p> : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: EXIT.colors.border }}>
          <table className="w-full text-sm"><thead><tr className="text-[10px] uppercase tracking-wide text-slate-500 border-b" style={{ borderColor: EXIT.colors.border }}><th className="text-left p-3">Name</th><th className="text-left p-3">Email</th><th className="text-left p-3">Phone</th><th className="text-left p-3">Ad</th></tr></thead>
            <tbody>{leads.map((l, i) => <tr key={i} className="border-b last:border-0" style={{ borderColor: EXIT.colors.border }}><td className="p-3">{l.name || "—"}</td><td className="p-3">{l.email || "—"}</td><td className="p-3">{l.phone || "—"}</td><td className="p-3 text-slate-400">{l.adTitle}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
