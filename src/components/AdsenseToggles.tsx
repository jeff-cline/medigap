"use client";
import { useState } from "react";

type Site = { host: string; name: string; on: boolean; pubId: string; usingDefault: boolean };

function Copy({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard?.writeText(text); setDone(true); setTimeout(() => setDone(false), 1200); }}
      className="btn btn-ghost text-[11px] whitespace-nowrap">{done ? "✓ copied" : "Copy"}</button>
  );
}

export default function AdsenseToggles({ sites, defaultPub }: { sites: Site[]; defaultPub: string }) {
  const [on, setOn] = useState(() => Object.fromEntries(sites.map((s) => [s.host, s.on])));
  const [pubs, setPubs] = useState(() => Object.fromEntries(sites.map((s) => [s.host, s.pubId])));
  const [busy, setBusy] = useState("");
  const [saved, setSaved] = useState("");
  const [open, setOpen] = useState<string>("");

  async function save(host: string, body: Record<string, unknown>, tag: string) {
    setBusy(tag);
    const r = await fetch("/api/adsense", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ host, ...body }) }).then((x) => x.json()).catch(() => ({}));
    setBusy("");
    if (r.ok) { if (body.on !== undefined) setOn((s) => ({ ...s, [host]: r.on })); if (body.pubId !== undefined) { setPubs((s) => ({ ...s, [host]: r.pubId })); setSaved(host); setTimeout(() => setSaved(""), 1500); } }
  }

  const effPub = (host: string) => (pubs[host]?.trim() || defaultPub);
  const metaTag = (host: string) => `<meta name="google-adsense-account" content="${effPub(host)}">`;
  const adsTxt = (host: string) => `google.com, ${effPub(host).replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0`;

  return (
    <div className="space-y-2">
      {sites.map((s) => (
        <div key={s.host} className="rounded-xl border border-[var(--border)]">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="min-w-[170px]">
              <div className="font-medium">{s.name}</div>
              <a href={`https://${s.host}`} target="_blank" className="text-xs text-[var(--brand)]">{s.host} ↗</a>
            </div>
            {/* per-site publisher id */}
            <div className="flex items-center gap-2 flex-1 min-w-[230px]">
              <input value={pubs[s.host] ?? ""} onChange={(e) => setPubs((p) => ({ ...p, [s.host]: e.target.value }))} placeholder={`${defaultPub} (default)`}
                className="w-full rounded border border-[var(--border)] bg-[var(--panel2)] px-3 py-1.5 text-xs font-mono" />
              <button onClick={() => save(s.host, { pubId: pubs[s.host] || "" }, "p" + s.host)} disabled={!!busy} className="btn btn-ghost text-xs whitespace-nowrap">
                {busy === "p" + s.host ? "…" : saved === s.host ? "✓ saved" : "Save"}
              </button>
            </div>
            <button onClick={() => setOpen(open === s.host ? "" : s.host)} className="btn btn-ghost text-xs whitespace-nowrap">Verify {open === s.host ? "▲" : "▾"}</button>
            {/* on/off */}
            <button onClick={() => save(s.host, { on: !on[s.host] }, "t" + s.host)} disabled={!!busy}
              className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${on[s.host] ? "bg-[var(--brand2,#16a34a)]" : "bg-[var(--border)]"}`}
              title={on[s.host] ? "AdSense ON" : "AdSense OFF"}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on[s.host] ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>

          {open === s.host && (
            <div className="border-t border-[var(--border)] px-4 py-3 space-y-3 bg-[var(--panel2)]">
              <p className="text-xs text-[var(--muted)]">Three ways to verify <b>{s.host}</b> in AdSense — if the code-snippet method fails, use one of these:</p>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted)] mb-1">1 · Meta tag (paste in &lt;head&gt; — already live)</div>
                <div className="flex items-center gap-2"><code className="flex-1 rounded bg-[var(--panel)] border border-[var(--border)] px-2 py-1.5 text-[11px] break-all">{metaTag(s.host)}</code><Copy text={metaTag(s.host)} /></div>
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted)] mb-1">2 · ads.txt line (already served at /ads.txt)</div>
                <div className="flex items-center gap-2"><code className="flex-1 rounded bg-[var(--panel)] border border-[var(--border)] px-2 py-1.5 text-[11px] break-all">{adsTxt(s.host)}</code><Copy text={adsTxt(s.host)} /></div>
                <a href={`https://${s.host}/ads.txt`} target="_blank" className="text-[11px] text-[var(--brand)] mt-1 inline-block">View live: {s.host}/ads.txt ↗</a>
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted)] mb-1">3 · Code snippet — the adsbygoogle.js script is already on every page of this site.</div>
                <p className="text-[11px] text-[var(--muted)]">In AdSense pick <b>“Meta tag”</b> or <b>“Ads.txt snippet”</b> as the method if the snippet method won’t verify. All three point to <b>{effPub(s.host)}</b>.</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
