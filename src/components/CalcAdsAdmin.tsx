"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Partner = { id: string; name: string; category: string };
type Ad = { id: string; partnerId: string; partnerName: string; title: string; description: string; imageUrl: string; ctaLabel: string; ctaUrl: string; category: string; sortOrder: number; active: boolean; clicks: number };
const CATS = [["service", "Service partner"], ["advertiser", "Advertiser"], ["adjacent", "Adjacent business"]];

async function api(body: Record<string, unknown>) { return fetch("/api/calc/ads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()).catch(() => ({})); }

export default function CalcAdsAdmin({ partners, ads, signupOn = true }: { partners: Partner[]; ads: Ad[]; signupOn?: boolean }) {
  const router = useRouter();
  const [signup, setSignup] = useState(signupOn);
  const [pName, setPName] = useState(""); const [pCat, setPCat] = useState("advertiser");
  const [ad, setAd] = useState({ partnerId: partners[0]?.id || "", title: "", description: "", imageUrl: "", ctaLabel: "Learn more", ctaUrl: "", category: "advertiser" });
  const [busy, setBusy] = useState(""); const [msg, setMsg] = useState("");
  const inp = "w-full rounded border border-[var(--border)] bg-[var(--panel2)] px-3 py-2 text-sm";

  async function run(body: Record<string, unknown>, tag: string) { setBusy(tag); const r = await api(body); setBusy(""); if (r.error) setMsg(r.error); router.refresh(); }
  async function upload(file: File) { setBusy("up"); const fd = new FormData(); fd.append("file", file); const r = await fetch("/api/upload", { method: "POST", body: fd }).then((x) => x.json()).catch(() => ({})); setBusy(""); if (r.url) setAd((a) => ({ ...a, imageUrl: r.url })); }

  async function toggleSignup() { const next = !signup; setSignup(next); await api({ action: "setPartnerSignup", on: next }); }

  return (
    <div className="space-y-6">
      {/* partner self-signup on/off */}
      <div className="card p-4 flex items-center justify-between">
        <div><div className="font-semibold">Partner self-signup</div><div className="text-xs text-[var(--muted)]">Let businesses create their own partner account + ad at exitoptimization.com/become-a-partner.</div></div>
        <button onClick={toggleSignup} className={`relative h-6 w-11 rounded-full ${signup ? "bg-[var(--brand2,#16a34a)]" : "bg-[var(--border)]"}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${signup ? "left-[22px]" : "left-0.5"}`} /></button>
      </div>

      {/* create partner */}
      <div className="card p-5">
        <div className="font-semibold mb-2">➕ Add a partner</div>
        <div className="flex flex-wrap gap-2 items-center">
          <input value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Partner / business name" className={inp + " max-w-xs"} />
          <select value={pCat} onChange={(e) => setPCat(e.target.value)} className={inp + " max-w-[180px]"}>{CATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          <button onClick={() => { if (pName.trim()) run({ action: "createPartner", name: pName, category: pCat }, "np").then(() => setPName("")); }} disabled={!!busy} className="btn btn-brand text-sm">Add partner</button>
        </div>
      </div>

      {/* create ad */}
      <div className="card p-5">
        <div className="font-semibold mb-2">🖼️ Create an ad block</div>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <select value={ad.partnerId} onChange={(e) => setAd({ ...ad, partnerId: e.target.value })} className={inp}><option value="">— Partner —</option>{partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <select value={ad.category} onChange={(e) => setAd({ ...ad, category: e.target.value })} className={inp}>{CATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          <input value={ad.title} onChange={(e) => setAd({ ...ad, title: e.target.value })} placeholder="Ad title" className={inp} />
          <input value={ad.ctaLabel} onChange={(e) => setAd({ ...ad, ctaLabel: e.target.value })} placeholder="CTA button label" className={inp} />
          <input value={ad.description} onChange={(e) => setAd({ ...ad, description: e.target.value })} placeholder="Description" className={inp + " sm:col-span-2"} />
          <input value={ad.ctaUrl} onChange={(e) => setAd({ ...ad, ctaUrl: e.target.value })} placeholder="CTA URL (partner site — tracked)" className={inp + " sm:col-span-2"} />
          <div className="flex items-center gap-2 sm:col-span-2">
            <input value={ad.imageUrl} onChange={(e) => setAd({ ...ad, imageUrl: e.target.value })} placeholder="Image URL (or upload →)" className={inp} />
            <label className="btn btn-ghost text-sm cursor-pointer whitespace-nowrap">{busy === "up" ? "…" : "⬆ Upload"}<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} /></label>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <button onClick={() => { if (ad.partnerId && ad.title && ad.ctaUrl) run({ action: "createAd", ...ad }, "na").then(() => setAd({ ...ad, title: "", description: "", imageUrl: "", ctaUrl: "" })); else setMsg("Partner, title, and CTA URL are required."); }} disabled={!!busy} className="btn btn-brand text-sm">Create ad</button>
          {msg && <span className="text-xs text-[var(--muted)]">{msg}</span>}
        </div>
      </div>

      {/* ads by category, reorderable */}
      {CATS.map(([cat, label]) => {
        const list = ads.filter((a) => a.category === cat).sort((a, b) => a.sortOrder - b.sortOrder);
        return (
          <div key={cat} className="card p-5">
            <div className="font-semibold mb-3">{label}s ({list.length})</div>
            {list.length === 0 ? <p className="text-sm text-[var(--muted)]">None yet.</p> : (
              <div className="space-y-2">
                {list.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 border-b border-[var(--border)] pb-2 last:border-0">
                    {a.imageUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={a.imageUrl} alt="" className="h-10 w-14 object-cover rounded" /> : <div className="h-10 w-14 rounded bg-[var(--panel2)]" />}
                    <div className="min-w-0 flex-1"><div className="font-medium truncate">{a.title} <span className="text-xs text-[var(--muted)]">· {a.partnerName}</span></div><div className="text-xs text-[var(--muted)] truncate">{a.ctaUrl}</div></div>
                    <div className="text-sm font-bold text-[var(--brand)]">{a.clicks} clicks</div>
                    <div className="flex gap-1">
                      <button onClick={() => run({ action: "reorderAd", id: a.id, dir: "up" }, "u" + a.id)} className="btn btn-ghost text-xs">↑</button>
                      <button onClick={() => run({ action: "reorderAd", id: a.id, dir: "down" }, "d" + a.id)} className="btn btn-ghost text-xs">↓</button>
                      <button onClick={() => run({ action: "updateAd", id: a.id, active: !a.active }, "t" + a.id)} className="btn btn-ghost text-xs">{a.active ? "Hide" : "Show"}</button>
                      <button onClick={() => { if (confirm("Delete ad?")) run({ action: "deleteAd", id: a.id }, "x" + a.id); }} className="btn btn-ghost text-xs text-[var(--danger)]">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
