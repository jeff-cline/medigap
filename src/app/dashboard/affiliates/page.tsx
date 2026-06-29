import { db } from "@/lib/db";
import { Stat, Section, Card } from "@/components/ui";
import { usd2, num } from "@/lib/format";
import AffiliateConsole from "@/components/affiliate/AffiliateConsole";
import GoLivePanel from "@/components/affiliate/GoLivePanel";
import ReconciliationLedger from "@/components/affiliate/ReconciliationLedger";
import MoneyWordMap from "@/components/affiliate/MoneyWordMap";
import RawFlowLog from "@/components/affiliate/RawFlowLog";
import { reconciliationSummary, VERTICALS } from "@/lib/affiliate";
import { QS_VERTICALS } from "@/lib/quinstreet";

export const dynamic = "force-dynamic";

export default async function AffiliatesPage() {
  const [affiliates, pingsRaw, recon, moneyWords, soldReal, soldTest, pingedReal, perVertReal] = await Promise.all([
    db.affiliate.findMany({ orderBy: { createdAt: "asc" }, include: { verticals: { orderBy: { label: "asc" } } } }),
    db.affiliatePing.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    reconciliationSummary(),
    db.moneyWord.findMany({ where: { active: true }, orderBy: [{ triggers: "desc" }, { word: "asc" }], take: 300 }),
    db.affiliatePing.aggregate({ where: { status: "sold", isTest: false }, _sum: { soldCents: true }, _count: true }),
    db.affiliatePing.aggregate({ where: { status: "sold", isTest: true }, _sum: { soldCents: true }, _count: true }),
    db.affiliatePing.count({ where: { isTest: false } }),
    db.affiliatePing.groupBy({ by: ["vertical"], where: { status: "sold", isTest: false }, _sum: { soldCents: true }, _count: true }),
  ]);

  // QuinStreet vertical dropdown options for the money-word map.
  const qsVertOpts = QS_VERTICALS.map((k) => ({ value: k, label: VERTICALS.find((v) => v.key === k)?.label || k }));
  const mwRows = moneyWords.map((w) => ({ id: w.id, word: w.word, affiliateVertical: w.affiliateVertical, triggers: w.triggers }));

  // Headline numbers come from the PING LEDGER (the source of truth), split real vs test — so a
  // stage test ping never masquerades as real revenue.
  const realReceived = soldReal._sum.soldCents ?? 0;
  const realMonetized = soldReal._count;
  const testReceived = soldTest._sum.soldCents ?? 0;
  const testMonetized = soldTest._count;
  const liveVerticals = affiliates.filter((a) => a.active).flatMap((a) => a.verticals.filter((v) => v.active)).length;
  const mode = affiliates.find((a) => a.slug === "quinstreet")?.mode ?? "off";

  // Per-vertical REAL sold totals (for the partner console — never includes test rows).
  const realByVert = new Map(perVertReal.map((r) => [r.vertical, { calls: r._count, received: r._sum.soldCents ?? 0 }]));

  const vertOpts = affiliates.flatMap((a) => a.verticals.map((v) => ({ id: v.id, label: `${a.name} · ${v.label}`, affiliateId: a.id })));
  const qsId = affiliates.find((a) => a.slug === "quinstreet")?.id;
  const callIds = [...new Set(pingsRaw.map((p) => p.callId).filter(Boolean) as string[])];
  const pingCalls = callIds.length ? await db.call.findMany({ where: { id: { in: callIds } }, select: { id: true, fromNumber: true, durationSec: true, lead: { select: { name: true } } } }) : [];
  const callInfo = new Map(pingCalls.map((c) => [c.id, { phone: c.fromNumber, name: c.lead?.name || "", durationSec: c.durationSec }]));
  const pings = pingsRaw.map((p) => {
    const ci = p.callId ? callInfo.get(p.callId) : undefined;
    return {
      id: p.id, vertical: p.vertical, status: p.status, offerCents: p.offerCents, soldCents: p.soldCents,
      reportedCents: p.reportedCents, reconciled: p.reconciled, isTest: p.isTest, externalId: p.externalId,
      trackingNumber: p.trackingNumber, moneyWord: p.moneyWord, callId: p.callId, note: p.note, createdAt: p.createdAt.toISOString(),
      qualifySec: p.qualifySec, matchedClient: p.matchedClient, who: p.affiliateId === qsId ? "QS" : "AF",
      phone: ci?.phone || "", callerName: ci?.name || "", callDurationSec: ci?.durationSec ?? null,
    };
  });

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Affiliate Network</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">
          Your monetization backstop. Calls we can&apos;t sell to a premium agent route to the highest-paying
          affiliate bid by vertical — automatically. Toggle any partner or vertical on/off with one click;
          edit a bid to test how the router would route. Every call&apos;s downstream payout lands here.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-2">
        <a href="#rawflow"><Stat label="Received (real)" value={usd2(realReceived)} sub={`${num(realMonetized)} live calls sold →`} tone="up" /></a>
        <a href="#rawflow"><Stat label="Test / stage" value={usd2(testReceived)} sub={`${num(testMonetized)} test pings (not real) →`} tone="gold" /></a>
        <Stat label="Mode" value={mode === "live" ? "🟢 LIVE" : mode === "observe" ? "👁 OBSERVE" : "○ off"} sub={`${num(liveVerticals)} verticals on`} tone="default" />
        <Stat label="Partners" value={num(affiliates.length)} sub="affiliate networks" tone="default" />
      </div>
      <p className="text-[11px] text-[var(--muted)] mb-6">Headline numbers come from the ping ledger, split real vs test. That earlier <b>$20 / 1</b> was a <b>stage test ping</b> on Life — real, but stage money, now under &ldquo;Test / stage.&rdquo; Click any number to jump to the raw log behind it.</p>

      <Section
        title="How routing decides"
        desc="Every inbound call/lead is priced three ways and the highest payer wins."
      >
        <Card>
          <ol className="text-sm space-y-1.5 text-[var(--muted)]">
            <li><b className="text-[var(--text)]">1 · Premium agent</b> — a funded agent/partner who bids the most wins the call (existing live auction).</li>
            <li><b className="text-[var(--text)]">2 · Affiliate backstop</b> — otherwise we ping each active affiliate for this vertical and take the best bid.</li>
            <li><b className="text-[var(--text)]">3 · House default</b> — if nothing beats it, the house floor price.</li>
          </ol>
          <p className="mt-3 text-xs text-[var(--muted)]">
            The engine is live (<code className="text-[var(--brand2)]">bestMonetization()</code>). The affiliate bid is currently the
            editable placeholder below; it switches to a real-time ping the moment QuinStreet&apos;s API docs are wired in.
          </p>
        </Card>
      </Section>

      <Section title="Partners" desc="One-click control of each affiliate network and its verticals.">
        {affiliates.length === 0 ? (
          <Card><p className="text-sm text-[var(--muted)]">No affiliates seeded yet. QuinStreet seeds on the next deploy.</p></Card>
        ) : (
          <div className="space-y-5">
            {affiliates.map((a) => (
              <div key={a.id} className="space-y-3">
                <AffiliateConsole
                  affiliate={{
                    id: a.id, name: a.name, slug: a.slug, active: a.active,
                    verticals: a.verticals.map((v) => ({ id: v.id, vertical: v.vertical, label: v.label, active: v.active, bidCents: v.bidCents, calls: realByVert.get(v.vertical)?.calls ?? 0, revenueCents: realByVert.get(v.vertical)?.received ?? 0 })),
                  }}
                />
                <GoLivePanel
                  affiliate={{
                    id: a.id, name: a.name, baseUrl: a.baseUrl, apiKey: a.apiKey, apiSecret: a.apiSecret, mode: a.mode,
                    verticals: a.verticals.map((v) => ({ id: v.id, label: v.label, vertical: v.vertical, pingUrl: v.pingUrl, postUrl: v.postUrl, quadTag: v.quadTag, trackingNumber: v.trackingNumber, hasEndpoint: !!v.pingUrl })),
                  }}
                />
                {/* Raw flow log — right next to QuinStreet, every ping/post event, click a row for the raw data */}
                <RawFlowLog pings={pings} />
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Money Words → QuinStreet verticals"
        desc="This is where you connect the call flow. A caller says a money word → we ping that vertical. Set Live mode above to also post + bridge winning calls."
      >
        <MoneyWordMap words={mwRows} verticals={qsVertOpts} />
      </Section>

      <Section
        title="Reconciliation — what they owe us vs what we recorded"
        desc="Every ping is logged: the offer, whether we sold it, our recorded price, and what their statement reports. Match them to spot underpayment."
      >
        <div className="grid gap-4 md:grid-cols-4 mb-4">
          <Stat label="We recorded (sold)" value={usd2(recon.weRecorded)} sub={`${num(recon.sold)} sold`} tone="up" />
          <Stat label="They report" value={usd2(recon.theyReport)} sub="from their statements" tone="default" />
          <Stat label="Variance" value={usd2(recon.variance)} sub={recon.variance > 0 ? "they owe us more" : recon.variance < 0 ? "over-reported" : "matched"} tone={recon.variance > 0 ? "down" : "up"} />
          <Stat label="Open (unreconciled)" value={usd2(recon.openUnreconciled)} sub="awaiting their report" tone="gold" />
        </div>
        <ReconciliationLedger pings={pings} verticals={vertOpts} />
      </Section>
    </>
  );
}
