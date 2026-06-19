"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Q = { field: string; ask: string };
export default function VoiceAgentForm({ initial, voices, aiConnected }: {
  initial: { active: boolean; voice: string; tone: string; greeting: string; systemPrompt: string; questions: Q[]; forwardWhenDone: boolean; maxTurns: number };
  voices: { id: string; label: string }[];
  aiConnected: boolean;
}) {
  const router = useRouter();
  const [active, setActive] = useState(initial.active);
  const [voice, setVoice] = useState(initial.voice);
  const [tone, setTone] = useState(initial.tone);
  const [greeting, setGreeting] = useState(initial.greeting);
  const [systemPrompt, setSystemPrompt] = useState(initial.systemPrompt);
  const [questions, setQuestions] = useState<Q[]>(initial.questions);
  const [forwardWhenDone, setForwardWhenDone] = useState(initial.forwardWhenDone);
  const [maxTurns, setMaxTurns] = useState(initial.maxTurns);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  function setQ(i: number, field: keyof Q, v: string) {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, [field]: v } : q)));
  }
  const addQ = () => setQuestions((qs) => [...qs, { field: `field${qs.length + 1}`, ask: "" }]);
  const delQ = (i: number) => setQuestions((qs) => qs.filter((_, idx) => idx !== i));

  async function save() {
    setBusy(true); setSaved(false);
    await fetch("/api/voice-agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active, voice, tone, greeting, systemPrompt, questions: questions.filter((q) => q.ask.trim()), forwardWhenDone, maxTurns }) });
    setBusy(false); setSaved(true); router.refresh();
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-6">
      {!aiConnected && (
        <div className="rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-2 text-sm text-[var(--gold)]">
          No voice-AI provider connected yet. Connect <b>xAI (Grok)</b> on Integrations and the AI will start answering. Until then, calls forward straight to your agents / house number.
        </div>
      )}

      <div className="card p-5 grid gap-4 md:grid-cols-2">
        <div className="flex items-center justify-between rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2.5">
          <span className="text-sm">AI answers calls</span>
          <button type="button" onClick={() => setActive(!active)} className={`inline-flex h-5 w-9 items-center rounded-full ${active ? "bg-[var(--brand)]" : "bg-[var(--border)]"}`}>
            <span className={`h-4 w-4 rounded-full bg-white transition ${active ? "translate-x-4" : "translate-x-0.5"}`} />
          </button>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-[var(--muted)]">Voice</label>
          <select value={voice} onChange={(e) => setVoice(e.target.value)} className="mt-1">
            {voices.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        </div>
      </div>

      <div className="card p-5">
        <label className="text-xs uppercase tracking-wide text-[var(--muted)]">Tone &amp; sentiment</label>
        <textarea className="mt-1" rows={2} value={tone} onChange={(e) => setTone(e.target.value)} placeholder="e.g. Warm, calm, reassuring, human. Speak slowly for seniors." />
        <p className="mt-1 text-xs text-[var(--muted)]">How the AI should sound and feel on every call.</p>
      </div>

      <div className="card p-5">
        <label className="text-xs uppercase tracking-wide text-[var(--muted)]">Authentication greeting (first thing the caller hears)</label>
        <textarea className="mt-1" rows={3} value={greeting} onChange={(e) => setGreeting(e.target.value)} />
        <p className="mt-1 text-xs text-[var(--muted)]">This should ask for the caller&apos;s first &amp; last name. The agent then walks the intake fields below in order, capturing each answer to the lead.</p>
      </div>

      <div className="card p-5">
        <label className="text-xs uppercase tracking-wide text-[var(--muted)]">Knowledge &amp; behavior (how it should answer — refine this anytime)</label>
        <textarea className="mt-1 font-mono text-xs" rows={8} value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} />
        <p className="mt-1 text-xs text-[var(--muted)]">This is the AI&apos;s instructions. Tighten its answers, add rules (e.g. &quot;never quote prices&quot;), product knowledge, or compliance lines. End-of-call transfer is triggered when the AI emits <code>[TRANSFER]</code>.</p>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs uppercase tracking-wide text-[var(--muted)]">Intake fields (asked in order, saved to the CRM)</label>
          <button type="button" onClick={addQ} className="btn btn-ghost text-xs !py-1">+ Add field</button>
        </div>
        <p className="text-xs text-[var(--muted)] mb-3">Use field key <code>name</code>, <code>zip</code>, or <code>dob</code> to auto-fill the lead record (dob computes age and reads it back). Other keys are saved to the journey.</p>
        <div className="space-y-2">
          {questions.map((q, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-[var(--muted)] text-xs w-4">{i + 1}.</span>
              <input className="!w-28" value={q.field} onChange={(e) => setQ(i, "field", e.target.value)} placeholder="field" />
              <input value={q.ask} onChange={(e) => setQ(i, "ask", e.target.value)} placeholder="What should it ask?" />
              <button type="button" onClick={() => delQ(i)} className="text-[var(--danger)] text-sm px-2">✕</button>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5 grid gap-4 md:grid-cols-2">
        <div className="flex items-center justify-between rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2.5">
          <span className="text-sm">Transfer to agent/house when done</span>
          <button type="button" onClick={() => setForwardWhenDone(!forwardWhenDone)} className={`inline-flex h-5 w-9 items-center rounded-full ${forwardWhenDone ? "bg-[var(--brand)]" : "bg-[var(--border)]"}`}>
            <span className={`h-4 w-4 rounded-full bg-white transition ${forwardWhenDone ? "translate-x-4" : "translate-x-0.5"}`} />
          </button>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-[var(--muted)]">Max conversation turns</label>
          <input type="number" min={2} max={20} value={maxTurns} onChange={(e) => setMaxTurns(parseInt(e.target.value) || 8)} className="mt-1" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={busy} className="btn btn-brand text-sm">{busy ? "Saving…" : "Save voice agent"}</button>
        {saved && <span className="text-sm text-[var(--brand)]">Saved — live on the next call.</span>}
      </div>
    </div>
  );
}
