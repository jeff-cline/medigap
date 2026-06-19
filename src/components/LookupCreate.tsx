"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LookupCreate({ phone }: { phone: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    const r = await fetch("/api/leads/from-phone", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) });
    const d = await r.json().catch(() => ({}));
    if (d.id) router.push(`/dashboard/leads/${d.id}`); else setBusy(false);
  }
  return (
    <button onClick={go} disabled={busy} className="btn btn-brand text-sm">
      {busy ? "Creating & enriching…" : "Create record + enrich (PredictiveData) →"}
    </button>
  );
}
