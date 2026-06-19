"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LaunchSiteForm() {
  const router = useRouter();
  const [hostname, setHostname] = useState("");
  const [name, setName] = useState("");
  const [vertical, setVertical] = useState("medicare");
  const [kind, setKind] = useState("marketing");
  const [goal, setGoal] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inputCls =
    "mt-1 w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostname, name, vertical, kind, goal }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not launch the site.");
        return;
      }
      setNote(`Launched ${hostname} — unique themed funnel provisioned and routed to the engine.`);
      setHostname("");
      setName("");
      setGoal("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs uppercase tracking-wide text-[var(--muted)]">URL / Hostname</label>
          <input
            value={hostname}
            onChange={(e) => setHostname(e.target.value)}
            placeholder="medigap-az.com (already pointed at the IP)"
            className={inputCls}
            required
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-[var(--muted)]">Site Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Medigap Arizona"
            className={inputCls}
            required
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-[var(--muted)]">Vertical</label>
          <select value={vertical} onChange={(e) => setVertical(e.target.value)} className={inputCls}>
            <option value="medicare">Medicare / Medigap</option>
            <option value="housing">Senior Housing</option>
            <option value="care">In-Home Care</option>
            <option value="alzheimers">Alzheimer&apos;s / Memory Care</option>
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-[var(--muted)]">Kind</label>
          <select value={kind} onChange={(e) => setKind(e.target.value)} className={inputCls}>
            <option value="marketing">Marketing (lead/call funnel)</option>
            <option value="management">Management (back-office portal)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs uppercase tracking-wide text-[var(--muted)]">Goal / Prompt</label>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          rows={3}
          placeholder="Drive AEP Medigap calls in Arizona ZIPs; lead with G-plan savings, fast quote, click-to-call."
          className={inputCls}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className="btn btn-brand text-sm">
          {busy ? "Provisioning…" : "Generate & launch"}
        </button>
        {note && !error && <span className="text-sm text-[var(--brand)]">{note}</span>}
        {error && <span className="text-sm text-[var(--danger)]">{error}</span>}
      </div>

      <p className="text-xs text-[var(--muted)]">
        A deterministic theme variant is assigned from the hostname so every site looks different out of the box —
        instant A/B fodder against the network.
      </p>
    </form>
  );
}
