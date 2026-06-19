import { Card, Stat, Badge, Section, Stars, AIButton } from "@/components/ui";
import Gauge from "@/components/Gauge";
import { db } from "@/lib/db";
import { getSettings, pickWinner, type BidLike } from "@/lib/logic";
import { usd, usd2, num } from "@/lib/format";

const SEAT_FEE_CENTS = 9900;
const SCOPE_LABEL: Record<string, string> = { zip: "ZIP", city: "City", state: "State", national: "National" };

// Representative ZIPs that have seeded bids — the live auction is rendered per ZIP.
const FEATURED_ZIPS: { zip: string; state: string }[] = [
  { zip: "33101", state: "FL" },
  { zip: "85001", state: "AZ" },
  { zip: "30301", state: "GA" },
  { zip: "10001", state: "NY" },
];

export default async function AgentsPage() {
  const { minCallBidCents } = await getSettings();
  const minDollars = Math.round(minCallBidCents / 100);

  const [activeAgents, activeBids, activeSeatCount, allBids, seats] = await Promise.all([
    db.user.count({ where: { role: "agent" } }),
    db.agentBid.findMany({ where: { active: true } }),
    db.agentSeat.count({ where: { active: true } }),
    db.agentBid.findMany({ where: { active: true }, include: { agent: true } }),
    db.agentSeat.findMany({ include: { agent: true }, orderBy: { createdAt: "desc" } }),
  ]);

  const avgBidCents = activeBids.length
    ? Math.round(activeBids.reduce((s, b) => s + b.amountCents, 0) / activeBids.length)
    : 0;
  const seatsRevenueCents = activeSeatCount * SEAT_FEE_CENTS;

  // Build per-ZIP auctions: each ZIP's eligible bids (zip-scoped match + state + national).
  const auctions = FEATURED_ZIPS.map(({ zip, state }) => {
    const eligible = allBids.filter(
      (b) =>
        (b.scope === "zip" && b.scopeValue === zip) ||
        (b.scope === "state" && b.scopeValue === state) ||
        b.scope === "national"
    );
    const pool: (BidLike & { id: string; name: string })[] = eligible.map((b) => ({
      id: b.id,
      agentId: b.agentId,
      name: b.agent.name || b.agent.email,
      amountCents: b.amountCents,
      stars: b.agent.stars,
      active: b.active,
      dailyCap: b.dailyCap,
      scope: b.scope,
      scopeValue: b.scopeValue,
    }));
    const winner = pickWinner(pool, { zip, state }) as (BidLike & { id: string }) | null;
    const sorted = [...pool].sort((a, b) => b.amountCents - a.amountCents || b.stars - a.stars);
    return { zip, state, bids: sorted, winnerId: winner?.id ?? null };
  });

  const gaugeMax = Math.max(60, (avgBidCents / 100) * 1.5);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Agent Bidding</h1>
        <p className="text-sm text-[var(--muted)]">
          Live pay-per-call auction. Agents bid for inbound Medigap calls by ZIP, state, or nationally.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Stat label="Active Agents" value={num(activeAgents)} sub="role = agent" tone="up" />
        <Stat label="Avg Bid / Call" value={avgBidCents ? usd2(avgBidCents) : "—"} sub="across active bids" tone="gold" />
        <Stat label="Seats Sold" value={num(activeSeatCount)} sub={`${usd(seatsRevenueCents)}/mo at ${usd(SEAT_FEE_CENTS)} ea`} />
        <Stat label="Min Call Bid" value={usd2(minCallBidCents)} sub="floor — Setting" tone="down" />
      </div>

      <Section
        title="Live Call Auction"
        desc={`Highest bid wins; ties broken by star rating. ${usd(SEAT_FEE_CENTS)}/mo seat per ZIP required to bid.`}
        action={<AIButton label="Optimize bids" />}
      >
        <div className="grid gap-4">
          {auctions.map((a) => (
            <Card key={a.zip} className="!p-0 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
                <div className="font-semibold">
                  ZIP {a.zip} <span className="text-[var(--muted)] font-normal">· {a.state}</span>
                </div>
                <Badge tone="brand">{a.bids.length} bidder{a.bids.length === 1 ? "" : "s"}</Badge>
              </div>
              {a.bids.length ? (
                <table>
                  <thead>
                    <tr>
                      <th>Agent</th>
                      <th>Rating</th>
                      <th>Scope</th>
                      <th>Target</th>
                      <th className="text-right">Bid / Call</th>
                      <th className="text-right">Daily cap</th>
                      <th>Outcome</th>
                    </tr>
                  </thead>
                  <tbody>
                    {a.bids.map((b) => {
                      const isWinner = b.id === a.winnerId;
                      return (
                        <tr
                          key={b.id}
                          className={isWinner ? "bg-[var(--gold)]/5 border-l-2 border-[var(--gold)]" : ""}
                        >
                          <td className="font-medium">{b.name}</td>
                          <td>
                            <Stars n={b.stars} /> <span className="text-xs text-[var(--muted)]">{b.stars.toFixed(1)}</span>
                          </td>
                          <td><Badge tone="default">{SCOPE_LABEL[b.scope] || b.scope}</Badge></td>
                          <td className="text-[var(--muted)]">{b.scope === "national" ? "US" : b.scopeValue || "—"}</td>
                          <td className="text-right font-medium text-[var(--brand)]">{usd2(b.amountCents)}</td>
                          <td className="text-right text-[var(--muted)]">{b.dailyCap > 0 ? `${b.dailyCap}/day` : "∞"}</td>
                          <td>
                            {isWinner ? (
                              <Badge tone="gold">★ WINS</Badge>
                            ) : (
                              <span className="text-xs text-[var(--muted)]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="px-5 py-4 text-sm text-[var(--muted)]">No active bids for this ZIP.</p>
              )}
            </Card>
          ))}
        </div>
        <p className="text-xs text-[var(--muted)] mt-2">
          Resolved live via <code className="text-[var(--brand)]">pickWinner</code> over the AgentBid table — highest
          active bid in scope wins, ties broken by star rating.
        </p>
      </Section>

      <div className="grid gap-4 lg:grid-cols-3 mb-8">
        <div className="lg:col-span-2">
          <Section title="Seats & Coverage" desc={`${usd(SEAT_FEE_CENTS)}/mo per ZIP grants the right to bid on that territory.`}>
            <Card className="!p-0 overflow-hidden">
              <table>
                <thead>
                  <tr>
                    <th>ZIP</th>
                    <th>Agent</th>
                    <th className="text-right">Seat Fee</th>
                    <th>Paid Through</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {seats.length ? (
                    seats.map((s) => (
                      <tr key={s.id}>
                        <td className="font-medium">{s.zip}</td>
                        <td>{s.agent.name || s.agent.email}</td>
                        <td className="text-right">{usd(s.monthlyFeeCents)}</td>
                        <td className="text-[var(--muted)]">
                          {s.paidThrough ? s.paidThrough.toISOString().slice(0, 10) : "—"}
                        </td>
                        <td>{s.active ? <Badge tone="up">active</Badge> : <Badge tone="down">lapsed</Badge>}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="text-[var(--muted)]">No seats sold yet.</td></tr>
                  )}
                </tbody>
              </table>
            </Card>
          </Section>
        </div>
        <Section title="Avg $/Call vs Floor" desc="Auction price health against the min bid.">
          <Gauge
            value={Number((avgBidCents / 100).toFixed(2))}
            max={gaugeMax}
            label={`Avg $/Call (floor $${minDollars})`}
            unit="$"
          />
        </Section>
      </div>
    </>
  );
}
