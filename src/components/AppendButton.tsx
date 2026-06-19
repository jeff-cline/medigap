"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AppendButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  async function run() {
    setBusy(true); setMsg("");
    const r = await fetch(`/api/leads/${leadId}/append`, { method: "POST" });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    setMsg(d.error ? d.error : d.matched ? "✓ Match found & appended" : "No match found for this contact");
    if (d.ok) router.refresh();
  }
  return (
    <div className="flex items-center gap-3">
      <button onClick={run} disabled={busy} className="btn btn-ghost text-xs !py-1.5">{busy ? "Appending…" : "↻ Append now"}</button>
      {msg && <span className="text-xs text-[var(--muted)]">{msg}</span>}
    </div>
  );
}
