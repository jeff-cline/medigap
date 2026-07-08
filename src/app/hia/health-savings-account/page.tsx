import type { Metadata } from "next";
import { HIA } from "@/lib/health";
import { hiaMeta, webPageLd, breadcrumbLd, ldScript } from "@/lib/health-meta";
import HiaShell, { FaqBlock } from "@/components/hia/HiaShell";

export const dynamic = "force-dynamic";
const C = HIA.colors;
export const metadata: Metadata = hiaMeta(
  "Health Savings Account (HSA) — Rules, Limits, Eligible Plans & Enrollment",
  "Health Savings Account (HSA) guide: eligibility, contribution limits, HSA-qualified health insurance plans, tax benefits, and enrollment. Call 1-800-MEDIGAP.",
  "/health-savings-account");

const SUB = ["HSA contribution limits", "HSA eligibility", "HSA vs FSA", "HSA-qualified high-deductible health plan", "HSA tax benefits", "family HSA", "HSA investment", "HSA withdrawal rules", "open an HSA", "HSA enrollment form"];

export default function HSA() {
  const faqs = [
    { q: "What is a Health Savings Account (HSA)?", a: `A Health Savings Account is a tax-advantaged account you can use for qualified medical expenses when you're enrolled in an HSA-qualified high-deductible <a href="/">health insurance</a> plan. Contributions, growth, and qualified withdrawals are tax-advantaged.` },
    { q: "Who is eligible for an HSA?", a: "You must be covered by an HSA-qualified high-deductible health plan (HDHP), not enrolled in Medicare, and not claimed as a dependent. Verify current IRS rules before contributing." },
    { q: "What are the HSA contribution limits?", a: "The IRS sets annual HSA contribution limits that adjust each year (with higher limits for family coverage and a catch-up for those 55+). Check the current year's IRS limits." },
    { q: "Which health insurance plans qualify for an HSA?", a: `HSA-qualified high-deductible health plans. Compare <a href="/health-insurance-plans">health insurance plans</a> and their applications, or <a href="tel:${HIA.tel}">call ${HIA.telDisplay}</a>.` },
    { q: "How do I open an HSA?", a: `Enroll in an HSA-qualified plan, then open an HSA with a bank or HSA custodian. For help choosing a qualifying plan, <a href="tel:${HIA.tel}">call ${HIA.telDisplay}</a>.` },
    { q: "What are the tax benefits of an HSA?", a: "Contributions may be tax-deductible, funds grow tax-free, and qualified medical withdrawals are tax-free — a triple tax advantage under current IRS rules." },
  ];
  return (
    <HiaShell crumbs={[{ name: "Private Health Insurance", href: "/" }, { name: "Health Savings Account" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldScript(
        webPageLd("Health Savings Account (HSA)", "/health-savings-account", metadata.description as string),
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Health Savings Account", path: "/health-savings-account" }]),
      ) }} />
      <h1 className="text-3xl font-black" style={{ color: C.navy }}>Health Savings Account (HSA)</h1>
      <p className="mt-3" style={{ color: C.ink }}>A Health Savings Account (HSA) pairs with an HSA-qualified high-deductible <a href="/" style={{ color: C.blue }}>private health insurance</a> plan to give you tax-advantaged savings for medical expenses. Below: how HSAs work, eligibility, limits, and how to enroll in a qualifying plan. Need help choosing one? <a href={`tel:${HIA.tel}`} style={{ color: C.green }}>Call {HIA.telDisplay}</a>.</p>

      <h2 className="mt-8 text-2xl font-black" style={{ color: C.navy }}>How a Health Savings Account works</h2>
      <p className="mt-2" style={{ color: C.ink }}>An HSA is owned by you, funded with pre-tax dollars, and used for qualified medical expenses. To contribute, you must be enrolled in an HSA-qualified high-deductible <a href="/health-insurance-plans" style={{ color: C.blue }}>health insurance plan</a>. Unused funds roll over year to year and can be invested.</p>

      <h2 className="mt-8 text-2xl font-black" style={{ color: C.navy }}>Find an HSA-qualified plan</h2>
      <p className="mt-2" style={{ color: C.ink }}>Compare carriers and their HSA-qualified plan applications on our <a href="/health-insurance-companies" style={{ color: C.blue }}>health insurance companies</a> directory, get <a href="/insurance-quotes" style={{ color: C.blue }}>insurance quotes</a>, or <a href="/apply" style={{ color: C.blue }}>apply by state</a>.</p>

      <FaqBlock faqs={faqs} />

      <section className="mt-10">
        <h2 className="text-xl font-black" style={{ color: C.navy }}>Related HSA topics</h2>
        <div className="mt-2 flex flex-wrap gap-2">{SUB.map((k) => <span key={k} className="rounded-full border px-3 py-1.5 text-xs" style={{ borderColor: C.border, color: C.muted }}>{k}</span>)}</div>
      </section>
    </HiaShell>
  );
}
