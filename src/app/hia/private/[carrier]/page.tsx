import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { HIA, STATES, slugify } from "@/lib/health";
import { hiaMeta, webPageLd, breadcrumbLd, collectionLd, ldScript } from "@/lib/health-meta";
import { carrierBySlug, allCarriers } from "@/lib/health-data";
import HiaShell, { FaqBlock } from "@/components/hia/HiaShell";

export const dynamic = "force-dynamic";
const C = HIA.colors;

export async function generateMetadata({ params }: { params: Promise<{ carrier: string }> }): Promise<Metadata> {
  const { carrier } = await params;
  const c = carrierBySlug(carrier);
  if (!c) return {};
  return hiaMeta(`${c.carrier_name} Health Insurance Applications & Forms`, `${c.carrier_name} health insurance applications, enrollment forms, and carrier PDFs. Private health insurance, medical insurance, broker and provider forms. Call 1-800-MEDIGAP.`, `/private/${c.slug}`);
}

export default async function CarrierPage({ params }: { params: Promise<{ carrier: string }> }) {
  const { carrier } = await params;
  const c = carrierBySlug(carrier);
  if (!c) {
    // Forgiving: /private/<state> → the state's apply page (states live under /apply).
    if (STATES.some((s) => slugify(s.name) === carrier)) redirect(`/apply/${carrier}`);
    notFound();
  }
  const related = allCarriers().filter((x) => x.slug !== c.slug).slice(0, 8);
  const faqs = [
    { q: `Where can I find ${c.carrier_name} health insurance application forms?`, a: `This page links to publicly available ${c.carrier_name} applications and enrollment forms. Select an application below to view details and the official source.` },
    { q: `Does ${c.carrier_name} offer a Medicare supplement application?`, a: `${c.products.some((p) => /medicare|supplement/i.test(p)) ? `Yes — see the Medicare <a href="https://medigap.plus">supplement</a> application below.` : `Check the applications below or <a href="tel:${HIA.tel}">call ${HIA.telDisplay}</a> for help.`}` },
    { q: `How do I apply for ${c.carrier_name} private health insurance?`, a: `Choose the correct application (individual, family, small group), review the details page, then follow the carrier's instructions. Need help? <a href="tel:${HIA.tel}">Call ${HIA.telDisplay}</a>.` },
    { q: `Is this the official ${c.carrier_name} website?`, a: `No. We are an independent repository linking to publicly available resources. ${c.carrier_name}'s official site is <a href="${c.website}" rel="nofollow">${c.website.replace(/^https?:\/\//, "")}</a>.` },
  ];

  return (
    <HiaShell crumbs={[{ name: "Private Health Insurance", href: "/" }, { name: "Companies", href: "/health-insurance-companies" }, { name: c.carrier_name }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldScript(
        webPageLd(`${c.carrier_name} Health Insurance Applications`, `/private/${c.slug}`, `${c.carrier_name} applications and forms.`),
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Companies", path: "/health-insurance-companies" }, { name: c.carrier_name, path: `/private/${c.slug}` }]),
        collectionLd(`${c.carrier_name} Applications`, `/private/${c.slug}`, c.applications.map((a) => ({ name: a.title, path: `/private/${c.slug}/${a.slug}` }))),
      ) }} />

      <h1 className="text-3xl font-black" style={{ color: C.navy }}>{c.carrier_name} Health Insurance Applications</h1>
      <p className="mt-3" style={{ color: C.ink }}>
        Find publicly available <a href="/" style={{ color: C.blue }}>private health insurance</a> and medical insurance application forms for {c.carrier_name}. Below are individual, family, small group, and related carrier application resources. For help applying, <a href={`tel:${HIA.tel}`} style={{ color: C.green }}>call {HIA.telDisplay}</a>.
      </p>

      {/* CARRIER SUMMARY */}
      <div className="mt-5 rounded-xl border p-5 grid gap-2 sm:grid-cols-2 text-sm" style={{ borderColor: C.border }}>
        <div><b>Headquarters:</b> {[c.city, c.state].filter(Boolean).join(", ") || "—"}</div>
        <div><b>Website:</b> <a href={c.website} rel="nofollow" style={{ color: C.blue }}>{c.website.replace(/^https?:\/\//, "")}</a></div>
        <div><b>Type:</b> {c.carrier_type}</div>
        <div><b>States served:</b> {c.states.includes("national") ? "Nationwide" : c.states.join(", ")}</div>
        <div className="sm:col-span-2"><b>Products:</b> {c.products.join(" · ")}</div>
      </div>

      {/* APPLICATION CARD GRID */}
      <h2 className="mt-8 text-2xl font-black" style={{ color: C.navy }}>{c.carrier_name} application forms</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {c.applications.map((a) => (
          <div key={a.slug} className="rounded-xl border p-5 flex flex-col" style={{ borderColor: C.border }}>
            <div className="text-xs font-bold uppercase tracking-wide" style={{ color: C.blue }}>{a.form_type} · {a.product_type}</div>
            <div className="mt-1 font-bold" style={{ color: C.navy }}>{a.title.replace(`${c.carrier_name} — `, "")}</div>
            <p className="mt-1 text-sm flex-1" style={{ color: C.muted }}>{a.description}</p>
            <a href={`/private/${c.slug}/${a.slug}`} className="mt-3 inline-flex justify-center rounded-lg font-bold text-white px-4 py-2.5" style={{ background: C.blue }}>View Application →</a>
          </div>
        ))}
      </div>

      <FaqBlock faqs={faqs} />

      {/* RELATED */}
      <section className="mt-10">
        <h2 className="text-2xl font-black" style={{ color: C.navy }}>Related health insurance companies</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {related.map((r) => <a key={r.slug} href={`/private/${r.slug}`} className="rounded-full border px-3 py-1.5 text-sm" style={{ borderColor: C.border, color: C.navy }}>{r.carrier_name}</a>)}
        </div>
        <p className="mt-4 text-sm"><a href="/" style={{ color: C.blue }}>← Back to Private Health Insurance home</a></p>
      </section>
    </HiaShell>
  );
}
