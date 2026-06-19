import { Card, Section, Badge } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { pnl, getSettings } from "@/lib/logic";
import { usd, num, TOLLFREE } from "@/lib/format";
import PitchDeck, { type Slide } from "@/components/PitchDeck";

export default async function InvestorPitchPage() {
  // Gated by the /investor layout already — getSession is for personalization only.
  const [session, p, settings, leadCount, callCount] = await Promise.all([
    getSession(),
    pnl(),
    getSettings(),
    db.lead.count(),
    db.call.count(),
  ]);

  const roiX = p.roi || 0; // revenue ÷ spend, live from the ledger
  const profit = p.profit;
  const avgCallValue = callCount > 0 ? Math.round(p.revenue / callCount) : settings.minCallBidCents;
  const cpl = leadCount > 0 ? Math.round(p.spend / leadCount) : 0;
  const target = settings.arbitrageTarget;

  const firstName = session?.email?.split("@")[0]?.split(".")[0];
  const greeting = firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : "Investor";

  const slides: Slide[] = [
    {
      kicker: "medigap.plus",
      title: "The AI-run marketing network for the 65+ economy.",
      body:
        "One autonomous backend powering dozens of senior-insurance sites — turning paid demand into live phone calls to licensed agents, profitably, at scale.",
      stats: [
        { label: "Live network ROI", value: `${roiX.toFixed(1)}x` },
        { label: "Inbound number", value: TOLLFREE },
        { label: "Net profit (to date)", value: usd(profit) },
      ],
    },
    {
      kicker: "The Problem",
      title: "A massive market that's still fragmented and offline.",
      body:
        "Over 11,000 Americans age into Medicare every single day. They're high-intent and ready to buy — but reached by thousands of disconnected agents, dated direct-mail, and TV spots with no feedback loop. Demand is huge; the funnel is broken.",
      bullets: [
        "65+ is the fastest-growing, highest-LTV consumer segment.",
        "Medigap & Medicare Advantage are bought by phone, not web checkout.",
        "Lead buyers overpay for stale, multi-sold leads.",
        "No one operates the demand and the conversion as one system.",
      ],
    },
    {
      kicker: "The Solution",
      title: "One backend. Many sites. Every call routed to 1-800-MEDIGAP.",
      body:
        "We run the ads, own the sites, and route each inbound caller through a real-time auction to the agent who values them most — billing per call. The same AI optimizes creative, bids, and budgets across the whole network.",
      bullets: [
        "Network of conversion-optimized senior-insurance sites.",
        "Real-time call auction: highest bid wins, ties broken by rating.",
        "AI-generated creative + automatic A/B testing.",
        `Single tracked number: ${TOLLFREE}.`,
      ],
    },
    {
      kicker: "Traction",
      title: "Built on a proven, multi-million-dollar call business.",
      body:
        "We're repurposing an existing operation — not starting cold. Last year the underlying business drove roughly 36,000 inbound calls and 100,000 leads. medigap.plus productizes that engine into an autonomous, investable network.",
      stats: [
        { label: "Inbound calls / yr", value: "36,000" },
        { label: "Leads / yr", value: "100,000" },
        { label: "Calls billed (live)", value: num(callCount) },
      ],
    },
    {
      kicker: "Business Model",
      title: "We get paid every time the phone rings.",
      body:
        "Primary revenue is pay-per-call with a hard floor of $25+ per qualified call. We layer in CPC ad arbitrage, premium 'money word' placements, and post-call upsells — all governed by an autonomous risk engine.",
      bullets: [
        `Pay-per-call, ${usd(settings.minCallBidCents)} floor, auction-priced above it.`,
        "CPC ad arbitrage across Google, Meta, and TV.",
        "'Money word' premium placement marketplace.",
        "Post-call upsells (dental, vision, RX) + autonomous risk limits.",
      ],
    },
    {
      kicker: "The Thesis",
      title: "Put $1 in. Get ~$3 out.",
      body:
        `Every dollar of ad spend is run through the auction until it clears our arbitrage target of ${target.toFixed(1)}x. ` +
        `Across the live network today, the ledger is converting spend into revenue at ${roiX.toFixed(1)}x — real, measured, and compounding as the AI learns.`,
      stats: [
        { label: "Arbitrage target", value: `${target.toFixed(1)}x` },
        { label: "Live network ROI", value: `${roiX.toFixed(1)}x` },
        { label: "Ad spend deployed", value: usd(p.spend) },
      ],
    },
    {
      kicker: "Unit Economics",
      title: "Healthy margins on every call.",
      body:
        "Each billed call is worth far more than it costs to source. As volume grows, the AI compresses cost-per-lead while holding call value — widening the spread on every incremental dollar.",
      stats: [
        { label: "Avg. call value", value: usd(avgCallValue) },
        { label: "Cost per lead", value: cpl > 0 ? usd(cpl) : "—" },
        { label: "Net profit", value: usd(profit) },
      ],
    },
    {
      kicker: "Why Now",
      title: "AI just made this operable by a small team.",
      body:
        "Generative AI now writes, tests, and optimizes creative and bids autonomously — collapsing the headcount a network like this used to need. Layer that on Medicare's Annual Enrollment seasonality (Oct–Dec) and the timing is ideal.",
      bullets: [
        "AI runs creative, bidding, and budget pacing end-to-end.",
        "Medicare AEP creates a predictable demand surge each Q4.",
        "Aging demographics expand the market every single day.",
        "Incumbents are slow, manual, and un-instrumented.",
      ],
    },
    {
      kicker: "The Ask",
      title: "We're raising a founder / seed round.",
      body:
        "Capital deploys directly into the arbitrage pool as next-money-in-line, earning a 50% profit share. Use of funds: scale ad spend on proven-positive channels, expand the site network, and harden the autonomous engine.",
      bullets: [
        "Deploys into the live arbitrage pool, not burn.",
        "Investors receive a 50% profit share.",
        "Use of funds: ad spend, network expansion, AI hardening.",
        `${settings.investorPct}% of this round currently open.`,
      ],
    },
    {
      kicker: "Team & Vision",
      title: "An operator-built engine, now autonomous.",
      body:
        "Built by operators who already ran the underlying multi-million-dollar call business — now codified into software that runs itself. The vision: the default AI-run marketing network for every regulated, phone-driven senior vertical, starting with Medigap.",
      stats: [
        { label: "Net profit (to date)", value: usd(profit) },
        { label: "Live ROI", value: `${roiX.toFixed(1)}x` },
        { label: "Inbound number", value: TOLLFREE },
      ],
    },
  ];

  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Investor Pitch</h1>
          <p className="text-sm text-[var(--muted)]">
            Welcome, {greeting}. Live proof metrics — pulled straight from the network ledger.
          </p>
        </div>
        <Badge tone="up">Live ROI {roiX.toFixed(1)}x</Badge>
      </div>

      <PitchDeck slides={slides} />

      <Section title="Executive Summary" desc="The one-pager — for forwarding after the deck.">
        <Card glow>
          <div className="space-y-4 text-sm leading-relaxed text-[var(--muted)] max-w-4xl">
            <p>
              <span className="text-[var(--text)] font-semibold">medigap.plus</span> is an autonomous marketing network
              for the 65+ insurance economy. We operate a portfolio of conversion-optimized senior-insurance websites,
              drive paid demand across Google, Meta, and TV, and route every inbound caller through a real-time auction to
              the licensed agent who values them most — all funneling to{" "}
              <span className="text-[var(--text)] font-semibold">{TOLLFREE}</span>. We are paid per call, with a hard floor
              of <span className="text-[var(--text)] font-semibold">{usd(settings.minCallBidCents)}</span> and auction
              pricing above it.
            </p>
            <p>
              The business is a productization of a proven, multi-million-dollar call operation that generated roughly{" "}
              <span className="text-[var(--text)] font-semibold">36,000 inbound calls</span> and{" "}
              <span className="text-[var(--text)] font-semibold">100,000 leads</span> last year. We have re-platformed that
              engine onto a single AI-run backend that writes creative, runs A/B tests, prices calls, and paces budgets
              autonomously.
            </p>
            <p>
              The thesis is arbitrage:{" "}
              <span className="text-[var(--text)] font-semibold">$1 of spend in, ~$3 of revenue out{" "}</span>, against
              a target of <span className="text-[var(--text)] font-semibold">{target.toFixed(1)}x</span>. Across the live
              network the ledger currently converts spend to revenue at{" "}
              <span className="text-[var(--brand)] font-semibold">{roiX.toFixed(1)}x</span> on{" "}
              <span className="text-[var(--text)] font-semibold">{usd(p.spend)}</span> deployed, for net profit of{" "}
              <span className="text-[var(--gold)] font-semibold">{usd(profit)}</span> — with an average call value of{" "}
              <span className="text-[var(--text)] font-semibold">{usd(avgCallValue)}</span>.
            </p>
            <p>
              <span className="text-[var(--text)] font-semibold">The ask:</span> a founder / seed round that deploys
              directly into the arbitrage pool as next-money-in-line, earning a 50% profit share — funding ad-spend scale
              on proven-positive channels, network expansion, and continued hardening of the autonomous engine. Timing is
              ideal: AI has collapsed the operating headcount, and Medicare&apos;s Annual Enrollment Period delivers a
              predictable Q4 demand surge every year.
            </p>
          </div>
          <p className="text-xs text-[var(--muted)] mt-4">
            Proof metrics on this page are computed live from the network ledger and lead/call counts.
          </p>
        </Card>
      </Section>
    </>
  );
}
