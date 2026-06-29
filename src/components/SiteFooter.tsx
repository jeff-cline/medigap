import Link from "next/link";
import { TOLLFREE, TOLLFREE_TEL } from "@/lib/format";
import Ticker from "./Ticker";

const verticals = [
  ["Medicare Insurance", "/insurance/medicare-insurance"],
  ["Home Insurance", "/insurance/home-insurance"],
  ["Life Insurance", "/insurance/life-insurance"],
  ["Pet Insurance", "/insurance/pet-insurance"],
  ["Auto Insurance", "/insurance/auto-insurance"],
  ["All Insurance", "/insurance"],
  ["Senior Care", "/senior-care"],
];
const business = [
  ["Become a Marketing Partner", "/onboard"],
  ["Advertise With Us", "/advertise"],
  ["Agents — Work With Us", "/agents"],
  ["Investor Relations", "/investors"],
  ["Money Word Cloud", "/money-word-cloud"],
  ["Money Words Partners", "/money-words"],
  ["Upsell Vendors", "/upsell-vendors"],
  ["Carrier / Risk Partners", "/risk-partners"],
];
const company = [
  ["Management Portal", "/login"],
  ["About the Network", "/about"],
  ["Privacy Policy", "/privacy"],
  ["Terms", "/terms"],
  ["Do Not Sell My Info", "/privacy#dnsmi"],
  ["Contact", "/contact"],
];

type Brand = { name: string; logoUrl?: string; footerLinks?: { label: string; href: string }[] };

export default function SiteFooter({ ticker, brand }: { ticker?: string[]; brand?: Brand | null }) {
  const custom = (brand?.footerLinks || []).map((l) => [l.label, l.href] as string[]);
  return (
    <footer className="mt-auto">
      {ticker && ticker.length > 0 && <Ticker items={ticker} />}
      <div className="border-t border-[var(--border)] bg-[var(--panel)]">
        <div className="mx-auto max-w-7xl px-6 py-12 grid gap-10 md:grid-cols-4">
          <div>
            {brand?.logoUrl ? (
              <img src={brand.logoUrl} alt={brand.name} className="h-10 w-auto" />
            ) : (
              <div className="text-xl font-bold text-gradient">{brand?.name || "medigap.plus"}</div>
            )}
            <p className="mt-3 text-sm text-[var(--muted)]">{brand ? `${brand.name} — trusted senior coverage and guidance.` : "The senior-population marketing network. One platform, every over-65 product."}</p>
            <a href={`tel:${TOLLFREE_TEL}`} className="btn btn-brand mt-4 text-sm">📞 {TOLLFREE}</a>
          </div>
          <FooterCol title="Products" links={verticals} />
          {custom.length > 0 ? <FooterCol title="More" links={custom} /> : <FooterCol title="Partner & Business" links={business} />}
          <FooterCol title="Company" links={company} />
        </div>
        {/* Site maps: XML (machine), HTML (human), and the answer-engine index (AEO). */}
        <div className="border-t border-[var(--border)]">
          <div className="mx-auto max-w-7xl px-6 py-3 text-xs text-[var(--muted)] flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-semibold text-[var(--text)]">Site maps:</span>
            <a href="/sitemap.xml" className="hover:text-[var(--brand)]">XML sitemap</a>
            <Link href="/sitemap" className="hover:text-[var(--brand)]">HTML sitemap</Link>
            <Link href="/answers" className="hover:text-[var(--brand)]">Answer-engine index</Link>
            <a href="/llms.txt" className="hover:text-[var(--brand)]">llms.txt</a>
          </div>
        </div>
        <div className="border-t border-[var(--border)]">
          <div className="mx-auto max-w-7xl px-6 py-4 text-xs text-[var(--muted)] flex flex-wrap justify-between gap-2">
            <span>© {""}2026 {brand?.name || "medigap.plus"} — all rights reserved. Not affiliated with the U.S. government or federal Medicare program.</span>
            <span>Privacy is centrally managed across the network.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[][] }) {
  return (
    <div>
      <div className="text-sm font-semibold mb-3">{title}</div>
      <ul className="space-y-2 text-sm text-[var(--muted)]">
        {links.map(([label, href]) => (
          <li key={href}><Link href={href} className="hover:text-[var(--brand)]">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
