import type { Metadata } from "next";
import { BIZ } from "@/lib/biz";
import BizShell from "@/components/biz/BizShell";

export const dynamic = "force-dynamic";
const serif = "Georgia,'Times New Roman',serif";
// Palette tuned to match the printed Executive Summary / Valuation Guide.
const S = { navy: "#0b1c3f", navy2: "#12305f", ink: "#16233f", body: "#33415c", muted: "#6b7890", gold: "#c9a24b", goldDeep: "#a9822b", green: "#2f7d5a", cream: "#f6f1e2", line: "#e4e7ee", white: "#ffffff" };

export const metadata: Metadata = {
  title: "1-800-MEDIGAP — Executive Summary & Valuation Guide | The Front Door to the Retirement Economy",
  description: "The whole story in one page: why the vanity-number playbook (Flowers, Contacts, GOT-JUNK, PetMeds) pointed at Medicare is worth 10×–100×+ per customer. Download the Executive Summary, Investor Deck, and One-Page Brief.",
  alternates: { canonical: `https://${BIZ.domain}/summary` },
  openGraph: { title: "1-800-MEDIGAP — The Front Door to the Retirement Economy", description: "Executive Summary & Valuation Guide — download the deck, brief, and summary.", url: `https://${BIZ.domain}/summary`, images: [`https://${BIZ.domain}/api/biz/og`] },
};

const ROWS = [
  { co: "1-800-FLOWERS", market: "Flowers & Gifts", ltv: "$900–$1,800", value: "~$245M", adv: "Category vanity number, decades of brand equity.", slug: "flowers" },
  { co: "1-800-CONTACTS", market: "Vision Care", ltv: "$4,000–$8,000", value: "~$1B+", adv: "Recurring purchases over decades.", slug: "contacts" },
  { co: "1-800-GOT-JUNK?", market: "Home Services", ltv: "$1,500–$4,000", value: "Several hundred $M", adv: "Franchise around one memorable number.", slug: "got-junk" },
  { co: "1-800-PetMeds", market: "Pet Pharmacy", ltv: "$2,500–$7,500", value: "~$700–900M", adv: "Long-term refills & strong retention.", slug: "petmeds" },
];
const EDGE = [
  ["Retention", "months–years → often 20+ years"],
  ["Cross-sell", "limited → extensive across insurance, financial, healthcare & senior services"],
  ["Brand trust", "important → essential for retirement decisions"],
  ["AI & data", "moderate → high (guidance, reminders, navigation)"],
  ["Referrals", "moderate → high via family, caregivers & advisors"],
];
const PDFS = [
  { title: "Executive Summary", note: "The thesis in brief — the valuation guide.", file: "1-800-MEDIGAP-Executive-Summary.pdf" },
  { title: "Investor Deck", note: "The full pitch — market, model, and the ask.", file: "1-800-MEDIGAP-Investor-Deck.pdf" },
  { title: "One-Page Brief", note: "The single-page leave-behind.", file: "1-800-MEDIGAP-One-Page-Brief.pdf" },
];
const LINKS = [
  { label: "Why the vanity number is priceless", href: "/vanity" },
  { label: "The comparables (market caps & LTV)", href: "/comps" },
  { label: "Full market analysis & the multiple", href: "/market-analysis" },
  { label: "The four strategic assets", href: "/#thesis" },
  { label: "Featured National TV Ad", href: "/#thesis" },
  { label: "Book a confidential call", href: "/book" },
];

