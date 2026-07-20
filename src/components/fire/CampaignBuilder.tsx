"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type List = { id: string; name: string; total: number; sendable: number };
type Step = { dayOffset: number; mode: "text" | "html"; subject: string; body: string; html: string };
const DAYS: [string, string][] = [["mon", "Mon"], ["tue", "Tue"], ["wed", "Wed"], ["thu", "Thu"], ["fri", "Fri"], ["sat", "Sat"], ["sun", "Sun"]];

export default function CampaignBuilder({ lists, defaultSubject, defaultBody }: { lists: List[]; defaultSubject: string; defaultBody: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [name, setName] = useState("");
  const [listId, setListId] = useState(lists[0]?.id || "");
  const [emailField, setEmailField] = useState<"business" | "personal" | "personal_business">("business");
  const [perHour, setPerHour] = useState(20);
  const [tracking, setTracking] = useState(false);
  const [sendStart, setSendStart] = useState("09:00");
  const [sendEnd, setSendEnd] = useState("17:00");
  const [days, setDays] = useState<Record<string, boolean>>({ mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false });
  const [steps, setSteps] = useState<Step[]>([{ dayOffset: 0, mode: "text", subject: defaultSubject, body: defaultBody, html: "" }]);

  const setStep = (i: number, patch: Partial<Step>) => setSteps((s) => s.map((st, j) => (j === i ? { ...st, ...patch } : st)));
  const addStep = () => setSteps((s) => [...s, { dayOffset: (s[s.length - 1]?.dayOffset || 0) + 3, mode: "text", subject: defaultSubject, body: "", html: "" }]);
  const removeStep = (i: number) => setSteps((s) => s.filter((_, j) => j !== i));

  async function create(start: boolean) {
    setErr("");
    if (!name.trim()) { setErr("Name your campaign."); return; }
    if (!listId) { setErr("Pick a list."); return; }
    const sendDays = DAYS.filter(([k]) => days[k]).map(([k]) => k).join(",");
    if (!sendDays) { setErr("Pick at least one send day."); return; }
    setBusy(true);
    const res = await fetch("/api/fire/campaigns", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, listId, emailField, perHour: Number(perHour), tracking, sendStart, sendEnd, sendDays, steps: steps.map((s) => ({ ...s, dayOffset: Number(s.dayOffset) })) }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setBusy(false); setErr(data.error || "Could not create."); return; }
    if (start) {
      await fetch(`/api/fire/campaigns/${data.campaignId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "start" }) });
    }
    setBusy(false); setOpen(false);
    router.refresh();
  }

  const inp = "rounded-lg border border-[var(--border)] bg-[var(--panel2)] px-3 py-2 text-sm";

  if (!open) return <button onClick={() => setOpen(true)} className="rounded-lg bg-gradient-to-r from-[#14b8a6] to-[#0d9488] px-4 py-2 text-sm font-bold text-white">+ New campaign</button>;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">New campaign</div>
        <button onClick={() => setOpen(false)} className="text-xs text-[var(--muted)] hover:text-[var(--text)]">Cancel</button>
      </div>
      {err && <p className="text-sm text-red-400">{err}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-[var(--muted)]">Campaign name<input className={`${inp} mt-1 w-full`} value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="text-xs text-[var(--muted)]">List<select className={`${inp} mt-1 w-full`} value={listId} onChange={(e) => setListId(e.target.value)}>{lists.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.total})</option>)}</select></label>
        <label className="text-xs text-[var(--muted)]">Send to<select className={`${inp} mt-1 w-full`} value={emailField} onChange={(e) => setEmailField(e.target.value as "business" | "personal" | "personal_business")}>
          <option value="business">Business email</option>
          <option value="personal">Personal email</option>
          <option value="personal_business">Personal, else business</option>
        </select></label>
        <label className="text-xs text-[var(--muted)]">Emails per hour<input type="number" min={1} className={`${inp} mt-1 w-full`} value={perHour} onChange={(e) => setPerHour(Number(e.target.value))} /></label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 items-end">
        <label className="text-xs text-[var(--muted)]">Send from (CST)<input type="time" className={`${inp} mt-1 w-full`} value={sendStart} onChange={(e) => setSendStart(e.target.value)} /></label>
        <label className="text-xs text-[var(--muted)]">Send until (CST)<input type="time" className={`${inp} mt-1 w-full`} value={sendEnd} onChange={(e) => setSendEnd(e.target.value)} /></label>
        <label className="flex items-center gap-2 text-xs text-[var(--muted)]"><input type="checkbox" checked={tracking} onChange={(e) => setTracking(e.target.checked)} /> Open tracking (HTML only)</label>
      </div>
      <div className="flex flex-wrap gap-2">
        {DAYS.map(([k, lbl]) => (
          <button key={k} onClick={() => setDays((d) => ({ ...d, [k]: !d[k] }))}
            className={`rounded-lg px-3 py-1 text-xs border ${days[k] ? "bg-[var(--brand)]/10 text-[var(--brand)] border-[var(--brand)]/40" : "text-[var(--muted)] border-[var(--border)]"}`}>{lbl}</button>
        ))}
      </div>

      <div className="space-y-3">
        {steps.map((s, i) => (
          <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--panel2)] p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <span className="font-semibold text-[var(--text)]">{i === 0 ? "Day 1" : `Follow-up`}</span>
                {i > 0 && <>send on day <input type="number" min={1} value={s.dayOffset} onChange={(e) => setStep(i, { dayOffset: Number(e.target.value) })} className={`${inp} !py-1 w-16`} /></>}
                <select className={`${inp} !py-1`} value={s.mode} onChange={(e) => setStep(i, { mode: e.target.value as "text" | "html" })}><option value="text">Text</option><option value="html">HTML</option></select>
              </div>
              {i > 0 && <button onClick={() => removeStep(i)} className="text-xs text-red-400">remove</button>}
            </div>
            <input placeholder="Subject" className={`${inp} w-full`} value={s.subject} onChange={(e) => setStep(i, { subject: e.target.value })} />
            {s.mode === "text"
              ? <textarea placeholder="Plain-text body — use {{first_name}}" rows={6} className={`${inp} mt-2 w-full font-mono`} value={s.body} onChange={(e) => setStep(i, { body: e.target.value })} />
              : <textarea placeholder="HTML body — use {{first_name}}" rows={6} className={`${inp} mt-2 w-full font-mono`} value={s.html} onChange={(e) => setStep(i, { html: e.target.value })} />}
          </div>
        ))}
        <button onClick={addStep} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-[var(--text)]">+ Add another day (follow-up)</button>
      </div>

      <div className="flex justify-end gap-2">
        <button disabled={busy} onClick={() => create(false)} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] hover:text-[var(--text)]">Save draft</button>
        <button disabled={busy} onClick={() => create(true)} className="rounded-lg bg-gradient-to-r from-[#14b8a6] to-[#0d9488] px-5 py-2 text-sm font-bold text-white disabled:opacity-60">{busy ? "Launching…" : "🚀 Start Send Now"}</button>
      </div>
    </div>
  );
}
