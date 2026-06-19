import { Card, Stat, Badge, Section, Stars, AIButton } from "@/components/ui";
import Gauge from "@/components/Gauge";
import { db } from "@/lib/db";
import { usd, usd2, num } from "@/lib/format";

type SampleBid = {
  agent: string;
  stars: number;
  scope: "zip" | "city" | "state" | "national";
  scopeValue: string;
  bidCents: number;
  active: boolean;
};

export default async function AgentsPage() {
  const activeAgents = await db.user.count({ where: { role: "agent" } });
  const minBidSetting = await db.setting.findUnique({ where: { key: "minCallBidCents" } });
  const minBidCents = minBidSetting ? parseInt(minBidSetting.value) : 2500;

  // AgentBid table is EMPTY — render realistic sample auction.
  const bids: SampleBid[] = [
    { agent: "Sarah Mitchell", stars: 4.5, scope: "zip", scopeValue: "85016", bidCents: 4200, active: true },
    { agent: "David Cohen", stars: 4.8, scope: "zip", scopeValue: "85016", bidCents: 4200, active: true },
    { agent: "Maria Lopez", stars: 4.2, scope: "zip", scopeValue: "85016", bidCents: 3800, active: true },
    { agent: "James Wright", stars: 3.9, scope: "city", scopeValue: "Phoenix", bidCents: 3100, active: false },
    { agent: "Priya Nair", stars: 4.6, scope: "state", scopeValue: "AZ", bidCents: 2900, active: true },
  ];

  // Determine winner for the 85016 ZIP: highest bid, ties broken by stars.
  const zipPool = bids.filter((b) => b.scopeValue === "85016" && b.active);
  const winner = [...zipPool].sort((a, b) => b.bidCents - a.bidCents || b.stars - a.stars)[0];

  const avgBidCents = Math.round(bids.reduce((s, b) => s + b.bidCents, 0) / bids.length);
  const seatFeeCents = 9900;
  const seatsSold = 14; // AgentSeat EMPTY — sample

  const seats = [
    { zip: "85016", state: "AZ", agent: "David Cohen", paidThrough: "2026-07-15", active: true },
    { zip: "85254", state: "AZ", agent: "Sarah Mitchell", paidThrough: "2026-07-02", active: true },
    { zip: "10001", state: "NY", agent: "Priya Nair", paidThrough: "2026-06-28", active: true },
    { zip: "33139", state: "FL", agent: "Maria Lopez", paidThrough: "2026-06-22", active: true },
    { zip: "75201", state: "TX", agent: "James Wright", paidThrough: "2026-05-30", active: false },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Agent Bidding</h1>
        <p className="text-sm text-[var(--muted)]">
          Live pay-per-call auction. Agents bid for inbound Medigap calls by ZIP, city, state, or nationally.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Stat label="Active Agents" value={num(activeAgents)} sub="role = agent" tone="up" />
        <Stat label="Avg Bid / Call" value={usd2(avgBidCents)} sub="across active bids" tone="gold" />
        <Stat label="Seats Sold" value={num(seatsSold)} sub={`${usd(seatFeeCents)}/mo per ZIP`} />
        <Stat label="Min Call Bid" value={usd2(minBidCents)} sub="floor — Setting" tone="down" />
      </div>

      <Section
        title="Live Call Auction"
        desc="Highest bid wins; ties broken by star rating. $99/mo seat per ZIP required to bid."
        action={<AIButton label="Optimize bids" />}
      >
        <Card className="!p-0 overflow-hidden">
          <table>
            <thead>
              <tr>
                <th>Agent</th>
                <th>Rating</th>
                <th>Scope</th>
                <th>Target</th>
                <th className="text-right">Bid / Call</th>
                <th>Status</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {bids.map((b, i) => {
                const isWinner = winner && b.agent === winner.agent && b.scopeValue === winner.scopeValue;
                return (
                  <tr key={i}>
                    <td className="font-medium">{b.agent}</td>
                    <td><Stars n={b.stars} /> <span className="text-xs text-[var(--muted)]">{b.stars}</span></td>
                    <td><Badge tone="default">{b.scope}</Badge></td>
                    <td className="text-[var(--muted)]">{b.scopeValue}</td>
                    <td className="text-right font-medium text-[var(--brand)]">{usd2(b.bidCents)}</td>
                    <td>{b.active ? <Badge tone="up">live</Badge> : <Badge tone="down">paused</Badge>}</td>
                    <td>{isWinner ? <Badge tone="gold">★ wins ZIP 85016</Badge> : <span className="text-xs text-[var(--muted)]">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
        <p className="text-xs text-[var(--muted)] mt-2">Wired next: AgentBid table → live auction resolver per inbound call.</p>
      </Section>

      <div className="grid gap-4 lg:grid-cols-3 mb-8">
        <div className="lg:col-span-2">
          <Section title="Seats & Coverage" desc="$99/mo per ZIP grants the right to bid on that territory.">
            <Card className="!p-0 overflow-hidden">
              <table>
                <thead>
                  <tr>
                    <th>ZIP</th>
                    <th>State</th>
                    <th>Agent</th>
                    <th className="text-right">Seat Fee</th>
                    <th>Paid Through</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {seats.map((s) => (
                    <tr key={s.zip}>
                      <td className="font-medium">{s.zip}</td>
                      <td className="text-[var(--muted)]">{s.state}</td>
                      <td>{s.agent}</td>
                      <td className="text-right">{usd(seatFeeCents)}</td>
                      <td className="text-[var(--muted)]">{s.paidThrough}</td>
                      <td>{s.active ? <Badge tone="up">active</Badge> : <Badge tone="down">lapsed</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <p className="text-xs text-[var(--muted)] mt-2">Wired next: AgentSeat table → Stripe subscription per ZIP.</p>
          </Section>
        </div>
        <Section title="Avg $/Call vs Floor" desc="Auction price health against the min bid.">
          <Gauge value={Number((avgBidCents / 100).toFixed(2))} max={Math.max(60, (avgBidCents / 100) * 1.5)} label={`Avg $/Call (floor $${(minBidCents / 100).toFixed(0)})`} unit="$" />
        </Section>
      </div>
    </>
  );
}
