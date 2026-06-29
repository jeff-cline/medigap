import type { Metadata } from "next";
import Link from "next/link";
import { MEDIGAP } from "@/lib/medigap-brand";
import { siloGroups } from "@/lib/silos";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Site Map — 1-800-MEDIGAP",
  description: "Every guide on 1-800-MEDIGAP: Medicare, senior living and care, retirement and finance, insurance, health, and benefits.",
  alternates: { canonical: `${MEDIGAP.url}/sitemap` },
};

// Human-readable (HTML) sitemap of the whole silo site. Complements /sitemap.xml + /answers.
export default function HtmlSitemap() {
  const groups = siloGroups();
  return (
    <div className="min-h-screen bg-white text-[#0b2348]">
      <div className="mx-auto max-w-5xl px-5 py-12">
        <h1 className="text-4xl font-extrabold">Site Map</h1>
        <p className="mt-3 text-[#5b6b86]">Every guide on 1-800-MEDIGAP. Machine-readable: <a href="/sitemap.xml" style={{ color: MEDIGAP.colors.brand }}>XML sitemap</a> · <Link href="/answers" style={{ color: MEDIGAP.colors.brand }}>answer-engine index</Link>.</p>

        {groups.map((g) => (
          <div key={g.group} className="mt-10">
            <h2 className="text-lg font-bold border-b border-[#e4e9f2] pb-1">{g.group}</h2>
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              {g.silos.map((s) => (
                <div key={s.slug}>
                  <Link href={`/${s.slug}`} className="font-semibold hover:underline" style={{ color: MEDIGAP.colors.brand }}>{s.name}</Link>
                  <ul className="mt-1.5 space-y-0.5 text-sm text-[#5b6b86]">
                    {s.childSlugs.map((c) => <li key={c.slug}><Link href={`/${s.slug}/${c.slug}`} className="hover:text-[#0b2348]">{c.keyword}</Link></li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
