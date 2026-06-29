import Link from "next/link";
import { MEDIGAP } from "@/lib/medigap-brand";
import { siloGroups } from "@/lib/silos";
import { qrImage, trackingUrl, pageCode } from "@/lib/qr";

const lightVars = {
  "--bg": MEDIGAP.colors.bg, "--text": MEDIGAP.colors.ink, "--brand": MEDIGAP.colors.brand,
  "--brand2": MEDIGAP.colors.brand2, "--gold": MEDIGAP.colors.gold, "--panel": MEDIGAP.colors.soft,
  "--panel2": "#eef3fb", "--border": MEDIGAP.colors.border, "--muted": MEDIGAP.colors.muted,
} as React.CSSProperties;

// Header + premium footer (silo HTML sitemap, sitemap links, per-page QR, brand). `path` = the
// current page path (e.g. "medicare-basics-enrollment" or "assisted-living/assisted-living-cost").
export default function SiloShell({ path, children }: { path: string; children: React.ReactNode }) {
  const groups = siloGroups();
  const qr = qrImage(trackingUrl(pageCode(path)), 120);
  return (
    <div style={lightVars} className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">
      {/* trust bar */}
      <div className="bg-[var(--ink,#0b2348)] text-white text-[12px]" style={{ background: MEDIGAP.colors.ink }}>
        <div className="mx-auto max-w-6xl px-5 h-9 flex items-center justify-between">
          <span className="font-medium tracking-wide">★ {MEDIGAP.tagline}</span>
          <a href={`tel:${MEDIGAP.tel}`} className="font-semibold">📞 {MEDIGAP.brand}</a>
        </div>
      </div>
      {/* header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
          <Link href="/" className="font-extrabold text-xl tracking-tight" style={{ color: MEDIGAP.colors.brand }}>
            1-800-<span style={{ color: MEDIGAP.colors.gold }}>MEDIGAP</span>
          </Link>
          <a href={`tel:${MEDIGAP.tel}`} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: MEDIGAP.colors.brand }}>
            📞 Call {MEDIGAP.telDisplay}
          </a>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* premium footer with the silo HTML sitemap + machine maps + QR */}
      <footer className="border-t border-[var(--border)] bg-[var(--panel)] mt-12">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <div className="flex flex-wrap items-start justify-between gap-8 mb-8">
            <div className="max-w-xs">
              <div className="font-extrabold text-lg" style={{ color: MEDIGAP.colors.brand }}>1-800-<span style={{ color: MEDIGAP.colors.gold }}>MEDIGAP</span></div>
              <p className="text-sm text-[var(--muted)] mt-2">{MEDIGAP.tagline}. Free, no-pressure guidance from licensed agents — Medicare, senior care, retirement, and everything in between.</p>
              <a href={`tel:${MEDIGAP.tel}`} className="inline-flex items-center gap-2 rounded-full px-4 py-2 mt-3 text-sm font-semibold text-white" style={{ background: MEDIGAP.colors.brand }}>📞 {MEDIGAP.telDisplay}</a>
            </div>
            <div className="text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="Scan to open this page" className="h-28 w-28 rounded-lg bg-white p-1.5 border border-[var(--border)]" />
              <div className="text-[11px] text-[var(--muted)] mt-1">Scan to share this page</div>
            </div>
          </div>

          {/* HTML sitemap — all silos grouped */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 border-t border-[var(--border)] pt-8">
            {groups.map((g) => (
              <div key={g.group}>
                <div className="text-xs font-bold uppercase tracking-wide text-[var(--muted)] mb-2">{g.group}</div>
                <ul className="space-y-1 text-sm">
                  {g.silos.map((s) => <li key={s.slug}><Link href={`/${s.slug}`} className="text-[var(--text)] hover:text-[var(--brand)]">{s.name}</Link></li>)}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-[var(--border)] flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
            <span className="font-semibold text-[var(--text)]">Site maps:</span>
            <a href="/sitemap.xml" className="hover:text-[var(--brand)]">XML</a>
            <Link href="/sitemap" className="hover:text-[var(--brand)]">HTML</Link>
            <Link href="/answers" className="hover:text-[var(--brand)]">Answer-engine</Link>
            <a href="/llms.txt" className="hover:text-[var(--brand)]">llms.txt</a>
            <span className="ml-auto">© 2026 {MEDIGAP.brand} · Not affiliated with the U.S. government or federal Medicare program.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
