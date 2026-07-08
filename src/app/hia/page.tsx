import type { Metadata } from "next";
import { HIA, STATES } from "@/lib/health";
import { hiaMeta, orgLd, webPageLd, collectionLd, ldScript } from "@/lib/health-meta";
import { allCarriers } from "@/lib/health-data";
import HiaShell, { FaqBlock } from "@/components/hia/HiaShell";
import HiaSearch from "@/components/hia/HiaSearch";

export const dynamic = "force-dynamic";
const C = HIA.colors;
export const metadata: Metadata = hiaMeta(
  "Private Health Insurance Application Repository | Carrier Forms & PDFs",
  "Find private health insurance applications, enrollment forms, and carrier application PDFs from health insurance companies nationwide. Call 1-800-MEDIGAP for help.",
  "/");

const CATS = [
  ["Individual Health Insurance Applications", "/apply"], ["Family Health Insurance Applications", "/apply"],
  ["Small Group Health Insurance Applications", "/health-insurance-companies"], ["Medicare Supplement Applications", "/health-insurance-companies"],
  ["Medical Insurance Enrollment Forms", "/health-insurance-companies"], ["Broker Appointment Applications", "/health-insurance-companies"],
  ["Provider Enrollment Applications", "/health-insurance-companies"], ["Member Change Forms", "/health-insurance-companies"],
];
const LONGTAIL = [
  "individual health insurance application pdf", "private health insurance application form", "family health insurance enrollment form",
  "small group health insurance application", "medicare supplement application pdf", "health insurance broker appointment application",
  "provider enrollment application", "where to find health insurance application pdfs", "how to apply for private medical insurance",
  "health savings account enrollment form", "health insurance plans by state", "medical insurance carrier forms",
];
const FAQS = [
  { q: "What is a private health insurance application?", a: `A private <a href="/">health insurance</a> application is the form used to apply for coverage from a private carrier — capturing applicant details, plan selection, and enrollment information. This repository links to publicly available carrier applications.` },
  { q: "Where can I find health insurance application PDFs?", a: `Browse by company on our <a href="/health-insurance-companies">Health Insurance Companies</a> directory or <a href="/apply">apply by state</a>. Each carrier page links to publicly available application forms and PDFs.` },
  { q: "How do I apply for private medical insurance?", a: `Choose your carrier, review the correct application (individual, family, small group, or Medicare supplement), and follow the carrier's instructions. Need help? <a href="tel:${HIA.tel}">Call ${HIA.telDisplay}</a>.` },
  { q: "Are these official insurance carrier applications?", a: `We link to publicly available resources hosted by the carriers. We are not the carrier — always confirm the current form with the carrier directly.` },
  { q: "Can I call 1-800-MEDIGAP for help?", a: `Yes — <a href="tel:${HIA.tel}">call ${HIA.telDisplay}</a> to speak with a licensed specialist about applications, a supplement, or a policy.` },
];

export default function HiaHome() {
  const carriers = allCarriers();
  return (
    <HiaShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldScript(orgLd, webPageLd("Private Health Insurance Application Repository", "/", metadata.description as string), collectionLd("Health Insurance Companies", "/", carriers.map((c) => ({ name: c.carrier_name, path: `/private/${c.slug}` })))) }} />

      {/* HERO */}
      <section className="rounded-2xl p-8 text-white" style={{ background: `linear-gradient(160deg, ${C.navy}, ${C.blue})` }}>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Private Health Insurance Application Repository</h1>
        <p className="mt-3 text-lg text-white/85 max-w-2xl">Find <a href="/" className="underline">private health insurance</a> applications, enrollment forms, and carrier PDFs — organized by company, state, and application type.</p>
        <a href={`tel:${HIA.tel}`} className="mt-5 inline-flex rounded-lg font-bold px-6 py-3" style={{ background: C.green, color: "#fff" }}>📞 Call {HIA.telDisplay}</a>
      </section>

      {/* SEARCH / FILTER */}
      <section className="mt-8">
        <h2 className="text-2xl font-black" style={{ color: C.navy }}>Search health insurance companies</h2>
        <p className="text-sm mt-1" style={{ color: C.muted }}>Search by company or filter by state to find applications and forms.</p>
        <div className="mt-4"><HiaSearch carriers={carriers.map((c) => ({ name: c.carrier_name, slug: c.slug, state: c.state, type: c.carrier_type }))} states={STATES} /></div>
      </section>

      {/* FEATURED CATEGORIES */}
      <section className="mt-10">
        <h2 className="text-2xl font-black" style={{ color: C.navy }}>Featured application categories</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CATS.map(([label, href]) => <a key={label} href={href} className="rounded-lg border p-4 text-sm font-semibold hover:shadow-sm" style={{ borderColor: C.border, color: C.navy }}>{label} →</a>)}
        </div>
      </section>

      {/* MONEY-WORD LINKS */}
      <section className="mt-10 grid gap-3 sm:grid-cols-3">
        <a href="/insurance-quotes" className="rounded-lg p-4 text-white font-bold" style={{ background: C.blue }}>Get Insurance Quotes →</a>
        <a href="/health-insurance-plans" className="rounded-lg p-4 text-white font-bold" style={{ background: C.navy }}>Compare Health Insurance Plans →</a>
        <a href="/health-savings-account" className="rounded-lg p-4 text-white font-bold" style={{ background: C.green }}>Health Savings Account (HSA) →</a>
      </section>

      {/* CARRIER DIRECTORY */}
      <section className="mt-10">
        <h2 className="text-2xl font-black" style={{ color: C.navy }}>Health insurance company directory</h2>
        <p className="text-sm mt-1" style={{ color: C.muted }}>Every carrier links to its applications. See the full list on <a href="/health-insurance-companies" style={{ color: C.blue }}>Health Insurance Companies</a>.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {carriers.map((c) => <a key={c.slug} href={`/private/${c.slug}`} className="rounded-full border px-3 py-1.5 text-sm" style={{ borderColor: C.border, color: C.navy }}>{c.carrier_name}</a>)}
        </div>
      </section>

      <FaqBlock faqs={FAQS} />

      {/* LONG-TAIL */}
      <section className="mt-10">
        <h2 className="text-2xl font-black" style={{ color: C.navy }}>Popular health insurance application searches</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {LONGTAIL.map((k) => <a key={k} href="/health-insurance-companies" className="rounded-full border px-3 py-1.5 text-xs" style={{ borderColor: C.border, color: C.muted }}>{k}</a>)}
        </div>
      </section>
    </HiaShell>
  );
}
