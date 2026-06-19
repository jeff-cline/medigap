import { Card, Stat, Section, Badge, Stars } from "@/components/ui";
import CallToggle from "@/components/portal/CallToggle";
import BidForm, { SeatForm } from "@/components/portal/BidForm";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getSettings, pickWinner, type BidLike } from "@/lib/logic";
import { usd, usd2, num } from "@/lib/format";

const SCOPE_LABEL: Record<string, string> = { zip: "ZIP", city: "City", state: "State", national: "National" };

export default async function AgentPortal() {
  const session = await getSession();
  if (!session) {
    return (
      <Card>
        <p className="text-sm text-[var(--muted)]">Sign in as an agent to access the portal.</p>
      </Card>
    );
  }

  const { minCallBidCents } = await getSettings();
  const minDollars = Math.round(minCallBidCents / 100);

  const [agent, myBids, mySeats, myLeads, callsToday] = await Promise.all([
    db.user.findUnique({ where: { id: session.uid } }),
    db.agentBid.findMany({ where: { agentId: session.uid }, orderBy: { createdAt: "desc" } }),
    db.agentSeat.findMany({ where: { agentId: session.uid }, orderBy: { createdAt: "desc" } }),
    db.lead.findMany({ where: { agentId: session.uid }, orderBy: { createdAt: "desc" }, take: 50 }),
    (async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return db.call.count({ where: { bidWinnerId: session.uid, createdAt: { gte: start } } });
    })(),
  ]);

  const stars = agent?.stars ?? 0;
  const activeBids = myBids.filter((b) => b.active);
  const avgBidCents = activeBids.length
    ? Math.round(activeBids.reduce((s, b) => s + b.amountCents, 0) / activeBids.length)
    : 0;
  const activeSeats = mySeats.filter((s) => s.active).length;

  // "Am I winning?" — for each of my active bids, load all competing active bids in scope and resolve.
  const winningBidIds = new Set<string>();
  for (const mine of activeBids) {
    if (mine.scope === "national") continue; // skip national resolution (no single target)
    const ctx = mine.scope === "state" ? { state: mine.scopeValue } : { zip: mine.scopeValue };
    const competitors = await db.agentBid.findMany({
      where: { active: true, OR: [{ scope: mine.scope, scopeValue: mine.scopeValue }, { scope: "national" }] },
      include: { agent: true },
    });
    const pool: (BidLike & { id: string })[] = competitors.map((b) => ({
      id: b.id,
      agentId: b.agentId,
      amountCents: b.amountCents,
      stars: b.agent.stars,
      active: b.active,
      dailyCap: b.dailyCap,
      scope: b.scope,
      scopeValue: b.scopeValue,
    }));
    const winner = pickWinner(pool, ctx);
    if (winner && (winner as BidLike & { id: string }).id === mine.id) winningBidIds.add(mine.id);
  }

  const hasNothing = myBids.length === 0 && mySeats.length === 0;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Agent Portal</h1>
        <p className="text-sm text-[var(--muted)]">
          {agent?.name || agent?.email} · bid for live calls, manage your seats, and work your CRM.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat label="My Calls Today" value={num(callsToday)} sub="won via auction" tone="up" />
        <Stat label="Avg $/Call" value={avgBidCents ? usd2(avgBidCents) : "—"} sub="across active bids" tone="gold" />
        <Stat label="Star Rating" value={stars.toFixed(1)} sub="routing priority" />
        <Stat label="Active Seats" value={num(activeSeats)} sub={`${usd(9900)}/mo per ZIP`} tone={activeSeats ? "up" : "default"} />
      </div>

      <Section title="Availability" desc="Flip on to enter the live-call auction.">
        <div className="grid gap-4 md:grid-cols-2 items-stretch">
          <CallToggle initialOn={activeBids.length > 0} />
          <Card>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Reputation</span>
              <span className="flex items-center gap-2">
                <Stars n={stars} />
                <span className="text-xs text-[var(--muted)]">{stars.toFixed(1)}</span>
              </span>
            </div>
            <p className="text-sm text-[var(--muted)] mt-2">
              Higher stars win call ties at equal bids and unlock premium ZIP scopes.
            </p>
          </Card>
        </div>
      </Section>

      {hasNothing && (
        <Section title="Get started" desc="You have no bids or seats yet. Buy a seat, then place your first bid below.">
          <Card>
            <p className="text-sm text-[var(--muted)]">
              A <span className="font-semibold text-[var(--text)]">{usd(9900)}/mo seat</span> per ZIP grants the right
              to bid on that territory. Once you have a seat, place a bid (min ${minDollars}/call) — the highest active
              bid in scope wins the next inbound call, with ties broken by your star rating.
            </p>
          </Card>
        </Section>
      )}

      <Section title="My Bids" desc="Pay-per-call auction. Highest active bid in scope wins the next call.">
        {myBids.length ? (
          <Card className="!p-0 overflow-hidden">
            <table>
              <thead>
                <tr>
                  <th>Scope</th>
                  <th>Target</th>
                  <th className="text-right">My bid</th>
                  <th className="text-right">Daily cap</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myBids.map((b) => (
                  <tr key={b.id}>
                    <td><Badge tone="default">{SCOPE_LABEL[b.scope] || b.scope}</Badge></td>
                    <td className="font-medium">{b.scope === "national" ? "United States" : b.scopeValue || "—"}</td>
                    <td className="text-right font-medium text-[var(--brand)]">{usd2(b.amountCents)}</td>
                    <td className="text-right text-[var(--muted)]">{b.dailyCap > 0 ? `${b.dailyCap}/day` : "unlimited"}</td>
                    <td>
                      {!b.active ? (
                        <Badge tone="down">paused</Badge>
                      ) : winningBidIds.has(b.id) ? (
                        <Badge tone="gold">★ winning</Badge>
                      ) : b.scope === "national" ? (
                        <Badge tone="up">live</Badge>
                      ) : (
                        <Badge tone="down">outbid</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : (
          <Card><p className="text-sm text-[var(--muted)]">No bids yet — place your first one below.</p></Card>
        )}
      </Section>

      <Section title="Place a Bid" desc={`Minimum bid is $${minDollars} per call. Highest active bid in scope wins.`}>
        <BidForm minBidCents={minCallBidCents} />
      </Section>

      <Section title="My Seats" desc={`${usd(9900)}/mo per ZIP grants the right to bid on that territory.`}>
        {mySeats.length ? (
          <Card className="!p-0 overflow-hidden mb-4">
            <table>
              <thead>
                <tr>
                  <th>ZIP</th>
                  <th className="text-right">Seat Fee</th>
                  <th>Paid Through</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {mySeats.map((s) => (
                  <tr key={s.id}>
                    <td className="font-medium">{s.zip}</td>
                    <td className="text-right">{usd(s.monthlyFeeCents)}</td>
                    <td className="text-[var(--muted)]">
                      {s.paidThrough ? s.paidThrough.toISOString().slice(0, 10) : "—"}
                    </td>
                    <td>{s.active ? <Badge tone="up">active</Badge> : <Badge tone="down">lapsed</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : (
          <Card className="mb-4"><p className="text-sm text-[var(--muted)]">No seats yet — buy your first ZIP below.</p></Card>
        )}
        <SeatForm />
      </Section>

      <Section title="My Leads CRM" desc="Your assigned contacts. The AI qualification journey stays internal.">
        <Card className="!p-0 overflow-hidden">
          <table>
            <thead>
              <tr><th>Name</th><th>Phone</th><th>Email</th><th>DOB</th><th>ZIP</th></tr>
            </thead>
            <tbody>
              {myLeads.length ? (
                myLeads.map((l) => (
                  <tr key={l.id}>
                    <td className="font-medium">{l.name || "—"}</td>
                    <td>{l.phone || "—"}</td>
                    <td className="text-[var(--muted)]">{l.email || "—"}</td>
                    <td className="text-[var(--muted)]">{l.dob || "—"}</td>
                    <td>{l.zip || "—"}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="text-[var(--muted)]">No assigned leads yet.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
        <p className="text-xs text-[var(--muted)] mt-2">
          Agents see contact details only — the AI qualification journey and appended data stay internal.
        </p>
      </Section>
    </>
  );
}
