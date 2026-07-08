import type { Metadata } from "next";
import { HIA } from "@/lib/health";
import { hiaMeta, webPageLd, breadcrumbLd, ldScript } from "@/lib/health-meta";
import HiaShell, { FaqBlock } from "@/components/hia/HiaShell";

export const dynamic = "force-dynamic";
const C = HIA.colors;
export const metadata: Metadata = hiaMeta(
  "Health Insurance Plans — Types, Carriers & Applications",
  "Compare health insurance plans: individual, family, small group, Medicare supplement and more. Find applications and enrollment forms. Call 1-800-MEDIGAP.",
  "/health-insurance-plans");

const PLANS = [
  ["Individual & Family Plans", "Private major-medical coverage for individuals and households."],
  ["Small Group / Employer Plans", "Coverage a business offers to its employees."],
  ["Medicare Supplement (Medigap)", "Plans that cover costs Original Medicare leaves behind — see supplements at medigap.plus."],
  ["Medicare Advantage", "All-in-one Part C alternatives to Original Medicare."],
  ["Short-Term & Supplemental", "Temporary and add-on coverage (dental, vision, accident)."],
  ["HSA-Qualified High-Deductible Plans", "Pair with a Health Savings Account for tax-advantaged savings."],
];

export default function Plans() {
  return (
    <HiaShell crumbs={[{ name: "Private Health Insurance", href: "/" }, { name: "Health Insurance Plans" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldScript(
        webPageLd("Health Insurance Plans", "/health-insurance-plans", metadata.description as string),
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Health Insurance Plans", path: "/health-insurance-plans" }]),
      ) }} />
      <h1 className="text-3xl font-black" style={{ color: C.navy }}>Health Insurance Plans</h1>
      <p className="mt-3" style={{ color: C.ink }}>Compare types of <a href="/" style={{ color: C.blue }}>private health insurance</a> plans and find the right application. Want a recommendation? <a href={`tel:${HIA.tel}`} style={{ color: C.green }}>Call {HIA.telDisplay}</a>, get <a href="/insurance-quotes" style={{ color: C.blue }}>insurance quotes</a>, or <a href="/apply" style={{ color: C.blue }}>apply by state</a>.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {PLANS.map(([t, d]) => <div key={t} className="rounded-xl border p-5" style={{ borderColor: C.border }}><div className="font-bold" style={{ color: C.navy }}>{t}</div><p className="mt-1 text-sm" style={{ color: C.muted }}>{d}</p></div>)}
      </div>
      <p className="mt-6"><a href="/health-savings-account" style={{ color: C.blue }}>Learn about Health Savings Accounts (HSA) →</a></p>
      <FaqBlock faqs={[
        { q: "What health insurance plan types are available?", a: "Individual & family, small group, Medicare supplement, Medicare Advantage, short-term, supplemental, and HSA-qualified high-deductible plans." },
        { q: "How do I choose a health insurance plan?", a: `Compare coverage, network, and cost — or <a href="tel:${HIA.tel}">call ${HIA.telDisplay}</a> for a free recommendation.` },
        { q: "Where do I find the application for a plan?", a: `Each carrier lists its applications on its page — browse <a href="/health-insurance-companies">health insurance companies</a>.` },
      ]} />
    </HiaShell>
  );
}
