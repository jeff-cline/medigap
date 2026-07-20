"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CampaignControls({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function act(action: "start" | "pause") {
    setBusy(true);
    await fetch(`/api/fire/campaigns/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action }) });
    setBusy(false);
    router.refresh();
  }
  if (status === "done") return <span className="text-xs text-[var(--muted)]">done</span>;
  return status === "running"
    ? <button disabled={busy} onClick={() => act("pause")} className="rounded bg-[var(--panel2)] px-2.5 py-1 text-xs hover:bg-[var(--border)]">Pause</button>
    : <button disabled={busy} onClick={() => act("start")} className="rounded bg-gradient-to-r from-[#14b8a6] to-[#0d9488] px-2.5 py-1 text-xs font-semibold text-white">🚀 Start Send Now</button>;
}
