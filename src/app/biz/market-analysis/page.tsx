import type { Metadata } from "next";
import { BIZ, COMPS, SENIOR_LTV } from "@/lib/biz";
import BizShell from "@/components/biz/BizShell";

export const dynamic = "force-dynamic";
const C = BIZ.colors;
const serif = "Georgia,'Times New Roman',serif";

export const metadata: Metadata = {
  title: "Market Analysis — The Disruptive-Edge Value of 1-800-MEDIGAP | Investor Executive Summary",
  description: "Executive summary: why the vanity-number playbook (1-800-FLOWERS, Contacts, GOT-JUNK, PetMeds) pointed at Medicare — a $494B/yr, 66.6M-beneficiary market with 10×–100×+ customer LTV — is a category-defining disruptive edge.",
  alternates: { canonical: `https://${BIZ.domain}/market-analysis` },
  openGraph: { title: "1-800-MEDIGAP — Market Analysis & Disruptive Edge", description: "Investor executive summary of the multiple.", url: `https://${BIZ.domain}/market-analysis`, images: [`https://${BIZ.domain}/api/biz/og`] },
};

const MARKET = [
  { big: "66.6M", label: "Medicare beneficiaries (CMS, 2024)", note: "~10,000 Americans age in every day" },
  { big: "~$494B", label: "Annual Medicare Advantage payments (2024)", note: "part of ~$850B+ total Medicare spend" },
  { big: "12.5M", label: "Medigap policyholders (KFF)", note: "guaranteed-renewable, high-persistency" },
  { big: "$77.1B", label: "Projected AgeTech market by 2034", note: "~14.3% CAGR from $22.4B (industry projection)" },
];

