"use client";
import { useState } from "react";

export default function ChallengeBox({ question }: { question: string }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "approved" | "declined" | "challenged">("idle");

  return (
    <div className="space-y-3">
      <p className="text-sm">{question}</p>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setStatus("approved")} className="btn btn-brand text-sm">Approve</button>
        <button type="button" onClick={() => setStatus("declined")} className="btn btn-ghost text-sm">Decline</button>
      </div>

      <div className="flex items-start gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Challenge / ask why…"
          className="flex-1 rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--gold)]"
        />
        <button
          type="button"
          onClick={() => { if (text.trim()) setStatus("challenged"); }}
          className="btn btn-ghost text-sm"
        >
          Ask AI
        </button>
      </div>

      {status === "approved" && <p className="text-sm text-[var(--brand)]">Approved — the AI will proceed and learn from your call.</p>}
      {status === "declined" && <p className="text-sm text-[var(--danger)]">Declined — logged as a constraint for future decisions.</p>}
      {status === "challenged" && <p className="text-sm text-[var(--gold)]">Question sent: &ldquo;{text}&rdquo; — the AI will explain its reasoning.</p>}
    </div>
  );
}
