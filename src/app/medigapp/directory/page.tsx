import type { Metadata } from "next";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { MEDIGAPP } from "@/lib/medigapp";
import { TAXONOMY, TIER_LABEL } from "@/lib/rak-taxonomy";
import MedigappSearch from "@/components/MedigappSearch";
import MedigappFooter from "@/components/MedigappFooter";

export const dynamic = "force-dynamic";
const C = MEDIGAPP.colors;
const vars = { "--bg": C.bg, "--ink": C.ink, "--brand": C.brand, "--green": C.green, "--gold": C.gold, "--soft": C.soft, "--border": C.border, "--muted": C.muted } as React.CSSProperties;

export const metadata: Metadata = {
  title: `Directory — Compare the Best Offers by Category | ${MEDIGAPP.brand}`,
  description: `Browse the best offers and deals across insurance, financial services, travel, home, electronics and more. ${MEDIGAPP.tagline}.`,
};

export default async function Directory() {
  const base = ((await headers()).get("x-pathname") || "").startsWith("/r") ? "/r" : "";
  const cats = [...TAXONOMY].sort((a, b) => b.tier - a.tier);
  const landers = await db.rakPage.findMany({ where: { active: true }, orderBy: [{ views: "desc" }] }).catch(() => []);

  const ld = {
    "@context": "https://schema.org", "@type": "CollectionPage", name: `${MEDIGAPP.brand} — Offer Directory`,
    hasPart: TAXONOMY.map((c) => ({ "@type": "WebPage", name: c.name, url: `${base}/${c.slug}` })),
  };

  return (
    <div style={vars} className="min-h-screen bg-white text-[var(--ink)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="mx-auto max-w-4xl px-5 py-7">
        <a href={`tel:${MEDIGAPP.tel}`} className="block w-full text-center text-white font-extrabold py-4 rounded-2xl text-2xl tracking-tight" style={{ background: `linear-gradient(110deg, ${C.brand}, ${C.green})` }}>
          📞 Call {MEDIGAPP.brand} — {MEDIGAPP.telDisplay}
          <span className="block text-[12px] font-semibold opacity-90 mt-0.5">{MEDIGAPP.tagline} · Free</span>
        </a>

        <div className="mt-7 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight">The best offers, by category.</h1>
          <p className="mt-2 text-[15px] text-[var(--muted)] max-w-2xl mx-auto">Compare top-rated deals across dozens of categories — insurance, financial, travel, home and more — or call {MEDIGAPP.brand} for free help. <a href={`${base}/answers`} className="text-[var(--brand)]">See common questions →</a></p>
        </div>

        <div className="mt-6"><MedigappSearch base={base} extra={landers.map((p) => ({ name: p.moneyWord || p.title, slug: p.slug, kind: "Topic" }))} /></div>

        {landers.length > 0 && (
          <div className="mt-7">
            <div className="text-xs font-bold uppercase tracking-widest text-[var(--gold)] mb-2">Featured topics</div>
            <div className="flex flex-wrap gap-2">
              {landers.map((p) => <a key={p.id} href={`${base}/${p.slug}`} className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium hover:border-[var(--brand)]">{p.moneyWord || p.title}</a>)}
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {cats.map((cat) => (
            <div key={cat.slug} className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex items-center justify-between">
                <a href={`${base}/${cat.slug}`} className="text-lg font-bold tracking-tight hover:text-[var(--brand)]">{cat.icon} {cat.name}</a>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: cat.tier >= 4 ? C.gold : cat.tier === 3 ? "#e7f0ff" : C.soft, color: cat.tier >= 4 ? "#fff" : C.muted }}>{TIER_LABEL[cat.tier].split(" ")[0]}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {cat.subs.map((s) => <a key={s.slug} href={`${base}/${s.slug}`} className="text-xs rounded-full bg-[var(--soft)] px-2.5 py-1 text-[var(--muted)] hover:text-[var(--brand)]">{s.name}</a>)}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-9 text-center">
          <a href={`tel:${MEDIGAPP.tel}`} className="inline-block text-white font-extrabold py-3.5 px-7 rounded-2xl text-xl" style={{ background: `linear-gradient(110deg, ${C.brand}, ${C.green})` }}>📞 Call {MEDIGAPP.telDisplay}</a>
        </div>
        <MedigappFooter base={base} />
      </div>
    </div>
  );
}
