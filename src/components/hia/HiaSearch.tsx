"use client";
import { useMemo, useState } from "react";
import { HIA } from "@/lib/health";

type C = { name: string; slug: string; state: string; type: string };
const K = HIA.colors;

export default function HiaSearch({ carriers, states }: { carriers: C[]; states: { name: string; abbr: string }[] }) {
  const [q, setQ] = useState("");
  const [st, setSt] = useState("");
  const term = q.trim().toLowerCase();
  const filtered = useMemo(() => carriers.filter((c) => (!term || c.name.toLowerCase().includes(term)) && (!st || c.state === st)), [carriers, term, st]);

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by company (e.g. Aetna, Blue Cross)…" aria-label="Search health insurance companies"
          className="flex-1 min-w-[220px] rounded-lg border px-4 py-2.5" style={{ borderColor: K.border, color: K.ink }} />
        <select value={st} onChange={(e) => setSt(e.target.value)} aria-label="Filter by state" className="rounded-lg border px-4 py-2.5" style={{ borderColor: K.border, color: K.ink }}>
          <option value="">All states</option>
          {states.map((s) => <option key={s.abbr} value={s.abbr}>{s.name}</option>)}
        </select>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <a key={c.slug} href={`/private/${c.slug}`} className="rounded-lg border px-4 py-3 hover:shadow-sm" style={{ borderColor: K.border }}>
            <div className="font-semibold" style={{ color: K.navy }}>{c.name}</div>
            <div className="text-xs" style={{ color: K.muted }}>{c.state} · {c.type}</div>
          </a>
        ))}
        {filtered.length === 0 && <div className="text-sm" style={{ color: K.muted }}>No companies match — try another search.</div>}
      </div>
    </div>
  );
}
