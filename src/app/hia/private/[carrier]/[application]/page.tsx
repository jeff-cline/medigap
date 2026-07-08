import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HIA } from "@/lib/health";
import { hiaMeta, webPageLd, breadcrumbLd, digitalDocLd, ldScript } from "@/lib/health-meta";
import { appBySlug } from "@/lib/health-data";
import HiaShell, { FaqBlock } from "@/components/hia/HiaShell";

export const dynamic = "force-dynamic";
const C = HIA.colors;

export async function generateMetadata({ params }: { params: Promise<{ carrier: string; application: string }> }): Promise<Metadata> {
  const { carrier, application } = await params;
  const r = appBySlug(carrier, application);
  if (!r) return {};
  return hiaMeta(`${r.app.title} | Application PDF & Form`, `${r.app.description} View source and apply. Call 1-800-MEDIGAP for help.`, `/private/${r.carrier.slug}/${r.app.slug}`);
}

export default async function AppPage({ params }: { params: Promise<{ carrier: string; application: string }> }) {
  const { carrier, application } = await params;
  const r = appBySlug(carrier, application);
  if (!r) notFound();
  const { carrier: c, app: a } = r;
  const path = `/private/${c.slug}/${a.slug}`;
  const officialHref = `/out?u=${encodeURIComponent(a.pdf_url || a.source_page_url || "")}`;
  const faqs = [
    { q: `What is the ${a.title.replace(`${c.carrier_name} — `, "")}?`, a: a.description },
    { q: `Where is the official ${c.carrier_name} application?`, a: `The official application is published by ${c.carrier_name} at <a href="${c.website}" rel="nofollow">${c.website.replace(/^https?:\/\//, "")}</a>. Use the button on this page to open the current source.` },
    { q: `Can 1-800-MEDIGAP help me apply?`, a: `Yes — <a href="tel:${HIA.tel}">call ${HIA.telDisplay}</a> for free help with this application, a supplement, or a policy.` },
  ];

  return (
    <HiaShell crumbs={[{ name: "Private Health Insurance", href: "/" }, { name: "Companies", href: "/health-insurance-companies" }, { name: c.carrier_name, href: `/private/${c.slug}` }, { name: a.form_type }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldScript(
        webPageLd(a.title, path, a.description),
        digitalDocLd(a.title, path, a.description, a.pdf_url || a.source_page_url),
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Companies", path: "/health-insurance-companies" }, { name: c.carrier_name, path: `/private/${c.slug}` }, { name: a.form_type, path }]),
      ) }} />

      <h1 className="text-3xl font-black" style={{ color: C.navy }}>{a.title}</h1>
      <p className="mt-3" style={{ color: C.ink }}>{a.description} This is a <a href={`/private/${c.slug}`} style={{ color: C.blue }}>{c.carrier_name}</a> resource in our <a href="/" style={{ color: C.blue }}>Private Health Insurance</a> repository.</p>

      <div className="mt-5 flex flex-wrap gap-3">
        <a href={officialHref} target="_blank" rel="nofollow noopener" className="inline-flex rounded-lg font-bold text-white px-5 py-3" style={{ background: C.green }}>Open official application ↗</a>
        <a href={`tel:${HIA.tel}`} className="inline-flex rounded-lg font-bold px-5 py-3 border" style={{ borderColor: C.border, color: C.navy }}>📞 Call {HIA.telDisplay}</a>
      </div>

      {/* PDF viewer (only when a verified PDF URL is present) */}
      {a.pdf_url ? (
        <div className="mt-6 rounded-xl border overflow-hidden" style={{ borderColor: C.border }}>
          <iframe src={a.pdf_url} title={a.title} loading="lazy" style={{ width: "100%", height: "70vh", border: 0 }} />
        </div>
      ) : (
        <div className="mt-6 rounded-xl border p-6 text-sm" style={{ borderColor: C.border, background: C.soft, color: C.muted }}>
          A live copy of this form is published on the carrier&apos;s website — use <b>Open official application</b> above to view the current version. (We link to public sources rather than re-hosting carrier PDFs.)
        </div>
      )}

      <p className="mt-4 text-sm" style={{ color: C.muted }}>Source: {c.carrier_name} · <a href={c.website} rel="nofollow" style={{ color: C.blue }}>{c.website.replace(/^https?:\/\//, "")}</a>. The document belongs to the carrier/source and may change or be removed at any time.</p>

      <FaqBlock faqs={faqs} />

      <section className="mt-8">
        <h2 className="text-xl font-black" style={{ color: C.navy }}>Related searches</h2>
        <div className="mt-2 flex flex-wrap gap-2">{a.keywords.map((k) => <span key={k} className="rounded-full border px-3 py-1.5 text-xs" style={{ borderColor: C.border, color: C.muted }}>{k}</span>)}</div>
        <p className="mt-4 text-sm"><a href={`/private/${c.slug}`} style={{ color: C.blue }}>← All {c.carrier_name} applications</a></p>
      </section>
    </HiaShell>
  );
}
