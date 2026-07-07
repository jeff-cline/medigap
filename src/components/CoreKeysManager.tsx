"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export type KeyRow = { id: string; name: string; keyId: string; scopes: string; active: boolean; callCount: number; lastUsedAt: string | null; createdAt: string };
const SCOPES = ["lead:create", "lead:read", "email:send", "sms:send"];

export default function CoreKeysManager({ keys }: { keys: KeyRow[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>(["lead:create"]);
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<{ keyId: string; secret: string } | null>(null);
  const [err, setErr] = useState("");

  async function issue() {
    if (!name.trim()) { setErr("Name the key (the partner/app)."); return; }
    setBusy(true); setErr("");
    const r = await fetch("/api/core-keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "issue", name, scopes }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (d.ok) { setIssued({ keyId: d.keyId, secret: d.secret }); setName(""); router.refresh(); }
    else setErr(d.error || "Could not issue key.");
  }
  async function revoke(id: string) {
    if (!confirm("Revoke this key? Apps using it will stop working immediately.")) return;
    await fetch("/api/core-keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "revoke", id }) });
    router.refresh();
  }

  return (
    <div>
      {issued ? (
        <div className="card !p-4 mb-4 border border-[var(--brand)]/40">
          <div className="font-semibold text-[var(--brand)]">✓ Key issued — copy the secret now (it won't be shown again)</div>
          <div className="mt-2 text-sm space-y-1 ag-mono">
            <div>Key ID: <code className="text-[var(--brand2)]">{issued.keyId}</code></div>
            <div>Secret: <code className="text-[var(--gold)]">{issued.secret}</code></div>
          </div>
          <button onClick={() => setIssued(null)} className="btn btn-ghost text-xs mt-3">Done</button>
        </div>
      ) : (
        <div className="card !p-4 mb-4">
          <div className="font-semibold text-sm mb-2">Issue a CORE API key</div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[200px]"><label className="text-xs text-[var(--muted)]">Partner / app name</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Partner" /></div>
            <div className="flex gap-3">
              {SCOPES.map((sc) => (
                <label key={sc} className="text-xs flex items-center gap-1.5 text-[var(--muted)]"><input type="checkbox" className="!w-auto" checked={scopes.includes(sc)} onChange={(e) => setScopes(e.target.checked ? [...scopes, sc] : scopes.filter((x) => x !== sc))} />{sc}</label>
              ))}
            </div>
            <button onClick={issue} disabled={busy} className="btn btn-brand text-sm">{busy ? "Issuing…" : "Issue key"}</button>
          </div>
          {err && <p className="text-xs text-[var(--danger)] mt-2">{err}</p>}
        </div>
      )}

      <div className="card !p-0 overflow-hidden">
        <table>
          <thead><tr><th>Name</th><th>Key ID</th><th>Scopes</th><th className="text-right">Calls</th><th>Last used</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k.id}>
                <td className="font-medium">{k.name || "—"}</td>
                <td className="ag-mono text-xs">{k.keyId.slice(0, 16)}…</td>
                <td className="text-xs text-[var(--muted)]">{k.scopes}</td>
                <td className="text-right">{k.callCount}</td>
                <td className="text-xs text-[var(--muted)]">{k.lastUsedAt || "never"}</td>
                <td><span className={`text-xs ${k.active ? "text-[var(--brand)]" : "text-[var(--danger)]"}`}>{k.active ? "active" : "revoked"}</span></td>
                <td className="text-right">{k.active && <button onClick={() => revoke(k.id)} className="text-[var(--danger)] text-sm hover:underline">revoke</button>}</td>
              </tr>
            ))}
            {keys.length === 0 && <tr><td colSpan={7} className="text-center text-[var(--muted)] py-6">No keys yet — issue one to let a partner build on the Core.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
