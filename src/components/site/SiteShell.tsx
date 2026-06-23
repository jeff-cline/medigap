import Link from "next/link";
import { TOLLFREE, TOLLFREE_TEL } from "@/lib/format";

export type SiteNavLink = { label: string; href: string };
export type ShellBrand = { name: string; logoUrl?: string; brandColor?: string };

// White-label chrome for AI-generated pages: header (brand + nav + call CTA) and a
// SLIM marketing footer (privacy/terms + 1-800-MEDIGAP only — no medigap.plus link list).
// Wraps children in theme-light + the site's brand color so every page matches the homepage.
export default function SiteShell({ brand, nav, children }: { brand: ShellBrand; nav: SiteNavLink[]; children: React.ReactNode }) {
  const style = brand.brandColor ? ({ "--brand": brand.brandColor } as React.CSSProperties) : undefined;
  return (
    <div style={style} className="theme-light min-h-screen flex flex-col bg-[var(--bg)]">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-gradient whitespace-nowrap">
            {brand.logoUrl ? <img src={brand.logoUrl} alt={brand.name} className="h-8 w-auto" /> : brand.name}
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-[var(--muted)]">
            {nav.slice(0, 6).map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-[var(--text)]">{l.label}</Link>
            ))}
          </nav>
          <a href={`tel:${TOLLFREE_TEL}`} className="btn btn-brand text-sm">📞 {TOLLFREE}</a>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-auto border-t border-[var(--border)] bg-[var(--panel)]">
        <div className="mx-auto max-w-7xl px-6 py-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-lg font-bold text-gradient">{brand.name}</div>
            <p className="mt-1 text-sm text-[var(--muted)]">Caring senior guidance — sponsored by {TOLLFREE}.</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--muted)]">
            <Link href="/privacy" className="hover:text-[var(--brand)]">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--brand)]">Terms</Link>
            <a href={`tel:${TOLLFREE_TEL}`} className="hover:text-[var(--brand)]">📞 {TOLLFREE}</a>
          </div>
        </div>
        <div className="border-t border-[var(--border)]">
          <div className="mx-auto max-w-7xl px-6 py-4 text-xs text-[var(--muted)]">
            © 2026 {brand.name}. Not affiliated with or endorsed by the U.S. government or the federal Medicare program.
          </div>
        </div>
      </footer>
    </div>
  );
}
