"use client";
import { useState } from "react";

type Vert = { id: string; label: string; vertical: string; pingUrl: string; postUrl: string; quadTag: string; trackingNumber: string; hasEndpoint: boolean };
type Aff = { id: string; name: string; baseUrl: string; apiKey: string; apiSecret: string; mode: string; verticals: Vert[] };

function VerticalRow({ v }: { v: Vert }) {
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function test() {
    setBusy(true); setResult("Pinging QuinStreet…");
    const r = await post({ action: "pingTest", verticalId: v.id });
    if (r?.ping) {
      const p = r.ping;
      if (p.ok) setResult(`✅ Commission $${(p.bidCents / 100).toFixed(2)}${p.qualifySec ? ` · qualify ${p.qualifySec}s` : ""}${p.matchedClient ? ` · ${p.matchedClient}` : ""} · post ${r.post?.ok ? "accepted" : r.post?.status || "—"}`);
      else setResult(`↩︎ ${p.status} (HTTP ${p.httpStatus}): ${p.message}`);
    } else setResult(`⚠️ ${r?.error || "no response"}`);
    setBusy(false);
  }
  return (
    <div className="rounded-lg border border-[var(--border)] p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">{v.label}</div>
        {v.hasEndpoint && <button onClick={test} disabled={busy} className="btn btn-brand !py-1 text-[11px]">{busy ? "…" : "⚡ Test live ping"}</button>}
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Field label="Ping URL" defv={v.pingUrl} placeholder="https://…/ping" onSave={(val) => post({ action: "setEndpoints", id: v.id, pingUrl: val })} mono />
        <Field label="Post URL" defv={v.postUrl} placeholder="https://…/post" onSave={(val) => post({ action: "setEndpoints", id: v.id, postUrl: val })} mono />
        <Field label="quadTag (prod)" defv={v.quadTag} placeholder="prod quadTag…" onSave={(val) => post({ action: "setEndpoints", id: v.id, quadTag: val })} mono />
        <Field label="Tracking number" defv={v.trackingNumber} placeholder="+1…" onSave={(val) => post({ action: "setEndpoints", id: v.id, trackingNumber: val })} mono />
      </div>
      {result && <div className="mt-2 text-xs rounded bg-[var(--panel2)] px-2 py-1.5 font-mono break-all">{result}</div>}
    </div>
  );
}

async function post(body: Record<string, unknown>) {
  const r = await fetch("/api/affiliates", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return r.json().catch(() => ({}));
}

function Field({ label, defv, onSave, placeholder, mono }: { label: string; defv: string; onSave: (v: string) => void; placeholder?: string; mono?: boolean }) {
  const [v, setV] = useState(defv);
  const [saved, setSaved] = useState(false);
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{label}</span>
      <input
        value={v}
        placeholder={placeholder}
        onChange={(e) => { setV(e.target.value); setSaved(false); }}
        onBlur={() => { if (v !== defv) { onSave(v); setSaved(true); } }}
        className={`mt-1 w-full rounded border border-[var(--border)] bg-[var(--panel2)] px-2 py-1.5 text-sm ${mono ? "font-mono text-xs" : ""}`}
      />
      {saved && <span className="text-[10px] text-[var(--brand)]">saved ✓</span>}
    </label>
  );
}

const MODES: { key: string; label: string; desc: string }[] = [
  { key: "off", label: "Off", desc: "No effect on calls." },
  { key: "observe", label: "Observe", desc: "Live calls ping QuinStreet & log what pinged — call still routes normally. Safe to watch." },
  { key: "live", label: "Live", desc: "Pings, and if QuinStreet outbids the agent it posts & bridges the call to them." },
];

export default function GoLivePanel({ affiliate }: { affiliate: Aff }) {
  const a = affiliate;
  const [mode, setMode] = useState(a.mode || "off");
  return (
    <details className="card overflow-hidden">
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium flex items-center gap-2">
        <span>🔌</span> Go live — {a.name} mode, endpoints, keys &amp; tracking numbers
        <span className="ml-auto text-[11px] text-[var(--muted)]">{mode === "live" ? "🟢 LIVE" : mode === "observe" ? "👁 OBSERVE" : "○ off"}</span>
      </summary>
      <div className="border-t border-[var(--border)] p-4 space-y-5">
        {/* 3-way mode selector */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--panel2)] p-3">
          <div className="text-sm font-medium mb-2">Call routing mode</div>
          <div className="flex gap-2">
            {MODES.map((m) => (
              <button key={m.key}
                onClick={async () => { const r = await post({ action: "setMode", id: a.id, mode: m.key }); if (r.ok) setMode(r.mode); }}
                className={`flex-1 rounded-lg border px-3 py-2 text-left text-xs transition ${mode === m.key ? "border-[var(--brand)] bg-[var(--brand)]/10" : "border-[var(--border)] hover:border-[var(--muted)]"}`}>
                <div className={`font-semibold ${mode === m.key ? "text-[var(--brand)]" : ""}`}>{m.label}</div>
                <div className="text-[var(--muted)] mt-0.5">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>
        {/* partner creds */}
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="API base URL" defv={a.baseUrl} placeholder="https://api.quinstreet.com/..." onSave={(v) => post({ action: "setCreds", id: a.id, baseUrl: v })} mono />
          <Field label="API key / publisher id" defv={a.apiKey} placeholder="key…" onSave={(v) => post({ action: "setCreds", id: a.id, apiKey: v })} mono />
          <Field label="API secret" defv={a.apiSecret} placeholder="secret…" onSave={(v) => post({ action: "setCreds", id: a.id, apiSecret: v })} mono />
        </div>
        {/* per-vertical endpoints + tracking number + live test */}
        <div className="space-y-3">
          {a.verticals.map((v) => <VerticalRow key={v.id} v={v} />)}
        </div>
        <p className="text-[11px] text-[var(--muted)]">
          Pre-filled with QuinStreet&apos;s <b>stage</b> endpoints + test quadTags — &ldquo;Test live ping&rdquo; hits their real stage API now. Replace the quadTag with your <b>prod</b> tag (from your QuinStreet account manager) to go live. Live call routing stays off until you flip the master switch above.
        </p>
      </div>
    </details>
  );
}
