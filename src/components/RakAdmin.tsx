"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Page = { id: string; slug: string; moneyWord: string; title: string; active: boolean; views: number };
type Offer = { id: string; advertiser: string; title: string; approved: boolean; category: string };

async function api(body: Record<string, unknown>) {
  return fetch("/api/rak", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()).catch(() => ({}));
}

export default function RakAdmin({ ready, pages, offers }: { ready: boolean; pages: Page[]; offers: Offer[] }) {
  const router = useRouter();
  const [moneyWord, setMoneyWord] = useState("");
  const [headline, setHeadline] = useState("");
  const [intro, setIntro] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [kw, setKw] = useState("");

  async function createPage() {
    if (!moneyWord.trim()) { setMsg("Enter the money word / keyword."); return; }
    setBusy("create");
    const r = await api({ action: "createPage", moneyWord, slug: moneyWord, title: `${moneyWord} — 1-800-MEDIGAP`, headline: headline || moneyWord, intro });
    setBusy(""); setMsg(r.ok ? `✅ Page live at medig.app/${r.slug}` : `⚠️ ${r.error || "failed"}`);
    if (r.ok) { setMoneyWord(""); setHeadline(""); setIntro(""); router.refresh(); }
  }
  async function act(body: Record<string, unknown>, tag: string) { setBusy(tag); const r = await api(body); setBusy(""); if (r.note || r.error) setMsg(r.note || r.error); if (r.pulled !== undefined) setMsg(`Pulled ${r.pulled}, added ${r.added}. ${r.note || ""}`); if (r.imported !== undefined) setMsg(`Fetched ${r.fetched}, imported ${r.imported} commissions.`); router.refresh(); }

  return (
    <div className="mt-8 space-y-6">
      {/* create keyword page */}
      <div className="card p-5">
        <div className="font-semibold mb-1">➕ New keyword lander</div>
        <p className="text-xs text-[var(--muted)] mb-3">Tie a lander to a money word. Trigger word <b>MEDICARE INSURANCE</b> → <b>medig.app/medicare-insurance</b>. Text that link; it opens the toll-free + offers page.</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm">Money word / keyword<input value={moneyWord} onChange={(e) => setMoneyWord(e.target.value)} placeholder="Medicare Insurance" className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--panel2)] px-3 py-2 text-sm" /></label>
          <label className="text-sm">Headline<input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Top Medicare savings for seniors" className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--panel2)] px-3 py-2 text-sm" /></label>
          <label className="text-sm">Intro copy<input value={intro} onChange={(e) => setIntro(e.target.value)} placeholder="Optimized SEO/lead copy…" className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--panel2)] px-3 py-2 text-sm" /></label>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <button onClick={createPage} disabled={!!busy} className="btn btn-brand text-sm">{busy === "create" ? "Saving…" : "Create page"}</button>
          {msg && <span className="text-xs text-[var(--muted)]">{msg}</span>}
        </div>
      </div>

      {/* pages list */}
      <div className="card p-5">
        <div className="font-semibold mb-3">Keyword landers ({pages.length})</div>
        {pages.length === 0 ? <p className="text-sm text-[var(--muted)]">None yet.</p> : (
          <div className="space-y-2">{pages.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] pb-2 last:border-0">
              <a href={`https://medig.app/${p.slug}`} target="_blank" className="text-[var(--brand)] font-medium">medig.app/{p.slug}</a>
              <span className="text-xs text-[var(--muted)]">{p.moneyWord} · {p.views} views</span>
              <div className="ml-auto flex gap-2">
                <button onClick={() => act({ action: "updatePage", id: p.id, active: !p.active }, "t" + p.id)} className="btn btn-ghost text-xs">{p.active ? "Unpublish" : "Publish"}</button>
                <button onClick={() => { if (confirm("Delete this page?")) act({ action: "deletePage", id: p.id }, "d" + p.id); }} className="btn btn-ghost text-xs text-[var(--danger)]">Delete</button>
              </div>
            </div>
          ))}</div>
        )}
      </div>

      {/* offers: pull + approve */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="font-semibold">Rakuten offers ({offers.filter((o) => o.approved).length} approved / {offers.length})</div>
          <div className="flex items-center gap-2">
            <input value={kw} onChange={(e) => setKw(e.target.value)} placeholder="keyword (e.g. medicare)" className="rounded border border-[var(--border)] bg-[var(--panel2)] px-3 py-1.5 text-sm" />
            <button onClick={() => act({ action: "pullOffers", keyword: kw }, "pull")} disabled={!ready || !!busy} className="btn btn-brand text-xs" title={ready ? "" : "Add Rakuten keys first"}>{busy === "pull" ? "Pulling…" : "⬇ Pull offers"}</button>
            <button onClick={() => act({ action: "importTransactions" }, "imp")} disabled={!ready || !!busy} className="btn btn-ghost text-xs">{busy === "imp" ? "Importing…" : "↻ Import commissions"}</button>
          </div>
        </div>
        {offers.length === 0 ? <p className="text-sm text-[var(--muted)]">No offers cached yet — add your Rakuten SID and click <b>Pull offers</b>. Only <b>approved</b> offers show on the public landers.</p> : (
          <div className="space-y-1.5 max-h-96 overflow-auto">{offers.map((o) => (
            <div key={o.id} className="flex items-center gap-3 text-sm border-b border-[var(--border)] pb-1.5 last:border-0">
              <input type="checkbox" checked={o.approved} onChange={(e) => act({ action: "approveOffer", id: o.id, approved: e.target.checked }, "a" + o.id)} title="Approved to show publicly" />
              <div className="min-w-0 flex-1"><span className="font-medium">{o.title}</span> <span className="text-xs text-[var(--muted)]">{o.advertiser}{o.category ? " · " + o.category : ""}</span></div>
              {o.approved && <span className="text-[10px] text-[var(--brand2)] font-semibold">APPROVED</span>}
            </div>
          ))}</div>
        )}
      </div>
    </div>
  );
}
