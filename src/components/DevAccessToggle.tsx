"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// God-only master switch for the Developer section. OFF hides it from every
// developer account instantly — the "turn it off if they leave" control.
export default function DevAccessToggle({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(enabled);
  const [busy, setBusy] = useState(false);

  async function set(next: boolean) {
    setBusy(true);
    const r = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "devGlobal", on: next }),
    });
    setBusy(false);
    if (r.ok) {
      setOn(next);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--panel2)] px-4 py-3">
      <span className="text-[10px] uppercase tracking-wide text-[var(--gold)]">★ God control</span>
      <span className={`text-sm font-semibold ${on ? "text-[var(--brand)]" : "text-[var(--muted)]"}`}>
        Developer access is {on ? "ON — developer accounts can see this section" : "OFF — hidden from all developer accounts"}
      </span>
      <button onClick={() => set(!on)} disabled={busy} className={`btn text-xs !py-1.5 !px-3 ${on ? "btn-ghost" : "btn-brand"}`}>
        {busy ? "Saving…" : on ? "Turn OFF" : "Turn ON"}
      </button>
    </div>
  );
}
