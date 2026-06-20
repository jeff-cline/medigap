"use client";
import { useState } from "react";

type Msg = { from: string; subject: string; date: string; snippet: string };
const TABS = [
  { key: "zapmail", label: "Cold (Zapmail)", imap: true },
  { key: "google_workspace", label: "Business (Workspace)", imap: true },
  { key: "klaviyo", label: "Opted-in (Klaviyo)", imap: false },
];

export default function CommInbox() {
  const [tab, setTab] = useState("zapmail");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [err, setErr] = useState("");
  const active = TABS.find((t) => t.key === tab)!;

  async function load(provider: string) {
    setTab(provider); setMsgs([]); setErr("");
    if (!TABS.find((t) => t.key === provider)?.imap) return;
    setBusy(true);
    const r = await fetch("/api/comms/inbox", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (d.ok) setMsgs(d.messages || []); else setErr(d.error || "Could not read inbox");
  }

  return (
    <div className="card !p-0 overflow-hidden">
      <div className="flex border-b border-[var(--border)]">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => load(t.key)} className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px ${tab === t.key ? "border-[var(--brand)] text-[var(--brand)]" : "border-transparent text-[var(--muted)] hover:text-[var(--text)]"}`}>{t.label}</button>
        ))}
        {active.imap && <button onClick={() => load(tab)} disabled={busy} className="ml-auto mr-3 my-2 btn btn-ghost text-xs !py-1">{busy ? "Loading…" : "↻ Load inbox"}</button>}
      </div>
      <div className="p-4">
        {!active.imap ? (
          <p className="text-sm text-[var(--muted)]">Klaviyo is for <b>opted-in</b> marketing — it&apos;s outbound flow-based, not an inbox. Manage opted-in profiles, segments and flows in Klaviyo; engaged cold leads flow here once they opt in.</p>
        ) : err ? (
          <p className="text-sm text-[var(--gold)]">{err}. Connect {active.label} (SMTP/IMAP) on the Integrations page, then Load inbox.</p>
        ) : msgs.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Click <b>Load inbox</b> to pull the latest replies for this mailbox.</p>
        ) : (
          <table>
            <thead><tr><th>From</th><th>Subject</th><th className="text-right">When</th></tr></thead>
            <tbody>
              {msgs.map((m, i) => (
                <tr key={i}>
                  <td className="font-medium">{m.from}</td>
                  <td className="text-[var(--muted)]">{m.subject}</td>
                  <td className="text-right text-[var(--muted)] text-xs whitespace-nowrap">{m.date ? new Date(m.date).toLocaleString("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) + " CT" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
