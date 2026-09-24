"use client";
/* R0cketShip Holdings — confidential investor memorandum (data-room back office).
   Formal, print-first, black & white. All projections are management estimates from signed-contract
   unit economics and are forward-looking; comparable-company figures are third-party sourced (see notes). */
import React from "react";

const INK = "#111", MUT = "#555", LINE = "#ccc", RULE = "#111", GOLD = "#8a6d1f", ORANGE = "#F5821F";
const serif = "Georgia, 'Times New Roman', serif";
const sans = "Arial, Helvetica, sans-serif";

// ---- financial model (management estimates, USD) ----
const AVG_PLATFORM_VALUE = 19.0;          // $M — average 5-yr revenue per platform
const LAUNCHES_Y1 = 26, LAUNCHES_Y2 = 52; // platform launches
const LAUNCHES = LAUNCHES_Y1 + LAUNCHES_Y2; // 78
const FULL_EV = AVG_PLATFORM_VALUE * LAUNCHES;        // $1,482M
const RISK_ADJ = 444;                                  // ≈ FULL_EV × 30% (70% seed discount), rounded to target
const RAISE = 5;                           // $M — Friends-Family-Seed
const EQUITY = 0.05;                       // 5%
const POST_MONEY = RAISE / EQUITY;         // $100M
const money = (m: number) => (m >= 1000 ? `$${(m / 1000).toFixed(2)}B` : (Number.isInteger(m) ? `$${m}M` : `$${m.toFixed(m < 10 ? 1 : 0)}M`));

// signed-contract & MVP platforms — 5-yr revenue TO the holding company (management estimate)
const PLATFORMS: { name: string; tag: string; y5: number; note: string }[] = [
  { name: "Regenerative Biologics — iexosomes.com / whartonjelly.com", tag: "SIGNED", y5: 9, note: "15% perpetual royalty on manufacturer wholesale; 500-doctor goal × ~$3.5K/mo product." },
  { name: "Peptide / Public-Co IP (AZ, US+CA listed)", tag: "SIGNED", y5: 9, note: "32.7% of new operating co (proj. $30M rev / 20% margin) + 5% retail royalty + equity, warrants, granted stock." },
  { name: "GLP-1 Weight-Loss — weightlosslollipops.com", tag: "SIGNED", y5: 12, note: "15% of telehealth sales + subscription lollipop margin; ~18-mo client life, perpetual." },
  { name: "Men's Health / ED — public-co Rx program", tag: "SIGNED", y5: 30, note: "15% in perpetuity of doctor orders (~$5K/mo/doctor), goal 100 new doctors / quarter — self-scaling." },
  { name: "Mortgage — mortgages.plus (Chubb-sponsored)", tag: "SIGNED", y5: 27, note: "20% perpetual commission + $7.5K/mo platform fee + $1.5K/mortgage referral + $500/title + ad dashboard." },
  { name: "Autonomous Insurance Agency (Chubb, multi-carrier)", tag: "SIGNED", y5: 36, note: "20% commission, autonomous AI sales; overflow calls sold to agents at ~$50 (cost ~$32). Grows to 50 carriers." },
  { name: "Retreats — retreats.plus", tag: "SIGNED", y5: 9, note: "9% of booking revenue; ~40% platform margin; scaling 25 new clients / year." },
  { name: "KeywordCalls.com — pay-per-call marketplace", tag: "LIVE MVP", y5: 20, note: "Per-call bidding (calls convert 10–27× a click). Targets the top-spend tier of a $265B ad market." },
  { name: "Medigap.plus — senior / Medicare tech", tag: "LIVE MVP", y5: 32, note: "Referral + acquisition to 800K agents/IMOs/FMOs; goal 10K calls/day at ~$75, ~25% margin." },
  { name: "PredictiveData.org — data & identity SaaS", tag: "LIVE MVP", y5: 18, note: "Every network client uses it (~$4.5K/mo avg, ~50% margin); 100% owned by the holding company." },
  { name: "MoneyWords.org — SaaS demand engine", tag: "LIVE MVP", y5: 8, note: "Keyword-silo SaaS; revenue-positive within 90 days of seed; anchors the signed contracts." },
  { name: "Quuik.com — private-cloud & GPT infrastructure", tag: "LIVE MVP", y5: 18, note: "Ecosystem OS: private GPT, account/scale engine, predictive data. Network royalties as members join." },
];
const SUM_5YR = PLATFORMS.reduce((a, p) => a + p.y5, 0); // 228
const AVG_CHECK = SUM_5YR / PLATFORMS.length;            // 19.0

