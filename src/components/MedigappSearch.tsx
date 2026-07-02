"use client";
import { useMemo, useState } from "react";
import { TAXONOMY } from "@/lib/rak-taxonomy";

type Item = { name: string; slug: string; kind: string };

// Instant search over every category + subcategory (and any extra landers passed in).
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

  return (
    <div className="relative mx-auto max-w-xl">
      <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2.5 shadow-sm focus-within:border-[var(--brand)]">
        <span className="text-[var(--muted)]">🔍</span>
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => { if (e.key === "Enter" && matches[0]) window.location.href = `${base}/${matches[0].slug}`; }}
          placeholder="Search offers & topics — e.g. Medicare, travel, mortgage…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
          aria-label="Search topics"
        />
      </div>
      {open && matches.length > 0 && (
        <div className="absolute z-20 mt-1.5 w-full rounded-2xl border border-[var(--border)] bg-white shadow-xl overflow-hidden">
          {matches.map((m) => (
            <a key={m.slug} href={`${base}/${m.slug}`} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-[var(--soft)]">
              <span className="font-medium text-[var(--ink)]">{m.name}</span>
              <span className="text-[11px] text-[var(--muted)]">{m.kind}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
