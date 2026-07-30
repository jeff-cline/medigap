"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import BuyerPanel from "./BuyerPanel";

type Row = {
  id: string; parentId: string | null; sortOrder: number; active: boolean; word: string; slug: string;
  valueCents: number; states: string; ageRule: string; contextPrompt: string; askQuestionPrompt: string;
};

async function api(body: unknown) {
  const res = await fetch("/api/static/tree", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
}

export default function StaticControls({ rows, selected }: { rows: Row[]; selected: string | null }) {
  const router = useRouter();
  const refresh = () => router.refresh();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const run = async (body: unknown): Promise<boolean> => {
    setBusy(true);
    setErr(null);
    try {
      await api(body);
      refresh();
      return true;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const topLevel = useMemo(() => rows.filter((r) => !r.parentId).sort((a, b) => a.sortOrder - b.sortOrder), [rows]);
  const sel = rows.find((r) => r.id === selected) ?? null;
  const children = useMemo(() => (sel ? rows.filter((r) => r.parentId === sel.id).sort((a, b) => a.sortOrder - b.sortOrder) : []), [rows, sel]);

  const TabRow = ({ items, label }: { items: Row[]; label: string }) => (
    <div className="mb-4">
      <div className="text-xs uppercase text-[var(--muted)] mb-1">{label}</div>
      <div className="flex flex-wrap gap-2 items-center">
        {items.map((r) => (
          <div key={r.id} className={`flex items-center gap-1 rounded px-2 py-1 border ${selected === r.id ? "border-[var(--gold)]" : "border-[var(--border)]"} ${r.active ? "" : "opacity-50"}`}>
            <button className="font-medium" onClick={() => router.push(`/dashboard/static?node=${r.id}`)}>{r.word}</button>
            <button title="left" disabled={busy} onClick={() => run({ action: "move", id: r.id, dir: "up" })}>◀</button>
            <button title="right" disabled={busy} onClick={() => run({ action: "move", id: r.id, dir: "down" })}>▶</button>
            <button title="on/off" disabled={busy} onClick={() => run({ action: "update", id: r.id, patch: { active: !r.active } })}>{r.active ? "🟢" : "⚪"}</button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {err && <div className="rounded border border-[var(--danger)] text-[var(--danger)] text-sm px-3 py-2">{err}</div>}
      <TabRow items={topLevel} label="Top-level tabs" />
      <div className="flex gap-2">
        <button className="btn" disabled={busy} onClick={() => run({ action: "create", parentId: null, word: "New Money Word" })}>+ Add tab</button>
        {sel && <button className="btn" disabled={busy} onClick={() => run({ action: "create", parentId: sel.id, word: "New Sub-Word" })}>+ Make sub-tab of “{sel.word}”</button>}
      </div>

      {sel && (
        <>
          {children.length > 0 && <TabRow items={children} label={`Sub-tabs of “${sel.word}”`} />}
          <NodeForm key={sel.id} row={sel} busy={busy} isLeaf={children.length === 0} onSave={(patch) => run({ action: "update", id: sel.id, patch })} onDelete={async () => { if (confirm(`Delete “${sel.word}” and its sub-tabs?`)) { const ok = await run({ action: "delete", id: sel.id }); if (ok) router.push("/dashboard/static"); } }} />
        </>
      )}
    </div>
  );
}

function NodeForm({ row, busy, isLeaf, onSave, onDelete }: { row: Row; busy: boolean; isLeaf: boolean; onSave: (patch: Record<string, unknown>) => void; onDelete: () => void }) {
  const [word, setWord] = useState(row.word);
  const [valueDollars, setValueDollars] = useState((row.valueCents / 100).toString());
  const [statesCsv, setStatesCsv] = useState((JSON.parse(row.states || "[]") as string[]).join(", "));
  const [ctx, setCtx] = useState(row.contextPrompt);
  const [ask, setAsk] = useState(row.askQuestionPrompt);
  const ageRule = JSON.parse(row.ageRule || "{}") as { min?: number; max?: number };
  const [ageMin, setAgeMin] = useState(ageRule.min?.toString() ?? "");
  const [ageMax, setAgeMax] = useState(ageRule.max?.toString() ?? "");

  const save = () => onSave({
    word: word.trim(),
    valueCents: Math.round((parseFloat(valueDollars) || 0) * 100),
    states: statesCsv.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean),
    ageRule: { ...(ageMin ? { min: +ageMin } : {}), ...(ageMax ? { max: +ageMax } : {}) },
    contextPrompt: ctx, askQuestionPrompt: ask,
  });

  const L = "block text-xs uppercase text-[var(--muted)] mb-1";
  const F = "w-full rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1 mb-3";
  return (
    <div className="rounded-lg border border-[var(--border)] p-4 max-w-2xl">
      <div className="text-lg font-semibold mb-3">Config — {row.word}</div>
      <label className={L}>Name</label><input className={F} value={word} onChange={(e) => setWord(e.target.value)} />
      <div className="grid grid-cols-3 gap-3">
        <div><label className={L}>Value ($)</label><input className={F} value={valueDollars} onChange={(e) => setValueDollars(e.target.value)} /></div>
        <div><label className={L}>Age min</label><input className={F} value={ageMin} onChange={(e) => setAgeMin(e.target.value)} /></div>
        <div><label className={L}>Age max</label><input className={F} value={ageMax} onChange={(e) => setAgeMax(e.target.value)} /></div>
      </div>
      <label className={L}>States (CSV, blank = all)</label><input className={F} value={statesCsv} onChange={(e) => setStatesCsv(e.target.value)} placeholder="TX, FL, CA" />
      <label className={L}>Context prompt</label><textarea className={F} rows={3} value={ctx} onChange={(e) => setCtx(e.target.value)} />
      <label className={L}>Ask-this-question prompt</label><textarea className={F} rows={2} value={ask} onChange={(e) => setAsk(e.target.value)} />
      <div className="flex gap-2 mb-1">
        <button className="btn" disabled={busy} onClick={save}>Save config</button>
        <button className="btn" disabled={busy} onClick={onDelete}>Delete</button>
      </div>
      <div className="text-[11px] text-[var(--muted)] mb-2">Saves the fields above. Buyers below each save on their own.</div>
      {isLeaf
        ? <BuyerPanel moneyWordId={row.id} />
        : <div className="text-xs text-[var(--muted)] mb-3">This is a <b>category</b> (has sub-tabs) — only leaf money words route to buyers.</div>}
      <div className="text-xs text-[var(--muted)] mt-3 mb-0">Text template · voice — <b>Phase 4</b>.</div>
    </div>
  );
}
