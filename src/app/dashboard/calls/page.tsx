import { Card, Stat, Badge, Section } from "@/components/ui";
import Gauge from "@/components/Gauge";
import { db } from "@/lib/db";
import { usd, usd2, num, pct, TOLLFREE } from "@/lib/format";

function mmss(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default async function CallsPage() {
  const calls = await db.call.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { lead: true },
  });

  const total = calls.length;
  const priceSum = calls.reduce((s, c) => s + c.priceCents, 0);
  const avgValue = total > 0 ? Math.round(priceSum / total) : 0;
  const houseCalls = calls.filter((c) => c.source === "house").length;
  const connected = calls.filter((c) => c.status === "connected" || c.status === "completed").length;
  const connectedRate = total > 0 ? (connected / total) * 100 : 0;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Calls</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">
          The highest-value asset in the network. Every channel pushes inbound to {TOLLFREE}, which routes to the
          winning agent with a live whisper announcing zip, state, and any detected money word before connect.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat label="Total Calls" value={num(total)} sub="last 50 shown" tone="default" />
        <Stat label="Avg Call Value" value={usd2(avgValue)} sub="paid per connected call" tone="gold" />
        <Stat label="House Calls" value={num(houseCalls)} sub="owned, un-auctioned" tone="up" />
        <Stat label="Connected Rate" value={pct(connectedRate)} sub={`${num(connected)} of ${num(total)}`} tone="up" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr] mb-8 items-start">
        <Gauge value={Number((avgValue / 100).toFixed(2))} max={Math.max(50, (avgValue / 100) * 1.5)} label="Avg $/Call" unit="$" />
        <Card>
          <div className="text-sm font-semibold mb-2">Routing — {TOLLFREE}</div>
          <p className="text-sm text-[var(--muted)]">
            Inbound is matched to the live agent auction by zip → city → state → national. The winning agent hears a
            whisper (caller zip/state + money word) and can accept or pass; passes fall to the next bidder. House
            calls bypass the auction and stay in-network.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="brand">Whisper: zip + state + money word</Badge>
            <Badge tone="up">Auction fallthrough</Badge>
            <Badge tone="gold">House priority</Badge>
          </div>
          <p className="text-xs text-[var(--muted)] mt-3">Wired next: Twilio programmable voice — number pool, whisper TwiML, recording &amp; transcription.</p>
        </Card>
      </div>

      <Section title="Recent Calls" desc="Live inbound — newest first.">
        <Card className="!p-0 overflow-hidden">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>From</th>
                <th>Zip / State</th>
                <th className="text-right">Duration</th>
                <th>Status</th>
                <th>Source</th>
                <th>Money Word</th>
                <th className="text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((c) => {
                const statusTone = c.status === "connected" || c.status === "completed" ? "up" : c.status === "missed" ? "down" : "default";
                const sourceTone = c.source === "house" ? "gold" : c.source === "paid" ? "brand" : "default";
                return (
                  <tr key={c.id}>
                    <td className="text-[var(--muted)] text-sm">{c.createdAt.toISOString().slice(5, 16).replace("T", " ")}</td>
                    <td className="font-medium">{c.lead?.name || c.fromNumber || "Unknown"}</td>
                    <td className="text-[var(--muted)]">{[c.zip, c.state].filter(Boolean).join(" · ") || "—"}</td>
                    <td className="text-right">{mmss(c.durationSec)}</td>
                    <td><Badge tone={statusTone}>{c.status}</Badge></td>
                    <td><Badge tone={sourceTone}>{c.source}</Badge></td>
                    <td>{c.moneyWord ? <span className="text-[var(--gold)] text-sm font-medium">{c.moneyWord}</span> : <span className="text-[var(--muted)]">—</span>}</td>
                    <td className="text-right font-medium text-[var(--brand)]">{c.priceCents > 0 ? usd(c.priceCents) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </Section>
    </>
  );
}
