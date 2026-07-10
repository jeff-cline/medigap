import type { Metadata } from "next";
import { BIZ, VANITY_POINTS, COMPS, SENIOR_LTV } from "@/lib/biz";
import BizShell from "@/components/biz/BizShell";

export const dynamic = "force-dynamic";
const C = BIZ.colors;
const serif = "Georgia,'Times New Roman',serif";

export const metadata: Metadata = {
  title: "Why Vanity Toll-Free Numbers Are Priceless Strategic Assets | 1-800-MEDIGAP",
  description: "A cited deep-dive on the strategic value of vanity toll-free numbers — recall, brand moat, and category ownership — and why 1-800-MEDIGAP is a priceless asset in the Medicare & senior market.",
  alternates: { canonical: `https://${BIZ.domain}/vanity` },
  openGraph: { title: "Why Vanity Toll-Free Numbers Are Priceless", description: "The strategic-asset case for 1-800-MEDIGAP.", url: `https://${BIZ.domain}/vanity`, type: "article" },
};

export default function VanityPage() {
  return (
    <BizShell>
      <article style={{ maxWidth: 860, margin: "0 auto", padding: "56px 22px 30px" }}>
        <a href="/" style={{ color: C.muted, fontSize: 14, textDecoration: "none" }}>← Back</a>
        <div style={{ marginTop: 18, fontSize: 12.5, letterSpacing: ".16em", textTransform: "uppercase", color: C.gold }}>Strategic asset · deep dive</div>
        <h1 style={{ fontFamily: serif, fontSize: "clamp(30px,5vw,50px)", lineHeight: 1.08, margin: "12px 0 0", fontWeight: 700 }}>Why vanity toll-free numbers are priceless</h1>
        <p style={{ fontSize: 18, color: "#c7d0e0", lineHeight: 1.6, marginTop: 18 }}>
          A vanity toll-free number is not a utility line — it is intellectual property, a memory device, and a category moat. In a phone-first, trust-driven market like Medicare, the generic category number is arguably the single most defensible marketing asset a company can own. Here is the case, with real comparables.
        </p>

        <h2 style={{ fontFamily: serif, fontSize: 26, fontWeight: 700, marginTop: 40 }}>The strategic case</h2>
        <div style={{ marginTop: 14, display: "grid", gap: 16 }}>
          {VANITY_POINTS.map((p) => (
            <div key={p.h} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18 }}>
              <div style={{ fontWeight: 800, color: C.goldSoft, fontSize: 16 }}>{p.h}</div>
              <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.6, marginTop: 6 }}>{p.p}</p>
            </div>
          ))}
        </div>

        <h2 style={{ fontFamily: serif, fontSize: 26, fontWeight: 700, marginTop: 44 }}>Real comparables — the number as the business</h2>
        <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.6, marginTop: 8 }}>Entire public companies and franchise empires have been built on a single vanity number. The pattern is consistent: own the category term, and the number becomes the brand.</p>
        <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
          {COMPS.map((c) => (
            <a key={c.slug} href={`/comps/${c.slug}`} style={{ display: "block", borderLeft: `3px solid ${C.gold}`, paddingLeft: 14, textDecoration: "none" }}>
              <div style={{ fontWeight: 800, color: C.ink }}>{c.name.split("(")[0].trim()} <span style={{ color: C.muted, fontWeight: 400, fontSize: 13 }}>· {c.ticker}</span> <span style={{ color: C.goldSoft, fontSize: 13.5 }}>— see the comparison →</span></div>
              <div style={{ fontSize: 14.5, color: C.muted, marginTop: 3 }}>{c.tagline} <span style={{ color: C.disrupt2, fontWeight: 700 }}>Medicare customer ≈{Math.round(SENIOR_LTV.mid / c.customerLtvMid)}× the LTV.</span></div>
            </a>
          ))}
        </div>
        <p style={{ marginTop: 14 }}><a href="/comps" style={{ color: C.goldSoft, fontWeight: 700, textDecoration: "none" }}>See all comparables + the market analysis →</a></p>

        <h2 style={{ fontFamily: serif, fontSize: 26, fontWeight: 700, marginTop: 44 }}>Why 1-800-MEDIGAP specifically</h2>
        <p style={{ color: "#c7d0e0", fontSize: 16, lineHeight: 1.65, marginTop: 10 }}>
          Now apply that pattern to the largest, highest-intent, highest-LTV corner of American healthcare. Medigap, Medicare Supplement, and Medicare Advantage are searched, spoken, and dialed by tens of millions of seniors — a demographic that still converts by phone and rewards trust. <b style={{ color: C.ink }}>1-800-MEDIGAP</b> is the generic category term in that market, paired with the matching domain 1-800-MEDIGAP.com. There is exactly one. In the entire Medicare insurance, Medicare supplement, Medicare Advantage, senior-tech, and senior-advertising space, a front-door control point like this is, by any strategic measure, priceless.
        </p>

        <div style={{ marginTop: 22, padding: 16, background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 12, fontSize: 12.5, color: C.muted, lineHeight: 1.6 }}>
          <b style={{ color: C.ink }}>References &amp; sources:</b> Company examples are publicly-traded or widely-reported businesses (1-800-FLOWERS.COM, Inc., NASDAQ: FLWS; 1-800 Contacts; 1-800-GOT-JUNK?; PetMed Express, Inc., NASDAQ: PETS). Recall/response claims reflect long-standing industry research on vanity vs. numeric numbers (e.g., 800response and telecom-industry studies). Figures are illustrative and directional; trademarks belong to their respective owners; no affiliation or endorsement is implied.
        </div>

        <div style={{ marginTop: 34, textAlign: "center" }}>
          <a href="/#disrupt" style={{ fontWeight: 900, fontSize: 18, color: "#1a0b00", textDecoration: "none", padding: "15px 30px", borderRadius: 12, background: `linear-gradient(90deg, ${C.disrupt2}, ${C.disrupt})`, display: "inline-block" }}>DISRUPT NOW →</a>
        </div>
      </article>
    </BizShell>
  );
}