export default function MarketAnalysis() {
  return (
    <BizShell>
      <article style={{ maxWidth: 900, margin: "0 auto", padding: "48px 22px 20px" }}>
        <div style={{ fontSize: 12.5, letterSpacing: ".14em", textTransform: "uppercase", color: C.gold }}>Executive summary · market analysis</div>
        <h1 style={{ fontFamily: serif, fontSize: "clamp(30px,5vw,50px)", lineHeight: 1.06, margin: "12px 0 0", fontWeight: 700 }}>The disruptive-edge value</h1>
        <p style={{ fontSize: 19, color: "#c7d0e0", lineHeight: 1.55, marginTop: 16 }}>
          The vanity-number playbook has minted public companies, billion-dollar acquisitions, and franchise empires — in flowers, contacts, junk removal, and pet meds. The thesis here is simple: <b style={{ color: C.ink }}>take the same proven playbook and point it at the single highest-value consumer category in America — Medicare.</b> The number is the same kind of asset. The customer underneath it is worth an order of magnitude more.
        </p>

        {/* THE MULTIPLE */}
        <div style={{ marginTop: 26, background: `linear-gradient(160deg, #1a1206, ${C.panel})`, border: `1px solid ${C.gold}`, borderRadius: 18, padding: 28, textAlign: "center" }}>
          <div style={{ fontSize: 12.5, letterSpacing: ".14em", textTransform: "uppercase", color: C.gold }}>The multiple</div>
          <div style={{ fontFamily: serif, fontSize: "clamp(48px,11vw,96px)", fontWeight: 700, color: C.disrupt2, lineHeight: 1 }}>{SENIOR_LTV.multipleHeadline}</div>
          <p style={{ maxWidth: 640, margin: "10px auto 0", fontSize: 15.5, color: "#c7d0e0", lineHeight: 1.6 }}>
            A Medicare/senior customer is worth <b style={{ color: C.gold }}>{SENIOR_LTV.spendHeadline}</b> in lifetime economic value (Medigap premiums over an 8–10-year hold), and up to <b style={{ color: C.gold }}>{SENIOR_LTV.spendUpside}</b> as a Medicare Advantage member — versus $150–$1,700 for a typical consumer-retail customer. On a like-for-like agent-commission basis alone, a Medicare policyholder is worth <b style={{ color: C.ink }}>{SENIOR_LTV.agentBasis}</b> — 3–10× the best retail comps.
          </p>
        </div>

        {/* MARKET SIZE */}
        <h2 style={{ fontFamily: serif, fontSize: 28, fontWeight: 700, marginTop: 40 }}>The market underneath the number</h2>
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14 }}>
          {MARKET.map((m) => (
            <div key={m.label} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18 }}>
              <div style={{ fontFamily: serif, fontSize: 30, fontWeight: 700, color: C.gold }}>{m.big}</div>
              <div style={{ fontSize: 13.5, color: C.ink, marginTop: 4 }}>{m.label}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{m.note}</div>
            </div>
          ))}
        </div>

        {/* COMPS RECAP */}
        <h2 style={{ fontFamily: serif, fontSize: 28, fontWeight: 700, marginTop: 44 }}>Same playbook, different markets</h2>
        <div style={{ marginTop: 14, overflowX: "auto", border: `1px solid ${C.line}`, borderRadius: 14 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
            <thead><tr>{["Vanity brand", "Market cap / EV", "Customer LTV", "Medicare multiple"].map((h) => <th key={h} style={{ padding: "12px", textAlign: "left", fontSize: 11.5, textTransform: "uppercase", letterSpacing: ".06em", color: C.gold, borderBottom: `1px solid ${C.line}` }}>{h}</th>)}</tr></thead>
            <tbody>
              {COMPS.map((c) => (
                <tr key={c.slug}>
                  <td style={{ padding: 12, borderBottom: `1px solid ${C.line}` }}><a href={`/comps/${c.slug}`} style={{ color: C.ink, fontWeight: 600, textDecoration: "none" }}>{c.name.split("(")[0].trim()} →</a></td>
                  <td style={{ padding: 12, borderBottom: `1px solid ${C.line}`, color: C.gold, fontWeight: 700 }}>{c.marketCap}</td>
                  <td style={{ padding: 12, borderBottom: `1px solid ${C.line}` }}>{c.customerLtv}</td>
                  <td style={{ padding: 12, borderBottom: `1px solid ${C.line}`, color: C.disrupt2, fontWeight: 800, fontFamily: serif }}>≈{Math.round(SENIOR_LTV.mid / c.customerLtvMid)}×</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* IF LEVERAGED */}
        <h2 style={{ fontFamily: serif, fontSize: 28, fontWeight: 700, marginTop: 44 }}>How much bigger this can be — if leveraged correctly</h2>
        <p style={{ color: "#c7d0e0", fontSize: 16, lineHeight: 1.65, marginTop: 10 }}>
          1-800-FLOWERS turned a number into a &gt;$1.5B-revenue public company. 1-800 Contacts turned one into a $3B+ asset that changed hands five times. Those brands did it in categories where a customer is worth a few hundred dollars. 1-800-MEDIGAP sits at the front door of a category where a single customer is worth <b style={{ color: C.gold }}>tens of thousands</b> — inside a <b style={{ color: C.ink }}>~$850B/year</b> federal-backed market with a demographic tailwind of 10,000 new beneficiaries a day.
        </p>
        <p style={{ color: "#c7d0e0", fontSize: 16, lineHeight: 1.65, marginTop: 12 }}>
          Now layer the platform on top of the number: <b style={{ color: C.ink }}>Medigap.plus</b> monetizes each customer across leads, policies, and cross-sold products; <b style={{ color: C.ink }}>predictivedata.org</b> drives cost-per-acquisition down as it learns; and an <b style={{ color: C.ink }}>AI autonomous workforce</b> scales service and concierge without linear headcount. The same vanity-number moat that built billion-dollar consumer brands — multiplied by a 10×–100×+ customer, a compounding lead engine, and autonomous scale. That is the disruptive edge.
        </p>

        {/* SOURCES */}
        <div style={{ marginTop: 26, background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18, fontSize: 12.5, color: C.muted, lineHeight: 1.7 }}>
          <b style={{ color: C.ink }}>Sources:</b> CMS (beneficiary counts, Medicare Advantage payments); KFF (Medigap premiums &amp; enrollment, MA switching); MedPAC (MA benchmark &amp; rebates); NAIC / Mark Farrah (MA PMPM revenue); AJMC (MA retention); CMS Agent-Broker Compensation (commission caps); Consumer Edge (pet-meds LTV); MarketIntelo (AgeTech projection). Per-company market caps, revenue, and transaction values are cited on each <a href="/comps" style={{ color: C.goldSoft }}>comparable page</a> (SEC filings &amp; reputable financial press).
          <div style={{ marginTop: 10, color: "#5c6a84", fontSize: 11.5 }}>{SENIOR_LTV.note}</div>
        </div>

        <div style={{ marginTop: 34, textAlign: "center" }}>
          <a href="/#disrupt" style={{ fontWeight: 900, fontSize: 18, color: "#1a0b00", textDecoration: "none", padding: "15px 30px", borderRadius: 12, background: `linear-gradient(90deg, ${C.disrupt2}, ${C.disrupt})`, display: "inline-block" }}>DISRUPT NOW →</a>
        </div>
      </article>
    </BizShell>
  );
}
