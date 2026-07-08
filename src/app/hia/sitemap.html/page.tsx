import type { Metadata } from "next";
import { HIA, STATES, slugify } from "@/lib/health";
import { hiaMeta } from "@/lib/health-meta";
import { allCarriers } from "@/lib/health-data";
import HiaShell from "@/components/hia/HiaShell";

export const dynamic = "force-dynamic";
const C = HIA.colors;
export const metadata: Metadata = hiaMeta("HTML Sitemap — Private Health Insurance", "Every page on the private health insurance application repository.", "/sitemap.html");

export default function HtmlSitemap() {
  const carriers = allCarriers();
  const link = { color: C.blue } as React.CSSProperties;
  return (
    <HiaShell crumbs={[{ name: "Private Health Insurance", href: "/" }, { name: "HTML Sitemap" }]}>
      <h1 className="text-3xl font-black" style={{ color: C.navy }}>HTML Sitemap</h1>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {[["Home", "/"], ["Companies", "/health-insurance-companies"], ["Apply by State", "/apply"], ["Insurance Quotes", "/insurance-quotes"], ["Health Insurance Plans", "/health-insurance-plans"], ["Health Savings Account", "/health-savings-account"], ["FAQ", "/faq"], ["Answer Engine", "/aeo-sitemap"]].map(([l, h]) => <a key={h} href={h} style={link}>{l}</a>)}
      </div>

      <h2 className="mt-8 text-xl font-black" style={{ color: C.navy }}>States</h2>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">{STATES.map((s) => <a key={s.abbr} href={`/apply/${slugify(s.name)}`} style={link}>{s.name}</a>)}</div>

      <h2 className="mt-8 text-xl font-black" style={{ color: C.navy }}>Carriers &amp; applications</h2>
      <div className="mt-2 space-y-3">
        {carriers.map((c) => (
          <div key={c.slug}>
            <a href={`/private/${c.slug}`} className="font-semibold" style={{ color: C.navy }}>{c.carrier_name}</a>
            <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">{c.applications.map((a) => <a key={a.slug} href={`/private/${c.slug}/${a.slug}`} style={link}>{a.title.replace(`${c.carrier_name} — `, "")}</a>)}</div>
          </div>
        ))}
      </div>
    </HiaShell>
  );
}
