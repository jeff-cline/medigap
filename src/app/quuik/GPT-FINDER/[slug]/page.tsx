// quuik.com/GPT-FINDER/<slug> — supporting answer page. Question = title, inline favicon citations,
// matching ad, QAPage + Breadcrumb JSON-LD, per-page OG card, shared footer + "People also visit".
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { readQuestion, titleCase } from "@/lib/gptfinder";
import AnswerBody from "@/components/quuik/AnswerBody";
import SiteFooter from "@/components/quuik/SiteFooter";
import { getCloud } from "@/lib/moneycloud";

export const dynamic = "force-dynamic";
const ORANGE = "#F5821F", INK = "#1c2128", MUT = "#6b7280", LINE = "#eee";
const ogFor = (t: string) => `https://quuik.com/api/quuik/og?t=${encodeURIComponent(t)}`;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const qa = readQuestion(slug);
  if (!qa) return { title: "Answer not found | Quuik" };
  const desc = (qa.answer || "").replace(/\s+/g, " ").slice(0, 155);
  const img = ogFor(qa.question);
  return {
    title: `${qa.question} | Quuik`, description: desc,
    alternates: { canonical: `https://quuik.com/GPT-FINDER/${qa.slug}` },
    openGraph: { type: "article", url: `https://quuik.com/GPT-FINDER/${qa.slug}`, siteName: "Quuik", title: qa.question, description: desc, images: [{ url: img, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title: qa.question, description: desc, images: [img] },
  };
}

export default async function QuestionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const qa = readQuestion(slug);
  if (!qa) notFound();
  const cat = qa.category || "answers";
  const cloud = await getCloud();
  const offer = cloud.find((e) => e.keyword === cat) || null;

  const qaLd = { "@context": "https://schema.org", "@type": "QAPage", mainEntity: { "@type": "Question", name: qa.question, text: qa.question, answerCount: 1, acceptedAnswer: { "@type": "Answer", text: (qa.answer || "").slice(0, 2000), url: `https://quuik.com/GPT-FINDER/${qa.slug}` } } };
  const crumbLd = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Quuik", item: "https://quuik.com/" },
    { "@type": "ListItem", position: 2, name: titleCase(cat), item: `https://quuik.com/${cat}` },
    { "@type": "ListItem", position: 3, name: qa.question, item: `https://quuik.com/GPT-FINDER/${qa.slug}` }] };

  return (
    <div style={{ background: "#fff", color: INK, fontFamily: "-apple-system,Segoe UI,Helvetica,Arial,sans-serif", minHeight: "100vh" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(qaLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbLd) }} />
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "26px 20px 40px" }}>
        <nav style={{ fontSize: 13, color: MUT }} aria-label="Breadcrumb">
          <a href="/" style={{ color: ORANGE, textDecoration: "none" }}>Quuik</a> › <a href="/GPT-FINDER" style={{ color: ORANGE, textDecoration: "none" }}>GPT-FINDER</a> › <a href={`/${cat}`} style={{ color: ORANGE, textDecoration: "none" }}>{titleCase(cat)}</a>
        </nav>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "12px 0 14px", lineHeight: 1.2 }}>{qa.question}</h1>
        <AnswerBody answer={qa.answer} citations={qa.citations || []} />

        {offer && (
          <a href={`https://el.ag/${encodeURIComponent(offer.keyword)}`} target="_blank" rel="noopener sponsored" style={{ display: "flex", gap: 14, alignItems: "center", textDecoration: "none", color: INK, marginTop: 18, border: `1px solid ${ORANGE}44`, borderRadius: 14, overflow: "hidden", background: "#fff" }}>
            <div style={{ background: `${ORANGE}14`, alignSelf: "stretch", display: "flex", alignItems: "center", padding: "0 12px", fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: ORANGE }}>Ad</div>
            {offer.image ? <img src={offer.image} alt="" style={{ width: 60, height: 60, borderRadius: 10, objectFit: "cover" }} /> : null}
            <div style={{ flex: 1, padding: "12px 0" }}><div style={{ fontWeight: 700, fontSize: 16 }}>{offer.title}</div><div style={{ color: MUT, fontSize: 13.5 }}>{offer.desc}</div></div>
            <span style={{ background: ORANGE, color: "#fff", fontWeight: 700, fontSize: 13, padding: "8px 15px", borderRadius: 100, margin: "0 14px", whiteSpace: "nowrap" }}>Visit →</span>
          </a>
        )}

        <div style={{ marginTop: 26, background: "#faf9f7", border: `1px solid ${LINE}`, borderRadius: 14, padding: "16px 18px", textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Have your own question?</div>
          <a href={`/?q=${encodeURIComponent(qa.question)}`} style={{ display: "inline-block", marginTop: 8, background: ORANGE, color: "#fff", fontWeight: 800, textDecoration: "none", borderRadius: 100, padding: "10px 22px" }}>Ask Quuik →</a>
        </div>
        <div style={{ marginTop: 20, borderTop: `1px solid ${LINE}`, paddingTop: 14, fontSize: 13 }}>
          <a href={`/${cat}`} style={{ color: ORANGE, textDecoration: "none" }}>← More about {titleCase(cat)}</a> · <a href="/GPT-FINDER" style={{ color: ORANGE, textDecoration: "none" }}>All topics</a>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
