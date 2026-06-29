import Link from "next/link";
import { db } from "@/lib/db";
import { Card, Stat, Section, Badge } from "@/components/ui";
import { usd2, num, fmtPhone } from "@/lib/format";
import RawFlowLog from "@/components/affiliate/RawFlowLog";
import PingTreeControls from "@/components/affiliate/PingTreeControls";
import { resolveAffiliateVertical, verticalLabel } from "@/lib/affiliate";

export const dynamic = "force-dynamic";

export default async function PingTreePage() {
  const aff = await db.affiliate.findFirst({ where: { slug: "quinstreet" }, include: { verticals: true } });
  if (!aff) return <Card><p className="text-sm text-[var(--muted)]">QuinStreet not seeded yet.</p></Card>;

  const [pingsRaw, soldAgg, recentCalls] = await Promise.all([
    db.affiliatePing.findMany({ orderBy: { createdAt: "desc" }, take: 150 }),
    db.affiliatePing.aggregate({ where: { status: "sold", isTest: false }, _sum: { soldCents: true }, _count: true }),
    db.call.findMany({ orderBy: { createdAt: "desc" }, take: 25, include: { lead: true } }),
  ]);

  // Join each ping to its call (phone / caller name / how long the call lasted = buffer clearing).
  const callIds = [...new Set(pingsRaw.map((p) => p.callId).filter(Boolean) as string[])];
  const pingCalls = callIds.length ? await db.call.findMany({ where: { id: { in: callIds } }, select: { id: true, fromNumber: true, durationSec: true, lead: { select: { name: true } } } }) : [];
  const callInfo = new Map(pingCalls.map((c) => [c.id, { phone: c.fromNumber, name: c.lead?.name || "", durationSec: c.durationSec }]));
  const code = (affId: string) => (affId === aff.id ? "QS" : "AF");

  const pings = pingsRaw.map((p) => {
    const ci = p.callId ? callInfo.get(p.callId) : undefined;
    return {
      id: p.id, vertical: p.vertical, status: p.status, offerCents: p.offerCents, soldCents: p.soldCents,
      reportedCents: p.reportedCents, reconciled: p.reconciled, isTest: p.isTest, externalId: p.externalId,
      trackingNumber: p.trackingNumber, moneyWord: p.moneyWord, callId: p.callId, note: p.note, createdAt: p.createdAt.toISOString(),
      qualifySec: p.qualifySec, matchedClient: p.matchedClient, who: code(p.affiliateId),
      phone: ci?.phone || "", callerName: ci?.name || "", callDurationSec: ci?.durationSec ?? null,
    };
  });

  // Per-call: did it ping the tree, and if not — why? (the diagnostic that answers "where are my logs")
  const pingByCall = new Map<string, (typeof pingsRaw)[number]>();
  for (const p of pingsRaw) if (p.callId && !pingByCall.has(p.callId)) pingByCall.set(p.callId, p);
  const endpointFor = new Map(aff.verticals.map((v) => [v.vertical, !!v.pingUrl]));

  const callDiag = await Promise.all(recentCalls.map(async (c) => {
    const ping = pingByCall.get(c.id);
    let resolved: string | null = await resolveAffiliateVertical(c.moneyWord);
    if (!resolved && aff.defaultVertical) resolved = aff.defaultVertical;
    let reason = "";
    if (ping) reason = "pinged";
    else if (aff.mode === "off") reason = "mode is OFF — pings disabled";
    else if (!resolved) reason = "no vertical (no word matched, no default set)";
    else if (!endpointFor.get(resolved)) reason = `no endpoint for ${resolved}`;
    else reason = "no ping (call predates ping-tree / not yet processed)";
    return { id: c.id, when: c.createdAt, word: c.moneyWord, resolved, ping, reason, phone: c.fromNumber, leadId: c.leadId, name: c.lead?.name || "", dob: c.lead?.dob || "" };
  }));

  const realSold = soldAgg._sum.soldCents ?? 0;
  const pingedCount = pings.filter((p) => !p.isTest).length;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">🌳 Ping Tree</h1>
          <p className="text-sm text-[var(--muted)] max-w-3xl">
            Every inbound call that resolves a vertical is pinged to QuinStreet&apos;s tree. This page is the live log of
            what was pinged, what came back, and the routing decision — updating as calls come in.
          </p>
        </div>
        <PingTreeControls affiliateId={aff.id} mode={aff.mode} />
      </div>

      {aff.mode === "off" && (
        <Card className="mb-4 border-l-4 border-[var(--gold)]">
          <p className="text-sm"><b className="text-[var(--gold)]">Pings are OFF.</b> Set the mode above to <b>Observe</b> — live calls will then ping QuinStreet and appear below (the call still routes normally). <b>Live</b> also posts &amp; bridges winning calls.</p>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat label="Mode" value={aff.mode === "live" ? "🟢 LIVE" : aff.mode === "observe" ? "👁 OBSERVE" : "○ OFF"} sub={`default vertical: ${aff.defaultVertical ? verticalLabel(aff.defaultVertical) : "none"}`} tone={aff.mode === "off" ? "down" : "up"} />
        <Stat label="Pings logged" value={num(pingedCount)} sub="real call pings" tone="default" />
        <Stat label="Sold to QuinStreet" value={usd2(realSold)} sub={`${num(soldAgg._count)} calls`} tone="up" />
        <Stat label="Verticals wired" value={num(aff.verticals.filter((v) => v.pingUrl).length)} sub="have an endpoint" tone="gold" />
      </div>

      <Section title="The logic — how a call moves through the tree">
        <Card>
          <ol className="text-sm space-y-2">
            <li><b>1 · Call lands</b> → we read the spoken <b>money word</b> (or none).</li>
            <li><b>2 · Resolve vertical</b> → explicit money-word tag, else keyword match, else the <b>default vertical</b> ({aff.defaultVertical ? verticalLabel(aff.defaultVertical) : "none set"}). No vertical → no ping.</li>
            <li><b>3 · PING QuinStreet</b> → their tree returns a <b>commission</b> (bid) + <b>callQualificationDuration</b>, or &ldquo;unable to monetize&rdquo;.</li>
            <li><b>4 · Decide</b> → compare their bid to the winning agent. <span className="text-[var(--muted)]">Observe</span> = log only; <span className="text-[var(--brand)]">Live</span> = if they outbid the agent, <b>POST</b> &amp; bridge the call to their tracking number.</li>
            <li><b>5 · Log</b> → every step lands in the feed below (and on <Link href="/dashboard/calls" className="text-[var(--brand)]">Calls</Link> per call).</li>
          </ol>
        </Card>
      </Section>

      <Section title="Live ping feed" desc="Every ping/post event — click a row for the raw request/response.">
        <RawFlowLog pings={pings} />
      </Section>

      <Section title="Recent calls → did they hit the tree?" desc="The last 25 calls and exactly why each did or didn't ping.">
        <Card className="!p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]">
                <th className="text-left p-3">When</th>
                <th className="text-left p-3">Phone</th>
                <th className="text-left p-3">DOB recorded</th>
                <th className="text-left p-3">Vertical</th>
                <th className="text-left p-3">Pinged?</th>
                <th className="text-left p-3">Result / reason</th>
              </tr>
            </thead>
            <tbody>
              {callDiag.map((d) => {
                const dobOk = /^\d{4}-\d{2}-\d{2}$/.test(d.dob) || /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(d.dob);
                const drill = d.leadId ? `/dashboard/leads/${d.leadId}` : `/dashboard/calls/${d.id}`;
                return (
                <tr key={d.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="p-3 text-[var(--muted)] whitespace-nowrap text-xs">{d.when.toISOString().slice(5, 16).replace("T", " ")}</td>
                  <td className="p-3 whitespace-nowrap">
                    {d.phone ? <Link href={drill} className="text-[var(--brand)] hover:underline">{fmtPhone(d.phone)}</Link> : <span className="text-[var(--muted)]">—</span>}
                  </td>
                  <td className="p-3 text-xs">
                    {d.dob
                      ? <span title={d.name ? `AI recorded for ${d.name}` : "AI recorded"} className={dobOk ? "text-[var(--text)]" : "text-red-400"}>{d.dob}{!dobOk && " ⚠"}</span>
                      : <span className="text-[var(--muted)]">none</span>}
                  </td>
                  <td className="p-3">{d.resolved ? verticalLabel(d.resolved) : <span className="text-[var(--muted)]">—</span>}</td>
                  <td className="p-3">{d.ping ? <Badge tone={d.ping.status === "sold" ? "brand" : d.ping.status === "rejected" ? "down" : "up"}>yes</Badge> : <Badge tone="default">no</Badge>}</td>
                  <td className="p-3 text-xs">
                    {d.ping
                      ? <span className="text-[var(--muted)]"><b className="text-[var(--text)]">{d.ping.status}</b>{d.ping.offerCents > 0 ? ` · bid ${usd2(d.ping.offerCents)}` : ""} · {d.ping.note}</span>
                      : <span className="text-[var(--muted)]">{d.reason}</span>}
                  </td>
                </tr>
                );
              })}
              {callDiag.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-[var(--muted)]">No calls yet.</td></tr>}
            </tbody>
          </table>
        </Card>
      </Section>
    </>
  );
}
