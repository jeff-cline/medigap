import type { Metadata } from "next";
import Link from "next/link";
import { Fraunces, Inter } from "next/font/google";
import { CATEGORIES } from "@/lib/equity";
import { SITE_DISCLOSURE } from "@/lib/equity/consent";
import { getEquitySettings, telHref } from "@/lib/equity/settings";
import QualifyModal from "./QualifyModal";
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

export default async function EquityLayout({ children }: { children: React.ReactNode }) {
  const { phone } = await getEquitySettings();

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
          <button type="button" data-qualify className="eq-cta-sm">
            See what you qualify for
          </button>
        </div>
      </header>

      {children}

      {/* Any [data-qualify] element on any page opens this. */}
      <QualifyModal />

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
              {/* Phone rather than an email address, and it comes from a
                  setting so it changes without a deploy. */}
              <a href={telHref(phone)} className="eq-foot-phone">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"
                        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {phone}
              </a>
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
