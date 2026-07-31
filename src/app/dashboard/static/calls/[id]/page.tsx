import { redirect } from "next/navigation";
import { getSession, isGod } from "@/lib/auth";
import { callerDetail, parseTranscript } from "@/lib/static/caller";
import { usd2 } from "@/lib/format";
import { Card, Section } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function CallerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!isGod(session)) redirect("/dashboard");
  const { id } = await params;
  const data = await callerDetail(id);
  if (!data) return <div className="p-6">Call not found. <a className="text-[var(--gold)]" href="/dashboard/static/calls">← Call Reports</a></div>;
  const { call, lead, answers, otherCalls } = data;
  const turns = parseTranscript(call.transcript);
  const L = "text-xs uppercase text-[var(--muted)]";
  return (
    <div className="space-y-6">
      <Section title={`Caller — ${call.fromNumber}`} action={<a className="text-sm text-[var(--gold)]" href="/dashboard/static/calls">← Call Reports</a>}>
        <Card>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><div className={L}>Money Word</div>{call.moneyWord || "—"}</div>
            <div><div className={L}>How it ended</div>{call.disposition}</div>
            <div><div className={L}>Duration</div>{call.durationSec}s</div>
            <div><div className={L}>Connect</div>{call.connectSec}s</div>
            <div><div className={L}>State</div>{call.state || "—"}</div>
            <div><div className={L}>To #</div><span className="font-mono">{call.toNumber}</span></div>
            <div><div className={L}>Landed</div><span className="font-mono">{call.forwardedTo || "—"}</span></div>
            <div><div className={L}>Billed</div>{call.realized ? usd2(call.priceCents) : "not billed"}</div>
          </div>
        </Card>
      </Section>

      <Section title="AI recording">
        <Card>
          {call.recordingUrl
            ? <audio controls src={call.recordingUrl.endsWith(".mp3") ? call.recordingUrl : `${call.recordingUrl}.mp3`} className="w-full" />
            : <div className="text-sm text-[var(--muted)]">No audio recording captured for this call.</div>}
          <div className="mt-4">
            <div className={L + " mb-1"}>Transcript</div>
            {turns.length === 0 ? <div className="text-sm text-[var(--muted)]">No transcript.</div> : (
              <div className="space-y-1 text-sm">
                {turns.map((t, i) => (
                  <div key={i}><span className={t.role === "bot" ? "text-[var(--gold)]" : "text-[color:#3fb950]"}>{t.role === "bot" ? "AI" : "Caller"}:</span> {t.text}</div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </Section>

      <Section title="Lead / known data">
        <Card>
          {lead ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                <div><div className={L}>Name</div>{lead.name || "—"}</div>
                <div><div className={L}>Phone</div><span className="font-mono">{lead.phone}</span></div>
                <div><div className={L}>Email</div>{lead.email || "—"}</div>
                <div><div className={L}>DOB</div>{lead.dob || "—"}</div>
                <div><div className={L}>State</div>{lead.state || "—"}</div>
                <div><div className={L}>Zip</div>{lead.zip || "—"}</div>
                <div><div className={L}>Source</div>{lead.source}</div>
                <div><div className={L}>Ref</div>{lead.refNum ? `444-${String(lead.refNum).padStart(10, "0")}` : "—"}</div>
              </div>
              <div className={L + " mb-1"}>Answers</div>
              {answers.length === 0 ? <div className="text-sm text-[var(--muted)]">No answers.</div> : (
                <ul className="text-sm space-y-1">{answers.map((a) => <li key={a.id}><b>{a.question}:</b> {a.answer}</li>)}</ul>
              )}
            </>
          ) : <div className="text-sm text-[var(--muted)]">No lead linked to this call.</div>}
        </Card>
      </Section>

      <Section title={`Other Static calls from ${call.fromNumber}`}>
        <Card>
          {otherCalls.length === 0 ? <div className="text-sm text-[var(--muted)]">None.</div> : (
            <ul className="text-sm space-y-1">
              {otherCalls.map((c) => (
                <li key={c.id}><a className="text-[var(--gold)] underline" href={`/dashboard/static/calls/${c.id}`}>{c.createdAt.toLocaleString()}</a> — {c.moneyWord || "—"} · {c.disposition} · {c.connectSec}s connect</li>
              ))}
            </ul>
          )}
        </Card>
      </Section>
    </div>
  );
}
