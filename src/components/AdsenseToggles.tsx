"use client";
import { useState } from "react";

export default function AdsenseToggles({ sites }: { sites: { host: string; name: string; on: boolean }[] }) {
  const [state, setState] = useState(() => Object.fromEntries(sites.map((s) => [s.host, s.on])));
  const [busy, setBusy] = useState("");

  async function toggle(host: string) {
    const next = !state[host];
    setBusy(host);
    const r = await fetch("/api/adsense", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ host, on: next }) }).then((x) => x.json()).catch(() => ({}));
    setBusy("");
    if (r.ok) setState((s) => ({ ...s, [host]: r.on }));
  }

  return (
    <div className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)]">
      {sites.map((s) => (
        <div key={s.host} className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="font-medium">{s.name}</div>
            <a href={`https://${s.host}`} target="_blank" className="text-xs text-[var(--brand)]">{s.host} ↗</a>
          </div>
          <button onClick={() => toggle(s.host)} disabled={!!busy}
            className={`relative h-6 w-11 rounded-full transition-colors ${state[s.host] ? "bg-[var(--brand2,#16a34a)]" : "bg-[var(--border)]"}`}
            title={state[s.host] ? "AdSense ON" : "AdSense OFF"}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${state[s.host] ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>
      ))}
    </div>
  );
}
