"use client";
import { useEffect, useState, useCallback } from "react";

type Cfg = {
  enabled: boolean; fromNumber: string;
  schedule: "immediate" | "next_business_day" | "plus_days";
  sendTimeCst: string; offsetDays: number; perTick: number;
  windowStartCst: string; windowEndCst: string; days: string; speechEndThreshold: number;
};
type Stats = { dropsSent: number; spendCents: number; scheduled: number; dueNow: number };
type Drop = { id: string; toNumber: string; status: string; answeredBy: string; durationSec: number; priceCents: number; priceFinal: boolean; createdAt: string };

const usd = (c: number) => "$" + (c / 100).toFixed(2);
const SCHEDULES = [
  { v: "next_business_day", label: "Next business day" },
  { v: "immediate", label: "Immediately (same as email)" },
  { v: "plus_days", label: "N days later" },
] as const;

export default function VoiceDripCard() {
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Drop[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const r = await fetch("/api/voicedrip/config").then((x) => x.json()).catch(() => null);
    if (r?.ok) { setCfg(r.cfg); setStats(r.stats); setRecent(r.recent || []); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save(patch: Partial<Cfg>) {
    if (!cfg) return;
    setSaving(true); setMsg("");
    const r = await fetch("/api/voicedrip/config", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(patch) }).then((x) => x.json()).catch(() => null);
    setSaving(false);
    if (r?.ok) {
      setCfg(r.cfg);
      if (r.justEnabled) setMsg(`Enabled — scheduled ${r.scheduled} drop${r.scheduled === 1 ? "" : "s"}. Backlog (emails >24h old) fires this hour; the rest at ${r.cfg.sendTimeCst} CST next business day.`);
      else if (typeof r.scheduled === "number") setMsg(`Saved. ${r.scheduled} newly scheduled.`);
      else setMsg("Saved.");
      load();
    } else setMsg(r?.error || "Save failed.");
  }

  if (!cfg || !stats) return <div className="rounded-2xl border border-[var(--border)] p-4 text-sm text-[var(--muted)]">Loading VoiceDrip…</div>;

  const set = (patch: Partial<Cfg>) => setCfg({ ...cfg, ...patch });

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] p-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold">📞 VoiceDrip</h3>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cfg.enabled ? "bg-[#22c55e]/15 text-[#22c55e]" : "bg-[var(--panel2)] text-[var(--muted)]"}`}>{cfg.enabled ? "ON" : "OFF"}</span>
          </div>
          <p className="text-xs text-[var(--muted)] max-w-xl mt-0.5">Ringless‑style voicemail drops off each sent email. Only ever leaves a voicemail — never talks to a live person. Callbacks route to U65 &amp; turn the lead teal ($75).</p>
        </div>
        <button
          disabled={saving}
          onClick={() => save({ enabled: !cfg.enabled })}
          className={`rounded-lg px-3.5 py-2 text-sm font-semibold text-white ${cfg.enabled ? "bg-[var(--panel2)] !text-[var(--text)] border border-[var(--border)]" : "bg-gradient-to-r from-[#14b8a6] to-[#0d9488]"}`}
        >{cfg.enabled ? "Pause VoiceDrip" : "⚡ Enable & Start"}</button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--border)]">
        {[
          { k: "Drops sent", v: stats.dropsSent.toLocaleString() },
          { k: "Scheduled", v: stats.scheduled.toLocaleString() },
          { k: "Due now", v: stats.dueNow.toLocaleString() },
          { k: "Spend (COGS)", v: usd(stats.spendCents) },
        ].map((s) => (
          <div key={s.k} className="bg-[var(--panel)] p-3">
            <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{s.k}</div>
            <div className="text-xl font-bold">{s.v}</div>
          </div>
        ))}
      </div>

      {/* Editable flow settings */}
      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-xs">Timing
          <select value={cfg.schedule} onChange={(e) => set({ schedule: e.target.value as Cfg["schedule"] })} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--panel2)] px-2 py-1.5 text-sm">
            {SCHEDULES.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
          </select>
        </label>
        {cfg.schedule === "plus_days" && (
          <label className="text-xs">Days after email
            <input type="number" min={1} max={30} value={cfg.offsetDays} onChange={(e) => set({ offsetDays: parseInt(e.target.value) || 1 })} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--panel2)] px-2 py-1.5 text-sm" />
          </label>
        )}
        {cfg.schedule !== "immediate" && (
          <label className="text-xs">Send time (CST)
            <input type="time" value={cfg.sendTimeCst} onChange={(e) => set({ sendTimeCst: e.target.value })} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--panel2)] px-2 py-1.5 text-sm" />
          </label>
        )}
        <label className="text-xs">Pace (drops / 5 min)
          <input type="number" min={1} max={100} value={cfg.perTick} onChange={(e) => set({ perTick: parseInt(e.target.value) || 1 })} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--panel2)] px-2 py-1.5 text-sm" />
        </label>
        <label className="text-xs">Call window (CST)
          <div className="mt-1 flex items-center gap-1">
            <input type="time" value={cfg.windowStartCst} onChange={(e) => set({ windowStartCst: e.target.value })} className="w-full rounded-lg border border-[var(--border)] bg-[var(--panel2)] px-2 py-1.5 text-sm" />
            <span className="text-[var(--muted)]">–</span>
            <input type="time" value={cfg.windowEndCst} onChange={(e) => set({ windowEndCst: e.target.value })} className="w-full rounded-lg border border-[var(--border)] bg-[var(--panel2)] px-2 py-1.5 text-sm" />
          </div>
        </label>
        <label className="text-xs">Caller ID / from
          <input value={cfg.fromNumber} onChange={(e) => set({ fromNumber: e.target.value })} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--panel2)] px-2 py-1.5 text-sm" />
        </label>
      </div>
      <div className="flex items-center gap-3 px-4 pb-4">
        <button disabled={saving} onClick={() => save({ schedule: cfg.schedule, sendTimeCst: cfg.sendTimeCst, offsetDays: cfg.offsetDays, perTick: cfg.perTick, windowStartCst: cfg.windowStartCst, windowEndCst: cfg.windowEndCst, fromNumber: cfg.fromNumber })} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--panel2)]">{saving ? "Saving…" : "Save settings"}</button>
        {msg && <span className="text-xs text-[var(--muted)]">{msg}</span>}
      </div>

      {/* Recent drops feed */}
      <div className="border-t border-[var(--border)] p-4">
        <div className="text-[10px] uppercase tracking-wide text-[var(--muted)] mb-2">Recent drops</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-[10px] uppercase text-[var(--muted)]"><th className="text-left py-1">When</th><th className="text-left py-1">To</th><th className="text-left py-1">Result</th><th className="text-left py-1">Sec</th><th className="text-left py-1">Cost</th></tr></thead>
            <tbody>
              {recent.map((d) => {
                const vm = (d.answeredBy || "").startsWith("machine");
                return (
                  <tr key={d.id} className="border-t border-[var(--border)]">
                    <td className="py-1.5 text-xs text-[var(--muted)] whitespace-nowrap">{new Date(d.createdAt).toISOString().slice(5, 16).replace("T", " ")}</td>
                    <td className="py-1.5">{d.toNumber}</td>
                    <td className="py-1.5 text-xs">{d.status === "completed" ? (vm ? <span className="text-[#22c55e]">✓ voicemail left</span> : <span className="text-[var(--muted)]">{d.answeredBy || "completed"}</span>) : <span className="text-[var(--muted)]">{d.status || "…"}</span>}</td>
                    <td className="py-1.5 text-xs">{d.durationSec || "—"}</td>
                    <td className="py-1.5 text-xs">{d.priceFinal ? usd(d.priceCents) : <span className="text-[var(--muted)]">pending</span>}</td>
                  </tr>
                );
              })}
              {recent.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-[var(--muted)] text-xs">No drops yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
