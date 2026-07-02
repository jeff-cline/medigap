import type { Metadata } from "next";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { MEDIGAPP } from "@/lib/medigapp";

export const dynamic = "force-dynamic";
const C = MEDIGAPP.colors;
const vars = { "--bg": C.bg, "--ink": C.ink, "--brand": C.brand, "--green": C.green, "--gold": C.gold, "--soft": C.soft, "--border": C.border, "--muted": C.muted } as React.CSSProperties;

export const metadata: Metadata = {
  title: `Directory — ${MEDIGAPP.brand}`,
  description: `Browse every ${MEDIGAPP.brand} topic — Medicare, senior benefits, and the offers that save you money.`,
};

export default async function Directory() {
  const base = ((await headers()).get("x-pathname") || "").startsWith("/r") ? "/r" : "";
  const pages = await db.rakPage.findMany({ where: { active: true }, orderBy: [{ views: "desc" }, { createdAt: "desc" }] }).catch(() => []);

  return (
    <div style={vars} className="min-h-screen bg-white text-[var(--ink)]">
      <div className="mx-auto max-w-3xl px-5 py-8">
        {/* toll-free header */}
        <a href={`tel:${MEDIGAPP.tel}`} className="block w-full text-center text-white font-extrabold py-4 rounded-2xl text-2xl tracking-tight" style={{ background: `linear-gradient(110deg, ${C.brand}, ${C.green})` }}>
          📞 Call {MEDIGAPP.brand} — {MEDIGAPP.telDisplay}
          <span className="block text-[12px] font-semibold opacity-90 mt-0.5">{MEDIGAPP.tagline} · Free</span>
        </a>

        <div className="mt-7 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">Directory</h1>
          <p className="mt-2 text-[15px] text-[var(--muted)]">Every topic we help with — tap any one to see the offers, or call {MEDIGAPP.brand} anytime.</p>
        </div>

        {pages.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--soft)] p-6 text-center text-sm text-[var(--muted)]">No topics yet — add keyword landers in the dashboard.</div>
        ) : (
          <div className="mt-7 space-y-4">
            {pages.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--border)] bg-white p-5">
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold tracking-tight">{p.moneyWord || p.title}</h2>
                  <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">{p.intro || p.headline || `Top approved offers and free help for ${(p.moneyWord || p.slug.replace(/-/g, " ")).toLowerCase()}.`}</p>
                </div>
                <a href={`${base}/${p.slug}`} className="shrink-0 rounded-full px-6 py-3 text-sm font-bold text-white" style={{ background: C.brand }}>View offers →</a>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <a href={`tel:${MEDIGAPP.tel}`} className="inline-block text-white font-extrabold py-3.5 px-7 rounded-2xl text-xl" style={{ background: `linear-gradient(110deg, ${C.brand}, ${C.green})` }}>📞 Call {MEDIGAPP.telDisplay}</a>
        </div>
        <p className="mt-6 text-[10px] text-[var(--muted)] text-center">© 2026 {MEDIGAPP.brand} · Not affiliated with or endorsed by the U.S. government, Medicare, or any insurer. Offers via Rakuten Advertising; we may earn a commission.</p>
      </div>
    </div>
  );
}
