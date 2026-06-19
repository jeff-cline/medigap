import Link from "next/link";
import { TOLLFREE, TOLLFREE_TEL } from "@/lib/format";
import Ticker from "./Ticker";

const verticals = [
  ["Medicare Insurance", "/medicare"],
  ["Medicare Advantage", "/medicare-advantage"],
  ["Medicare Supplements", "/medigap"],
  ["Senior Housing", "/senior-housing"],
  ["Senior Care", "/senior-care"],
  ["Alzheimer's Care", "/alzheimers-care"],
  ["Life & Final Expense", "/life"],
];
const business = [
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

export default function SiteFooter({ ticker }: { ticker?: string[] }) {
  return (
    <footer className="mt-auto">
      {ticker && ticker.length > 0 && <Ticker items={ticker} />}
      <div className="border-t border-[var(--border)] bg-[var(--panel)]">
        <div className="mx-auto max-w-7xl px-6 py-12 grid gap-10 md:grid-cols-4">
          <div>
            <div className="text-xl font-bold text-gradient">medigap.plus</div>
            <p className="mt-3 text-sm text-[var(--muted)]">The senior-population marketing network. One platform, every over-65 product.</p>
            <a href={`tel:${TOLLFREE_TEL}`} className="btn btn-brand mt-4 text-sm">📞 {TOLLFREE}</a>
          </div>
          <FooterCol title="Products" links={verticals} />
          <FooterCol title="Partner & Business" links={business} />
          <FooterCol title="Company" links={company} />
        </div>
        <div className="border-t border-[var(--border)]">
          <div className="mx-auto max-w-7xl px-6 py-4 text-xs text-[var(--muted)] flex flex-wrap justify-between gap-2">
            <span>© {""}2026 medigap.plus — all rights reserved. Not affiliated with the U.S. government or federal Medicare program.</span>
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
