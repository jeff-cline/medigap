import type { Metadata } from "next";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import LeadForm from "@/components/LeadForm";
import { MEDIGAPP } from "@/lib/medigapp";
import MedigappSearch from "@/components/MedigappSearch";
import MedigappFooter from "@/components/MedigappFooter";

export const dynamic = "force-dynamic";
const C = MEDIGAPP.colors;
const vars = { "--bg": C.bg, "--ink": C.ink, "--brand": C.brand, "--green": C.green, "--gold": C.gold, "--soft": C.soft, "--border": C.border, "--muted": C.muted } as React.CSSProperties;

export const metadata: Metadata = {
  title: `${MEDIGAPP.brand} — ${MEDIGAPP.tagline}`,
  description: `Call ${MEDIGAPP.brand}. Free, no-pressure help with Medicare, senior benefits, and the offers that save you money.`,
};

export default async function MedigappHome() {
  const base = ((await headers()).get("x-pathname") || "").startsWith("/r") ? "/r" : ""; // works under medigap.plus/r mirror
  const pages = await db.rakPage.findMany({ where: { active: true }, orderBy: { views: "desc" }, take: 12 }).catch(() => []);
  return (
    <div style={vars} className="min-h-screen bg-white text-[var(--ink)]">
      <div className="mx-auto max-w-3xl px-5 py-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white mb-4" style={{ background: C.gold }}>★ {MEDIGAPP.tagline}</div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">1-800-<span style={{ color: C.gold }}>MEDIGAP</span></h1>
          <p className="mt-3 text-[15px] text-[var(--muted)] max-w-xl mx-auto">One simple, memorable number for Medicare and senior benefits — plus the top approved offers that save you money. Free and no pressure.</p>
          <a href={`tel:${MEDIGAPP.tel}`} className="mt-6 inline-block text-white font-extrabold py-4 px-8 rounded-2xl text-2xl" style={{ background: `linear-gradient(110deg, ${C.brand}, ${C.green})` }}>
            📞 Call {MEDIGAPP.telDisplay}
          </a>
        </div>

        <div className="mt-7"><MedigappSearch base={base} extra={pages.map((p) => ({ name: p.moneyWord || p.title, slug: p.slug, kind: "Topic" }))} /></div>

        <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--soft)] p-5">
          <div className="text-sm font-bold mb-2 text-center">Prefer we call you? Enter your info — it&apos;s free.</div>
          <LeadForm vertical="senior" compact />
        </div>

        {pages.length > 0 && (
          <div className="mt-9">
            <div className="text-xs font-bold uppercase tracking-widest text-[var(--gold)] text-center mb-3">Popular topics</div>
            <div className="flex flex-wrap justify-center gap-2">
              {pages.map((p) => (
                <a key={p.id} href={`${base}/${p.slug}`} className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium hover:border-[var(--brand)]">{p.moneyWord || p.title}</a>
              ))}
            </div>
          </div>
        )}

        <MedigappFooter base={base} />
      </div>
    </div>
  );
}
