"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

// Buy-signal phrases — the word(s) right after these are very likely a money word.
const BUY_PHRASES = [
  "how much does it cost", "how much does it", "what does it cost", "how much", "how do i get",
  "i would like", "i'd like", "i'm looking for", "looking for", "i need", "i want", "i buy",
  "can i order", "can i get", "can i buy", "do you sell", "do you have", "i'm interested in",
  "interested in", "sign me up", "i'll take", "where can i get", "where do i get",
].map((p) => p.split(" "));

const STOP = new Set(
  "the a an and or but it its is are am was were be been being to of for in on at by with from as i you he she we they me my mine your yours our ours this that these those do does did doing have has had can could would should will shall just about really kind sort like so very then than there here now ok okay yeah yes no not get got one some any".split(" ")
);

type Turn = { role: "assistant" | "user"; text: string; at?: string };
type Mark = "buy" | "cand" | undefined;
const clean = (w: string) => w.toLowerCase().replace(/[^a-z']/g, "");

// Build per-token marks for one caller utterance.
function markTokens(text: string): { tokens: string[]; marks: Mark[]; words: { i: number; c: string }[] } {
  const tokens = text.split(/(\s+)/);
  const words: { i: number; c: string }[] = [];
  tokens.forEach((t, i) => { const c = clean(t); if (c) words.push({ i, c }); });
  const marks: Mark[] = new Array(tokens.length).fill(undefined);
  for (let s = 0; s < words.length; s++) {
    for (const phrase of BUY_PHRASES) {
      if (s + phrase.length > words.length) continue;
      let hit = true;
      for (let k = 0; k < phrase.length; k++) if (words[s + k].c !== phrase[k]) { hit = false; break; }
      if (!hit) continue;
      for (let k = 0; k < phrase.length; k++) marks[words[s + k].i] = "buy";
      // mark up to 2 following non-stop words as candidate money words
      let taken = 0;
      for (let j = s + phrase.length; j < words.length && taken < 2; j++) {
        if (STOP.has(words[j].c)) continue;
        marks[words[j].i] = "cand"; taken++;
      }
    }
  }
  return { tokens, marks, words };
}

export default function CallTranscriptTagger({ turns, armed }: { turns: Turn[]; armed: string[] }) {
  const router = useRouter();
  const [tagged, setTagged] = useState<Set<string>>(new Set(armed.map((w) => w.toLowerCase())));
  const [busy, setBusy] = useState("");
  const [toast, setToast] = useState("");

  async function tag(word: string) {
    const w = clean(word);
    if (!w || tagged.has(w)) return;
    setBusy(w);
    const r = await fetch("/api/money-words", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", word: w }) });
    setBusy("");
    if (r.ok || r.status === 409) {
      setTagged((prev) => new Set(prev).add(w));
      setToast(`"${w}" armed as a money word`);
      setTimeout(() => setToast(""), 2500);
      router.refresh();
    }
  }

  // Candidate analysis across the whole call: buy-adjacent words + repeated meaningful words.
  const candidates = useMemo(() => {
    const freq = new Map<string, number>();
    const buyAdj = new Set<string>();
    for (const t of turns) {
      if (t.role !== "user") continue;
      const { marks, words, tokens } = markTokens(t.text);
      for (const w of words) if (!STOP.has(w.c) && w.c.length >= 4) freq.set(w.c, (freq.get(w.c) || 0) + 1);
      tokens.forEach((_, i) => { if (marks[i] === "cand") buyAdj.add(clean(tokens[i])); });
    }
    const repeated = [...freq.entries()].filter(([w, n]) => n >= 2 && !tagged.has(w)).sort((a, b) => b[1] - a[1]).map(([w, n]) => ({ w, n, buy: buyAdj.has(w) }));
    const buyOnly = [...buyAdj].filter((w) => w && !tagged.has(w) && !freq.has(w)).map((w) => ({ w, n: 1, buy: true }));
    return [...[...buyAdj].filter((w) => w && !tagged.has(w)).map((w) => ({ w, n: freq.get(w) || 1, buy: true })), ...repeated.filter((r) => !buyAdj.has(r.w)), ...buyOnly]
      .filter((v, idx, arr) => arr.findIndex((x) => x.w === v.w) === idx);
  }, [turns, tagged]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-3 text-xs text-[var(--muted)]">
        <span><span className="px-1.5 py-0.5 rounded bg-[var(--brand)]/20 text-[var(--brand)]">buy signal</span> — phrase that precedes intent</span>
        <span><span className="px-1.5 py-0.5 rounded bg-[var(--gold)]/25 text-[var(--gold)] underline decoration-dotted">likely money word</span> — the word right after</span>
        <span>· click any word to arm it</span>
      </div>

      <div className="space-y-1.5">
        {turns.map((t, ti) => {
          const isUser = t.role === "user";
          const { tokens, marks } = isUser ? markTokens(t.text) : { tokens: [t.text], marks: [undefined as Mark] };
          return (
            <div key={ti} className={`text-sm flex ${isUser ? "justify-end" : ""}`}>
              <span className={`inline-block rounded-2xl px-3 py-1.5 max-w-[85%] ${isUser ? "bg-[var(--brand)]/10" : "bg-[var(--panel2)]"}`}>
                <span className="text-[10px] uppercase tracking-wide text-[var(--muted)] block">{isUser ? "👤 Caller" : "🤖 AI Agent"}{t.at ? ` · ${new Date(t.at).toLocaleString("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit" })} CT` : ""}</span>
                {isUser ? tokens.map((tok, i) => {
                  if (!clean(tok)) return <span key={i}>{tok}</span>;
                  const m = marks[i];
                  const isTagged = tagged.has(clean(tok));
                  const cls = isTagged ? "bg-[var(--brand)]/30 text-[var(--brand)] rounded px-0.5"
                    : m === "buy" ? "bg-[var(--brand)]/20 text-[var(--brand)] rounded px-0.5 cursor-pointer"
                    : m === "cand" ? "bg-[var(--gold)]/25 text-[var(--gold)] underline decoration-dotted rounded px-0.5 cursor-pointer font-medium"
                    : "cursor-pointer hover:bg-[var(--panel2)] rounded px-0.5";
                  return <span key={i} className={cls} title={isTagged ? "already a money word" : "click to arm as money word"} onClick={() => tag(tok)}>{tok}</span>;
                }) : t.text}
              </span>
            </div>
          );
        })}
      </div>

      {candidates.length > 0 && (
        <div className="mt-4 card !p-4">
          <div className="text-xs uppercase tracking-wide text-[var(--muted)] mb-2">Suggested money words from this call</div>
          <div className="flex flex-wrap gap-2">
            {candidates.slice(0, 18).map((c) => (
              <button key={c.w} disabled={busy === c.w} onClick={() => tag(c.w)}
                className={`text-xs rounded-full border px-2.5 py-1 ${c.buy ? "border-[var(--gold)]/40 text-[var(--gold)]" : "border-[var(--border)] text-[var(--text)]"} hover:bg-[var(--panel2)]`}>
                + {c.w}{c.n > 1 ? <span className="text-[var(--muted)]"> ×{c.n}</span> : ""}{c.buy ? " ⚡" : ""}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[var(--muted)] mt-2">⚡ = followed a buy signal (high intent). ×N = repeated in the call. Click to arm; set the partner &amp; payout in Money Words.</p>
        </div>
      )}
      {toast && <div className="mt-2 text-sm text-[var(--brand)]">✓ {toast}</div>}
    </div>
  );
}