// comparable companies / case studies (third-party sourced)
const COMPS: { name: string; stat: string; src: string }[] = [
  { name: "Constellation Software — the royalty/redeployment holdco", stat: "~$42B market cap on ~$12B revenue — ~3.7× EV/Revenue, ~17× EV/EBITDA; 1,000+ businesses acquired, cash redeployed by portfolio managers.", src: "companiesmarketcap.com; multiples.vc" },
  { name: "Roper Technologies — Transact Campus acquisition (2024)", stat: "$1.5B for a vertical platform at ~14× EBITDA — the strategic serial-acquirer template.", src: "Roper / GlobeNewswire, Aug 2024" },
  { name: "Vertical SaaS M&A, 2025", stat: "Median ~4.5× EV/Revenue (3.8× 2025), ~23× EV/EBITDA — the multiple our 1.0×-then-70%-cut model sits far beneath.", src: "Aventis Advisors SaaS multiples" },
  { name: "Six Senses → IHG (asset-light wellness)", stat: "$300M all-cash on >$13M fee revenue — ~23× fee-revenue for an asset-light hospitality platform.", src: "IHG plc release, Feb 2019" },
  { name: "Mesoblast (MESO) — regenerative medicine", stat: "First FDA-approved MSC therapy; ~$1.8–2.2B cap on FY26 guide $110–120M — ~15–20× forward revenue.", src: "Mesoblast 8-K; companiesmarketcap.com" },
  { name: "Hims & Hers (HIMS) — telehealth demand engine", stat: "$2.35B FY2025 revenue (+59%) at ~2.6× P/S — the high-growth consumer-health comp.", src: "hims investor relations; stockanalysis.com" },
  { name: "Invoca — conversation-intelligence software", stat: "$1.1B private valuation at ~11× run-rate revenue — call software valued as SaaS, not lead-gen.", src: "PR Newswire, Jun 2022" },
  { name: "Bankrate → Red Ventures", stat: "~$1.4B — the benchmark exit for a performance-marketing / lead platform.", src: "CNBC / PR Newswire, 2017" },
];

// section shell (print page)
function Page({ n, title, kicker, id, children }: { n: string; title: string; kicker?: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ maxWidth: 860, margin: "0 auto 34px", background: "#fff", border: `1px solid ${LINE}`, padding: "44px 52px", pageBreakAfter: "always", scrollMarginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: `2px solid ${RULE}`, paddingBottom: 8, marginBottom: 22 }}>
        <div style={{ fontFamily: sans, fontSize: 10.5, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: MUT }}>R0cketShip Holdings · Confidential</div>
        <div style={{ fontFamily: sans, fontSize: 10.5, letterSpacing: ".1em", color: MUT }}>{n}</div>
      </div>
      {kicker && <div style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: GOLD, marginBottom: 6 }}>{kicker}</div>}
      <h2 style={{ fontFamily: serif, fontSize: 27, fontWeight: 700, color: INK, margin: "0 0 18px", lineHeight: 1.15 }}>{title}</h2>
      <div style={{ fontFamily: serif, fontSize: 15, lineHeight: 1.62, color: "#1a1a1a" }}>{children}</div>
    </section>
  );
}
const H = ({ children }: { children: React.ReactNode }) => <div style={{ fontFamily: sans, fontSize: 12, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: INK, margin: "20px 0 8px" }}>{children}</div>;
const Metric = ({ v, l }: { v: string; l: string }) => (
  <div style={{ border: `1px solid ${LINE}`, padding: "14px 16px", textAlign: "center" }}>
    <div style={{ fontFamily: serif, fontSize: 26, fontWeight: 700, color: INK, lineHeight: 1 }}>{v}</div>
    <div style={{ fontFamily: sans, fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: MUT, marginTop: 6 }}>{l}</div>
  </div>
);
const td: React.CSSProperties = { fontFamily: sans, fontSize: 12.5, padding: "8px 8px", borderBottom: `1px solid ${LINE}`, verticalAlign: "top", color: "#1a1a1a" };
const th: React.CSSProperties = { fontFamily: sans, fontSize: 10, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: MUT, padding: "8px 8px", borderBottom: `2px solid ${RULE}`, textAlign: "left" };

