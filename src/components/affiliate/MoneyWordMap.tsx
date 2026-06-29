"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type MW = { id: string; word: string; affiliateVertical: string; triggers: number };
type VOpt = { value: string; label: string };

async function post(body: Record<string, unknown>) {
  const r = await fetch("/api/affiliates", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return r.json().catch(() => ({}));
}

// What the Auto keyword matcher already routes (no mapping needed).
const AUTO_RULES: [string, string][] = [
  ["medicare, medigap, supplement, advantage, part A/B/D, turning 65", "Medicare"],
  ["auto, car, vehicle, automobile, motor", "Auto Insurance"],
  ["home, homeowner, house, property, condo, renter", "Home Insurance"],
  ["life, final expense, term/whole life, burial, funeral", "Life Insurance"],
];

export default function MoneyWordMap({ words, verticals }: { words: MW[]; verticals: VOpt[] }) {
  const router = useRouter();
  const [map, setMap] = useState<Record<string, string>>(Object.fromEntries(words.map((w) => [w.id, w.affiliateVertical])));
  const [filter, setFilter] = useState("");
  const [newWord, setNewWord] = useState("");
  const [newVert, setNewVert] = useState(verticals[0]?.value || "");
  const [busy, setBusy] = useState(false);

  async function set(id: string, vertical: string) {
    setMap((m) => ({ ...m, [id]: vertical }));
    await post({ action: "mapMoneyWord", moneyWordId: id, vertical });
  }
  async function add() {
    const w = newWord.trim();
    if (!w) return;
    setBusy(true);
    const r = await post({ action: "addMoneyWord", word: w, vertical: newVert });
    setBusy(false);
    if (r.ok) { setNewWord(""); router.refresh(); }
    else alert(r.error || "Could not add");
  }
  const shown = words.filter((w) => !filter || w.word.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-4">
      {/* Auto keyword rules — these route even with nothing mapped */}
      <Card>
        <div className="text-xs font-semibold mb-2">Already auto-routing (no mapping needed)</div>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {AUTO_RULES.map(([words, v]) => (
            <div key={v} className="text-xs text-[var(--muted)]"><span className="text-[var(--brand)] font-medium">{v}</span> — when a caller says: {words}</div>
          ))}
        </div>
      </Card>

      {/* Add a word → vertical (for words you don't have yet, e.g. home/auto/life) */}
      <div className="card p-4">
        <div className="text-sm font-medium mb-2">Add a money word → vertical</div>
        <div className="flex flex-wrap gap-2">
          <input
            value={newWord} onChange={(e) => setNewWord(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") add(); }}
            placeholder='e.g. "home insurance"'
            className="flex-1 min-w-[200px] rounded border border-[var(--border)] bg-[var(--panel2)] px-3 py-2 text-sm"
          />
          <select value={newVert} onChange={(e) => setNewVert(e.target.value)} className="rounded border border-[var(--border)] bg-[var(--panel2)] px-2 py-2 text-sm">
            {verticals.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
          <button onClick={add} disabled={busy || !newWord.trim()} className="btn btn-brand text-sm">{busy ? "…" : "+ Add & map"}</button>
        </div>
        <p className="text-[11px] text-[var(--muted)] mt-2">Creates an active money word tagged to that vertical. Callers who say it ping that vertical.</p>
      </div>

      {/* Existing words */}
      <div className="card p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-sm text-[var(--muted)]">Your money words ({words.length}). Set each one&apos;s vertical, or leave <b>Auto</b> to use the keyword rules above.</p>
          {words.length > 8 && <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="filter…" className="rounded border border-[var(--border)] bg-[var(--panel2)] px-2 py-1 text-sm w-36" />}
        </div>
        {shown.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No money words yet — add one above (or they appear here automatically as calls surface new words in Arm Cloud).</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((w) => (
              <div key={w.id} className="flex items-center gap-2 rounded border border-[var(--border)] px-2 py-1.5">
                <span className="text-sm flex-1 truncate" title={w.word}>{w.word}</span>
                {w.triggers > 0 && <span className="text-[10px] text-[var(--muted)]" title="times heard on calls">{w.triggers}×</span>}
                <select
                  value={map[w.id] || ""}
                  onChange={(e) => set(w.id, e.target.value)}
                  className={`rounded border px-1.5 py-1 text-xs ${map[w.id] ? "border-[var(--brand)] text-[var(--brand)]" : "border-[var(--border)] text-[var(--muted)]"} bg-[var(--panel2)]`}
                >
                  <option value="">Auto</option>
                  {verticals.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="card p-4">{children}</div>;
}
