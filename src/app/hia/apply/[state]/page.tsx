import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HIA, STATES, slugify } from "@/lib/health";
import { hiaMeta, webPageLd, breadcrumbLd, collectionLd, ldScript } from "@/lib/health-meta";
import { carriersByState } from "@/lib/health-data";
import HiaShell, { FaqBlock } from "@/components/hia/HiaShell";

export const dynamic = "force-dynamic";
const C = HIA.colors;
const findState = (slug: string) => STATES.find((s) => slugify(s.name) === slug) || null;

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const { state } = await params;
  const s = findState(state);
  if (!s) return {};
  return hiaMeta(`${s.name} Private Health Insurance — Applications, Carriers & Forms`, `${s.name} private health insurance applications and carriers. Find individual, family, and medical insurance enrollment forms in ${s.name}. Call 1-800-MEDIGAP.`, `/apply/${slug(s.name)}`);
}
const slug = (n: string) => slugify(n);

export default async function StatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const s = findState(state);
  if (!s) notFound();
  const carriers = carriersByState(s.abbr);
  const faqs = [
    { q: `How do I apply for private health insurance in ${s.name}?`, a: `Choose a carrier serving ${s.name} below, open its <a href="/">private health insurance</a> application, and follow the carrier's process. For help, <a href="tel:${HIA.tel}">call ${HIA.telDisplay}</a>.` },
    { q: `Which health insurance companies serve ${s.name}?`, a: `${carriers.length} carriers in our directory serve ${s.name}, including national and regional plans listed below.` },
    { q: `Where are ${s.name} health insurance application PDFs?`, a: `Each carrier below links to its publicly available application forms and PDFs.` },
  ];
  return (
    <HiaShell crumbs={[{ name: "Private Health Insurance", href: "/" }, { name: "Apply by State", href: "/apply" }, { name: s.name }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldScript(
        webPageLd(`${s.name} Private Health Insurance`, `/apply/${slug(s.name)}`, `${s.name} private health insurance applications and carriers.`),
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Apply by State", path: "/apply" }, { name: s.name, path: `/apply/${slug(s.name)}` }]),
        collectionLd(`${s.name} Health Insurance Companies`, `/apply/${slug(s.name)}`, carriers.map((c) => ({ name: c.carrier_name, path: `/private/${c.slug}` }))),
      ) }} />
      <h1 className="text-3xl font-black" style={{ color: C.navy }}>{s.name} Private Health Insurance</h1>
      <p className="mt-3" style={{ color: C.ink }}>Find <a href="/" style={{ color: C.blue }}>private health insurance</a> applications and carriers serving {s.name}. Compare <a href="/health-insurance-plans" style={{ color: C.blue }}>health insurance plans</a>, get <a href="/insurance-quotes" style={{ color: C.blue }}>insurance quotes</a>, or <a href={`tel:${HIA.tel}`} style={{ color: C.green }}>call {HIA.telDisplay}</a>.</p>

      <h2 className="mt-8 text-2xl font-black" style={{ color: C.navy }}>Health insurance companies serving {s.name}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {carriers.map((c) => (
          <a key={c.slug} href={`/private/${c.slug}`} className="rounded-lg border p-4 hover:shadow-sm" style={{ borderColor: C.border }}>
            <div className="font-bold" style={{ color: C.navy }}>{c.carrier_name}</div>
            <div className="text-xs" style={{ color: C.muted }}>{c.carrier_type} · {c.applications.length} applications</div>
          </a>
        ))}
        {carriers.length === 0 && <p className="text-sm" style={{ color: C.muted }}>Carriers for {s.name} are being added — <a href="/health-insurance-companies" style={{ color: C.blue }}>see all companies</a>.</p>}
      </div>
      <FaqBlock faqs={faqs} />
      <p className="mt-6 text-sm"><a href="/apply" style={{ color: C.blue }}>← All states</a></p>
    </HiaShell>
  );
}
