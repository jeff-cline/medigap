import type { Metadata } from "next";
import { BIZ, ASSETS, AGETECH, FAQ } from "@/lib/biz";
import BizShell from "@/components/biz/BizShell";
import BizForm from "@/components/biz/BizForm";

export const dynamic = "force-dynamic";
const C = BIZ.colors;
const serif = "Georgia,'Times New Roman',serif";

export const metadata: Metadata = {
  title: "1-800-MEDIGAP — Disruption Ahead | Investor, JV, Sponsor & Advertiser Opportunities",
  description: "A business-development power platform in the Medicare & senior-marketing space: the 1-800-MEDIGAP vanity brand, Medigap.plus lead engine, predictivedata.org, and an AI autonomous workforce. Investor-grade. Disrupt now.",
  alternates: { canonical: `https://${BIZ.domain}/` },
  openGraph: { title: "1-800-MEDIGAP Disruption Ahead!", description: "Strategic assets to disrupt the Medicare & AgeTech market — investor, JV, sponsor & advertiser opportunities.", url: `https://${BIZ.domain}/`, siteName: "1-800-MEDIGAP", type: "website", images: [{ url: `https://${BIZ.domain}/api/biz/og`, width: 1200, height: 630, alt: "1-800-MEDIGAP Disruption Ahead!" }] },
  twitter: { card: "summary_large_image", title: "1-800-MEDIGAP Disruption Ahead!", description: "Strategic assets to disrupt the Medicare & AgeTech market.", images: [`https://${BIZ.domain}/api/biz/og`] },
};

