import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Badge, Section, Stars } from "@/components/ui";
import { AppendedBlock } from "@/components/AppendedData";
import { db } from "@/lib/db";
import { usd, usd2, TOLLFREE } from "@/lib/format";

function mmss(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default async function CallDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const call = await db.call.findUnique({ where: { id }, include: { lead: true } });
  if (!call) notFound();

  const winner = call.bidWinnerId ? await db.user.findUnique({ where: { id: call.bidWinnerId } }) : null;

  const statusTone = call.status === "connected" || call.status === "completed" ? "up" : call.status === "missed" ? "down" : "default";
  const sourceTone = call.source === "house" ? "gold" : call.source === "paid" ? "brand" : "default";

  return (
    <>
      <div className="mb-6">
        <Link href="/dashboard/calls" className="text-sm text-[var(--muted)] hover:text-[var(--brand)]">
          ← Back to Calls
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{call.lead?.name || call.fromNumber || "Inbound call"}</h1>
          <Badge tone={statusTone}>{call.status}</Badge>
          <Badge tone={sourceTone}>{call.source}</Badge>
          {call.moneyWord && <span className="text-[var(--gold)] font-medium">money word: {call.moneyWord}</span>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8 items-start">
        <Section title="Call Metadata">
          <Card>
            <dl className="grid grid-cols-3 gap-y-3 text-sm">
              <dt className="text-[var(--muted)]">From</dt>
              <dd className="col-span-2 font-medium">{call.fromNumber || "—"}</dd>
              <dt className="text-[var(--muted)]">To</dt>
              <dd className="col-span-2 font-medium">{call.toNumber || TOLLFREE}</dd>
              <dt className="text-[var(--muted)]">Zip / State</dt>
              <dd className="col-span-2 font-medium">{[call.zip, call.state].filter(Boolean).join(" · ") || "—"}</dd>
              <dt className="text-[var(--muted)]">Duration</dt>
              <dd className="col-span-2 font-medium">{mmss(call.durationSec)}</dd>
              <dt className="text-[var(--muted)]">Time</dt>
              <dd className="col-span-2 font-medium">{call.createdAt.toISOString().slice(0, 16).replace("T", " ")}</dd>
            </dl>
          </Card>
        </Section>

        <Section title="Auction Result" desc="Winning agent and price paid for this call.">
          <Card glow>
            {winner ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)] text-sm">Winning agent</span>
                  <span className="font-semibold">{winner.name || winner.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)] text-sm">Rating</span>
                  <Stars n={winner.stars} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)] text-sm">Price paid</span>
                  <span className="font-bold text-[var(--brand)] text-xl">{usd2(call.priceCents)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">
                No eligible bidder won this call — it was logged unrouted. {call.priceCents > 0 ? `Price: ${usd(call.priceCents)}` : ""}
              </p>
            )}
          </Card>
        </Section>
      </div>

      {call.lead && (
        <Section title="Linked Lead" desc="The CRM record tied to this caller.">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold">{call.lead.name || "Unnamed lead"}</div>
                <div className="text-sm text-[var(--muted)]">
                  {[call.lead.phone, call.lead.email].filter(Boolean).join(" · ") || "—"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="brand">{call.lead.vertical}</Badge>
                <Badge>{call.lead.status}</Badge>
                <Link href={`/dashboard/leads/${call.lead.id}`} className="btn btn-ghost text-xs !py-1.5 !px-3">
                  Open lead
                </Link>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--border)]/60">
              <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--gold)] mb-2">⊕ Appended Data</div>
              <AppendedBlock raw={call.lead.appended} />
            </div>
          </Card>
        </Section>
      )}

      {call.moneyWord && (
        <Section title="Money-Word Flow" desc="A detected keyword re-routed this call to an alternate monetization path.">
          <Card>
            <p className="text-sm text-[var(--muted)]">
              The caller said <span className="text-[var(--gold)] font-medium">{call.moneyWord}</span>, triggering the
              money-word flow — the call is re-routed to the matched partner (transfer or qualify) before standard agent
              connect. Configure payouts &amp; qualification logic in Money Words.
            </p>
          </Card>
        </Section>
      )}

      <Section title="Transcript" desc="AI transcription of the live call.">
        <Card>
          {call.transcript ? (
            <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">{call.transcript}</pre>
          ) : (
            <p className="text-sm text-[var(--muted)]">Transcript appears here once Twilio+Groq are live.</p>
          )}
        </Card>
      </Section>
    </>
  );
}
