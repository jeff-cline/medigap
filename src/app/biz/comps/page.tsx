import type { Metadata } from "next";
import { BIZ, COMPS, SENIOR_LTV } from "@/lib/biz";
import BizShell from "@/components/biz/BizShell";

export const dynamic = "force-dynamic";
const C = BIZ.colors;
const serif = "Georgia,'Times New Roman',serif";

export const metadata: Metadata = {
  title: "Vanity-Brand Comparables — Market Caps & Customer LTV vs. 1-800-MEDIGAP",
  description: "Investor comparables: 1-800-FLOWERS (FLWS), 1-800 Contacts, 1-800-GOT-JUNK?, and 1-800-PetMeds (PETS) — market caps, revenue, and customer LTV — contrasted with a Medicare/senior customer worth 10×–100×+ more.",
  alternates: { canonical: `https://${BIZ.domain}/comps` },
  openGraph: { title: "Vanity-Brand Comparables vs. 1-800-MEDIGAP", description: "Market caps & customer LTV across the great vanity brands — versus Medicare.", url: `https://${BIZ.domain}/comps`, images: [`https://${BIZ.domain}/api/biz/og`] },
};

export default function CompsIndex() {
  const th = { padding: "12px 12px", textAlign: "left" as const, fontSize: 11.5, textTransform: "uppercase" as const, letterSpacing: ".06em", color: C.gold, borderBottom: `1px solid ${C.line}` };
  const td = { padding: "14px 12px", fontSize: 14.5, borderBottom: `1px solid ${C.line}`, verticalAlign: "top" as const };
  return (
    <BizShell>
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "48px 22px 20px" }}>
        <div style={{ fontSize: 12.5, letterSpacing: ".14em", textTransform: "uppercase", color: C.gold }}>Comparables</div>
        <h1 style={{ fontFamily: serif, fontSize: "clamp(30px,5vw,48px)", lineHeight: 1.08, margin: "10px 0 0", fontWeight: 700 }}>The great vanity brands — and why Medicare dwarfs them</h1>
        <p style={{ maxWidth: 780, fontSize: 18, color: "#c7d0e0", lineHeight: 1.55, marginTop: 16 }}>
          Entire public companies, billion-dollar acquisitions, and franchise empires have been built on a single vanity number. Same playbook, different markets. The difference is the <b style={{ color: C.ink }}>value of the customer underneath the number</b> — and no consumer category comes close to Medicare.
        </p>

        {/* TABLE */}
        <div style={{ marginTop: 24, overflowX: "auto", border: `1px solid ${C.line}`, borderRadius: 14 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
            <thead><tr>
              <th style={th}>Vanity brand</th><th style={th}>Status</th><th style={th}>Market cap / EV</th><th style={th}>Revenue</th><th style={th}>Customer LTV</th><th style={th}>Medicare multiple</th>
            </tr></thead>
            <tbody>
              {COMPS.map((c) => {
                const mult = Math.round(SENIOR_LTV.mid / c.customerLtvMid);
                return (
                  <tr key={c.slug}>
                    <td style={td}><a href={`/comps/${c.slug}`} style={{ color: C.ink, fontWeight: 700, textDecoration: "none" }}>{c.name.split("(")[0].trim()} →</a></td>
                    <td style={{ ...td, color: C.muted }}>{c.ticker}</td>
                    <td style={{ ...td, color: C.gold, fontWeight: 700 }}>{c.marketCap}</td>
                    <td style={td}>{c.revenue}</td>
                    <td style={td}>{c.customerLtv}</td>
                    <td style={{ ...td, color: C.disrupt2, fontWeight: 800, fontFamily: serif, fontSize: 18 }}>≈{mult}×</td>
                  </tr>
                );
              })}
              <tr style={{ background: "rgba(227,178,60,.06)" }}>
                <td style={{ ...td, fontWeight: 800, color: C.gold }}>1-800-MEDIGAP</td>
                <td style={{ ...td, color: C.muted }}>Available</td>
                <td style={{ ...td, color: C.muted }}>—</td>
                <td style={{ ...td, color: C.muted }}>Medicare / senior</td>
                <td style={{ ...td, color: C.gold, fontWeight: 700 }}>{SENIOR_LTV.spendHeadline}</td>
                <td style={{ ...td, color: C.disrupt2, fontWeight: 800, fontFamily: serif, fontSize: 18 }}>base</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: 12, fontSize: 12, color: "#5c6a84", lineHeight: 1.6 }}>{SENIOR_LTV.note}</p>

        {/* CARDS */}
        <div style={{ marginTop: 30, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
          {COMPS.map((c) => (
            <a key={c.slug} href={`/comps/${c.slug}`} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18, textDecoration: "none", color: C.ink }}>
              <div style={{ fontSize: 11.5, color: C.muted }}>{c.ticker}</div>
              <div style={{ fontFamily: serif, fontSize: 19, fontWeight: 700, marginTop: 3 }}>{c.name.split("(")[0].trim()}</div>
              <div style={{ fontSize: 13.5, color: C.muted, marginTop: 6, lineHeight: 1.5 }}>{c.tagline}</div>
              <div style={{ marginTop: 10, color: C.goldSoft, fontSize: 14, fontWeight: 700 }}>See the comparison →</div>
            </a>
          ))}
        </div>

        <div style={{ marginTop: 26, textAlign: "center" }}>
          <a href="/market-analysis" style={{ color: C.gold, fontWeight: 700, fontSize: 16, textDecoration: "none", border: `1px solid ${C.gold}`, borderRadius: 12, padding: "13px 24px", display: "inline-block" }}>Read the full market analysis →</a>
        </div>
      </section>
    </BizShell>
  );
}
