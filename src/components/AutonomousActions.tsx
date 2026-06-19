"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Action = "approve" | "decline" | "generate";

export default function AutonomousActions({ id, mode = "decision" }: { id?: string; mode?: "decision" | "generate" }) {
  const router = useRouter();
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: Action) {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch("/api/autonomous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Action failed.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (mode === "generate") {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={() => run("generate")}
          disabled={busy !== null}
          className="btn btn-brand text-xs !py-1.5 !px-3 disabled:opacity-60"
        >
          <span className="text-gradient font-bold">✦ {busy === "generate" ? "Analyzing…" : "Generate recommendation"}</span>
        </button>
        {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => run("approve")}
          disabled={busy !== null}
          className="btn btn-brand text-sm disabled:opacity-60"
        >
          {busy === "approve" ? "Approving…" : "Approve"}
        </button>
        <button
          type="button"
          onClick={() => run("decline")}
          disabled={busy !== null}
          className="btn btn-ghost text-sm disabled:opacity-60"
        >
          {busy === "decline" ? "Declining…" : "Decline"}
        </button>
      </div>
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}
