"use client";
import { useMemo, useState } from "react";
import { TAXONOMY } from "@/lib/rak-taxonomy";

type Item = { name: string; slug: string; kind: string };

// Instant search over every category + subcategory (+ any extra landers), with a real
// Search button that navigates to the full results page (which also matches offer text).
export default function MedigappSearch({ base = "", extra = [] }: { base?: string; extra?: Item[] }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const items = useMemo<Item[]>(() => {
    const arr: Item[] = [];
    for (const c of TAXONOMY) { arr.push({ name: c.name, slug: c.slug, kind: "Category" }); for (const s of c.subs) arr.push({ name: s.name, slug: s.slug, kind: c.name }); }
    for (const e of extra) if (!arr.some((a) => a.slug === e.slug)) arr.push(e);
    return arr;
  }, [extra]);
  const term = q.trim().toLowerCase();
  const matches = term ? items.filter((i) => i.name.toLowerCase().includes(term) || i.slug.includes(term)).slice(0, 8) : [];
  const go = () => { window.location.href = `${base}/search?q=${encodeURIComponent(q.trim())}`; };

  return (
    <div className="relative mx-auto max-w-xl">
      <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) go(); }} className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-white pl-4 pr-1.5 py-1.5 shadow-sm focus-within:border-[var(--brand)]">
        <span className="text-[var(--muted)]">🔍</span>
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search offers & topics — e.g. Medicare, travel, mortgage…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
          aria-label="Search"
        />
        <button type="submit" className="shrink-0 rounded-full px-5 py-2 text-sm font-bold text-white" style={{ background: "var(--brand)" }}>Search</button>
      </form>
      {open && matches.length > 0 && (
        <div className="absolute z-20 mt-1.5 w-full rounded-2xl border border-[var(--border)] bg-white shadow-xl overflow-hidden">
          {matches.map((m) => (
            <a key={m.slug} href={`${base}/${m.slug}`} onMouseDown={(e) => e.preventDefault()} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-[var(--soft)]">
              <span className="font-medium text-[var(--ink)]">{m.name}</span>
              <span className="text-[11px] text-[var(--muted)]">{m.kind}</span>
            </a>
          ))}
          <button onMouseDown={(e) => { e.preventDefault(); go(); }} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-[var(--brand)] hover:bg-[var(--soft)] border-t border-[var(--border)]">See all results for “{q.trim()}” →</button>
        </div>
      )}
    </div>
  );
}
