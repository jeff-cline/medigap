import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { MEDIGAPP, offersForPage } from "@/lib/medigapp";
import { searchPhotos } from "@/lib/pexels";

export const dynamic = "force-dynamic";

const C = MEDIGAPP.colors;
const vars = { "--bg": C.bg, "--ink": C.ink, "--brand": C.brand, "--green": C.green, "--gold": C.gold, "--soft": C.soft, "--border": C.border, "--muted": C.muted } as React.CSSProperties;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await db.rakPage.findUnique({ where: { slug } }).catch(() => null);
  const t = page?.title || `${MEDIGAPP.brand} — ${slug.replace(/-/g, " ")}`;
  return { title: t, description: page?.intro?.slice(0, 155) || `${MEDIGAPP.tagline}. Call ${MEDIGAPP.brand}.` };
}

function CallBar({ where }: { where: string }) {
  return (
    <a href={`tel:${MEDIGAPP.tel}`} className="block w-full text-center text-white font-extrabold py-4 rounded-2xl text-2xl tracking-tight" style={{ background: `linear-gradient(110deg, ${C.brand}, ${C.green})` }}>
      📞 Call {MEDIGAPP.brand} — {MEDIGAPP.telDisplay}
      <span className="block text-[12px] font-semibold opacity-90 mt-0.5">{MEDIGAPP.tagline} · Free · {where}</span>
    </a>
  );
}

export default async function KeywordLander({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await db.rakPage.findUnique({ where: { slug } }).catch(() => null);
  if (!page || !page.active) notFound();

  // log the inbound page view (fire-and-forget) + bump the counter
  db.rakClick.create({ data: { kind: "view", slug } }).catch(() => {});
  db.rakPage.update({ where: { id: page.id }, data: { views: { increment: 1 } } }).catch(() => {});

  const offers = await offersForPage(page);
  const hero = await searchPhotos(page.moneyWord || slug.replace(/-/g, " ") + " senior", 1).then((p) => p[0]?.url || "").catch(() => "");

  return (
    <div style={vars} className="min-h-screen bg-white text-[var(--ink)]">
      <div className="mx-auto max-w-2xl px-4 py-5">
        {/* TOLL-FREE — TOP */}
        <CallBar where="tap to call now" />

        {/* hero + headline */}
        <div className="mt-6 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">{page.headline || page.title}</h1>
          {page.intro && <p className="mt-3 text-[15px] text-[var(--muted)] leading-relaxed">{page.intro}</p>}
        </div>
        {hero && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero} alt={`${page.moneyWord || slug} — ${MEDIGAPP.brand}, ${MEDIGAPP.tagline}`} className="mt-5 w-full h-44 object-cover rounded-2xl border border-[var(--border)]" />
        )}

        {/* OFFERS */}
        <div className="mt-7 space-y-4">
          <div className="text-xs font-bold uppercase tracking-widest text-[var(--gold)] text-center">Approved offers & benefits for you</div>
          {offers.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--soft)] p-6 text-center text-sm text-[var(--muted)]">New offers loading — call {MEDIGAPP.brand} now and a specialist will help right away.</div>
          ) : offers.map((o) => (
            <a key={o.id} href={`/api/rak/go?s=${encodeURIComponent(slug)}&o=${encodeURIComponent(o.id)}`} target="_blank" rel="sponsored noopener"
               className="flex gap-4 items-center rounded-2xl border border-[var(--border)] bg-white p-4 hover:shadow-lg transition-shadow">
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

        {page.outro && <p className="mt-7 text-sm text-[var(--muted)] leading-relaxed text-center">{page.outro}</p>}

        {/* TOLL-FREE — BOTTOM */}
        <div className="mt-7"><CallBar where="prefer to talk? call us" /></div>

        <p className="mt-6 text-[10px] text-[var(--muted)] text-center leading-relaxed">
          Offers provided by third-party advertisers via Rakuten Advertising; we may earn a commission. {MEDIGAPP.brand} is a private informational resource — not affiliated with or endorsed by the U.S. government, Medicare, or any insurer.
        </p>
      </div>
    </div>
  );
}
