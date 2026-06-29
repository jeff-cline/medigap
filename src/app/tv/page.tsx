import type { Metadata } from "next";
import { db } from "@/lib/db";
import { MEDIGAP } from "@/lib/medigap-brand";
import { qrImage, trackingUrl, pageCode } from "@/lib/qr";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "1-800-MEDIGAP — As Seen On TV | America's Trusted Toll-Free Number",
  description:
    "Watch the 1-800-MEDIGAP television commercials. America's Trusted Toll-Free Number for Medicare Supplement insurance and senior guidance — call 1-800-MEDIGAP.",
  alternates: { canonical: `${MEDIGAP.url}/tv` },
};

const lightVars = {
  "--bg": MEDIGAP.colors.bg, "--text": MEDIGAP.colors.ink, "--brand": MEDIGAP.colors.brand,
  "--brand2": MEDIGAP.colors.brand2, "--gold": MEDIGAP.colors.gold, "--panel": MEDIGAP.colors.soft,
  "--border": MEDIGAP.colors.border, "--muted": MEDIGAP.colors.muted,
} as React.CSSProperties;

function isEmbed(url: string) {
  return /youtube\.com|youtu\.be|vimeo\.com|player\./i.test(url);
}
function embedSrc(url: string) {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{6,})/i);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/i);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return url;
}

export default async function TvPage() {
  const spots = await db.tvSpot
    .findMany({ where: { status: "approved" }, orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { approvedAt: "desc" }] })
    .catch(() => []);

  const ld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "1-800-MEDIGAP TV Commercials — As Seen On TV",
    itemListElement: spots.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "VideoObject",
        name: s.title,
        description: s.subtitle || `${MEDIGAP.brand} television commercial — ${MEDIGAP.tagline}.`,
        thumbnailUrl: s.posterUrl || undefined,
        contentUrl: s.videoUrl || undefined,
        uploadDate: (s.approvedAt || s.createdAt).toISOString().slice(0, 10),
        publisher: { "@type": "Organization", name: MEDIGAP.brand, telephone: `+${MEDIGAP.tel}` },
      },
    })),
  };

  const qr = qrImage(trackingUrl(pageCode("tv")), 120);

  return (
    <div style={lightVars} className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />

      {/* trust bar */}
      <div className="text-white text-[12px]" style={{ background: MEDIGAP.colors.ink }}>
        <div className="mx-auto max-w-6xl px-5 h-9 flex items-center justify-between">
          <span className="font-medium tracking-wide">★ {MEDIGAP.tagline}</span>
          <a href={`tel:${MEDIGAP.tel}`} className="font-semibold">📞 {MEDIGAP.brand}</a>
        </div>
      </div>

      {/* header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
          <a href="/" className="font-extrabold text-xl tracking-tight" style={{ color: MEDIGAP.colors.brand }}>
            1-800-<span style={{ color: MEDIGAP.colors.gold }}>MEDIGAP</span>
          </a>
          <a href={`tel:${MEDIGAP.tel}`} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: MEDIGAP.colors.brand }}>
            📞 Call {MEDIGAP.telDisplay}
          </a>
        </div>
      </header>

      {/* hero */}
      <section className="border-b border-[var(--border)]" style={{ background: "linear-gradient(180deg,#f4f7fc, #ffffff)" }}>
        <div className="mx-auto max-w-6xl px-5 py-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white mb-4" style={{ background: MEDIGAP.colors.gold }}>
            📺 As Seen On TV
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            1-800-<span style={{ color: MEDIGAP.colors.gold }}>MEDIGAP</span>
          </h1>
          <p className="mt-3 text-lg font-semibold" style={{ color: MEDIGAP.colors.brand }}>{MEDIGAP.tagline}</p>
          <p className="mt-3 mx-auto max-w-2xl text-[15px] text-[var(--muted)]">
            The television commercials seniors see across America. One simple, memorable number for Medicare Supplement
            insurance and trusted senior guidance — <b className="text-[var(--text)]">1-800-MEDIGAP</b>.
          </p>
        </div>
      </section>

      {/* gallery */}
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-5 py-12">
          {spots.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-12 text-center">
              <div className="text-5xl mb-3">🎬</div>
              <h2 className="text-xl font-bold">New commercials coming soon</h2>
              <p className="mt-2 text-[var(--muted)]">Our newest 1-800-MEDIGAP spots are in production. In the meantime, our licensed team is one call away.</p>
              <a href={`tel:${MEDIGAP.tel}`} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 mt-5 text-sm font-semibold text-white" style={{ background: MEDIGAP.colors.brand }}>📞 Call {MEDIGAP.telDisplay}</a>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2">
              {spots.map((s) => (
                <article key={s.id} className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden shadow-sm">
                  <div className="relative bg-black aspect-video">
                    {s.videoUrl && isEmbed(s.videoUrl) ? (
                      <iframe src={embedSrc(s.videoUrl)} title={s.title} className="absolute inset-0 h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    ) : s.videoUrl ? (
                      // eslint-disable-next-line jsx-a11y/media-has-caption
                      <video src={s.videoUrl} poster={s.posterUrl || undefined} controls playsInline className="absolute inset-0 h-full w-full object-contain" />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-white/60 text-sm">Video coming soon</div>
                    )}
                    {s.featured && <span className="absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white" style={{ background: MEDIGAP.colors.gold }}>★ Featured</span>}
                  </div>
                  <div className="p-5">
                    <h2 className="text-lg font-bold">{s.title}</h2>
                    {s.subtitle && <p className="mt-1 text-sm text-[var(--muted)]">{s.subtitle}</p>}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <a href={`tel:${MEDIGAP.tel}`} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: MEDIGAP.colors.brand }}>📞 Call {MEDIGAP.brand}</a>
                      {s.videoUrl && !isEmbed(s.videoUrl) && (
                        <a href={s.videoUrl} download={`1-800-MEDIGAP-${s.id}.mp4`} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border" style={{ borderColor: MEDIGAP.colors.border, color: MEDIGAP.colors.ink }}>⬇ Download spot</a>
                      )}
                      <span className="text-xs text-[var(--muted)]">{s.seconds}s spot</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--panel)]">
        <div className="mx-auto max-w-6xl px-5 py-12 flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-md">
            <div className="font-extrabold text-lg" style={{ color: MEDIGAP.colors.brand }}>1-800-<span style={{ color: MEDIGAP.colors.gold }}>MEDIGAP</span></div>
            <p className="text-sm text-[var(--muted)] mt-2">{MEDIGAP.tagline}. Free, no-pressure guidance from licensed agents.</p>
            <a href={`tel:${MEDIGAP.tel}`} className="inline-flex items-center gap-2 rounded-full px-4 py-2 mt-3 text-sm font-semibold text-white" style={{ background: MEDIGAP.colors.brand }}>📞 {MEDIGAP.telDisplay}</a>
            <div className="mt-4 text-xs text-[var(--muted)]"><a href="/sitemap" className="hover:text-[var(--brand)]">Site map</a> · <a href="/" className="hover:text-[var(--brand)]">Home</a></div>
          </div>
          <div className="text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="Scan to open the 1-800-MEDIGAP As Seen On TV page" className="h-28 w-28 rounded-lg bg-white p-1.5 border border-[var(--border)]" />
            <div className="text-[11px] text-[var(--muted)] mt-1">Scan to share this page</div>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-5 pb-8 text-xs text-[var(--muted)]">© 2026 {MEDIGAP.brand} · Not affiliated with the U.S. government or federal Medicare program.</div>
      </footer>
    </div>
  );
}
