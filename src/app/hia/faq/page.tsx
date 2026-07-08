import type { Metadata } from "next";
import { HIA } from "@/lib/health";
import { hiaMeta, webPageLd, breadcrumbLd, ldScript } from "@/lib/health-meta";
import HiaShell, { FaqBlock } from "@/components/hia/HiaShell";

export const dynamic = "force-dynamic";
const C = HIA.colors;
export const metadata: Metadata = hiaMeta(
  "Frequently Asked Questions — Private Health Insurance Applications",
  "FAQs about private health insurance applications, carrier forms, enrollment, and how to apply. Call 1-800-MEDIGAP for help.",
  "/faq");

const FAQS = [
  { q: "What is a private health insurance application?", a: `A form used to apply for coverage from a private <a href="/">health insurance</a> carrier — capturing applicant details, plan choice, and enrollment.` },
  { q: "Where can I find health insurance application PDFs?", a: `On each carrier's page — browse <a href="/health-insurance-companies">health insurance companies</a> or <a href="/apply">apply by state</a>.` },
  { q: "How do I apply for private medical insurance?", a: `Pick your carrier and application type, review the details page, and follow the carrier's instructions — or <a href="tel:${HIA.tel}">call ${HIA.telDisplay}</a>.` },
  { q: "Are these official carrier applications?", a: "We link to publicly available carrier resources. We are not the carrier; confirm the current form with the carrier directly." },
  { q: "Do you store the PDFs?", a: "No — we link to the carrier's public copy. If a link stops working, it redirects back to our homepage." },
  { q: "What is a Medicare supplement application?", a: `An application for a Medicare <a href="https://medigap.plus">supplement</a> (Medigap) plan that helps cover costs Original Medicare leaves behind.` },
  { q: "Can 1-800-MEDIGAP help me?", a: `Yes — <a href="tel:${HIA.tel}">call ${HIA.telDisplay}</a> for free help with applications, a supplement, or a policy.` },
];

export default function Faq() {
  return (
    <HiaShell crumbs={[{ name: "Private Health Insurance", href: "/" }, { name: "FAQ" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldScript(
        webPageLd("Frequently Asked Questions", "/faq", metadata.description as string),
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "FAQ", path: "/faq" }]),
      ) }} />
      <h1 className="text-3xl font-black" style={{ color: C.navy }}>Frequently Asked Questions</h1>
      <p className="mt-3" style={{ color: C.ink }}>Answers about <a href="/" style={{ color: C.blue }}>private health insurance</a> applications, carrier forms, and how to apply.</p>
      <FaqBlock faqs={FAQS} />
    </HiaShell>
  );
}
