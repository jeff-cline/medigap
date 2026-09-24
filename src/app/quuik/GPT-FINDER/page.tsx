// quuik.com/GPT-FINDER — HTML sitemap + index of every category (money word) and its live questions.
import { readCategories } from "@/lib/gptfinder";
import SiteFooter from "@/components/quuik/SiteFooter";

export const dynamic = "force-dynamic";
const OG = "https://quuik.com/api/quuik/og?t=Answers%20people%20are%20searching%20for";
export const metadata = {
  title: "GPT-FINDER — Real answers people are searching for | Quuik",
  description: "Browse the questions people actually ask, organized by topic. Real answers with sources, updated in real time by Quuik, the Trusted GPT.",
  alternates: { canonical: "https://quuik.com/GPT-FINDER" },
  openGraph: { type: "website", url: "https://quuik.com/GPT-FINDER", siteName: "Quuik", title: "GPT-FINDER — Real answers people are searching for", description: "Every topic, built from real questions with sourced answers. Updated in real time.", images: [{ url: OG, width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "GPT-FINDER — Real answers people are searching for", images: [OG] },
};
const ORANGE = "#F5821F", INK = "#1c2128", MUT = "#6b7280", LINE = "#eee";

export default async function FinderIndex() {
  const cats = readCategories();
  const total = cats.reduce((s, c) => s + c.count, 0);
  return (
    <div style={{ background: "#fff", color: INK, fontFamily: "-apple-system,Segoe UI,Helvetica,Arial,sans-serif", minHeight: "100vh" }}>
      <header style={{ borderBottom: `1px solid ${LINE}`, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 1000, margin: "0 auto" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: INK }}><img src="/quuik-assets/logo.png" alt="Quuik" style={{ height: 34 }} /><b style={{ fontSize: 18 }}>GPT-FINDER</b></a>
        <a href="/" style={{ color: ORANGE, fontWeight: 700, textDecoration: "none", fontSize: 14 }}>Ask Quuik →</a>
      </header>
      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "34px 20px 40px" }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0 }}>Answers people are searching for</h1>
        <p style={{ color: MUT, fontSize: 15.5, marginTop: 8, maxWidth: 680, lineHeight: 1.6 }}>
          Every topic below is built from real questions asked on Quuik — the Trusted GPT — with sourced answers, updated in real time. {total > 0 ? `${total.toLocaleString()} answers and counting.` : ""}
        </p>
        {cats.length === 0 ? (
          <p style={{ color: MUT, marginTop: 30 }}>No topics yet — ask something on <a href="/" style={{ color: ORANGE }}>quuik.com</a> and this page fills itself in.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16, marginTop: 26 }}>
            {cats.map((c) => (
              <a key={c.cat} href={`/${c.cat}`} style={{ textDecoration: "none", color: INK, border: `1px solid ${LINE}`, borderRadius: 14, padding: 18, background: "#fff", display: "block" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <b style={{ fontSize: 17 }}>{c.title}</b>
                  <span style={{ fontSize: 12, fontWeight: 700, color: ORANGE, background: "#fff5ef", borderRadius: 100, padding: "3px 9px" }}>{c.count}</span>
                </div>
                {c.recent.map((r) => <div key={r.slug} style={{ color: MUT, fontSize: 13, marginTop: 7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>· {r.question}</div>)}
              </a>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
