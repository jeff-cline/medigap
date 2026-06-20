"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type App = { id: string; businessName: string; status: string; revSharePct: number; hostname: string; siteId: string | null; ownerId: string | null };

export default function PartnerRow({ app }: { app: App }) {
  const router = useRouter();
  const [pct, setPct] = useState(String(app.revSharePct));
  const [coupon, setCoupon] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function call(body: object) {
    setBusy(true); setMsg("");
    const r = await fetch("/api/partners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: app.id, ...body }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (d.error) setMsg(`✗ ${d.error}`); else router.refresh();
    return d;
  }
  async function generate() { const d = await call({ action: "generate" }); if (d.ok) setMsg(`✓ Site ${d.hostname} generated — owner ${d.ownerEmail} / TEMP!234`); }
  async function upgrade(kind: string) { const d = await call({ action: "upgrade", kind, couponCode: coupon }); if (d.ok) setMsg(`✓ ${kind} ordered — $${(d.paidCents / 100).toFixed(0)}${d.discountCents ? ` (−$${(d.discountCents / 100).toFixed(0)} coupon)` : ""}${d.runway ? " · generating" : " · queued (connect RunwayML)"}`); }

  return (
    <div className="card !p-4 mb-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <span className="font-semibold">{app.businessName}</span>
          <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full ${app.status === "generated" ? "bg-[var(--brand)]/15 text-[var(--brand)]" : app.status === "rejected" ? "bg-[var(--danger)]/15 text-[var(--danger)]" : "bg-[var(--gold)]/15 text-[var(--gold)]"}`}>{app.status}</span>
          {app.hostname && <span className="ml-2 text-xs text-[var(--muted)]">{app.hostname}</span>}
        </div>
        <a href={`/dashboard/partners/${app.id}`} className="text-xs text-[var(--brand)]">Full intake →</a>
      </div>
      <div className="flex items-center gap-2 mt-3 flex-wrap text-sm">
        <span className="text-[var(--muted)] text-xs">Rev-share %</span>
        <input className="!w-16" value={pct} onChange={(e) => setPct(e.target.value)} />
        <button onClick={() => call({ action: "revshare", pct: Number(pct) })} disabled={busy} className="btn btn-ghost text-xs !py-1">Set</button>
        <span className="text-[var(--border)]">|</span>
        {app.status !== "generated" ? (
          <button onClick={generate} disabled={busy} className="btn btn-brand text-xs !py-1.5">⚡ Generate baked site</button>
        ) : (
          <>
            <a href={`/dashboard/partners/${app.id}/brand-kit`} target="_blank" className="btn btn-ghost text-xs !py-1.5">📄 Brand guidelines</a>
            <input className="!w-32" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="coupon" />
            <button onClick={() => upgrade("video")} disabled={busy} className="btn btn-ghost text-xs !py-1.5">🎬 Video upgrade $1,500</button>
            <button onClick={() => upgrade("mediakit")} disabled={busy} className="btn btn-ghost text-xs !py-1.5">🎨 Media kit $1,500</button>
          </>
        )}
        {app.status === "new" && <button onClick={() => call({ action: "reject" })} disabled={busy} className="text-[var(--danger)] text-xs px-1">Reject</button>}
      </div>
      {msg && <div className="text-xs mt-2" style={{ color: msg.startsWith("✓") ? "var(--brand)" : "var(--danger)" }}>{msg}</div>}
    </div>
  );
}
