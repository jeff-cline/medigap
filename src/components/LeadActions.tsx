"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type AgentOption = { id: string; name: string };

const STATUSES = ["new", "contacted", "sold", "dead"];

export default function LeadActions({
  leadId,
  status: initialStatus,
  agentId: initialAgentId,
  agents,
}: {
  leadId: string;
  status: string;
  agentId: string | null;
  agents: AgentOption[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [agentId, setAgentId] = useState(initialAgentId ?? "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(patch: { status?: string; agentId?: string | null }) {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not update lead.");
        return;
      }
      setSaved(true);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">Status</label>
        <select
          value={status}
          disabled={busy}
          onChange={(e) => {
            setStatus(e.target.value);
            save({ status: e.target.value });
          }}
          className="w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)] capitalize"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">Assigned agent</label>
        <select
          value={agentId}
          disabled={busy}
          onChange={(e) => {
            setAgentId(e.target.value);
            save({ agentId: e.target.value || null });
          }}
          className="w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
        >
          <option value="">Unassigned</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name || a.id}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="sm:col-span-2 text-xs text-[var(--danger)]">{error}</p>}
      {saved && !error && <p className="sm:col-span-2 text-xs text-[var(--brand)]">Saved.</p>}
    </div>
  );
}
