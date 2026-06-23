"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const inputCls = "mt-1 w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]";

type Category = { value: string; label: string; word: string };

export default function LaunchSiteForm({ partners = [], categories = [] }: { partners?: { id: string; name: string }[]; categories?: Category[] }) {
  const router = useRouter();
  const cats = categories.length ? categories : [{ value: "medicare", label: "Medicare / Medigap", word: "medicare" }];
  const [hostname, setHostname] = useState("");
  const [name, setName] = useState("");
  const [vertical, setVertical] = useState(cats[0]?.value || "medicare");
  const [customCategory, setCustomCategory] = useState("");
  const [kind, setKind] = useState("marketing");
  const [goal, setGoal] = useState("");
  // advanced
  const [adv, setAdv] = useState(false);
  const [mode, setMode] = useState("network");
  const [ownerId, setOwnerId] = useState("");
  const [territoryZips, setTerritoryZips] = useState("");
  const [revShare, setRevShare] = useState("50");
  const [audience, setAudience] = useState("");
  const [primaryCta, setPrimaryCta] = useState("call");
  const [brandColor, setBrandColor] = useState("");
  const [moneyWords, setMoneyWords] = useState("");

  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addingCategory = vertical === "__add";

  async function launch() {
    if (addingCategory && !customCategory.trim()) { setError("Type the new category name."); return; }
    setBusy(true); setError(null); setNote(null);
    try {
      const res = await fetch("/api/sites", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostname, name, vertical, categoryLabel: addingCategory ? customCategory.trim() : undefined, kind, goal, mode, ownerId: ownerId || undefined, territoryZips, affiliateRevSharePct: Number(revShare) || 0, audience, primaryCta, brandColor, moneyWords }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "Could not launch the site."); return; }
      const wordMsg = data.moneyWord ? ` Money word “${data.moneyWord}” is now biddable.` : "";
      const goLive = ` To go LIVE: point ${hostname}'s DNS A-record at the platform server, then run scripts/add-domain.sh ${hostname} on the server to attach the domain + TLS cert. Until then it serves default branding.`;
      setNote(`Created ${hostname}${mode === "standalone" ? " (standalone — owner keeps territory, overflow affiliated)" : ""}.${wordMsg}${goLive}`);
      setHostname(""); setName(""); setGoal(""); setTerritoryZips(""); setCustomCategory(""); setAdv(false);
      router.refresh();
    } finally { setBusy(false); }
  }

  const CategorySelect = ({ id }: { id?: string }) => (
    <>
      <select id={id} value={vertical} onChange={(e) => setVertical(e.target.value)} className={inputCls}>
        {cats.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        <option value="__add">+ Add category…</option>
      </select>
      {addingCategory && (
        <input
          value={customCategory}
          onChange={(e) => setCustomCategory(e.target.value)}
          placeholder="e.g. Senior Services — also creates a biddable money word"
          className={inputCls}
          autoFocus
        />
      )}
    </>
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="text-xs uppercase tracking-wide text-[var(--muted)]">URL / Hostname</label><input value={hostname} onChange={(e) => setHostname(e.target.value)} placeholder="medigap-az.com (already pointed at the IP)" className={inputCls} /></div>
        <div><label className="text-xs uppercase tracking-wide text-[var(--muted)]">Site Name</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Medigap Arizona" className={inputCls} /></div>
        <div><label className="text-xs uppercase tracking-wide text-[var(--muted)]">Category / Vertical</label>
          <CategorySelect /></div>
        <div><label className="text-xs uppercase tracking-wide text-[var(--muted)]">Kind</label>
          <select value={kind} onChange={(e) => setKind(e.target.value)} className={inputCls}><option value="marketing">Marketing (lead/call funnel)</option><option value="management">Management (back-office portal)</option></select></div>
      </div>
      <div><label className="text-xs uppercase tracking-wide text-[var(--muted)]">Goal / Prompt</label>
        <textarea value={goal} onChange={(e) => setGoal(e.target.value)} rows={2} placeholder="Drive AEP Medigap calls in Arizona ZIPs; lead with G-plan savings, fast quote, click-to-call." className={inputCls} /></div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={launch} disabled={busy || !hostname || !name} className="btn btn-brand text-sm">{busy ? "Provisioning…" : "Quick Start launch"}</button>
        <button type="button" onClick={() => setAdv(true)} className="btn btn-ghost text-sm">⚙ Advanced…</button>
        {note && !error && <span className="text-sm text-[var(--brand)]">{note}</span>}
        {error && <span className="text-sm text-[var(--danger)]">{error}</span>}
      </div>

      {adv && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-6 overflow-y-auto" onClick={() => setAdv(false)}>
          <div className="card glow p-6 max-w-2xl w-full my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Advanced site setup</h3>
              <button onClick={() => setAdv(false)} className="text-[var(--muted)] hover:text-[var(--text)]">✕</button>
            </div>
            <p className="text-xs text-[var(--muted)] mb-4">Everything in Quick Start, plus ownership model + deeper intent for a sharper funnel.</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="text-xs uppercase tracking-wide text-[var(--muted)]">Hostname</label><input value={hostname} onChange={(e) => setHostname(e.target.value)} className={inputCls} /></div>
              <div><label className="text-xs uppercase tracking-wide text-[var(--muted)]">Site Name</label><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} /></div>
            </div>

            <div className="card !p-4 mt-4">
              <label className="text-xs uppercase tracking-wide text-[var(--muted)]">Lead ownership</label>
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setMode("network")} className={`btn text-xs !py-1.5 ${mode === "network" ? "btn-brand" : "btn-ghost"}`}>Network (sell to our auction)</button>
                <button type="button" onClick={() => setMode("standalone")} className={`btn text-xs !py-1.5 ${mode === "standalone" ? "btn-brand" : "btn-ghost"}`}>Standalone (owner keeps territory)</button>
              </div>
              {mode === "standalone" && (
                <div className="grid gap-3 sm:grid-cols-2 mt-3">
                  <div><label className="text-xs uppercase tracking-wide text-[var(--muted)]">Owner (partner)</label>
                    <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className={inputCls}><option value="">Select partner…</option>{partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                  <div><label className="text-xs uppercase tracking-wide text-[var(--muted)]">Affiliate rev-share % (overflow)</label><input value={revShare} onChange={(e) => setRevShare(e.target.value)} className={inputCls} placeholder="50" /></div>
                  <div className="sm:col-span-2"><label className="text-xs uppercase tracking-wide text-[var(--muted)]">Their ZIP codes (kept for the owner)</label>
                    <textarea value={territoryZips} onChange={(e) => setTerritoryZips(e.target.value)} rows={2} className={inputCls} placeholder="85001, 85003, 85013 …" /></div>
                  <p className="sm:col-span-2 text-xs text-[var(--muted)]">Leads in these ZIPs go only to the owner. Leads outside route into our network as affiliate inventory — the owner earns the rev-share % on each one we sell (we track first name + the money, not the full record).</p>
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 mt-4">
              <div className="sm:col-span-2"><label className="text-xs uppercase tracking-wide text-[var(--muted)]">Target audience / intent</label><input value={audience} onChange={(e) => setAudience(e.target.value)} className={inputCls} placeholder="AZ seniors 65-75 turning 65, G-plan shoppers, snowbirds" /></div>
              <div><label className="text-xs uppercase tracking-wide text-[var(--muted)]">Primary CTA</label>
                <select value={primaryCta} onChange={(e) => setPrimaryCta(e.target.value)} className={inputCls}><option value="call">Click-to-call</option><option value="form">Lead form</option></select></div>
              <div><label className="text-xs uppercase tracking-wide text-[var(--muted)]">Brand color (hex)</label><input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className={inputCls} placeholder="#16d6a5" /></div>
              <div className="sm:col-span-2"><label className="text-xs uppercase tracking-wide text-[var(--muted)]">Money words to emphasize</label><input value={moneyWords} onChange={(e) => setMoneyWords(e.target.value)} className={inputCls} placeholder="incontinence, hearing aids, dental" /></div>
              <div className="sm:col-span-2"><label className="text-xs uppercase tracking-wide text-[var(--muted)]">Goal / Prompt</label><textarea value={goal} onChange={(e) => setGoal(e.target.value)} rows={2} className={inputCls} /></div>
            </div>

            <div className="flex items-center gap-3 mt-5">
              <button type="button" onClick={launch} disabled={busy || !hostname || !name} className="btn btn-brand text-sm">{busy ? "Provisioning…" : "Launch site"}</button>
              <button type="button" onClick={() => setAdv(false)} className="btn btn-ghost text-sm">Cancel</button>
              {error && <span className="text-sm text-[var(--danger)]">{error}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
