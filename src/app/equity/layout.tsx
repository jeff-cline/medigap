import type { Metadata } from "next";
import Link from "next/link";
import { Fraunces, Inter } from "next/font/google";
import { CATEGORIES } from "@/lib/equity";
import { SITE_DISCLOSURE } from "@/lib/equity/consent";
import "./equity.css";

// equity.direct gets its own typography and palette. The Core's root layout is
// dark teal; this is ink and gold, and everything is scoped under .eqroot so
// the two never bleed into each other.
const display = Fraunces({
  variable: "--eq-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});
const body = Inter({
  variable: "--eq-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://equity.direct"),
  title: {
    default: "Equity Direct — Access Your Home Equity Without a Monthly Payment",
    template: "%s",
  },
  description:
    "See what you could access from your home's equity. No monthly payment, no interest rate. Free, no obligation, and it does not affect your credit score.",
  openGraph: {
    type: "website",
    siteName: "Equity Direct",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function EquityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`eqroot ${display.variable} ${body.variable}`}>
      <header className="eq-header">
        <div className="eq-wrap eq-header-inner">
          <Link href="/" className="eq-logo" aria-label="Equity Direct home">
            <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2 2 10h3v11h5v-6h4v6h5V10h3z" fill="currentColor" />
            </svg>
            <span>Equity<strong>Direct</strong></span>
          </Link>
          <nav className="eq-nav" aria-label="Main">
            {CATEGORIES.slice(0, 5).map((c) => (
              <Link key={c.key} href={`/${c.key}`}>{c.label}</Link>
            ))}
          </nav>
          <Link href="/#qualify" className="eq-cta-sm">See what you qualify for</Link>
        </div>
      </header>

      {children}

      <footer className="eq-footer">
        <div className="eq-wrap">
          <div className="eq-foot-grid">
            <div>
              <div className="eq-logo eq-logo-foot">
                <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2 2 10h3v11h5v-6h4v6h5V10h3z" fill="currentColor" />
                </svg>
                <span>Equity<strong>Direct</strong></span>
              </div>
              <p className="eq-foot-blurb">
                Access to home equity without a monthly payment — for the hundred
                reasons homeowners actually need it.
              </p>
            </div>
            {/* Every category linked from every page: the whole 100-page silo
                stays within two clicks from anywhere on the site. */}
            {[CATEGORIES.slice(0, 3), CATEGORIES.slice(3, 6), CATEGORIES.slice(6)].map((group, i) => (
              <nav key={i} aria-label={`Footer group ${i + 1}`}>
                <ul>
                  {group.map((c) => (
                    <li key={c.key}><Link href={`/${c.key}`}>{c.label}</Link></li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <p className="eq-legal">{SITE_DISCLOSURE}</p>
          <div className="eq-foot-bar">
            <span>© {new Date().getFullYear()} Equity Direct</span>
            <span className="eq-foot-links">
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/partners">Partners</Link>
              <Link href="/sitemap.xml">Sitemap</Link>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
