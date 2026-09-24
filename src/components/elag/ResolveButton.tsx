"use client";
import { useState } from "react";
export default function ResolveButton({ ip, batch, label }: { ip?: string; batch?: number; label?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button disabled={busy} onClick={async () => {
      setBusy(true);
      try { await fetch("/api/net/resolve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(batch ? { batch } : { ip }) }); location.reload(); }
      catch { setBusy(false); }
    }} style={{ background: busy ? "#eceef1" : "#0f1b2d", color: busy ? "#5b6572" : "#fff", border: "none", borderRadius: 100, padding: batch ? "9px 18px" : "5px 12px", fontSize: batch ? 13.5 : 12, fontWeight: 700, cursor: busy ? "default" : "pointer" }}>
      {busy ? "Resolving…" : (label || (batch ? `⚡ Resolve ${batch} anonymous visitors` : "Resolve"))}
    </button>
  );
}
