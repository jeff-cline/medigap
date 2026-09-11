"use client";

import { useState } from "react";

type Msg = { uid: number; from: string; fromName: string; subject: string; date: string; body: string };

export default function SpamInbox({ address }: { address: string }) {
  const [msgs, setMsgs] = useState<Msg[] | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<number | null>(null);

  async function load() {
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/form-spam/inbox");
      const j = await r.json();
      if (!j.ok) { setErr(j.error || "Could not read the mailbox."); setMsgs([]); }
      else setMsgs(j.messages || []);
    } catch {
      setErr("Could not reach the mailbox.");
    }
    setBusy(false);
  }

  return (
    <div className="mt-3">
      <div className="rounded-lg border border-[var(--line)] p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Forward spam to</div>
            <code className="text-lg font-semibold select-all">{address}</code>
          </div>
          <button onClick={load} disabled={busy} className="btn btn-ghost text-sm !py-1.5">
            {busy ? "Reading…" : msgs ? "Refresh" : "Read the inbox"}
          </button>
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Forward anything that gets through. The body shows which form and which site it came from,
          which is what is needed to wire the guard onto it.
        </p>
      </div>

      {err && <p className="mt-3 text-sm" style={{ color: "var(--danger)" }}>{err}</p>}

      {msgs && msgs.length === 0 && !err && (
        <p className="mt-3 text-sm text-[var(--muted)]">Nothing forwarded yet.</p>
      )}

      {msgs && msgs.length > 0 && (
        <ul className="mt-3 space-y-2">
          {msgs.map((m) => (
            <li key={m.uid} className="rounded-lg border border-[var(--line)]">
              <button onClick={() => setOpen(open === m.uid ? null : m.uid)}
                className="w-full text-left p-3 flex justify-between gap-4">
                <span className="min-w-0">
                  <span className="block text-sm font-medium truncate">{m.subject}</span>
                  <span className="block text-xs text-[var(--muted)] truncate">
                    {m.fromName ? `${m.fromName} · ` : ""}{m.from}
                  </span>
                </span>
                <span className="text-xs text-[var(--muted)] whitespace-nowrap shrink-0">
                  {m.date ? new Date(m.date).toLocaleDateString("en-US") : ""}
                </span>
              </button>
              {open === m.uid && (
                <pre className="border-t border-[var(--line)] p-3 text-xs whitespace-pre-wrap break-words text-[var(--muted)] max-h-96 overflow-y-auto">
                  {m.body || "(no readable body)"}
                </pre>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
