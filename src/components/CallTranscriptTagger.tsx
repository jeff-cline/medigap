"use client";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const BUY_PHRASES = [
  "how much does it cost", "how much does it", "what does it cost", "how much", "how do i get",
  "i would like", "i'd like", "i'm looking for", "looking for", "i need", "i want", "i buy",
  "can i order", "can i get", "can i buy", "do you sell", "do you have", "i'm interested in",
  "interested in", "sign me up", "i'll take", "where can i get", "where do i get",
].map((p) => p.split(" "));

// Intent / connector words — never money words.
const INTENT = new Set("speak talk talking agent agents someone somebody anybody anyone person people help find finding get getting call calling connect connected provider providers supplier suppliers specialist specialists rep reps representative medicare medicaid insurance plan plans coverage option options about some service services free".split(" "));
const STOP = new Set("the a an and or but it its is are am was were be been being to of for in on at by with from as i you he she we they me my mine your yours our ours this that these those do does did doing have has had can could would should will shall just really kind sort like so very then than there here now ok okay yeah yes no not one need want".split(" "));
const PREP = new Set("for about with of regarding on around to".split(" "));

type Turn = { role: "assistant" | "user"; text: string; at?: string };
type MoneyWord = { id: string; word: string; aliases: string[] };
const clean = (w: string) => w.toLowerCase().replace(/[^a-z']/g, "");

// Topic-noun candidates: content words after a preposition OR the trailing content word(s) — NOT intent words.
function candidatesFor(text: string): Set<string> {
  const words = (text.split(/\s+/).map(clean).filter(Boolean));
  const out = new Set<string>();
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (STOP.has(w) || INTENT.has(w) || w.length < 4) continue;
    const afterPrep = i > 0 && PREP.has(words[i - 1]);
    const isLastContent = !words.slice(i + 1).some((x) => !STOP.has(x) && !INTENT.has(x) && x.length >= 4);
    if (afterPrep || isLastContent) out.add(w);
  }
  return out;
}

export default function CallTranscriptTagger({ turns, callId, moneyWords, detected }: { turns: Turn[]; callId: string; moneyWords: MoneyWord[]; detected: string[] }) {
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement>(null);
  const [ai, setAi] = useState<string[]>(detected);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [activeCloud, setActiveCloud] = useState<string | null>(null); // money word id receiving variants
  const [sel, setSel] = useState("");

  // token sets for highlighting (split multi-word money words/aliases into tokens)
  const armedTokens = useMemo(() => {
    const s = new Set<string>();
    moneyWords.forEach((m) => { [m.word, ...m.aliases].forEach((w) => String(w).split(/\s+/).map(clean).forEach((t) => t && s.add(t))); });
    return s;
  }, [moneyWords]);
  const aiTokens = useMemo(() => { const s = new Set<string>(); ai.forEach((w) => w.split(/\s+/).map(clean).forEach((t) => t && s.add(t))); return s; }, [ai]);
  const callerCands = useMemo(() => { const s = new Set<string>(); turns.forEach((t) => { if (t.role === "user") candidatesFor(t.text).forEach((c) => s.add(c)); }); return s; }, [turns]);

  function buyMarks(text: string): boolean[] {
    const tokens = text.split(/(\s+)/);
    const words: { i: number; c: string }[] = [];
    tokens.forEach((t, i) => { const c = clean(t); if (c) words.push({ i, c }); });
    const mark = new Array(tokens.length).fill(false);
    for (let s = 0; s < words.length; s++) for (const ph of BUY_PHRASES) {
      if (s + ph.length > words.length) continue;
      let hit = true; for (let k = 0; k < ph.length; k++) if (words[s + k].c !== ph[k]) { hit = false; break; }
      if (hit) for (let k = 0; k < ph.length; k++) mark[words[s + k].i] = true;
    }
    return mark;
  }

  async function api(body: object) {
    setBusy(true);
    const r = await fetch("/api/money-words", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    if (r.ok || r.status === 409) router.refresh();
    return r.ok || r.status === 409;
  }
  async function armWord(word: string) {
    const w = clean(word) || word.toLowerCase().trim();
    if (!w) return;
    if (activeCloud) { if (await api({ action: "addAlias", id: activeCloud, alias: w })) flash(`added "${w}" to cloud`); }
    else if (await api({ action: "create", word: w })) flash(`"${w}" armed as a money word`);
  }
  async function armSelection() {
    const text = sel.trim();
    if (!text) return;
    if (activeCloud) { if (await api({ action: "addAlias", id: activeCloud, alias: text })) flash(`added "${text}" to cloud`); }
    else if (await api({ action: "create", word: text })) flash(`"${text}" armed`);
    setSel(""); window.getSelection()?.removeAllRanges();
  }
  async function removeAlias(id: string, alias: string) { if (await api({ action: "removeAlias", id, alias })) flash(`removed "${alias}"`); }
  async function detectAI() {
    setBusy(true); setToast("Analyzing with AI…");
    const r = await fetch(`/api/calls/${callId}/analyze`, { method: "POST" });
    const d = await r.json().catch(() => ({})); setBusy(false);
    if (d.ok) { setAi(d.words || []); flash(d.words?.length ? `AI found: ${d.words.join(", ")}` : "AI found no money words"); }
    else flash(d.error || "AI detection failed");
  }
  function flash(m: string) { setToast(m); setTimeout(() => setToast(""), 3000); }
  function onMouseUp() { const t = window.getSelection()?.toString() || ""; setSel(t.trim().length > 1 ? t.trim() : ""); }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button onClick={detectAI} disabled={busy} className="btn btn-brand text-xs !py-1.5">✦ Detect money words (AI)</button>
        {sel && <button onClick={armSelection} disabled={busy} className="btn btn-ghost text-xs !py-1.5 text-[var(--gold)]">⚡ Arm “{sel.length > 24 ? sel.slice(0, 24) + "…" : sel}”{activeCloud ? " → cloud" : ""}</button>}
        {activeCloud && <span className="text-xs text-[var(--gold)]">Adding to cloud — clicks &amp; highlights become variants. <button onClick={() => setActiveCloud(null)} className="underline">done</button></span>}
        <span className="ml-auto flex items-center gap-3 text-[11px] text-[var(--muted)]">
          <span><span className="px-1 rounded bg-[var(--brand)]/20 text-[var(--brand)]">buy</span></span>
          <span><span className="px-1 rounded bg-[var(--gold)]/25 text-[var(--gold)]">money word</span></span>
          <span>· select text to highlight your own</span>
        </span>
      </div>

      <div ref={boxRef} onMouseUp={onMouseUp} className="space-y-1.5 select-text">
        {turns.map((t, ti) => {
          const isUser = t.role === "user";
          const tokens = t.text.split(/(\s+)/);
          const bmark = isUser ? buyMarks(t.text) : [];
          return (
            <div key={ti} className={`text-sm flex ${isUser ? "justify-end" : ""}`}>
              <span className={`inline-block rounded-2xl px-3 py-1.5 max-w-[85%] ${isUser ? "bg-[var(--brand)]/10" : "bg-[var(--panel2)]"}`}>
                <span className="text-[10px] uppercase tracking-wide text-[var(--muted)] block">{isUser ? "👤 Caller" : "🤖 AI Agent"}{t.at ? ` · ${new Date(t.at).toLocaleString("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit" })} CT` : ""}</span>
                {isUser ? tokens.map((tok, i) => {
                  const c = clean(tok);
                  if (!c) return <span key={i}>{tok}</span>;
                  const armed = armedTokens.has(c);
                  const isAi = aiTokens.has(c);
                  const isCand = callerCands.has(c);
                  const isBuy = bmark[i];
                  const cls = armed ? "bg-[var(--brand)]/30 text-[var(--brand)] rounded px-0.5 cursor-pointer"
                    : isAi ? "bg-[var(--gold)]/35 text-[var(--gold)] rounded px-0.5 cursor-pointer font-semibold"
                    : isCand ? "bg-[var(--gold)]/20 text-[var(--gold)] underline decoration-dotted rounded px-0.5 cursor-pointer"
                    : isBuy ? "bg-[var(--brand)]/20 text-[var(--brand)] rounded px-0.5"
                    : "cursor-pointer hover:bg-[var(--panel2)] rounded px-0.5";
                  return <span key={i} className={cls} title={armed ? "already a money word — click to add to active cloud" : "click to arm as money word"} onClick={() => armWord(tok)}>{tok}</span>;
                }) : t.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* Money-word clouds */}
      {moneyWords.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {moneyWords.map((m) => (
            <div key={m.id} className={`card !p-3 ${activeCloud === m.id ? "ring-1 ring-[var(--gold)]" : ""}`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-[var(--gold)]">☁ {m.word}</span>
                <button onClick={() => setActiveCloud(activeCloud === m.id ? null : m.id)} className="btn btn-ghost text-[11px] !py-0.5 !px-2">{activeCloud === m.id ? "stop adding" : "+ add variants"}</button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {m.aliases.length === 0 && <span className="text-[11px] text-[var(--muted)]">No variants yet — click words above to add.</span>}
                {m.aliases.map((a) => (
                  <span key={a} className="inline-flex items-center gap-1 text-[11px] rounded-full border border-[var(--gold)]/40 text-[var(--gold)] px-2 py-0.5">
                    {a}<button onClick={() => removeAlias(m.id, a)} className="text-[var(--danger)] hover:opacity-70">×</button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {toast && <div className="mt-2 text-sm text-[var(--brand)]">✓ {toast}</div>}
    </div>
  );
}
