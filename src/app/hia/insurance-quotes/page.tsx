import type { Metadata } from "next";
import { HIA } from "@/lib/health";
import { hiaMeta, webPageLd, breadcrumbLd, ldScript } from "@/lib/health-meta";
import { allCarriers } from "@/lib/health-data";
import HiaShell, { FaqBlock } from "@/components/hia/HiaShell";

export const dynamic = "force-dynamic";
const C = HIA.colors;
export const metadata: Metadata = hiaMeta(
  "Insurance Quotes — Private Health Insurance Rates & Applications",
  "Get insurance quotes for private health insurance. Compare medical insurance carriers, applications, and enrollment forms. Call 1-800-MEDIGAP for a personalized quote.",
  "/insurance-quotes");

export default function Quotes() {
  const carriers = allCarriers().slice(0, 12);
  return (
    <HiaShell crumbs={[{ name: "Private Health Insurance", href: "/" }, { name: "Insurance Quotes" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldScript(
        webPageLd("Insurance Quotes", "/insurance-quotes", metadata.description as string),
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Insurance Quotes", path: "/insurance-quotes" }]),
      ) }} />
      <h1 className="text-3xl font-black" style={{ color: C.navy }}>Insurance Quotes for Private Health Insurance</h1>
      <p className="mt-3" style={{ color: C.ink }}>Looking for insurance quotes? The fastest way to a personalized <a href="/" style={{ color: C.blue }}>private health insurance</a> quote is to <a href={`tel:${HIA.tel}`} style={{ color: C.green }}>call {HIA.telDisplay}</a> — a licensed specialist compares carriers, plans, and applications for you.</p>
      <div className="mt-5"><a href={`tel:${HIA.tel}`} className="inline-flex rounded-lg font-bold text-white px-6 py-3" style={{ background: C.green }}>📞 Get a quote — call {HIA.telDisplay}</a></div>
      <h2 className="mt-8 text-2xl font-black" style={{ color: C.navy }}>Compare carriers &amp; applications</h2>
      <p className="mt-2 text-sm" style={{ color: C.muted }}>Start with a carrier and review its applications, then get your quote. Also see <a href="/health-insurance-plans" style={{ color: C.blue }}>health insurance plans</a> and <a href="/apply" style={{ color: C.blue }}>apply by state</a>.</p>
      <div className="mt-4 flex flex-wrap gap-2">{carriers.map((c) => <a key={c.slug} href={`/private/${c.slug}`} className="rounded-full border px-3 py-1.5 text-sm" style={{ borderColor: C.border, color: C.navy }}>{c.carrier_name}</a>)}</div>
      <FaqBlock faqs={[
        { q: "How do I get a private health insurance quote?", a: `Call <a href="tel:${HIA.tel}">${HIA.telDisplay}</a> for a personalized quote, or browse carrier applications and apply directly.` },
        { q: "Are insurance quotes free?", a: "Yes — quotes and help via 1-800-MEDIGAP are free and no-obligation." },
        { q: "What affects my health insurance quote?", a: "Your age, location, plan type, and coverage level. A specialist can compare options across carriers for you." },
      ]} />
    </HiaShell>
  );
}
