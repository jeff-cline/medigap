"use client";
import { useState } from "react";

type Site = { host: string; name: string; on: boolean; pubId: string; usingDefault: boolean };

export default function AdsenseToggles({ sites, defaultPub }: { sites: Site[]; defaultPub: string }) {
  const [on, setOn] = useState(() => Object.fromEntries(sites.map((s) => [s.host, s.on])));
  const [pubs, setPubs] = useState(() => Object.fromEntries(sites.map((s) => [s.host, s.pubId])));
  const [busy, setBusy] = useState("");
  const [saved, setSaved] = useState("");

  async function save(host: string, body: Record<string, unknown>, tag: string) {
    setBusy(tag);
    const r = await fetch("/api/adsense", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ host, ...body }) }).then((x) => x.json()).catch(() => ({}));
    setBusy("");
    if (r.ok) { if (body.on !== undefined) setOn((s) => ({ ...s, [host]: r.on })); if (body.pubId !== undefined) { setPubs((s) => ({ ...s, [host]: r.pubId })); setSaved(host); setTimeout(() => setSaved(""), 1500); } }
  }

  return (
    <div className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)]">
      {sites.map((s) => (
        <div key={s.host} className="flex flex-wrap items-center gap-3 px-4 py-3">
          <div className="min-w-[180px]">
            <div className="font-medium">{s.name}</div>
            <a href={`https://${s.host}`} target="_blank" className="text-xs text-[var(--brand)]">{s.host} ↗</a>
          </div>

          {/* per-site publisher id */}
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <input
              value={pubs[s.host] ?? ""} onChange={(e) => setPubs((p) => ({ ...p, [s.host]: e.target.value }))}
              placeholder={`${defaultPub} (default)`}
              className="w-full rounded border border-[var(--border)] bg-[var(--panel2)] px-3 py-1.5 text-xs font-mono" />
            <button onClick={() => save(s.host, { pubId: pubs[s.host] || "" }, "p" + s.host)} disabled={!!busy} className="btn btn-ghost text-xs whitespace-nowrap">
              {busy === "p" + s.host ? "…" : saved === s.host ? "✓ saved" : "Save"}
            </button>
          </div>
          {!pubs[s.host] && <span className="text-[10px] text-[var(--muted)]">using default</span>}

          {/* on/off */}
          <button onClick={() => save(s.host, { on: !on[s.host] }, "t" + s.host)} disabled={!!busy}
            className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${on[s.host] ? "bg-[var(--brand2,#16a34a)]" : "bg-[var(--border)]"}`}
            title={on[s.host] ? "AdSense ON" : "AdSense OFF"}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on[s.host] ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>
      ))}
    </div>
  );
}