const ld = {
  "@context": "https://schema.org", "@graph": [
    { "@type": "Organization", name: "1-800-MEDIGAP", url: `https://${BIZ.domain}`, description: "Business-development power platform in the Medicare & senior-marketing space." },
    { "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
  ],
};

export default function BizHome() {
  return (
    <BizShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />

      {/* HERO */}
      <section style={{ position: "relative", overflow: "hidden", borderBottom: `1px solid ${C.line}` }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(1200px 500px at 70% -10%, rgba(227,178,60,.16), transparent), radial-gradient(800px 400px at 10% 110%, rgba(255,90,31,.12), transparent)` }} />
        <div style={{ position: "relative", maxWidth: 1120, margin: "0 auto", padding: "72px 22px 64px" }}>
          <div style={{ display: "inline-block", fontSize: 12.5, letterSpacing: ".18em", textTransform: "uppercase", color: C.gold, border: `1px solid ${C.line}`, borderRadius: 999, padding: "6px 14px" }}>Investor · JV · Sponsor · Advertiser</div>
          <h1 style={{ fontFamily: serif, fontSize: "clamp(38px,7vw,68px)", lineHeight: 1.03, margin: "20px 0 0", fontWeight: 700 }}>
            1-800-<span style={{ color: C.gold }}>MEDIGAP</span><br /><span style={{ color: C.disrupt2 }}>Disruption Ahead.</span>
          </h1>
          <p style={{ maxWidth: 720, marginTop: 20, fontSize: "clamp(16px,2.4vw,20px)", color: "#c7d0e0", lineHeight: 1.55 }}>
            Four strategic assets — a priceless category vanity brand, a lead-&-routing profit engine, predictive acquisition that lowers CPA, and an AI autonomous workforce — engineered to disrupt the Medicare, Medigap, Medicare Advantage, and broader AgeTech market. In the hands of the right strategic partner, this becomes the world's go-to brand for age-tech.
          </p>
          <div style={{ marginTop: 30, display: "flex", flexWrap: "wrap", gap: 14 }}>
            <a href="#disrupt" style={{ fontWeight: 900, fontSize: 18, color: "#1a0b00", textDecoration: "none", padding: "15px 30px", borderRadius: 12, background: `linear-gradient(90deg, ${C.disrupt2}, ${C.disrupt})`, boxShadow: "0 10px 34px rgba(255,90,31,.36)" }}>DISRUPT NOW →</a>
            <a href="#thesis" style={{ fontWeight: 700, fontSize: 16, color: C.ink, textDecoration: "none", padding: "15px 26px", borderRadius: 12, border: `1px solid ${C.line}` }}>Read the thesis</a>
          </div>
          <div style={{ marginTop: 34, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14, maxWidth: 720 }}>
            {AGETECH.stats.map((s) => (
              <div key={s.label} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 14 }}>
                <div style={{ fontFamily: serif, fontSize: 26, fontWeight: 700, color: C.gold }}>{s.big}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* THESIS INTRO */}
      <section id="thesis" style={{ maxWidth: 900, margin: "0 auto", padding: "56px 22px 10px" }}>
        <div style={{ fontSize: 12.5, letterSpacing: ".16em", textTransform: "uppercase", color: C.gold }}>Executive thesis</div>
        <p style={{ fontFamily: serif, fontSize: "clamp(20px,3vw,27px)", lineHeight: 1.45, marginTop: 12, color: C.ink }}>
          Medicare is the front door to the fastest-growing consumer market in the country. Whoever owns the category's most trusted, most memorable entry point — and the technology to convert and scale it autonomously — owns a control point, not a campaign. That is what is on offer here.
        </p>
      </section>

      {/* FOUR ASSETS */}
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "30px 22px 20px" }}>
        {ASSETS.map((a, i) => (
          <div key={a.key} style={{ display: "grid", gridTemplateColumns: "1fr", gap: 18, padding: "34px 0", borderTop: i ? `1px solid ${C.line}` : "none" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
              <div style={{ fontFamily: serif, fontSize: 44, fontWeight: 700, color: "rgba(227,178,60,.35)" }}>{a.n}</div>
              <div>
                <div style={{ fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: C.gold }}>{a.tag}</div>
                <h2 style={{ fontFamily: serif, fontSize: "clamp(22px,3.4vw,32px)", margin: "4px 0 0", fontWeight: 700, lineHeight: 1.15 }}>{a.title}</h2>
              </div>
            </div>
            <p style={{ fontSize: 17.5, color: "#c7d0e0", fontWeight: 600, lineHeight: 1.5, margin: 0 }}>{a.lead}</p>
            <p style={{ fontSize: 15.5, color: C.muted, lineHeight: 1.65, margin: 0, maxWidth: 860 }}>{a.body}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 10 }}>
              {a.bullets.map((b) => <div key={b} style={{ display: "flex", gap: 9, fontSize: 14.5, color: C.ink }}><span style={{ color: C.gold }}>◆</span>{b}</div>)}
            </div>
            {"link" in a && a.link && <a href={a.link.href} style={{ color: C.goldSoft, fontWeight: 700, fontSize: 15, textDecoration: "none" }}>{a.link.label}</a>}
          </div>
        ))}
      </section>

      {/* AGETECH MACRO */}
      <section style={{ background: C.panel2, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "56px 22px" }}>
          <div style={{ fontSize: 12.5, letterSpacing: ".16em", textTransform: "uppercase", color: C.gold }}>The macro</div>
          <h2 style={{ fontFamily: serif, fontSize: "clamp(24px,3.6vw,36px)", margin: "10px 0 0", fontWeight: 700, maxWidth: 820 }}>{AGETECH.headline}</h2>
          <div style={{ marginTop: 26, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14 }}>
            {AGETECH.stats.map((s) => (
              <div key={s.label} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18 }}>
                <div style={{ fontFamily: serif, fontSize: 32, fontWeight: 700, color: C.gold }}>{s.big}</div>
                <div style={{ fontSize: 13.5, color: C.ink, marginTop: 4 }}>{s.label}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{s.note}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 26, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 12 }}>
            {AGETECH.exits.map((e) => (
              <div key={e.name} style={{ borderLeft: `3px solid ${C.gold}`, paddingLeft: 14 }}>
                <div style={{ fontWeight: 800, color: C.ink }}>{e.name}</div>
                <div style={{ fontSize: 13.5, color: C.muted, marginTop: 3 }}>{e.note}</div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 26, maxWidth: 860, fontSize: 16, color: "#c7d0e0", lineHeight: 1.6 }}>{AGETECH.thesis}</p>
        </div>
      </section>

      {/* FEATURED NATIONAL TV AD */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "56px 22px" }}>
        <div style={{ fontSize: 12.5, letterSpacing: ".16em", textTransform: "uppercase", color: C.gold, textAlign: "center" }}>Featured National TV Ad</div>
        <h2 style={{ fontFamily: serif, fontSize: "clamp(22px,3.4vw,32px)", margin: "10px 0 22px", fontWeight: 700, textAlign: "center" }}>As seen on national television</h2>
        <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: 16, overflow: "hidden", border: `1px solid ${C.line}`, boxShadow: "0 20px 60px rgba(0,0,0,.5)" }}>
          <iframe src={`https://www.youtube.com/embed/${BIZ.tvYouTube}`} title="1-800-MEDIGAP National TV Ad" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />
        </div>
      </section>

      {/* EXECUTIVE SUMMARY */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "10px 22px 40px" }}>
        <div style={{ background: `linear-gradient(160deg, ${C.panel}, ${C.panel2})`, border: `1px solid ${C.line}`, borderRadius: 18, padding: 30 }}>
          <div style={{ fontSize: 12.5, letterSpacing: ".16em", textTransform: "uppercase", color: C.gold }}>Executive summary</div>
          <p style={{ fontFamily: serif, fontSize: "clamp(19px,2.8vw,26px)", lineHeight: 1.45, marginTop: 12 }}>
            These four assets — the vanity brand, the lead engine, predictive acquisition, and the autonomous workforce — in the hands of strategic partners, allow the geeks and the brand to disrupt entire marketplaces and industries, and potentially become the world's number-one go-to brand for age-tech.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 860, margin: "0 auto", padding: "20px 22px 50px" }}>
        <h2 style={{ fontFamily: serif, fontSize: "clamp(24px,3.4vw,32px)", fontWeight: 700 }}>Frequently asked questions</h2>
        <div style={{ marginTop: 16 }}>
          {FAQ.map((f, i) => (
            <details key={i} style={{ borderTop: `1px solid ${C.line}`, padding: "16px 0" }}>
              <summary style={{ cursor: "pointer", fontSize: 17, fontWeight: 700, color: C.ink }}>{f.q}</summary>
              <p style={{ marginTop: 10, color: C.muted, fontSize: 15, lineHeight: 1.6 }}>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FORM */}
      <section id="disrupt" style={{ background: C.panel2, borderTop: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "56px 22px 70px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 12.5, letterSpacing: ".16em", textTransform: "uppercase", color: C.gold }}>Make your move</div>
            <h2 style={{ fontFamily: serif, fontSize: "clamp(28px,4.6vw,44px)", margin: "10px 0 8px", fontWeight: 700 }}>DISRUPT NOW</h2>
            <p style={{ color: C.muted, fontSize: 15.5, maxWidth: 560, margin: "0 auto 26px" }}>Tell us where you fit. Your inquiry routes directly to the founder and you'll be invited to a private, confidential conversation.</p>
          </div>
          <BizForm />
        </div>
      </section>
    </BizShell>
  );
}
