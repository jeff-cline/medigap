"use client";
import { useEffect, useRef, useState } from "react";

type Counts = { textsOutstanding: number; liveCalls: number; today: number; week: number; month: number; total: number };
const ZERO: Counts = { textsOutstanding: 0, liveCalls: 0, today: 0, week: 0, month: 0, total: 0 };

export default function Notifications() {
  const [c, setC] = useState<Counts>(ZERO);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    const load = () => fetch("/api/notifications").then((r) => (r.ok ? r.json() : null)).then((d) => { if (alive && d) setC(d); }).catch(() => {});
    load();
    const t = setInterval(load, 45000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const badge = c.textsOutstanding;
  const rows: [string, number, string?][] = [
    ["Texts to respond", c.textsOutstanding, "var(--danger)"],
    ["Live calls", c.liveCalls, "#3fb950"],
    ["Calls today", c.today],
    ["Calls this week", c.week],
    ["Calls this month", c.month],
    ["Total calls", c.total],
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Notifications"
        className="relative w-9 h-9 rounded-full border border-[var(--border)] bg-[var(--panel)] flex items-center justify-center hover:border-[var(--gold)]"
      >
        <span aria-hidden className="text-base">🔔</span>
        {badge > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--danger)] text-white text-[10px] font-bold flex items-center justify-center">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-lg border border-[var(--border)] bg-[var(--panel)] shadow-lg z-50 p-3">
          <div className="text-xs uppercase text-[var(--muted)] mb-2">Notifications</div>
          <ul className="space-y-1 text-sm">
            {rows.map(([label, val, color]) => (
              <li key={label} className="flex items-center justify-between">
                <span>{label}</span>
                <span className="font-bold tabular-nums" style={color ? { color } : undefined}>{val}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
