// quuik.com/<money-word> — category silo. AI SEO intro, matching ad, live FAQs, per-page OG card,
// shared footer + "People also visit" money-word strip. Hyper-siloed for SEO/AEO.
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { readCategory, readQuestion, slugify, titleCase } from "@/lib/gptfinder";
import { getCloud } from "@/lib/moneycloud";
import SiteFooter from "@/components/quuik/SiteFooter";

export const dynamic = "force-dynamic";
const ORANGE = "#F5821F", INK = "#1c2128", MUT = "#6b7280", LINE = "#eee";
const ogFor = (t: string) => `https://quuik.com/api/quuik/og?t=${encodeURIComponent(t)}`;

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params; const cat = slugify(category);
  const cf = readCategory(cat);
  const title = `${cf?.title || titleCase(cat)} — Questions & Answers | Quuik`;
  const desc = cf?.description || `Answers to common questions about ${titleCase(cat)}, updated in real time by Quuik.`;
  const img = ogFor(`${cf?.title || titleCase(cat)} — Q&A`);
  return {
    title, description: desc,
    alternates: { canonical: `https://quuik.com/${cat}` },
    openGraph: { type: "article", url: `https://quuik.com/${cat}`, siteName: "Quuik", title, description: desc, images: [{ url: img, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description: desc, images: [img] },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params; const cat = slugify(category);
  const cf = readCategory(cat);
  const cloud = await getCloud();
  const offer = cloud.find((e) => e.keyword === cat) || null;
  if (!cf && !offer) notFound();

  const title = cf?.title || titleCase(cat);
  const description = cf?.description || `Straight answers to the most common questions about ${title}, updated in real time from what people actually ask on Quuik — the Trusted GPT.`;
  const items = cf?.items || [];
  const topItems = items.slice(0, 5);
  const topQAs = topItems.map((it) => readQuestion(it.slug)).filter(Boolean) as NonNullable<ReturnType<typeof readQuestion>>[];

  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: topQAs.map((qa) => ({ "@type": "Question", name: qa.question, acceptedAnswer: { "@type": "Answer", text: (qa.answer || "").slice(0, 900) } })) };
  const crumbLd = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Quuik", item: "https://quuik.com/" },
    { "@type": "ListItem", position: 2, name: title, item: `https://quuik.com/${cat}` }] };

  return (
    <div style={{ background: "#fff", color: INK, fontFamily: "-apple-system,Segoe UI,Helvetica,Arial,sans-serif", minHeight: "100vh" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbLd) }} />
      <main style={{ maxWidth: 780, margin: "0 auto", padding: "26px 20px 40px" }}>
        <nav style={{ fontSize: 13, color: MUT }} aria-label="Breadcrumb"><a href="/" style={{ color: ORANGE, textDecoration: "none" }}>Quuik</a> › <a href="/GPT-FINDER" style={{ color: ORANGE, textDecoration: "none" }}>GPT-FINDER</a> › {title}</nav>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: "12px 0 0" }}>{title}: Questions &amp; Answers</h1>
        <p style={{ color: "#374151", fontSize: 16, lineHeight: 1.7, marginTop: 12 }}>{description}</p>

        {offer && (
          <a href={`https://el.ag/${encodeURIComponent(offer.keyword)}`} target="_blank" rel="noopener sponsored" style={{ display: "flex", gap: 14, alignItems: "center", textDecoration: "none", color: INK, marginTop: 18, border: `1px solid ${ORANGE}44`, borderRadius: 14, overflow: "hidden", background: "#fff" }}>
            {offer.image ? <img src={offer.image} alt="" style={{ width: 74, height: 74, objectFit: "cover" }} /> : <div style={{ width: 8, alignSelf: "stretch", background: ORANGE }} />}
            <div style={{ flex: 1, padding: "12px 4px" }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: ORANGE }}>Sponsored</div>
              <div style={{ fontWeight: 700, fontSize: 16.5, marginTop: 2 }}>{offer.title}</div>
              <div style={{ color: MUT, fontSize: 13.5 }}>{offer.desc}</div>
            </div>
            <span style={{ background: ORANGE, color: "#fff", fontWeight: 700, fontSize: 13, padding: "8px 15px", borderRadius: 100, margin: "0 14px", whiteSpace: "nowrap" }}>Visit →</span>
          </a>
        )}

        <h2 style={{ fontSize: 20, fontWeight: 800, margin: "30px 0 6px" }}>Frequently asked questions</h2>
        {topQAs.length === 0 ? (
          <p style={{ color: MUT }}>Be the first to ask about {title} on <a href="/" style={{ color: ORANGE }}>Quuik</a>.</p>
        ) : (
          <div>
            {topQAs.map((qa) => (
              <div key={qa.slug} style={{ borderTop: `1px solid ${LINE}`, padding: "16px 0" }}>
                <a href={`/GPT-FINDER/${qa.slug}`} style={{ fontSize: 17, fontWeight: 700, color: INK, textDecoration: "none" }}>{qa.question}</a>
                <p style={{ color: "#4b5563", fontSize: 14.5, lineHeight: 1.6, margin: "6px 0 0" }}>{(qa.answer || "").split(/\n\s*\n/)[0].slice(0, 240)}… <a href={`/GPT-FINDER/${qa.slug}`} style={{ color: ORANGE, fontWeight: 600, whiteSpace: "nowrap" }}>Read more →</a></p>
              </div>
            ))}
          </div>
        )}

        {items.length > 5 && (
          <div style={{ marginTop: 22 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: MUT, textTransform: "uppercase", letterSpacing: ".05em" }}>More {title} questions</h3>
            <ul style={{ margin: "10px 0 0", paddingLeft: 18, lineHeight: 1.9 }}>
              {items.slice(5).map((it) => <li key={it.slug}><a href={`/GPT-FINDER/${it.slug}`} style={{ color: ORANGE, textDecoration: "none" }}>{it.question}</a></li>)}
            </ul>
          </div>
        )}

        <div style={{ marginTop: 34, borderTop: `1px solid ${LINE}`, paddingTop: 16, fontSize: 13 }}>
          <a href="/GPT-FINDER" style={{ color: ORANGE, textDecoration: "none" }}>← All topics</a> · <a href="/" style={{ color: ORANGE, textDecoration: "none" }}>Ask Quuik a question</a>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
