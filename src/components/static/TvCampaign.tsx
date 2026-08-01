"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Section, Stat } from "@/components/ui";

type TN = { id: string; number: string; label: string; mode: string; moneyWordSlug: string; thankYouText: string; billableSeconds: number; active: boolean };
type CallRow = { id: string; from: string; name: string; state: string; connectSec: number; durationSec: number; disposition: string; moneyWord: string; at: string; toNumber: string; billable: boolean };
type MW = { slug: string; word: string };
type Props = { numbers: TN[]; calls: CallRow[]; moneyWords: MW[] };

const fmtDur = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const fmtNum = (d: string) => {
  const x = d.replace(/\D/g, "").slice(-10);
  return x.length === 10 ? `(${x.slice(0, 3)}) ${x.slice(3, 6)}-${x.slice(6)}` : d;
};

export default function TvCampaign({ numbers, calls, moneyWords }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [numFilter, setNumFilter] = useState("");

  const post = async (body: unknown) => {
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/static/tracking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Failed (${res.status})`);
      router.refresh();
      return true;
    } catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong."); return false; }
    finally { setBusy(false); }
  };

  const shown = useMemo(() => (numFilter ? calls.filter((c) => c.toNumber === numFilter) : calls), [calls, numFilter]);
  const billableCount = shown.filter((c) => c.billable).length;

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><span title="As Seen on TV">📺</span> National TV Campaign</h1>
          <p className="text-sm text-[var(--muted)]">Calls from your TV tracking numbers. Toggle each number between the AI flow and direct-to-buyer to A/B what converts.</p>
        </div>
        <a href="/dashboard/static" className="btn btn-ghost text-sm">← Static dashboard</a>
      </div>

      {err && <div className="rounded border border-[var(--danger)] text-[var(--danger)] text-sm px-3 py-2 mb-4">{err}</div>}

      <div className="grid gap-3 sm:grid-cols-3 mb-6">
        <Stat label="TV calls" value={String(shown.length)} sub={numFilter ? fmtNum(numFilter) : "all numbers"} />
        <Stat label="Billable (≥ 120s)" value={String(billableCount)} sub="connected long enough" tone="up" />
        <Stat label="Tracking numbers" value={String(numbers.length)} sub={`${numbers.filter((n) => n.mode === "direct").length} on direct`} />
      </div>

      <Section title="Tracking numbers" desc="Flow = the AI static flow. Direct = skip the AI and route straight to a money word's buyers.">
        <div className="space-y-3 mb-6">
          {numbers.map((n) => <NumberEditor key={n.id} tn={n} moneyWords={moneyWords} busy={busy} onSave={post} />)}
          <NewNumber moneyWords={moneyWords} busy={busy} onSave={post} />
        </div>
      </Section>

      <Section title="Calls" desc="Click a caller to see everything we know about them. Green = billable (connected ≥ 120 seconds).">
        <div className="flex items-center gap-2 mb-3 text-sm">
          <span className="text-[var(--muted)]">Number</span>
          <select className="rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1" value={numFilter} onChange={(e) => setNumFilter(e.target.value)}>
            <option value="">All</option>
            {numbers.map((n) => <option key={n.id} value={n.number}>{fmtNum(n.number)} — {n.label || n.mode}</option>)}
          </select>
        </div>
        <div className="card !p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[var(--muted)] text-xs uppercase">
              <tr className="border-b border-[var(--border)]">
                <th className="px-3 py-2">Caller</th><th className="px-3 py-2">State</th><th className="px-3 py-2">Money word</th>
                <th className="px-3 py-2">Connect</th><th className="px-3 py-2">Billable</th><th className="px-3 py-2">Disposition</th><th className="px-3 py-2">When</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && <tr><td colSpan={7} className="px-3 py-4 text-[var(--muted)]">No TV calls yet.</td></tr>}
              {shown.map((c) => (
                <tr key={c.id} className="border-b border-[var(--border)] hover:bg-[var(--panel2)]">
                  <td className="px-3 py-2">
                    <a href={`/dashboard/static/calls/${c.id}`} className="text-[var(--brand)] font-medium">{c.from ? fmtNum(c.from) : "unknown"}</a>
                    {c.name && c.name !== "Inbound caller" && <span className="text-[var(--muted)] ml-1">· {c.name}</span>}
                  </td>
                  <td className="px-3 py-2">{c.state || "—"}</td>
                  <td className="px-3 py-2">{c.moneyWord || "—"}</td>
                  <td className="px-3 py-2 tabular-nums">{c.connectSec ? fmtDur(c.connectSec) : "—"}</td>
                  <td className="px-3 py-2">{c.billable ? <span className="text-[color:#3fb950] font-semibold">✓ billable</span> : <span className="text-[var(--muted)]">—</span>}</td>
                  <td className="px-3 py-2">{c.disposition}</td>
                  <td className="px-3 py-2 text-[var(--muted)]">{new Date(c.at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}

function fields(tn: Partial<TN>) {
  return { label: tn.label || "", mode: tn.mode || "flow", moneyWordSlug: tn.moneyWordSlug || "", thankYouText: tn.thankYouText || "", billableSeconds: tn.billableSeconds ?? 120, active: tn.active !== false };
}

function NumberEditor({ tn, moneyWords, busy, onSave }: { tn: TN; moneyWords: MW[]; busy: boolean; onSave: (b: unknown) => Promise<boolean> }) {
  const [mode, setMode] = useState(tn.mode);
  const [label, setLabel] = useState(tn.label);
  const [mw, setMw] = useState(tn.moneyWordSlug);
  const [ty, setTy] = useState(tn.thankYouText);
  const [bill, setBill] = useState(tn.billableSeconds);

  const save = () => onSave({ action: "update", id: tn.id, number: tn.number, label, mode, moneyWordSlug: mw, thankYouText: ty, billableSeconds: bill, active: tn.active });
  const fmt = (d: string) => { const x = d.replace(/\D/g, "").slice(-10); return x.length === 10 ? `(${x.slice(0, 3)}) ${x.slice(3, 6)}-${x.slice(6)}` : d; };

  return (
    <div className={`rounded border border-[var(--border)] p-3 ${tn.active ? "" : "opacity-60"}`}>
      <div className="flex items-center gap-3 flex-wrap mb-2">
        <span className="font-semibold">{fmt(tn.number)}</span>
        <input className="rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-sm" placeholder="Label (e.g. National TV)" value={label} onChange={(e) => setLabel(e.target.value)} />
        <div className="inline-flex rounded-full border border-[var(--border)] overflow-hidden text-sm">
          <button onClick={() => setMode("flow")} className={`px-3 py-1 ${mode === "flow" ? "bg-[var(--gold)] text-black font-semibold" : ""}`}>Flow (AI)</button>
          <button onClick={() => setMode("direct")} className={`px-3 py-1 ${mode === "direct" ? "bg-[var(--gold)] text-black font-semibold" : ""}`}>Direct</button>
        </div>
        {mode === "direct" && (
          <select className="rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-sm" value={mw} onChange={(e) => setMw(e.target.value)}>
            <option value="">— route to money word —</option>
            {moneyWords.map((m) => <option key={m.slug} value={m.slug}>{m.word}</option>)}
          </select>
        )}
        <button className="btn btn-ghost text-xs" disabled={busy} onClick={() => onSave({ action: "update", id: tn.id, number: tn.number, ...fields(tn), active: !tn.active })}>{tn.active ? "🟢 On" : "⚪ Off"}</button>
        <button className="text-xs text-[var(--danger)] ml-auto" disabled={busy} onClick={() => { if (confirm("Remove this tracking number?")) onSave({ action: "delete", id: tn.id }); }}>Delete</button>
      </div>
      <div className="grid gap-2 md:grid-cols-[1fr_auto] items-center">
        <input className="rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-sm" placeholder="Thank-you text (blank = default)" value={ty} onChange={(e) => setTy(e.target.value)} />
        <div className="flex items-center gap-2 text-xs">
          <label>Billable ≥ <input type="number" className="w-16 rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1" value={bill} onChange={(e) => setBill(Number(e.target.value))} />s</label>
          <button className="btn text-sm" disabled={busy} onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}

function NewNumber({ moneyWords, busy, onSave }: { moneyWords: MW[]; busy: boolean; onSave: (b: unknown) => Promise<boolean> }) {
  const [number, setNumber] = useState("");
  const [label, setLabel] = useState("");
  const [mode, setMode] = useState("flow");
  const [mw, setMw] = useState("");

  const add = async () => {
    const ok = await onSave({ action: "create", number, label, mode, moneyWordSlug: mw });
    if (ok) { setNumber(""); setLabel(""); setMode("flow"); setMw(""); }
  };

  return (
    <div className="card">
      <div className="text-sm font-medium mb-2">Add a tracking number</div>
      <div className="flex flex-wrap items-center gap-2">
        <input className="rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-sm" placeholder="Phone number" value={number} onChange={(e) => setNumber(e.target.value)} />
        <input className="rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-sm" placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
        <div className="inline-flex rounded-full border border-[var(--border)] overflow-hidden text-sm">
          <button onClick={() => setMode("flow")} className={`px-3 py-1 ${mode === "flow" ? "bg-[var(--gold)] text-black font-semibold" : ""}`}>Flow</button>
          <button onClick={() => setMode("direct")} className={`px-3 py-1 ${mode === "direct" ? "bg-[var(--gold)] text-black font-semibold" : ""}`}>Direct</button>
        </div>
        {mode === "direct" && (
          <select className="rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-sm" value={mw} onChange={(e) => setMw(e.target.value)}>
            <option value="">— money word —</option>
            {moneyWords.map((m) => <option key={m.slug} value={m.slug}>{m.word}</option>)}
          </select>
        )}
        <button className="btn" disabled={busy || !number.trim()} onClick={add}>+ Add</button>
      </div>
    </div>
  );
}
