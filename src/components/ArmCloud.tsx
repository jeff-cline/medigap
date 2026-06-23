"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type CloudWord = { word: string; count: number };

const clean = (w: string) => w.toLowerCase().replace(/[^a-z' ]/g, "").replace(/\s+/g, " ").trim();

export default function ArmCloud({ initial, calls }: { initial: CloudWord[]; calls: number }) {
  const [words, setWords] = useState<CloudWord[]>(initial);
  const [armed, setArmed] = useState<string[]>([]);          // armed this session → green
  const [filter, setFilter] = useState("");
  const [sel, setSel] = useState("");
  const [manual, setManual] = useState("");
  const [busy, setBusy] = useState<string>("");
  const [toast, setToast] = useState("");
  const [callCount, setCallCount] = useState(calls);
  const armedSet = useRef<Set<string>>(new Set());

  function flash(m: string) { setToast(m); window.setTimeout(() => setToast(""), 2600); }

  // POST to the money-word system. 409 = already exists → treat as armed.
  const armWord = useCallback(async (raw: string) => {
    const word = clean(raw);
    if (!word || armedSet.current.has(word)) return;
    setBusy(word);
    const r = await fetch("/api/money-words", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", word }),
    });
    setBusy("");
    if (r.ok || r.status === 409) {
      armedSet.current.add(word);
      setArmed((a) => (a.includes(word) ? a : [word, ...a]));
      setWords((ws) => ws.filter((w) => w.word !== word));        // armed → leaves the cloud
      flash(r.status === 409 ? `“${word}” was already armed` : `✓ “${word}” armed → money word`);
    } else {
      const d = await r.json().catch(() => ({}));
      flash(d.error || "Could not arm that word");
    }
  }, []);

  // Live poll: pull the latest cloud; server already strips armed words.
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const r = await fetch("/api/arm-cloud", { cache: "no-store" });
        if (!r.ok) return;
        const d = (await r.json()) as { words: CloudWord[]; calls: number };
        if (!alive) return;
        setCallCount(d.calls);
        setWords(d.words.filter((w) => !armedSet.current.has(w.word)));
      } catch { /* ignore transient */ }
    };
    const id = window.setInterval(tick, 6000);
    return () => { alive = false; window.clearInterval(id); };
  }, []);

  const max = useMemo(() => words.reduce((m, w) => Math.max(m, w.count), 1), [words]);
  const shown = useMemo(() => {
    const f = filter.trim().toLowerCase();
    return f ? words.filter((w) => w.word.includes(f)) : words;
  }, [words, filter]);

  // Font size scales with how often the word is spoken across all calls.
  function sizeFor(count: number): string {
    const t = Math.log(count + 1) / Math.log(max + 1); // 0..1
    return `${(0.82 + t * 1.5).toFixed(2)}rem`;
  }

  function onMouseUp() {
    const t = window.getSelection()?.toString().trim() || "";
    setSel(t.length > 1 ? clean(t) : "");
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && manual.trim()) { armWord(manual); setManual(""); } }}
          placeholder="Type a word or phrase to arm…"
          className="!w-64"
        />
        <button onClick={() => { if (manual.trim()) { armWord(manual); setManual(""); } }} disabled={!manual.trim()} className="btn btn-brand text-xs !py-2">⚡ Arm word</button>
        {sel && <button onClick={() => { armWord(sel); setSel(""); window.getSelection()?.removeAllRanges(); }} className="btn btn-ghost text-xs !py-2 text-[var(--gold)]">⚡ Arm “{sel.length > 24 ? sel.slice(0, 24) + "…" : sel}”</button>}
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter cloud…" className="!w-40 ml-auto" />
      </div>

      {/* Armed this session — green */}
      {armed.length > 0 && (
        <div className="mb-4 rounded-xl border border-[var(--brand)]/30 bg-[var(--brand)]/5 p-3">
          <div className="text-[11px] uppercase tracking-wide text-[var(--brand)] font-bold mb-2">✓ Armed this session — sent to Money Words</div>
          <div className="flex flex-wrap gap-2">
            {armed.map((w) => (
              <span key={w} className="rounded-full bg-[var(--brand)]/25 text-[var(--brand)] border border-[var(--brand)] px-3 py-1 text-sm font-semibold">{w}</span>
            ))}
          </div>
        </div>
      )}

      {/* The cloud */}
      <div onMouseUp={onMouseUp} className="select-text min-h-[200px] leading-relaxed flex flex-wrap gap-x-3 gap-y-2 items-baseline">
        {shown.length === 0 && (
          <p className="text-sm text-[var(--muted)]">
            {words.length === 0 ? "No caller words yet. As calls come in, the words people actually say show up here to arm." : "No words match that filter."}
          </p>
        )}
        {shown.map((w) => (
          <button
            key={w.word}
            onClick={() => armWord(w.word)}
            disabled={busy === w.word}
            title={`said ${w.count}× across calls — click to arm as a money word`}
            style={{ fontSize: sizeFor(w.count) }}
            className={`rounded px-1.5 py-0.5 transition hover:bg-[var(--gold)]/20 hover:text-[var(--gold)] ${busy === w.word ? "opacity-40" : "text-[var(--text)]"}`}
          >
            {w.word}<sub className="text-[9px] text-[var(--muted)] ml-0.5">{w.count}</sub>
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3 text-[11px] text-[var(--muted)]">
        <span>{words.length} unarmed words · across {callCount} calls · live (refreshes every 6s)</span>
        {toast && <span className="ml-auto text-[var(--brand)] font-medium">{toast}</span>}
      </div>
    </div>
  );
}
