"use client";
import { useState } from "react";
import { US_STATES, U65Config } from "@/lib/u65";

const DAYS: [keyof U65Config["hours"]["days"], string][] = [
  ["mon", "Mon"], ["tue", "Tue"], ["wed", "Wed"], ["thu", "Thu"], ["fri", "Fri"], ["sat", "Sat"], ["sun", "Sun"],
];

export default function U65Controls({ initial }: { initial: U65Config }) {
  const [cfg, setCfg] = useState<U65Config>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const save = async (patch: Partial<U65Config>) => {
    setSaving(true);
    const res = await fetch("/api/u65/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const next = await res.json();
    setCfg(next); setSaving(false); setMsg("Saved ✓"); setTimeout(() => setMsg(""), 1500);
  };
  const setAllStates = (on: boolean) => save({ states: Object.fromEntries(US_STATES.map((s) => [s, on])) });
  const sync = async () => {
    setSaving(true); setMsg("Syncing Ringba…");
    const r = await fetch("/api/u65/reconcile", { method: "POST" }).then((x) => x.json());
    setSaving(false); setMsg(r.connected ? `Ringba: ${r.matched}/${r.fetched} matched` : "Ringba not connected yet");
    setTimeout(() => setMsg(""), 4000);
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">U65 controls</h3>
        <span className="text-xs text-[var(--muted)]">{saving ? "Working…" : msg}</span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">SET number
          <input className="mt-1 w-full" defaultValue={cfg.setNumber}
            onBlur={(e) => save({ setNumber: e.target.value.trim() })} />
        </label>
        <label className="text-sm">Backup number (after-hours)
          <input className="mt-1 w-full" defaultValue={cfg.backupNumber}
            onBlur={(e) => save({ backupNumber: e.target.value.trim() })} />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-3 items-end">
        <label className="text-sm">Open (UTC-6)
          <input type="time" className="mt-1 w-full" defaultValue={cfg.hours.start}
            onBlur={(e) => save({ hours: { ...cfg.hours, start: e.target.value } })} />
        </label>
        <label className="text-sm">Close (UTC-6)
          <input type="time" className="mt-1 w-full" defaultValue={cfg.hours.end}
            onBlur={(e) => save({ hours: { ...cfg.hours, end: e.target.value } })} />
        </label>
        <label className="text-sm">After-hours
          <select className="mt-1 w-full" defaultValue={cfg.afterHoursMode}
            onChange={(e) => save({ afterHoursMode: e.target.value as U65Config["afterHoursMode"] })}>
            <option value="regular">REGULAR FLOW (money words)</option>
            <option value="backup">Backup number</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {DAYS.map(([k, label]) => (
          <button key={k} onClick={() => save({ hours: { ...cfg.hours, days: { ...cfg.hours.days, [k]: !cfg.hours.days[k] } } })}
            className={`px-3 py-1 rounded-lg text-xs border ${cfg.hours.days[k] ? "bg-[var(--brand)]/10 text-[var(--brand)] border-[var(--brand)]/40" : "text-[var(--muted)] border-[var(--border)]"}`}>
            {label}
          </button>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">States ({US_STATES.filter((s) => cfg.states[s]).length}/50 on)</span>
          <div className="flex gap-2">
            <button className="btn btn-ghost text-xs !py-1" onClick={() => setAllStates(true)}>All on</button>
            <button className="btn btn-ghost text-xs !py-1" onClick={() => setAllStates(false)}>All off</button>
          </div>
        </div>
        <div className="grid grid-cols-8 gap-1 sm:grid-cols-10">
          {US_STATES.map((s) => (
            <button key={s} onClick={() => save({ states: { ...cfg.states, [s]: !cfg.states[s] } })}
              className={`px-1 py-1 rounded text-xs border ${cfg.states[s] ? "bg-[var(--brand)]/10 text-[var(--brand)] border-[var(--brand)]/40" : "text-[var(--muted)] border-[var(--border)]"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <button className="btn btn-brand text-sm" onClick={sync}>Sync Ringba</button>
    </div>
  );
}
