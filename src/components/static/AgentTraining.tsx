"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Section } from "@/components/ui";
import { triggerConflicts } from "@/lib/static/trigger-check";

type Rule = {
  id: string; kind: string; trigger: string; label: string; response: string; sms: string;
  smsWhen: string; smsHour: number; smsMinute: number;
  continueMenu: boolean; active: boolean; builtin: boolean; sortOrder: number;
};

function TimingControls({ sms, smsWhen, setSmsWhen, smsHour, setSmsHour }: { sms: string; smsWhen: string; setSmsWhen: (v: string) => void; smsHour: number; setSmsHour: (v: number) => void }) {
  if (!sms.trim()) return null;
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs mb-2">
      <label className="flex items-center gap-1"><input type="radio" checked={smsWhen === "immediate"} onChange={() => setSmsWhen("immediate")} /> Send immediately</label>
      <label className="flex items-center gap-1"><input type="radio" checked={smsWhen === "next_business_day"} onChange={() => setSmsWhen("next_business_day")} /> Next business day at</label>
      {smsWhen === "next_business_day" && (
        <select className="rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1" value={smsHour} onChange={(e) => setSmsHour(Number(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => i + 8).map((h) => <option key={h} value={h}>{((h + 11) % 12) + 1} {h < 12 ? "AM" : "PM"} CT</option>)}
        </select>
      )}
    </div>
  );
}
type Props = { rules: Rule[]; moneyWords: string[] };

const KIND_DESC: Record<string, string> = {
  representative: "Fires when a caller asks for a representative, an agent, an operator, or a person.",
  what: 'Fires when a caller says "what?" or sounds confused.',
  stuck: "Fires automatically after 2 answers in a row that don't match the menu.",
};

