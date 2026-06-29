"use client";
import { useState } from "react";
import { Badge } from "@/components/ui";

type Row = { id: string; name: string; email: string; refCode: string; connected: boolean; accountName: string; pages: number; lastError: string };

export default function CreatorConnections({ rows }: { rows: Row[] }) {
  const [busy, setBusy] = useState<string | null>(null);

  async function impersonate(userId: string) {
    setBusy(userId);
    const r = await fetch("/api/impersonate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId }) }).then((r) => r.json()).catch(() => ({}));
    if (r && !r.error) window.location.href = "/creator"; // land in their studio to Connect / manage
    else { setBusy(null); alert(r?.error || "Could not impersonate"); }
  }

  if (rows.length === 0) return <p className="text-sm text-[var(--muted)]">No creator accounts yet — add one above.</p>;
  return (
    <div className="card !p-0 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]">
            <th className="text-left p-3">Creator</th>
            <th className="text-left p-3">Facebook</th>
            <th className="text-left p-3">Account / Pages</th>
            <th className="text-right p-3">Manage</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-[var(--border)] last:border-0">
              <td className="p-3">
                <div className="font-medium">{r.name || r.email}</div>
                <div className="text-[11px] text-[var(--muted)]">{r.email}{r.refCode ? ` · /c/${r.refCode}` : ""}</div>
              </td>
              <td className="p-3">{r.connected ? <Badge tone="up">connected</Badge> : <Badge tone="default">not connected</Badge>}</td>
              <td className="p-3 text-[var(--muted)]">
                {r.connected ? <>{r.accountName || "—"}{r.pages > 0 ? ` · ${r.pages} page${r.pages === 1 ? "" : "s"}` : r.lastError ? ` · ⚠️ ${r.lastError}` : " · 0 pages"}</> : "—"}
              </td>
              <td className="p-3 text-right">
                <button onClick={() => impersonate(r.id)} disabled={busy === r.id} className="btn btn-brand text-xs !py-1.5">
                  {busy === r.id ? "…" : r.connected ? "Open as them" : "Impersonate to connect"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