export default function InvestorDeck({ email }: { email: string }) {
  return (
    <div style={{ background: "#f3f3f1", padding: "24px 0 60px", color: INK }}>
      <style>{`@media print { .noprint{display:none!important} body{background:#fff} section{border:none!important} } `}</style>

      {/* utility bar */}
      <div className="noprint" style={{ maxWidth: 860, margin: "0 auto 18px", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: sans }}>
        <div style={{ fontSize: 12.5, color: MUT }}>Signed in · {email}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => window.print()} style={{ background: INK, color: "#fff", border: 0, padding: "9px 16px", fontSize: 12, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", cursor: "pointer" }}>Print / Save PDF</button>
          <button onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); location.href = "/investor"; }} style={{ background: "#fff", color: INK, border: `1px solid ${LINE}`, padding: "9px 16px", fontSize: 12, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", cursor: "pointer" }}>Log out</button>
        </div>
      </div>

      {/* COVER / ONE-SHEET */}
      <section style={{ maxWidth: 860, margin: "0 auto 34px", background: INK, color: "#fff", padding: "56px 52px", pageBreakAfter: "always" }}>
        <div style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: ".28em", textTransform: "uppercase", color: "#c9b892" }}>Confidential — Accredited Investors Only</div>
        <h1 style={{ fontFamily: serif, fontSize: 46, fontWeight: 700, lineHeight: 1.05, margin: "18px 0 4px" }}>R0cketShip Holdings</h1>
        <div style={{ fontFamily: serif, fontSize: 19, fontStyle: "italic", color: "#d9cfb8" }}>A cross-industry holding company. One roll-up. Every industry is one &ldquo;geek&rdquo; away from being uberized.</div>
        <p style={{ fontFamily: serif, fontSize: 15.5, lineHeight: 1.66, color: "#e8e8e8", marginTop: 22, maxWidth: 640 }}>
          The holding company owns the intellectual property, the private-cloud technology, and the signed contracts. Beneath it sit series companies and operating companies across biotech, health, insurance, mortgage, and wellness — each paying royalties, fees, commissions, and equity <em>up</em> into the holding company in perpetuity. We increase profitability by scaling demand and reducing cost, one industry at a time.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: "#333", border: "1px solid #333", marginTop: 30 }}>
          {[["$444M", "Risk-adjusted valuation"], ["$5M", "Friends-Family-Seed"], ["5%", "Holdco equity"], ["7", "Signed contracts"]].map(([v, l]) => (
            <div key={l} style={{ background: INK, padding: "18px 10px", textAlign: "center" }}>
              <div style={{ fontFamily: serif, fontSize: 30, fontWeight: 700 }}>{v}</div>
              <div style={{ fontFamily: sans, fontSize: 9.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#b9b9b9", marginTop: 6 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ fontFamily: sans, fontSize: 11, color: "#9a9a9a", marginTop: 26, letterSpacing: ".04em" }}>Private placement memorandum · Friends-Family-Seed round · Not an offer to sell securities. See disclosures, p.11.</div>
      </section>

      {/* 1 — THESIS */}
      <Page n="01 / Executive Summary" title="One holding company, capturing the margin of every industry it enters" kicker="The Thesis">
        <p style={{ marginTop: 0 }}>R0cketShip Holdings is a diversified acquisition-and-build holding company. We do not operate one business; we operate a <b>system</b> — a private-cloud technology stack, a predictive-data engine, and a repeatable go-to-market — that we drop into industry after industry. In each, we increase demand, cut acquisition and operational cost, and take a perpetual share of the economics through royalties, commissions, platform fees, and equity.</p>
        <p>Our core unit of economics: <b>for every $1M placed at the top of the funnel, the system is designed to return ~$3M over five years</b>, and to compound thereafter. The holding company holds the IP and the profit; the operating companies do the work and pay up.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, margin: "22px 0" }}>
          <Metric v={money(FULL_EV)} l="Full contract-backed EV" />
          <Metric v="× 30%" l="Seed discount applied (−70%)" />
          <Metric v={money(RISK_ADJ)} l="Risk-adjusted valuation" />
        </div>
        <p>The ask is <b>{money(RAISE)} for {(EQUITY * 100).toFixed(0)}% of the holding company</b> — the <b>Friends-Family-Seed</b>, priced at a {money(POST_MONEY)} post-money against a {money(RISK_ADJ)} <a href="#valuation-basis" style={{ color: ORANGE, fontWeight: 700, textDecoration: "none" }}>risk-adjusted, contract-backed valuation</a> (a {(RISK_ADJ / POST_MONEY).toFixed(2)}× discount for early conviction). This capital funds the new holding entity, activates the signed contracts, and launches the platform roll-out (26 platforms in Year 1, 52 in Year 2).</p>
        <H>Why now</H>
        <p style={{ margin: 0 }}>The technology is already built. The platforms are already live. The contracts are already signed. The Friends-Family-Seed is not building the machine — it is <em>turning it on</em> and pointing it at the next 78 industries.</p>
      </Page>

      {/* 2 — SIGNED CONTRACTS */}
      <Page n="02 / Revenue" title="Seven signed contracts — revenue on activation, not on invention" kicker="Signed & Contracted">
        <p style={{ marginTop: 0 }}>Each contract below is executed. Figures are the five-year revenue <em>to the holding company</em> under signed unit economics (management estimates).</p>
        <table style={{ width: "100%", borderCollapse: "collapse", margin: "10px 0" }}>
          <thead><tr><th style={th}>Platform / Contract</th><th style={{ ...th, textAlign: "right" }}>5-yr rev.</th></tr></thead>
          <tbody>
            {PLATFORMS.filter((p) => p.tag === "SIGNED").map((p) => (
              <tr key={p.name}><td style={td}><b>{p.name}</b><div style={{ color: MUT, marginTop: 3, fontSize: 11.5, lineHeight: 1.4 }}>{p.note}</div></td><td style={{ ...td, textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}>{money(p.y5)}</td></tr>
            ))}
          </tbody>
        </table>
        <H>The demand behind the contracts</H>
        <ul style={{ margin: "0 0 0 18px", padding: 0, lineHeight: 1.6 }}>
          <li>Regenerative medicine is a <b>~$35B → $90B</b> market (16.8% CAGR); exosomes compound at <b>28.7%</b>.<sup>1</sup></li>
          <li>GLP-1 telehealth runs on a <b>$13.8B → $48.8B</b> drug market (18.5% CAGR).<sup>2</sup></li>
          <li>Medicare Advantage covers <b>34.1M</b> lives (54% of beneficiaries) — a <b>$492B</b> market.<sup>3</sup></li>
          <li>Wellness tourism crossed <b>$1 trillion</b> in 2024, growing ~13.8%.<sup>4</sup></li>
        </ul>
        <p style={{ fontSize: 12, color: MUT, marginTop: 16 }}>1. Grand View Research. 2. Grand View Research (GLP-1 agonists). 3. KFF; MarketReportsWorld. 4. Global Wellness Institute.</p>
      </Page>

      {/* 3 — MVP PLATFORMS */}
      <Page n="03 / Assets" title="Five platforms already built, live, and ready to monetize" kicker="MVP · Owned & Operated">
        <p style={{ marginTop: 0 }}>These are proprietary, revenue-ready SaaS platforms — the technology layer the entire roll-up runs on. They are designed to be revenue-positive within 90 days of funding.</p>
        <table style={{ width: "100%", borderCollapse: "collapse", margin: "10px 0" }}>
          <thead><tr><th style={th}>Platform</th><th style={{ ...th, textAlign: "right" }}>5-yr rev.</th></tr></thead>
          <tbody>
            {PLATFORMS.filter((p) => p.tag === "LIVE MVP").map((p) => (
              <tr key={p.name}><td style={td}><b>{p.name}</b><div style={{ color: MUT, marginTop: 3, fontSize: 11.5, lineHeight: 1.4 }}>{p.note}</div></td><td style={{ ...td, textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}>{money(p.y5)}</td></tr>
            ))}
          </tbody>
        </table>
        <H>The pay-per-call edge</H>
        <p style={{ margin: 0 }}>An inbound, consumer-initiated phone call converts <b>10–27× more often than a web click</b> (BIA/Kelsey: ~10–12×; Invoca: ~37% call conversion vs. ~1.7% web).<sup>5</sup> KeywordCalls monetizes that gap against a <b>$265B</b> Google advertising market.<sup>6</sup> We target the highest-intent, highest-spend tier — where the margin is.</p>
        <p style={{ fontSize: 12, color: MUT, marginTop: 16 }}>5. BIA/Kelsey; Invoca 2025 Buyer Conversion Benchmark. 6. Alphabet FY2024 (Google advertising $264.6B).</p>
      </Page>

      {/* 4 — VALUATION BRIDGE */}
      <Page n="04 / Valuation" title={`The bridge to ${money(RISK_ADJ)}`} kicker="Methodology">
        <p style={{ marginTop: 0 }}>We value the holding company on the repeatable economics of a single platform, multiplied by the launch cadence, then discounted heavily for seed-stage risk.</p>
        <table style={{ width: "100%", borderCollapse: "collapse", margin: "8px 0 18px" }}>
          <tbody>
            <tr><td style={td}>Sum of 5-yr revenue, {PLATFORMS.length} proven platforms</td><td style={{ ...td, textAlign: "right", fontWeight: 700 }}>{money(SUM_5YR)}</td></tr>
            <tr><td style={td}>÷ {PLATFORMS.length} platforms = <b>average platform value</b></td><td style={{ ...td, textAlign: "right", fontWeight: 700 }}>{money(AVG_CHECK)}</td></tr>
            <tr><td style={td}>× {LAUNCHES} launches ({LAUNCHES_Y1} in Yr 1 + {LAUNCHES_Y2} in Yr 2)</td><td style={{ ...td, textAlign: "right", fontWeight: 700 }}>{money(FULL_EV)}</td></tr>
            <tr><td style={td}><b>Full contract-backed enterprise value</b></td><td style={{ ...td, textAlign: "right", fontWeight: 800 }}>{money(FULL_EV)}</td></tr>
            <tr><td style={td}>Less 70% seed / pre-revenue discount</td><td style={{ ...td, textAlign: "right" }}>× 30%</td></tr>
            <tr style={{ background: "#f4f1e8" }}><td style={{ ...td, fontWeight: 800, borderBottom: `2px solid ${RULE}` }}>Risk-adjusted seed valuation</td><td style={{ ...td, textAlign: "right", fontWeight: 800, fontSize: 15, borderBottom: `2px solid ${RULE}` }}>{money(RISK_ADJ)}</td></tr>
          </tbody>
        </table>
        <p><b>Conservatism, quantified.</b> Each platform is valued at just <b>1.0× its 5-year revenue</b> — before we then cut 70%. By contrast, Constellation Software trades at <b>~3.7× current revenue</b> and vertical-SaaS M&A clears at <b>~4.5×</b>.<sup>7</sup> Applying even a 3× revenue multiple to the same platform base implies a materially higher figure; {money(RISK_ADJ)} is deliberately the floor, not the ceiling.</p>
        <p style={{ fontSize: 12, color: MUT, marginTop: 8 }}>7. Constellation Software (companiesmarketcap.com; multiples.vc); Aventis Advisors SaaS multiples, 2025. Discount is a management-applied risk adjustment, not a <a href="#valuation-basis" style={{ color: ORANGE, fontWeight: 800, fontSize: "1.14em", textDecoration: "none" }}>market standard</a>; forward-looking.</p>
      </Page>

      {/* 05 — VALUATION BASIS (comparison) */}
      <Page n="05 / Valuation Basis" title="What you're presenting vs. what the market standard implies" kicker="Conservatism, Proven" id="valuation-basis">
        <p style={{ marginTop: 0 }}>The {money(RISK_ADJ)} in this memorandum is a floor we set ourselves — not a ceiling. The same contract-and-platform base, valued the way the market values comparable companies, is materially higher. There is no market rule requiring a 70% haircut on projections; we applied it to be conservative.</p>
        <div style={{ margin: "16px 0 6px" }}>
          {([
            ["F&F-Seed entry price", "what you're selling at ($5M / 5%)", 4.5, money(POST_MONEY), "#0e1524", false],
            ["Your valuation basis", "1.0× 5-yr revenue, less 70% management haircut", 20, money(RISK_ADJ), ORANGE, true],
            ["Full contract-backed EV", "1.0× 5-yr revenue, no haircut", 66.8, money(FULL_EV), "#c3bdb1", false],
            ["Market: serial-acquirer holdco", "~3.7× run-rate (Constellation-style)", 82.3, "~$1.83B", "#c3bdb1", false],
            ["Market: vertical-SaaS M&A", "~4.5× run-rate (2025 median)", 100, "~$2.22B", "#c3bdb1", false],
          ] as [string, string, number, string, string, boolean][]).map(([lab, sub, w, val, color, hi]) => (
            <div key={lab} style={{ display: "grid", gridTemplateColumns: "228px 1fr 90px", alignItems: "center", gap: 12, margin: "10px 0" }}>
              <div style={{ fontFamily: sans, fontSize: 12, color: INK }}>{lab}<div style={{ color: MUT, fontSize: 10.5 }}>{sub}</div></div>
              <div style={{ background: "#f0ede7", height: 28, borderRadius: 2, overflow: "hidden" }}><div style={{ width: `${w}%`, height: "100%", background: color }} /></div>
              <div style={{ textAlign: "right", fontFamily: sans, fontSize: 15, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: hi ? ORANGE : INK }}>{val}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: `1px solid ${LINE}`, margin: "14px 0 6px" }}>
          <div style={{ padding: "16px 18px", borderRight: `1px solid ${LINE}`, background: "#fffaf3" }}>
            <div style={{ fontFamily: sans, fontSize: 11, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: MUT }}>What you have</div>
            <div style={{ fontFamily: serif, fontSize: 32, fontWeight: 700, color: ORANGE, marginTop: 6, lineHeight: 1 }}>{money(RISK_ADJ)}</div>
            <div style={{ fontSize: 12, color: MUT, marginTop: 6, lineHeight: 1.5 }}>Your presented, conservatively-discounted basis — and you&rsquo;re raising the Friends-Family-Seed into it at a {money(POST_MONEY)} post-money.</div>
          </div>
          <div style={{ padding: "16px 18px" }}>
            <div style={{ fontFamily: sans, fontSize: 11, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: MUT }}>What market standard implies</div>
            <div style={{ fontFamily: serif, fontSize: 32, fontWeight: 700, color: INK, marginTop: 6, lineHeight: 1 }}>$1.8B–$2.2B</div>
            <div style={{ fontSize: 12, color: MUT, marginTop: 6, lineHeight: 1.5 }}>Comparable multiples (3.7×–4.5×) on the same estimated run-rate. Your basis is a 4×–5× discount to this; your {money(POST_MONEY)} entry, ~18×–22×.</div>
          </div>
        </div>
        <p style={{ fontSize: 12, color: MUT, marginTop: 12 }}>Est. Year-5 run-rate ≈ $6.3M / platform × 78 ≈ $494M (a five-year ramp reaches a Year-5 run-rate ≈ one-third of its five-year total). Multiples: Constellation ~3.7× EV/Revenue; vertical-SaaS M&amp;A ~4.5× (Aventis Advisors, 2025). Market-multiple scenarios apply third-party comparable multiples to management-estimated revenue and are illustrative context, not projections of R0cketShip performance.</p>
      </Page>

      {/* 6 — COMPS / CASE STUDIES */}
      <Page n="06 / Comparables" title="What the market pays for what we are building" kicker="Case Studies">
        <p style={{ marginTop: 0 }}>Two references frame us. On the <b>structure</b>: Constellation Software and Roper — serial acquirers that redeploy cash and command mid-teens EBITDA multiples. On the <b>verticals</b>: asset-light, IP-and-demand platforms (Six Senses, Mesoblast, Hims &amp; Hers, Invoca).</p>
        <table style={{ width: "100%", borderCollapse: "collapse", margin: "8px 0" }}>
          <tbody>
            {COMPS.map((c) => (
              <tr key={c.name}><td style={{ ...td, width: "34%" }}><b>{c.name}</b></td><td style={td}>{c.stat}<div style={{ color: MUT, fontSize: 11, marginTop: 3 }}>{c.src}</div></td></tr>
            ))}
          </tbody>
        </table>
        <H>The trap we are built to avoid</H>
        <p style={{ margin: 0 }}>Single-vertical, balance-sheet-heavy distributors have been punished — SelectQuote, GoHealth, and eHealth trade near <b>0.1× sales</b>, and Digital Media Solutions filed Chapter 11.<sup>8</sup> R0cketShip is the opposite: <b>asset-light, multi-vertical, IP-owning, royalty-based.</b> We do not carry the risk on our balance sheet; we license the demand and keep the data.</p>
        <p style={{ fontSize: 12, color: MUT, marginTop: 14 }}>8. stockanalysis.com; SEC filings; Bloomberg Law (DMS Ch. 11, 2024). Comparables are illustrative, not projections of R0cketShip performance.</p>
      </Page>

      {/* 6 — STRUCTURE & THE ASK */}
      <Page n="07 / The Ask" title={`${money(RAISE)} for ${(EQUITY * 100).toFixed(0)}% of the holding company`} kicker="Deal Structure">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, margin: "6px 0 20px" }}>
          <Metric v={money(RAISE)} l="Friends-Family-Seed" />
          <Metric v={`${(EQUITY * 100).toFixed(0)}%`} l="Holdco equity" />
          <Metric v={money(POST_MONEY)} l="Post-money" />
        </div>
        <p style={{ marginTop: 0 }}>The Friends-Family-Seed buys <b>{(EQUITY * 100).toFixed(0)}% of R0cketShip Holdings</b> — the entity that sits on top of every operating and service company and owns the IP. Priced at a {money(POST_MONEY)} post-money, entry sits <b>{(RISK_ADJ / POST_MONEY).toFixed(2)}×</b> below the <a href="#valuation-basis" style={{ color: ORANGE, fontWeight: 700, textDecoration: "none" }}>risk-adjusted valuation</a> and <b>{(FULL_EV / POST_MONEY).toFixed(0)}×</b> below the full contract-backed EV — a deliberate discount for the earliest capital.</p>
        <H>How value compounds up into the holdco</H>
        <ul style={{ margin: "0 0 0 18px", padding: 0, lineHeight: 1.6 }}>
          <li>The holding company holds the <b>IP, data, and contracts</b>, and funds the series companies.</li>
          <li>Each <b>series company</b> houses a vertical; each <b>operating company</b> may raise its own capital to acquire and scale — run independently.</li>
          <li>Operating companies pay the holdco <b>royalties, options, shares, commissions, fees, and up-line</b> — perpetual revenue off every deal.</li>
          <li>Data is retained 100% and can be repurposed into new opportunities at any time.</li>
        </ul>
        <H>Use of proceeds</H>
        <p style={{ margin: 0 }}>Form the holding entity; activate the seven signed contracts (revenue-positive target: 90 days); operate the five live platforms; and launch the roll-out — 26 platforms in Year 1, 52 in Year 2. Additional platform-level capital is raised at each launch, at higher marks, as scale opportunities are matched to operators.</p>
      </Page>

      {/* 7 — FRIENDS & FAMILY NOTE */}
      <Page n="08 / Friends-Family-Seed" title="Friends-Family-Seed — $5,000,000" kicker="One-Page Term Sheet">
        <table style={{ width: "100%", borderCollapse: "collapse", margin: "4px 0 16px" }}>
          <tbody>
            {[
              ["Instrument", "Direct equity in R0cketShip Holdings (Friends-Family-Seed)"],
              ["Round size", "$5,000,000"],
              ["Equity", "5% of R0cketShip Holdings"],
              ["Post-money valuation", "$100,000,000"],
              ["Basis", "A 4.44× discount to the $444M risk-adjusted, contract-backed valuation; ~15× below the full enterprise value"],
              ["Position", "Equity in the holding company — above every operating & service company; the entity that owns the IP, data, and contracts"],
              ["Participation", "Perpetual pro-rata participation in the royalties, fees, commissions, and profit that roll up into the holdco"],
            ].map(([k, v]) => (
              <tr key={k}><td style={{ ...td, width: "30%", fontWeight: 700, verticalAlign: "top" }}>{k}</td><td style={td}>{v}</td></tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: 0 }}>In plain terms: <b>$5,000,000 buys 5% of R0cketShip Holdings</b> at a <b>$100M post-money</b> — the entity that owns the IP and the profit and sits on top of everything. Early capital enters at a <b>4.44× discount</b> to the $444M <a href="#valuation-basis" style={{ color: ORANGE, fontWeight: 700, textDecoration: "none" }}>risk-adjusted valuation</a>, with perpetual participation in the economics of every platform the holding company launches.</p>
        <div style={{ border: `1px solid ${LINE}`, padding: "14px 16px", marginTop: 8, fontFamily: sans, fontSize: 12, color: MUT }}>This term sheet is a summary for discussion only, is non-binding, and does not constitute an offer to sell or a solicitation to buy securities. Any investment will be made solely under definitive executed documents and is available only to accredited investors.</div>
      </Page>

      {/* 8 — ROLL-OUT */}
      <Page n="09 / Plan" title="Signed today; 78 platforms over 24 months" kicker="Execution">
        <table style={{ width: "100%", borderCollapse: "collapse", margin: "4px 0" }}>
          <thead><tr><th style={th}>Horizon</th><th style={th}>Milestone</th></tr></thead>
          <tbody>
            {[
              ["Day 0–90", "Form holdco; activate 7 signed contracts; 5 live MVPs revenue-positive."],
              ["Year 1", "Launch 26 platforms; build the remaining MVPs from the 50-platform pipeline; each launch raises platform-level capital at higher marks."],
              ["Months 12–18", "Complete pipeline build-out; match operators + revenue to scale opportunities; royalties and fees compounding into the holdco."],
              ["Year 2", "Launch 52 platforms; position for Series A as contract revenue matures across verticals."],
            ].map(([k, v]) => (
              <tr key={k}><td style={{ ...td, width: "22%", fontWeight: 700 }}>{k}</td><td style={td}>{v}</td></tr>
            ))}
          </tbody>
        </table>
        <p>Every new platform launch is a fresh funding opportunity at a higher valuation, and a new stream of royalties, fees, and income into the holding company. The build cost is largely behind us — incremental launches match <em>operators and revenue</em> to platforms that already exist.</p>
      </Page>

      {/* 9 — WHY US */}
      <Page n="10 / Edge" title="Proprietary technology, owned demand, retained data" kicker="Competitive Moat">
        <ul style={{ margin: "0 0 0 18px", padding: 0, lineHeight: 1.66 }}>
          <li><b>Private-cloud OS (Quuik).</b> A private GPT, account-and-scale engine, and predictive-data layer that every network business runs on — a rising tide that lifts all boats and compounds as members join.</li>
          <li><b>PredictiveData identity engine.</b> First-party visitor identification and enrichment across the entire network — owned, not rented.</li>
          <li><b>Pay-per-call demand (KeywordCalls).</b> Higher-intent inventory than clicks, monetized against a $265B ad market.</li>
          <li><b>Contracts, not concepts.</b> Seven executed agreements with public companies and a global biotech — perpetual royalties, not pilots.</li>
          <li><b>The roll-up flywheel.</b> Each vertical we enter feeds demand, data, and cash back to the holding company to fund the next.</li>
        </ul>
        <p style={{ marginTop: 18 }}>Our brand promise across every industry is the same: <b>increase profitability by increasing demand and reducing cost and risk</b> — one industry at a time, because every industry is a geek away from being uberized.</p>
      </Page>

      {/* 10 — DISCLOSURES */}
      <Page n="11 / Disclosures" title="Important disclosures" kicker="Legal">
        <p style={{ marginTop: 0, fontSize: 13, color: "#333" }}>This memorandum is confidential and is furnished solely to accredited investors for informational and discussion purposes. It does not constitute an offer to sell, or a solicitation of an offer to buy, any security, and is not a recommendation or investment advice. Any offering will be made only to accredited investors (as defined in Rule 501 of Regulation D) pursuant to definitive documents.</p>
        <p style={{ fontSize: 13, color: "#333" }}>All financial figures relating to R0cketShip Holdings are <b>management estimates and forward-looking projections</b> based on signed-contract unit economics and internal assumptions. Actual results may differ materially. Projections are not guarantees. The 70% seed discount is a management-applied risk adjustment, not a <a href="#valuation-basis" style={{ color: ORANGE, fontWeight: 800, fontSize: "1.14em", textDecoration: "none" }}>market standard</a> — see the Valuation Basis comparison (p.05).</p>
        <p style={{ fontSize: 13, color: "#333" }}>Comparable-company and market figures are drawn from third-party sources believed reliable (as cited) and are provided for context only; they are not projections of R0cketShip performance and were current as of the sources&rsquo; stated dates. Market caps and multiples fluctuate. Past performance and comparable outcomes do not indicate future results. Recipients should conduct their own diligence and consult their own legal, tax, and financial advisors.</p>
        <div style={{ marginTop: 26, borderTop: `1px solid ${LINE}`, paddingTop: 14, fontFamily: sans, fontSize: 11.5, color: MUT }}>R0cketShip Holdings · Confidential · Do not distribute · Prepared for accredited-investor review.</div>
      </Page>
    </div>
  );
}
