import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Badge, Section, Stat } from "@/components/ui";
import LeadActions from "@/components/LeadActions";
import AppendButton from "@/components/AppendButton";
import CallTranscriptTagger from "@/components/CallTranscriptTagger";
import { db } from "@/lib/db";
import { getSession, isRealGod } from "@/lib/auth";
import { usd, usd2, cst, cstFull, mmss, fmtPhone } from "@/lib/format";
import { ageFromSpeech } from "@/lib/voice";

const sourceTone: Record<string, "default" | "up" | "down" | "gold" | "brand"> = { house: "gold", google: "brand", facebook: "brand", organic: "up", tv: "default", affiliate: "default" };
const statusTone: Record<string, "default" | "up" | "down" | "gold" | "brand"> = { new: "brand", contacted: "default", sold: "up", dead: "down" };
type Turn = { role: "assistant" | "user"; text: string; at?: string };

function parseAppended(raw: string): Record<string, unknown> | null {
  try { const v = JSON.parse(raw || "{}"); if (v && typeof v === "object" && Object.keys(v).length) return v as Record<string, unknown>; } catch {}
  return null;
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const god = isRealGod(session) || session?.role === "god";

  const lead = await db.lead.findUnique({
    where: { id },
    include: { answers: { orderBy: { askedAt: "asc" } }, calls: { orderBy: { createdAt: "desc" } }, agent: true },
  });
  if (!lead) notFound();

  const last10 = lead.phone.replace(/\D/g, "").slice(-10);
  const [agents, texts, moneyWords] = await Promise.all([
    db.user.findMany({ where: { role: "agent" }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    last10 ? db.smsMessage.findMany({ where: { to: { contains: last10 } }, orderBy: { createdAt: "asc" } }) : Promise.resolve([]),
    db.moneyWord.findMany({ select: { id: true, word: true, aliases: true } }),
  ]);
  const mwParsed = moneyWords.map((m) => { let aliases: string[] = []; try { aliases = JSON.parse(m.aliases); } catch {} return { id: m.id, word: m.word, aliases: Array.isArray(aliases) ? aliases : [] }; });

  const appended = parseAppended(lead.appended);
  const age = ageFromSpeech(lead.dob || "");
  const totalCallSec = lead.calls.reduce((s, c) => s + c.durationSec, 0);
  const lastCall = lead.calls[0];

  return (
    <>
      <div className="mb-6">
        <Link href="/dashboard/leads" className="text-sm text-[var(--muted)] hover:text-[var(--brand)]">← Back to Leads</Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{lead.name || "Unnamed lead"}</h1>
          <Badge tone="brand">{lead.vertical}</Badge>
          <Badge tone={sourceTone[lead.source] ?? "default"}>{lead.source}</Badge>
          <Badge tone={statusTone[lead.status] ?? "default"}>{lead.status}</Badge>
          <a href={`tel:${lead.phone}`} className="text-[var(--brand)] font-semibold">{fmtPhone(lead.phone)}</a>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat label="Total Talk Time" value={mmss(totalCallSec)} sub={`${lead.calls.length} call${lead.calls.length === 1 ? "" : "s"}`} tone="gold" />
        <Stat label="Age" value={age ? String(age) : "—"} sub={lead.dob ? `DOB: ${lead.dob}` : "DOB not captured"} tone="default" />
        <Stat label="Last Call" value={lastCall ? mmss(lastCall.durationSec) : "—"} sub={lastCall ? cst(lastCall.createdAt) : "no calls"} tone="up" />
        <Stat label="Texts" value={String(texts.length)} sub="both directions" tone="default" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8 items-start">
        <Section title="Contact">
          <Card>
            <dl className="grid grid-cols-3 gap-y-3 text-sm">
              <dt className="text-[var(--muted)]">Phone</dt><dd className="col-span-2 font-medium"><a href={`tel:${lead.phone}`} className="text-[var(--brand)]">{fmtPhone(lead.phone)}</a></dd>
              <dt className="text-[var(--muted)]">Email</dt><dd className="col-span-2 font-medium">{lead.email || "—"}</dd>
              <dt className="text-[var(--muted)]">DOB / Age</dt><dd className="col-span-2 font-medium">{lead.dob || "—"}{age ? ` · ${age} yrs` : ""}</dd>
              <dt className="text-[var(--muted)]">Location</dt><dd className="col-span-2 font-medium">{[lead.city, lead.state, lead.zip].filter(Boolean).join(", ") || "—"}</dd>
              <dt className="text-[var(--muted)]">Looking for</dt><dd className="col-span-2 font-medium">{appended?.intent ? String(appended.intent) : "—"}</dd>
              <dt className="text-[var(--muted)]">Agent</dt><dd className="col-span-2 font-medium">{lead.agent?.name || "Unassigned"}</dd>
              <dt className="text-[var(--muted)]">Created</dt><dd className="col-span-2 font-medium">{cstFull(lead.createdAt)}</dd>
            </dl>
          </Card>
        </Section>
        <Section title="Manage" desc="Move the lead through the pipeline or assign an agent.">
          <Card><LeadActions leadId={lead.id} status={lead.status} agentId={lead.agentId} agents={agents} /></Card>
        </Section>
      </div>

      {god && lead.calls.some((c) => c.transcript) && (
        <Section title="Call Conversations — God-only" desc="Highlight buy signals (green) and likely money words (gold). Click any word to arm it as a money word.">
          <div className="space-y-4">
            {lead.calls.filter((c) => c.transcript).map((c) => {
              let dialogue: Turn[] = [];
              try { dialogue = JSON.parse(c.transcript || "[]"); } catch {}
              return (
                <Card key={c.id} glow>
                  <div className="flex items-center justify-between mb-3 text-sm">
                    <span className="font-medium">{cst(c.createdAt)} · {mmss(c.durationSec)} · <Badge tone={c.disposition === "default" ? "gold" : "up"}>{c.disposition}</Badge>{c.moneyWord && <span className="ml-2 text-[var(--gold)]">💬 {c.moneyWord}</span>}</span>
                    <Link href={`/dashboard/calls/${c.id}`} className="text-[var(--brand)] text-xs hover:underline">Call detail →</Link>
                  </div>
                  <CallTranscriptTagger turns={dialogue} callId={c.id} moneyWords={mwParsed} detected={(() => { try { return JSON.parse(c.detectedWords || "[]"); } catch { return []; } })()} />
                </Card>
              );
            })}
          </div>
        </Section>
      )}

      <Section title="Calls" desc="Every call tied to this caller — click to drill in.">
        <Card className="!p-0 overflow-hidden">
          <table>
            <thead><tr><th>Time (CT)</th><th className="text-right">Duration</th><th>Status</th><th>Disposition</th><th>Money Word</th><th className="text-right">Price</th><th></th></tr></thead>
            <tbody>
              {lead.calls.map((c) => (
                <tr key={c.id}>
                  <td className="text-[var(--muted)] text-sm">{cst(c.createdAt)}</td>
                  <td className="text-right font-medium">{mmss(c.durationSec)}</td>
                  <td><Badge tone={c.status === "completed" ? "up" : c.status === "missed" || c.status === "failed" ? "down" : "default"}>{c.status}</Badge></td>
                  <td><Badge tone={c.disposition === "default" ? "gold" : "up"}>{c.disposition}</Badge>{!c.realized && <span className="ml-1 text-[10px] text-[var(--gold)]">UNREAL</span>}</td>
                  <td>{c.moneyWord ? <span className="text-[var(--gold)] text-sm">{c.moneyWord}</span> : <span className="text-[var(--muted)]">—</span>}</td>
                  <td className="text-right font-medium text-[var(--brand)]">{c.priceCents > 0 ? usd2(c.priceCents) : "—"}</td>
                  <td className="text-right"><Link href={`/dashboard/calls/${c.id}`} className="text-[var(--brand)] text-sm hover:underline">View</Link></td>
                </tr>
              ))}
              {lead.calls.length === 0 && <tr><td colSpan={7} className="text-center text-[var(--muted)] py-8">No calls recorded for this caller.</td></tr>}
            </tbody>
          </table>
        </Card>
      </Section>

      <Section title="Text Messages" desc="Every SMS to and from this number — for AI training & follow-up.">
        <Card className="!p-0 overflow-hidden">
          <table>
            <thead><tr><th>Time (CT)</th><th>Dir</th><th>Message</th><th>Status</th></tr></thead>
            <tbody>
              {texts.map((m) => (
                <tr key={m.id}>
                  <td className="text-[var(--muted)] text-sm whitespace-nowrap">{cst(m.createdAt)}</td>
                  <td>{m.direction === "inbound" ? "↓ in" : "↑ out"}</td>
                  <td className="text-sm">{m.body}</td>
                  <td><Badge tone={m.status === "sent" || m.status === "delivered" ? "up" : m.status === "received" ? "brand" : "down"}>{m.status}</Badge></td>
                </tr>
              ))}
              {texts.length === 0 && <tr><td colSpan={4} className="text-center text-[var(--muted)] py-6">No texts with this caller yet.</td></tr>}
            </tbody>
          </table>
        </Card>
      </Section>

      <Section title="Appended Data" desc="PredictiveData enrichment + captured intent." action={<AppendButton leadId={lead.id} />}>
        <Card>
          {appended ? (
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {Object.entries(appended).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-[var(--border)]/50 py-1">
                  <dt className="text-[var(--muted)] capitalize">{k.replace(/_/g, " ")}</dt>
                  <dd className="font-medium text-right">{typeof v === "object" ? JSON.stringify(v) : String(v)}</dd>
                </div>
              ))}
            </dl>
          ) : <p className="text-sm text-[var(--muted)]">No append or intent captured yet.</p>}
        </Card>
      </Section>
    </>
  );
}