export default function SummaryPage() {
  return (
    <BizShell>
      {/* HERO */}
      <section style={{ background: `linear-gradient(120deg, ${S.navy} 0%, ${S.navy2} 100%)`, color: S.white }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 26px 46px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 44, border: `2px solid ${S.gold}`, borderRadius: "10px 10px 14px 14px", color: S.gold, fontSize: 20 }}>📞</span>
              <span style={{ fontWeight: 900, fontSize: 24, letterSpacing: ".02em" }}>1-800·MEDIGAP</span>
            </div>
            <div style={{ border: `1px solid ${S.gold}`, borderRadius: 999, padding: "8px 18px", fontSize: 12.5, letterSpacing: ".16em", color: S.gold }}>EXECUTIVE SUMMARY · VALUATION GUIDE</div>
          </div>
          <h1 style={{ fontFamily: serif, fontSize: "clamp(38px,7vw,72px)", lineHeight: 1.02, margin: "28px 0 0", fontWeight: 700 }}>
            The front door to the <span style={{ color: S.gold, fontStyle: "italic" }}>retirement economy.</span>
          </h1>
          <p style={{ maxWidth: 900, marginTop: 20, fontSize: "clamp(15px,2.1vw,18px)", color: "#cdd7ea", lineHeight: 1.6 }}>
            A memorable, category-defining vanity number is more than a marketing asset. As a nationally recognized, trusted destination for Medicare and retirement guidance, 1-800-MEDIGAP can serve as the entry point to a broad senior-services ecosystem — increasing customer lifetime value, lowering acquisition cost through brand recognition, and supporting a substantially larger enterprise than a single insurance product.
          </p>
        </div>
      </section>

      {/* BENCHMARK TABLE */}
      <section style={{ background: S.white, color: S.ink }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "44px 26px 20px" }}>
          <div style={{ fontSize: 13, letterSpacing: ".14em", textTransform: "uppercase", color: S.goldDeep, fontWeight: 800 }}>Strategic benchmark — the vanity-number playbook</div>
          <div style={{ marginTop: 18, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
              <thead><tr>{["Company", "Market", "Est. Customer LTV", "Company Value", "Competitive Advantage"].map((h) => <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11.5, letterSpacing: ".06em", textTransform: "uppercase", color: S.muted, borderBottom: `2px solid ${S.line}`, fontWeight: 700 }}>{h}</th>)}</tr></thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.co}>
                    <td style={{ padding: "16px 14px", borderBottom: `1px solid ${S.line}`, fontWeight: 800, color: S.ink }}><a href={`/comps/${r.slug}`} style={{ color: S.ink, textDecoration: "none" }}>{r.co}</a></td>
                    <td style={{ padding: "16px 14px", borderBottom: `1px solid ${S.line}`, color: S.body }}>{r.market}</td>
                    <td style={{ padding: "16px 14px", borderBottom: `1px solid ${S.line}`, color: S.green, fontWeight: 800, fontFamily: "ui-monospace,Menlo,monospace" }}>{r.ltv}</td>
                    <td style={{ padding: "16px 14px", borderBottom: `1px solid ${S.line}`, fontWeight: 800, color: S.ink }}>{r.value}</td>
                    <td style={{ padding: "16px 14px", borderBottom: `1px solid ${S.line}`, color: S.body, maxWidth: 320 }}>{r.adv}</td>
                  </tr>
                ))}
                <tr style={{ background: S.cream }}>
                  <td style={{ padding: "18px 14px", fontWeight: 900, color: S.goldDeep }}>★ 1-800-MEDIGAP</td>
                  <td style={{ padding: "18px 14px", color: S.ink, fontWeight: 600 }}>Medicare & Senior Ecosystem</td>
                  <td style={{ padding: "18px 14px", color: S.goldDeep, fontWeight: 900, fontFamily: "ui-monospace,Menlo,monospace" }}>$15,000–$50,000+</td>
                  <td style={{ padding: "18px 14px", fontWeight: 900, color: S.goldDeep }}>Potentially billions</td>
                  <td style={{ padding: "18px 14px", color: S.ink, maxWidth: 320 }}>Trusted advisory, recurring relationships, cross-sell, AI & senior ecosystem.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style={{ marginTop: 10, fontSize: 11.5, color: S.muted }}>Illustrative figures for directional guidance. Per-company market caps, revenue, and cited sources are on each <a href="/comps" style={{ color: S.goldDeep }}>comparable page</a>.</p>
        </div>
      </section>

      {/* WHY + EDGE */}
      <section style={{ background: S.white, color: S.ink }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 26px 44px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }} className="sum-grid">
          <div>
            <div style={{ fontSize: 13, letterSpacing: ".12em", textTransform: "uppercase", color: S.ink, fontWeight: 800 }}>Why the LTV is higher</div>
            <div style={{ fontFamily: serif, fontSize: 46, fontWeight: 700, color: S.ink, marginTop: 10 }}>20+ years</div>
            <p style={{ color: S.body, fontSize: 15.5, lineHeight: 1.65, marginTop: 8 }}>Unlike flowers or junk removal, Medicare customers typically remain in the retirement ecosystem for decades. A trusted relationship formed at age 65 can continue throughout retirement — the beginning of a long-term advisory relationship, not a one-time sale.</p>
          </div>
          <div>
            <div style={{ fontSize: 13, letterSpacing: ".12em", textTransform: "uppercase", color: S.ink, fontWeight: 800 }}>The structural edge</div>
            <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
              {EDGE.map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 10 }}>
                  <span style={{ color: S.gold, fontWeight: 900 }}>›</span>
                  <div style={{ fontSize: 15, color: S.body }}><b style={{ color: S.ink }}>{k}:</b> {v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* DOWNLOADS */}
      <section style={{ background: S.cream, color: S.ink, borderTop: `1px solid ${S.line}` }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 26px" }}>
          <div style={{ fontSize: 13, letterSpacing: ".14em", textTransform: "uppercase", color: S.goldDeep, fontWeight: 800 }}>Download the materials</div>
          <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
            {PDFS.map((p) => (
              <a key={p.file} href={`/uploads/${p.file}`} target="_blank" rel="noopener" download style={{ background: S.white, border: `1px solid ${S.line}`, borderRadius: 14, padding: 20, textDecoration: "none", color: S.ink, boxShadow: "0 4px 16px rgba(11,28,63,.06)" }}>
                <div style={{ fontSize: 26 }}>📄</div>
                <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 700, marginTop: 6 }}>{p.title}</div>
                <div style={{ fontSize: 13.5, color: S.body, marginTop: 4 }}>{p.note}</div>
                <div style={{ marginTop: 12, color: S.goldDeep, fontWeight: 800, fontSize: 14 }}>↓ Download PDF</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* DEEP LINKS — the whole story */}
      <section style={{ background: S.white, color: S.ink }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 26px" }}>
          <div style={{ fontSize: 13, letterSpacing: ".14em", textTransform: "uppercase", color: S.goldDeep, fontWeight: 800 }}>Explore the whole story</div>
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 }}>
            {LINKS.map((l) => (
              <a key={l.label} href={l.href} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${S.line}`, borderRadius: 12, padding: "15px 18px", textDecoration: "none", color: S.ink, fontWeight: 600 }}>
                {l.label} <span style={{ color: S.gold }}>→</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: `linear-gradient(120deg, ${S.navy} 0%, ${S.navy2} 100%)`, color: S.white }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "56px 26px", textAlign: "center" }}>
          <h2 style={{ fontFamily: serif, fontSize: "clamp(28px,4.6vw,44px)", fontWeight: 700, margin: 0 }}>Own the front door to the retirement economy.</h2>
          <p style={{ color: "#cdd7ea", fontSize: 16.5, maxWidth: 620, margin: "14px auto 0", lineHeight: 1.55 }}>Investment, sponsorship, advertising, or a full nationwide brand takeover — let's talk about how these assets fit your thesis.</p>
          <div style={{ marginTop: 26, display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
            <a href="/#disrupt" style={{ fontWeight: 900, fontSize: 18, color: "#1a0b00", textDecoration: "none", padding: "15px 32px", borderRadius: 12, background: `linear-gradient(90deg, ${BIZ.colors.disrupt2}, ${BIZ.colors.disrupt})`, boxShadow: "0 10px 30px rgba(255,90,31,.35)" }}>DISRUPT NOW →</a>
            <a href="/book" style={{ fontWeight: 700, fontSize: 16, color: S.white, textDecoration: "none", padding: "15px 26px", borderRadius: 12, border: `1px solid ${S.gold}` }}>Book a call</a>
          </div>
          <p style={{ marginTop: 22, color: "#8ea0c2", fontSize: 12.5, lineHeight: 1.6, maxWidth: 760, margin: "22px auto 0" }}>{BIZ.disclaimer}</p>
        </div>
      </section>
      <style>{`@media (max-width:720px){.sum-grid{grid-template-columns:1fr !important;gap:28px !important}}`}</style>
    </BizShell>
  );
}