export default function AgentTraining({ rules, moneyWords }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const builtins = rules.filter((r) => r.builtin);
  const customs = rules.filter((r) => !r.builtin);

  const post = async (body: unknown) => {
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/static/agent-rules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Failed (${res.status})`);
      router.refresh();
      return true;
    } catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong."); return false; }
    finally { setBusy(false); }
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Agent Training</h1>
          <p className="text-sm text-[var(--muted)]">Teach the voice agent how to respond when a caller says something that isn&apos;t on the menu. It speaks your response, texts info from 1-800-MEDIGAP, then keeps helping.</p>
        </div>
        <a href="/dashboard/static" className="btn btn-ghost text-sm">← Static dashboard</a>
      </div>

      {err && <div className="rounded border border-[var(--danger)] text-[var(--danger)] text-sm px-3 py-2 mb-4">{err}</div>}

      <Section title="Built-in responses" desc="Always on. Edit the wording and the text that gets sent. You can turn one off, but not delete it.">
        <div className="space-y-3 mb-6">
          {builtins.map((r) => <RuleEditor key={r.id} rule={r} busy={busy} onSave={post} desc={KIND_DESC[r.kind]} />)}
        </div>
      </Section>

      <Section title="Your rules" desc="Add a trigger phrase and what the agent should do. Example: trigger “reverse mortgage, cash out” → response + a text with a link.">
        <NewRule busy={busy} onSave={post} prefillTrigger={params.get("trigger") || ""} rules={rules} moneyWords={moneyWords} />
        <div className="space-y-3 mt-4">
          {customs.length === 0 && <div className="text-sm text-[var(--muted)]">No custom rules yet.</div>}
          {customs.map((r) => <RuleEditor key={r.id} rule={r} busy={busy} onSave={post} deletable />)}
        </div>
      </Section>
    </>
  );
}

function RuleEditor({ rule, busy, onSave, desc, deletable }: { rule: Rule; busy: boolean; onSave: (b: unknown) => Promise<boolean>; desc?: string; deletable?: boolean }) {
  const [trigger, setTrigger] = useState(rule.trigger);
  const [response, setResponse] = useState(rule.response);
  const [sms, setSms] = useState(rule.sms);
  const [smsWhen, setSmsWhen] = useState(rule.smsWhen || "immediate");
  const [smsHour, setSmsHour] = useState(rule.smsHour ?? 10);
  const [continueMenu, setContinueMenu] = useState(rule.continueMenu);
  const savePayload = { trigger, response, sms, smsWhen, smsHour, smsMinute: 0, continueMenu };

  return (
    <div className={`rounded border border-[var(--border)] p-3 ${rule.active ? "" : "opacity-60"}`}>
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="font-medium text-sm">{rule.label || (rule.builtin ? rule.kind : trigger || "New rule")}</div>
        <div className="flex gap-2">
          <button className="btn btn-ghost text-xs" disabled={busy} onClick={() => onSave({ action: "update", id: rule.id, ...savePayload, active: !rule.active })}>{rule.active ? "🟢 On" : "⚪ Off"}</button>
          {deletable && <button className="text-xs text-[var(--danger)]" disabled={busy} onClick={() => { if (confirm("Delete this rule?")) onSave({ action: "delete", id: rule.id }); }}>Delete</button>}
        </div>
      </div>
      {desc && <div className="text-xs text-[var(--muted)] mb-2">{desc}</div>}
      {!rule.builtin && (
        <input className="w-full rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-sm mb-2" placeholder="Trigger phrases (comma-separated)" value={trigger} onChange={(e) => setTrigger(e.target.value)} />
      )}
      <label className="block text-xs text-[var(--muted)] mb-1">Guidance for the agent <span className="text-[var(--muted)]">(context — replies in its own words)</span></label>
      <textarea className="w-full rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-2 text-sm min-h-[60px] mb-2" value={response} onChange={(e) => setResponse(e.target.value)} />
      <label className="block text-xs text-[var(--muted)] mb-1">Text to send from 1-800-MEDIGAP (optional)</label>
      <textarea className="w-full rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-2 text-sm min-h-[50px] mb-2" value={sms} onChange={(e) => setSms(e.target.value)} />
      <TimingControls sms={sms} smsWhen={smsWhen} setSmsWhen={setSmsWhen} smsHour={smsHour} setSmsHour={setSmsHour} />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={continueMenu} onChange={(e) => setContinueMenu(e.target.checked)} /> Keep qualifying (re-offer the menu after)</label>
        <button className="btn text-sm" disabled={busy} onClick={() => onSave({ action: "update", id: rule.id, ...savePayload, active: rule.active })}>Save</button>
      </div>
    </div>
  );
}

function NewRule({ busy, onSave, prefillTrigger, rules, moneyWords }: { busy: boolean; onSave: (b: unknown) => Promise<boolean>; prefillTrigger: string; rules: Rule[]; moneyWords: string[] }) {
  const [trigger, setTrigger] = useState(prefillTrigger);
  const [response, setResponse] = useState("");
  const [sms, setSms] = useState("");
  const [smsWhen, setSmsWhen] = useState("immediate");
  const [smsHour, setSmsHour] = useState(10);
  const conflicts = triggerConflicts(trigger, { rules, moneyWords });

  const add = async () => {
    const ok = await onSave({ action: "create", trigger, response, sms, smsWhen, smsHour, smsMinute: 0, continueMenu: true });
    if (ok) { setTrigger(""); setResponse(""); setSms(""); setSmsWhen("immediate"); }
  };

  return (
    <div className="card">
      <div className="text-sm font-medium mb-2">Add a rule{prefillTrigger ? ` — from “${prefillTrigger}”` : ""}</div>
      <input className="w-full rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-sm mb-1" placeholder="Trigger phrases (comma-separated), e.g. reverse mortgage, cash out" value={trigger} onChange={(e) => setTrigger(e.target.value)} />
      {conflicts.length > 0 ? (
        <div className="rounded border border-[color:#9a6700] bg-[color:#3a2d00] text-[color:#f0c000] text-xs px-3 py-2 mb-2">
          <div className="font-semibold mb-0.5">⚠ This overlaps something:</div>
          {conflicts.map((c, i) => <div key={i}>• {c}</div>)}
        </div>
      ) : (trigger.trim() && <div className="text-xs text-[color:#3fb950] mb-2">✓ No overlap — unique trigger.</div>)}
      <textarea className="w-full rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-2 text-sm min-h-[60px] mb-2" placeholder="Guidance / context for the agent (it replies in its own words)…" value={response} onChange={(e) => setResponse(e.target.value)} />
      <textarea className="w-full rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-2 text-sm min-h-[50px] mb-2" placeholder="Text to send from 1-800-MEDIGAP (optional)…" value={sms} onChange={(e) => setSms(e.target.value)} />
      <TimingControls sms={sms} smsWhen={smsWhen} setSmsWhen={setSmsWhen} smsHour={smsHour} setSmsHour={setSmsHour} />
      <button className="btn" disabled={busy || !trigger.trim()} onClick={add}>+ Add rule</button>
    </div>
  );
}
