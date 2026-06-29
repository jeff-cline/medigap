"use client";
import { useState } from "react";
import Link from "next/link";

type Vert = { id: string; vertical: string; label: string; quadTag: string; isTest: boolean; hasEndpoint: boolean };
type Props = { affiliateId: string; mode: string; verticals: Vert[] };

async function post(body: Record<string, unknown>) {
  const r = await fetch("/api/affiliates", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return r.json().catch(() => ({}));
}

const MODES = [
  { key: "off", label: "Off" },
  { key: "observe", label: "👁 Observe (test)" },
  { key: "live", label: "🟢 Live" },
];

function VerticalRow({ v, onLive }: { v: Vert; onLive: (mode: string) => void }) {
  const [tag, setTag] = useState(v.quadTag);
  const [isTest, setIsTest] = useState(v.isTest);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    const r = await post({ action: "saveQuadTag", verticalId: v.id, quadTag: tag });
    setBusy(false);
    if (r.ok) {
      const mine = (r.verticals || []).find((x: { id: string }) => x.id === v.id);
      if (mine) setIsTest(!mine.isProd);
      if (r.autoLive) onLive("live");
      setResult(r.autoLive ? "✅ Saved — all verticals now PROD → went LIVE!" : "Saved.");
      setTimeout(() => setResult(null), 4000);
    }
  }
  async function test() {
    setBusy(true); setResult("Pinging…");
    const r = await post({ action: "pingTest", verticalId: v.id });
    setBusy(false);
    if (r?.ping) {
      const p = r.ping;
      setResult(p.ok ? `✅ Commission $${(p.bidCents / 100).toFixed(2)}${p.qualifySec ? ` · qualify ${p.qualifySec}s` : ""}` : `↩︎ ${p.status}: ${p.message}`);
    } else setResult(`⚠️ ${r?.error || "no response"}`);
  }

  return (
    <div className="rounded-lg border border-[var(--border)] p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium">{v.label}</span>
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${isTest ? "bg-[var(--gold)]/15 text-[var(--gold)]" : "bg-[var(--brand)]/15 text-[var(--brand)]"}`}>{isTest ? "TEST tag" : "PROD tag"}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="paste production quadTag…" className="flex-1 min-w-[220px] rounded border border-[var(--border)] bg-[var(--panel2)] px-2 py-1.5 text-xs font-mono" />
        <button onClick={save} disabled={busy} className="btn btn-brand text-xs !py-1.5">Save</button>
        {v.hasEndpoint && <button onClick={test} disabled={busy} className="btn btn-ghost text-xs !py-1.5">⚡ Test</button>}
      </div>
      {result && <div className="mt-1.5 text-[11px] text-[var(--muted)] font-mono break-all">{result}</div>}
    </div>
  );
}

export default function QuinStreetCard({ affiliateId, mode: initialMode, verticals }: Props) {
  const [mode, setMode] = useState(initialMode);
  const allProd = verticals.length > 0 && verticals.every((v) => !v.isTest);
  const statusBadge = mode === "live" ? "🟢 LIVE" : mode === "observe" ? "👁 OBSERVE (testing)" : "○ OFF";

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--brand)]/10 text-lg">🔁</div>
          <div>
            <div className="font-semibold">QuinStreet — Affiliate Call Network</div>
            <div className="text-xs text-[var(--muted)]">Ping-post-tree backstop monetization for inbound calls</div>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${mode === "live" ? "bg-[var(--brand)]/15 text-[var(--brand)]" : mode === "observe" ? "bg-[var(--gold)]/15 text-[var(--gold)]" : "bg-[var(--panel2)] text-[var(--muted)]"}`}>{statusBadge}</span>
      </div>

      {/* what you need */}
      <div className="rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-3 text-xs mb-4">
        <b className="text-[var(--text)]">What you need from QuinStreet to go live:</b> your <b>production quadTag</b> for each vertical
        (one per Medicare/Health, Home, Life, Auto) — from your account manager. <b>That&apos;s the only credential</b> —
        there&apos;s no separate API key or token. Paste each below and hit Save; <b className="text-[var(--brand)]">the moment all four are production tags, it flips to LIVE automatically</b> and starts routing calls.
      </div>

      {/* on/off / mode — controllable right here */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-[var(--muted)] mr-1">Routing:</span>
        {MODES.map((m) => (
          <button key={m.key}
            onClick={async () => { const r = await post({ action: "setMode", id: affiliateId, mode: m.key }); if (r.ok) setMode(r.mode); }}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${mode === m.key ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]" : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"}`}>
            {m.label}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-[var(--muted)]">{allProd ? "all verticals on prod tags" : "still on test tags"}</span>
      </div>

      <div className="space-y-2">
        {verticals.map((v) => <VerticalRow key={v.id} v={v} onLive={setMode} />)}
      </div>

      <p className="text-[11px] text-[var(--muted)] mt-3">
        Endpoints are pre-wired to QuinStreet&apos;s environment. If your account manager gives you a <b>different production host</b>
        (vs. the stage <code>quinstage.com</code>), update the Ping/Post URLs in <Link href="/dashboard/affiliates" className="text-[var(--brand)]">Affiliate Network</Link>.
        Full per-call log lives in the <Link href="/dashboard/ping-tree" className="text-[var(--brand)]">Ping Tree</Link>.
      </p>
    </div>
  );
}
