"use client";
import { useState } from "react";

export default function LaunchSiteForm() {
  const [hostname, setHostname] = useState("");
  const [vertical, setVertical] = useState("medicare");
  const [goal, setGoal] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // No backend yet — log + optimistic success toast.
    // eslint-disable-next-line no-console
    console.log("Launch site", { hostname, vertical, goal });
    setToast(`Launching ${hostname || "new site"} — generating pages…`);
    setTimeout(() => setToast(null), 3500);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="text-xs uppercase tracking-wide text-[var(--muted)]">URL / Hostname</label>
        <input
          value={hostname}
          onChange={(e) => setHostname(e.target.value)}
          placeholder="medigap-az.com (already pointed at the IP)"
          className="mt-1 w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
        />
      </div>

      <div>
        <label className="text-xs uppercase tracking-wide text-[var(--muted)]">Vertical</label>
        <select
          value={vertical}
          onChange={(e) => setVertical(e.target.value)}
          className="mt-1 w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
        >
          <option value="medicare">Medicare / Medigap</option>
          <option value="housing">Senior Housing</option>
          <option value="care">In-Home Care</option>
          <option value="alzheimers">Alzheimer&apos;s / Memory Care</option>
        </select>
      </div>

      <div>
        <label className="text-xs uppercase tracking-wide text-[var(--muted)]">Goal / Prompt</label>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          rows={3}
          placeholder="Drive AEP Medigap calls in Arizona ZIPs; lead with G-plan savings, fast quote, click-to-call."
          className="mt-1 w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
        />
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" className="btn btn-brand text-sm">Generate &amp; launch</button>
        {toast && <span className="text-sm text-[var(--brand)]">{toast}</span>}
      </div>

      <p className="text-xs text-[var(--muted)]">Wired next: one-click provisioning + AI page generation.</p>
    </form>
  );
}
