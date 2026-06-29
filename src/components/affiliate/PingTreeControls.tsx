"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

async function post(body: Record<string, unknown>) {
  const r = await fetch("/api/affiliates", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return r.json().catch(() => ({}));
}

const MODES = [
  { key: "off", label: "Off" },
  { key: "observe", label: "👁 Observe" },
  { key: "live", label: "🟢 Live" },
];

export default function PingTreeControls({ affiliateId, mode }: { affiliateId: string; mode: string }) {
  const router = useRouter();
  const [m, setM] = useState(mode);
  const [live, setLive] = useState(true);

  // Auto-refresh so new pings appear as calls come in.
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => router.refresh(), 12000);
    return () => clearInterval(t);
  }, [live, router]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] p-1">
        {MODES.map((x) => (
          <button key={x.key}
            onClick={async () => { const r = await post({ action: "setMode", id: affiliateId, mode: x.key }); if (r.ok) { setM(r.mode); router.refresh(); } }}
            className={`rounded px-3 py-1.5 text-xs font-medium ${m === x.key ? "bg-[var(--brand)] text-white" : "text-[var(--muted)] hover:text-[var(--text)]"}`}>
            {x.label}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-1.5 text-xs text-[var(--muted)] cursor-pointer">
        <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} />
        Auto-refresh (12s)
      </label>
      <button onClick={() => router.refresh()} className="btn btn-ghost text-xs !py-1.5">↻ Refresh now</button>
    </div>
  );
}
