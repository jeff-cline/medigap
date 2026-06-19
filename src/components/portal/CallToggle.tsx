"use client";
import { useState } from "react";

export default function CallToggle() {
  const [on, setOn] = useState(true);
  return (
    <div className="card p-5 flex items-center justify-between gap-4">
      <div>
        <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Take Calls</div>
        <div className={`mt-1 text-2xl font-bold ${on ? "text-[var(--brand)]" : "text-[var(--danger)]"}`}>
          {on ? "ON — receiving" : "OFF — paused"}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setOn((v) => !v)}
        className={`relative h-8 w-14 rounded-full border transition-colors ${
          on ? "bg-[var(--brand)]/30 border-[var(--brand)]/40" : "bg-[var(--panel2)] border-[var(--border)]"
        }`}
        aria-pressed={on}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full transition-all ${
            on ? "left-7 bg-[var(--brand)]" : "left-1 bg-[var(--muted)]"
          }`}
        />
      </button>
    </div>
  );
}
