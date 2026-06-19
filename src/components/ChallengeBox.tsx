"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChallengeBox({ id, question }: { id: string; question: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const question = text.trim();
    if (!question) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/autonomous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "challenge", question }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not send question.");
        return;
      }
      setSent(true);
      setText("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-sm">{question}</p>
      <div className="flex items-start gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Challenge / ask why…"
          rows={2}
          className="flex-1 rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none resize-none focus:border-[var(--gold)]"
        />
        <button type="submit" disabled={busy || !text.trim()} className="btn btn-ghost text-sm disabled:opacity-60">
          {busy ? "Sending…" : "Ask AI"}
        </button>
      </div>
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
      {sent && <p className="text-sm text-[var(--gold)]">Question logged — the AI will explain its reasoning.</p>}
    </form>
  );
}
