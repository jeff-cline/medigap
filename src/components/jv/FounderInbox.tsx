"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type InboxItem = { id: string; leadId: string; leadName: string; fromEmail: string; subject: string; engine: string; at: string };

const TABS: { key: string; label: string }[] = [
  { key: "all", label: "All accounts" },
  { key: "personal", label: "Personal (Google)" },
  { key: "zapmail", label: "Cold (Zapmail)" },
  { key: "smtp", label: "SMTP" },
];

// Consolidated inbound mail: one "All accounts" view + a tab per engine. Each row's
// sender links into the CRM deal page (unified by email/phone, appended, notes, timeline).
export default function FounderInbox({ items }: { items: InboxItem[] }) {
  const router = useRouter();
  const [tab, setTab] = useState("all");
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  async function onSync() {
    setSyncing(true); setSyncMsg("");
    const r = await fetch("/api/founder/sync-inbox", { method: "POST" });
    const d = await r.json().catch(() => ({}));
    setSyncing(false);
    if (d.ok) { setSyncMsg(`Pulled ${d.matched} message(s) · ${d.replies} marked replied${d.errors?.length ? ` · ${d.errors.length} engine error(s): ${d.errors.join("; ")}` : ""}`); router.refresh(); }
    else setSyncMsg(d.error || "Sync failed");
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length, personal: 0, zapmail: 0, smtp: 0 };
    for (const i of items) c[i.engine] = (c[i.engine] || 0) + 1;
    return c;
  }, [items]);
  const shown = tab === "all" ? items : items.filter((i) => i.engine === tab);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`text-xs px-3 py-1.5 rounded-lg border ${tab === t.key ? "border-[var(--brand)] text-[var(--brand)]" : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"}`}>
              {t.label} <span className="opacity-70">({counts[t.key] || 0})</span>
            </button>
          ))}
        </div>
        <button onClick={onSync} disabled={syncing} className="btn btn-ghost text-xs !py-1.5 ml-auto">{syncing ? "Syncing…" : "↻ Sync inbox"}</button>
      </div>
      {syncMsg && <p className="text-xs text-[var(--muted)] mb-2">{syncMsg}</p>}

      <div className="card !p-0 overflow-hidden overflow-x-auto">
        <table>
          <thead><tr><th>From</th><th>Subject</th><th>Engine</th><th>Received</th></tr></thead>
          <tbody>
            {shown.map((i) => (
              <tr key={i.id} className="hover:bg-[var(--panel2)] cursor-pointer" onClick={() => router.push(`/dashboard/jv/${i.leadId}`)}>
                <td className="font-medium"><span className="text-[var(--brand)] hover:underline">{i.leadName || i.fromEmail}</span><div className="text-[var(--muted)] text-xs font-normal">{i.fromEmail}</div></td>
                <td className="text-sm">{i.subject}</td>
                <td className="text-xs text-[var(--muted)]">{i.engine}</td>
                <td className="text-[var(--muted)] text-xs whitespace-nowrap">{i.at}</td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td colSpan={4} className="text-center text-[var(--muted)] py-6">No replies here yet. Hit “↻ Sync inbox” to pull new mail — each reply becomes a clickable contact in your CRM.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
