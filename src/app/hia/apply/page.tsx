import type { Metadata } from "next";
import { HIA, STATES, slugify } from "@/lib/health";
import { hiaMeta, webPageLd, breadcrumbLd, collectionLd, ldScript } from "@/lib/health-meta";
import HiaShell, { FaqBlock } from "@/components/hia/HiaShell";

export const dynamic = "force-dynamic";
const C = HIA.colors;
export const metadata: Metadata = hiaMeta(
  "Apply for Private Health Insurance by State — Applications & Forms",
  "Find private health insurance applications and enrollment forms by state. Choose your state to see carriers and application PDFs. Call 1-800-MEDIGAP.",
  "/apply");

export default function Apply() {
  return (
    <HiaShell crumbs={[{ name: "Private Health Insurance", href: "/" }, { name: "Apply by State" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldScript(
        webPageLd("Apply for Private Health Insurance by State", "/apply", metadata.description as string),
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Apply by State", path: "/apply" }]),
        collectionLd("Apply by State", "/apply", STATES.map((s) => ({ name: `${s.name} Private Health Insurance`, path: `/apply/${slugify(s.name)}` }))),
      ) }} />
      <h1 className="text-3xl font-black" style={{ color: C.navy }}>Apply for Private Health Insurance by State</h1>
      <p className="mt-3" style={{ color: C.ink }}>Choose your state to find <a href="/" style={{ color: C.blue }}>private health insurance</a> applications, carriers, and enrollment forms. Need help now? <a href={`tel:${HIA.tel}`} style={{ color: C.green }}>Call {HIA.telDisplay}</a>.</p>
      <div className="mt-6 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {STATES.map((s) => <a key={s.abbr} href={`/apply/${slugify(s.name)}`} className="rounded-lg border px-4 py-2.5 text-sm font-semibold hover:shadow-sm" style={{ borderColor: C.border, color: C.navy }}>{s.name} Private Health Insurance →</a>)}
      </div>
      <FaqBlock faqs={[
        { q: "How do I apply for health insurance in my state?", a: `Pick your state above to see carriers and their <a href="/">private health insurance</a> applications, then follow the carrier's process or <a href="tel:${HIA.tel}">call ${HIA.telDisplay}</a>.` },
        { q: "Are these state-specific applications?", a: "Many carriers use state-specific application forms. Each state page lists the carriers serving that state and links to their public applications." },
      ]} />
    </HiaShell>
  );
}
