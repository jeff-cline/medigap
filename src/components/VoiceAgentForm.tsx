"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Q = { field: string; ask: string };
type Voice = { id: string; label: string; gender: "female" | "male"; sample: string };
type Engine = { id: string; label: string; model: string; tier: string; note: string; costPerCall: number; configured: boolean; rank: "highest" | "lowest" | "" };
export default function VoiceAgentForm({ initial, voices, engines, aiConnected }: {
  initial: { active: boolean; voice: string; tone: string; greeting: string; systemPrompt: string; questions: Q[]; forwardWhenDone: boolean; maxTurns: number; engine: string };
  voices: Voice[];
  engines: Engine[];
  aiConnected: boolean;
}) {
  const router = useRouter();
  const [active, setActive] = useState(initial.active);
  const [voice, setVoice] = useState(initial.voice);
  const [engine, setEngine] = useState(initial.engine);
  const [speaking, setSpeaking] = useState(false);
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
    await fetch("/api/voice-agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active, voice, tone, greeting, systemPrompt, questions: questions.filter((q) => q.ask.trim()), forwardWhenDone, maxTurns, engine }) });
    setBusy(false); setSaved(true); router.refresh();
    setTimeout(() => setSaved(false), 2500);
  }

  // Browser preview of the selected voice. NOTE: this uses your device's text-to-speech to
  // approximate gender/cadence — the actual phone call uses the high-quality neural voice you pick.
  function playSample() {
    const v = voices.find((x) => x.id === voice);
    if (!v || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(v.sample);
    const sys = window.speechSynthesis.getVoices();
    const match = sys.find((s) => /en[-_]US/i.test(s.lang) && (v.gender === "female" ? /female|Samantha|Victoria|Joanna|Ava|Allison|Susan|Zira/i.test(s.name) : /male|Daniel|Alex|Fred|Tom|David|Mark/i.test(s.name))) || sys.find((s) => /en[-_]US/i.test(s.lang));
    if (match) u.voice = match;
    u.rate = 0.96;
    u.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  }

  const cheapest = engines.reduce((m, e) => (e.costPerCall < m.costPerCall ? e : m), engines[0]);
  const priciest = engines.reduce((m, e) => (e.costPerCall > m.costPerCall ? e : m), engines[0]);
  const multiple = cheapest && priciest && cheapest.costPerCall > 0 ? priciest.costPerCall / cheapest.costPerCall : 0;

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
          <label className="text-xs uppercase tracking-wide text-[var(--muted)]">Voice (all neural — clearest first)</label>
          <div className="mt-1 flex gap-2">
            <select value={voice} onChange={(e) => { setVoice(e.target.value); }} className="flex-1">
              {voices.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
            <button type="button" onClick={playSample} className="btn btn-ghost text-sm !py-2 whitespace-nowrap" title="Preview this voice (browser approximation)">{speaking ? "▮▮" : "▶ Play sample"}</button>
          </div>
          <p className="text-[11px] text-[var(--muted)] mt-1">Preview uses your device&apos;s text-to-speech to approximate the voice; the live call uses the selected neural voice.</p>
        </div>
      </div>

      {/* AI brain / engine — quality vs cost */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs uppercase tracking-wide text-[var(--muted)]">AI brain (engine)</label>
          {multiple > 1 && <span className="text-[11px] text-[var(--muted)]">highest ≈ <b className="text-[var(--text)]">{multiple.toFixed(0)}×</b> the cost of lowest</span>}
        </div>
        <p className="text-[11px] text-[var(--muted)] mb-3">Pick the brain that answers calls. Toggle anytime to compare quality — changes are live on the next call.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {engines.map((e) => {
            const selected = engine === e.id || (!engine && e.rank === "highest");
            return (
              <button key={e.id} type="button" disabled={!e.configured} onClick={() => setEngine(e.id)}
                className={`text-left rounded-lg border p-3 transition ${selected ? "border-[var(--brand)] bg-[var(--brand)]/10" : "border-[var(--border)] hover:border-[var(--muted)]"} ${!e.configured ? "opacity-50" : ""}`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{e.label}</span>
                  {e.rank === "highest" && <span className="rounded-full bg-[var(--gold)]/15 text-[var(--gold)] px-2 py-0.5 text-[10px]">★ highest quality</span>}
                  {e.rank === "lowest" && <span className="rounded-full bg-[var(--brand)]/15 text-[var(--brand)] px-2 py-0.5 text-[10px]">💲 lowest cost</span>}
                </div>
                <div className="text-[11px] text-[var(--muted)] mt-0.5">{e.tier} · {e.note}</div>
                <div className="text-[11px] mt-1.5"><b className="text-[var(--text)]">~${e.costPerCall.toFixed(4)}</b> <span className="text-[var(--muted)]">/ call est. · {e.model}</span>{!e.configured && <span className="text-red-400"> · not connected</span>}</div>
              </button>
            );
          })}
        </div>
        <div className="mt-3 rounded-lg bg-[var(--panel2)] border border-[var(--border)] p-3 text-[11px] text-[var(--muted)]">
          💡 <b className="text-[var(--text)]">Cost comparison (est. per call):</b> {priciest && <>Highest <b className="text-[var(--gold)]">{priciest.label} ~${priciest.costPerCall.toFixed(4)}</b></>}{cheapest && <> · Lowest <b className="text-[var(--brand)]">{cheapest.label} ~${cheapest.costPerCall.toFixed(4)}</b></>}. Based on a typical 8-turn qualifying call; actual cost varies with call length.
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
