import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BIZ, COMPS, SENIOR_LTV, compBySlug } from "@/lib/biz";
import BizShell from "@/components/biz/BizShell";

export const dynamic = "force-dynamic";
const C = BIZ.colors;
const serif = "Georgia,'Times New Roman',serif";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = compBySlug(slug);
  if (!c) return {};
  return {
    title: `${c.name} (${c.ticker}) vs. 1-800-MEDIGAP — Vanity-Brand Comparable | Market Cap & Customer LTV`,
    description: `Investor comparison: ${c.name} market cap ${c.marketCap}, customer LTV ${c.customerLtv} — versus a Medicare/senior customer worth ${SENIOR_LTV.spendHeadline}+. See the multiple.`,
    alternates: { canonical: `https://${BIZ.domain}/comps/${c.slug}` },
    openGraph: { title: `${c.name} vs. 1-800-MEDIGAP`, description: c.tagline, url: `https://${BIZ.domain}/comps/${c.slug}`, images: [`https://${BIZ.domain}/api/biz/og`] },
  };
}

export default async function CompPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = compBySlug(slug);
  if (!c) notFound();
  const multiple = Math.round(SENIOR_LTV.mid / c.customerLtvMid);
  const others = COMPS.filter((x) => x.slug !== c.slug);
  const stat = (label: string, big: string, note?: string) => (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18 }}>
      <div style={{ fontSize: 11.5, textTransform: "uppercase", letterSpacing: ".08em", color: C.muted }}>{label}</div>
      <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 700, color: C.gold, marginTop: 4 }}>{big}</div>
      {note && <div style={{ fontSize: 12.5, color: C.muted, marginTop: 4, lineHeight: 1.45 }}>{note}</div>}
    </div>
  );

  return (
    <BizShell>
      <article style={{ maxWidth: 900, margin: "0 auto", padding: "48px 22px 20px" }}>
        <a href="/comps" style={{ color: C.muted, fontSize: 14, textDecoration: "none" }}>← All comparables</a>
        <div style={{ marginTop: 16, fontSize: 12.5, letterSpacing: ".14em", textTransform: "uppercase", color: C.gold }}>Vanity-brand comparable · {c.ticker}</div>
        <h1 style={{ fontFamily: serif, fontSize: "clamp(28px,4.6vw,44px)", lineHeight: 1.08, margin: "10px 0 0", fontWeight: 700 }}>{c.name} <span style={{ color: C.muted, fontWeight: 400 }}>vs.</span> <span style={{ color: C.gold }}>1-800-MEDIGAP</span></h1>
        <p style={{ fontSize: 18, color: "#c7d0e0", lineHeight: 1.55, marginTop: 14 }}>{c.tagline}</p>

        {/* STATS */}
        <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
          {stat(c.isPublic ? "Market cap" : "Enterprise value", c.marketCap, c.marketCapNote)}
          {stat("Revenue", c.revenue, c.revenueNote)}
          {stat("Customer lifetime value", c.customerLtv, c.ltvBasis)}
        </div>

        {/* THE CONTRAST — the multiple */}
        <div style={{ marginTop: 22, background: `linear-gradient(160deg, #1a1206, ${C.panel})`, border: `1px solid ${C.gold}`, borderRadius: 18, padding: 26 }}>
          <div style={{ fontSize: 12.5, letterSpacing: ".14em", textTransform: "uppercase", color: C.gold }}>The disruptive-edge contrast</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 14, marginTop: 16 }}>
            <div>
              <div style={{ fontSize: 13, color: C.muted }}>{c.name.split("(")[0].trim()} customer</div>
              <div style={{ fontFamily: serif, fontSize: "clamp(22px,4vw,32px)", fontWeight: 700 }}>{c.customerLtv}</div>
            </div>
            <div style={{ fontFamily: serif, fontSize: "clamp(30px,6vw,52px)", fontWeight: 700, color: C.disrupt2, textAlign: "center" }}>≈{multiple}×</div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, color: C.muted }}>Medicare / senior customer</div>
              <div style={{ fontFamily: serif, fontSize: "clamp(22px,4vw,32px)", fontWeight: 700, color: C.gold }}>{SENIOR_LTV.spendHeadline}</div>
            </div>
          </div>
          <p style={{ marginTop: 16, fontSize: 14.5, color: "#c7d0e0", lineHeight: 1.6 }}>
            A Medicare/senior customer generates roughly <b style={{ color: C.gold }}>{SENIOR_LTV.spendHeadline}</b> in lifetime economic value (Medigap premiums over an 8–10-year hold) — and up to <b style={{ color: C.gold }}>{SENIOR_LTV.spendUpside}</b> as a Medicare Advantage member. Against a typical {c.name.split("(")[0].trim()} customer at <b>{c.customerLtv}</b>, that's an illustrative <b style={{ color: C.disrupt2 }}>≈{multiple}× advantage</b> — the same vanity-number playbook, pointed at a market with radically higher per-customer value.
          </p>
        </div>

        {/* NARRATIVE */}
        <h2 style={{ fontFamily: serif, fontSize: 26, fontWeight: 700, marginTop: 40 }}>Why it matters</h2>
        <p style={{ color: "#c7d0e0", fontSize: 16, lineHeight: 1.65, marginTop: 10 }}>{c.narrative}</p>
        <div style={{ marginTop: 16, display: "grid", gap: 9 }}>
          {c.facts.map((f) => <div key={f} style={{ display: "flex", gap: 9, fontSize: 15, color: C.ink }}><span style={{ color: C.gold }}>◆</span>{f}</div>)}
        </div>

        {/* FILINGS / SOURCES */}
        <div style={{ marginTop: 26, background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18 }}>
          {c.isPublic && c.tenK ? (
            <div style={{ marginBottom: 10 }}><b style={{ color: C.ink }}>Primary filing:</b> <a href={c.tenK} target="_blank" rel="noopener" style={{ color: C.goldSoft }}>{c.tenKLabel} ↗</a></div>
          ) : (
            <div style={{ marginBottom: 10, color: C.muted }}><b style={{ color: C.ink }}>Ownership:</b> {c.ownership}</div>
          )}
          <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.7 }}>
            <b style={{ color: C.ink }}>Sources:</b> {c.sources.map((s, i) => <span key={s.url}>{i ? " · " : " "}<a href={s.url} target="_blank" rel="noopener" style={{ color: C.goldSoft }}>{s.label}↗</a></span>)}
          </div>
          <div style={{ fontSize: 11.5, color: "#5c6a84", marginTop: 10, lineHeight: 1.6 }}>{SENIOR_LTV.note}</div>
        </div>

        {/* OTHER COMPS */}
        <h2 style={{ fontFamily: serif, fontSize: 22, fontWeight: 700, marginTop: 36 }}>Other comparables</h2>
        <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 10 }}>
          {others.map((o) => <a key={o.slug} href={`/comps/${o.slug}`} style={{ border: `1px solid ${C.line}`, borderRadius: 999, padding: "8px 15px", color: C.ink, fontSize: 14, textDecoration: "none" }}>{o.name.split("(")[0].trim()} →</a>)}
          <a href="/market-analysis" style={{ border: `1px solid ${C.gold}`, borderRadius: 999, padding: "8px 15px", color: C.gold, fontSize: 14, textDecoration: "none" }}>Full market analysis →</a>
        </div>

        <div style={{ marginTop: 34, textAlign: "center" }}>
          <a href="/#disrupt" style={{ fontWeight: 900, fontSize: 18, color: "#1a0b00", textDecoration: "none", padding: "15px 30px", borderRadius: 12, background: `linear-gradient(90deg, ${C.disrupt2}, ${C.disrupt})`, display: "inline-block" }}>DISRUPT NOW →</a>
        </div>
      </article>
    </BizShell>
  );
}
