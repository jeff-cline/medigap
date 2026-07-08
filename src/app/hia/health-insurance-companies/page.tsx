import type { Metadata } from "next";
import { HIA } from "@/lib/health";
import { hiaMeta, webPageLd, breadcrumbLd, collectionLd, ldScript } from "@/lib/health-meta";
import { allCarriers } from "@/lib/health-data";
import HiaShell, { FaqBlock } from "@/components/hia/HiaShell";

export const dynamic = "force-dynamic";
const C = HIA.colors;
export const metadata: Metadata = hiaMeta(
  "Health Insurance Companies — Applications & Forms Directory",
  "Directory of health insurance companies with links to their private health insurance applications, enrollment forms, and carrier PDFs. Call 1-800-MEDIGAP.",
  "/health-insurance-companies");

export default function Companies() {
  const carriers = allCarriers();
  const faqs = [
    { q: "How many health insurance companies are listed?", a: `We list ${carriers.length}+ health insurance companies and are continually adding more across all 50 states. Each links to its <a href="/">private health insurance</a> applications.` },
    { q: "Can I apply through this site?", a: `We link to publicly available carrier applications. Choose a company, open the application, and follow the carrier's process — or <a href="tel:${HIA.tel}">call ${HIA.telDisplay}</a> for help.` },
  ];
  return (
    <HiaShell crumbs={[{ name: "Private Health Insurance", href: "/" }, { name: "Health Insurance Companies" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldScript(
        webPageLd("Health Insurance Companies", "/health-insurance-companies", metadata.description as string),
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Health Insurance Companies", path: "/health-insurance-companies" }]),
        collectionLd("Health Insurance Companies", "/health-insurance-companies", carriers.map((c) => ({ name: c.carrier_name, path: `/private/${c.slug}` }))),
      ) }} />
      <h1 className="text-3xl font-black" style={{ color: C.navy }}>Health Insurance Companies</h1>
      <p className="mt-3" style={{ color: C.ink }}>Browse health insurance companies and their <a href="/" style={{ color: C.blue }}>private health insurance</a> applications, enrollment forms, and carrier PDFs. Also see <a href="/insurance-quotes" style={{ color: C.blue }}>insurance quotes</a> and <a href="/health-insurance-plans" style={{ color: C.blue }}>health insurance plans</a>.</p>

      <div className="mt-6 space-y-5">
        {carriers.map((c) => (
          <div key={c.slug} className="border-b pb-4" style={{ borderColor: C.border }}>
            <h2 className="text-xl font-black"><a href={`/private/${c.slug}`} style={{ color: C.navy }}>{c.carrier_name} Health Insurance Applications</a></h2>
            <div className="text-xs mt-0.5" style={{ color: C.muted }}>{[c.city, c.state].filter(Boolean).join(", ")} · {c.carrier_type}</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {c.applications.map((a) => <a key={a.slug} href={`/private/${c.slug}/${a.slug}`} className="rounded-full border px-2.5 py-1 text-xs" style={{ borderColor: C.border, color: C.blue }}>{a.title.replace(`${c.carrier_name} — `, "")}</a>)}
            </div>
          </div>
        ))}
      </div>
      <FaqBlock faqs={faqs} />
    </HiaShell>
  );
}
