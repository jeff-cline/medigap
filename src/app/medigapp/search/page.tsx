import type { Metadata } from "next";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { MEDIGAPP } from "@/lib/medigapp";
import { TAXONOMY } from "@/lib/rak-taxonomy";
import MedigappSearch from "@/components/MedigappSearch";
import MedigappFooter from "@/components/MedigappFooter";

export const dynamic = "force-dynamic";
const C = MEDIGAPP.colors;
const vars = { "--bg": C.bg, "--ink": C.ink, "--brand": C.brand, "--green": C.green, "--gold": C.gold, "--soft": C.soft, "--border": C.border, "--muted": C.muted } as React.CSSProperties;

export const metadata: Metadata = { title: `Search | ${MEDIGAPP.brand}`, robots: { index: false } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const base = ((await headers()).get("x-pathname") || "").startsWith("/r") ? "/r" : "";
  const q = ((await searchParams).q || "").trim();
  const term = q.toLowerCase();

  const topics = term
    ? TAXONOMY.flatMap((c) => [{ name: c.name, slug: c.slug, kind: "Category" }, ...c.subs.map((s) => ({ name: s.name, slug: s.slug, kind: c.name }))])
        .filter((t) => t.name.toLowerCase().includes(term) || t.slug.includes(term)).slice(0, 20)
    : [];
  const offers = term
    ? await db.rakOffer.findMany({
        where: { active: true, approved: true, OR: [{ title: { contains: term } }, { advertiser: { contains: term } }, { description: { contains: term } }] },
        take: 24,
      }).catch(() => [])
    : [];

  return (
    <div style={vars} className="min-h-screen bg-white text-[var(--ink)]">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <a href={`tel:${MEDIGAPP.tel}`} className="block w-full text-center text-white font-extrabold py-3.5 rounded-2xl text-xl" style={{ background: `linear-gradient(110deg, ${C.brand}, ${C.green})` }}>📞 {MEDIGAPP.brand} — {MEDIGAPP.telDisplay}</a>
        <h1 className="mt-6 text-2xl font-extrabold tracking-tight">{q ? <>Results for “{q}”</> : "Search"}</h1>
        <div className="mt-4"><MedigappSearch base={base} /></div>

        {q && topics.length === 0 && offers.length === 0 && (
          <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--soft)] p-6 text-center text-sm text-[var(--muted)]">
            No matches for “{q}”. Try a broader term, browse the <a href={`${base}/directory`} className="text-[var(--brand)]">directory</a>, or call {MEDIGAPP.brand}.
          </div>
        )}

        {topics.length > 0 && (
          <div className="mt-7">
            <div className="text-xs font-bold uppercase tracking-widest text-[var(--gold)] mb-2">Topics</div>
            <div className="flex flex-wrap gap-2">
              {topics.map((t) => <a key={t.slug} href={`${base}/${t.slug}`} className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium hover:border-[var(--brand)]">{t.name} <span className="text-[10px] text-[var(--muted)]">{t.kind}</span></a>)}
            </div>
          </div>
        )}

        {offers.length > 0 && (
          <div className="mt-8 space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">Offers</div>
            {offers.map((o) => (
              <a key={o.id} href={`/api/rak/go?s=search&o=${encodeURIComponent(o.id)}`} target="_blank" rel="sponsored noopener" className="flex gap-4 items-center rounded-2xl border border-[var(--border)] bg-white p-4 hover:shadow-lg transition-shadow">
                {o.imageUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={o.imageUrl} alt={o.title} className="h-16 w-16 rounded-xl object-cover shrink-0 bg-[var(--soft)]" />
                  : <div className="h-16 w-16 rounded-xl shrink-0 grid place-items-center text-2xl" style={{ background: C.soft }}>🏷️</div>}
                <div className="min-w-0 flex-1">
                  {o.advertiser && <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">{o.advertiser}</div>}
                  <div className="font-bold leading-snug">{o.title}</div>
                  {o.description && <div className="text-xs text-[var(--muted)] mt-0.5 line-clamp-2">{o.description}</div>}
                </div>
                <span className="shrink-0 rounded-full px-4 py-2 text-sm font-bold text-white" style={{ background: C.brand }}>View →</span>
              </a>
            ))}
          </div>
        )}

        <MedigappFooter base={base} />
      </div>
    </div>
  );
}
