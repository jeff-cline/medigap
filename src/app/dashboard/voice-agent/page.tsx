import { db } from "@/lib/db";
import { getVoiceAgent, getAIProvider, VOICES, ENGINES, estCallCost, getIntake } from "@/lib/voice";
import { Badge, Section, Stat, Card } from "@/components/ui";
import { num, cst } from "@/lib/format";
import VoiceAgentForm from "@/components/VoiceAgentForm";

export const dynamic = "force-dynamic";
type Turn = { role: "assistant" | "user"; text: string };

export default async function VoiceAgentPage() {
  const [agent, ai, recent, answeredCount, engineRows] = await Promise.all([
    getVoiceAgent(),
    getAIProvider(),
    db.call.findMany({ where: { transcript: { not: null } }, orderBy: { createdAt: "desc" }, take: 15, include: { lead: true } }),
    db.call.count({ where: { transcript: { not: null } } }),
    db.integration.findMany({ where: { key: { in: ["xai", "groq"] } } }),
  ]);
  const questions = getIntake(agent);

  // Engine cards: which are connected, est cost/call, rank highest/lowest by cost.
  const cfgHas = (k: string) => { const r = engineRows.find((x) => x.key === k); try { return !!JSON.parse(r?.config || "{}").apiKey; } catch { return false; } };
  const costs = ENGINES.map((e) => estCallCost(e));
  const maxC = Math.max(...costs), minC = Math.min(...costs);
  const engines = ENGINES.map((e) => {
    const costPerCall = estCallCost(e);
    return { id: e.id, label: e.label, model: e.model, tier: e.tier, note: e.note, costPerCall, configured: cfgHas(e.id), rank: (costPerCall === maxC ? "highest" : costPerCall === minC ? "lowest" : "") as "highest" | "lowest" | "" };
  });

  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Train Agent</h1>
          <p className="text-sm text-[var(--muted)]">The AI that answers 1-800-MEDIGAP — set its voice, tone, authentication script, intake, knowledge, and routing. Changes go live on the next call.</p>
        </div>
        <Badge tone={ai ? "up" : "down"}>{ai ? `Brain: ${ENGINES.find((e) => e.id === ai.provider)?.label || ai.provider}${engines.find((e) => e.id === ai.provider)?.rank === "highest" ? " ★" : ""}` : "No AI connected"}</Badge>
      </div>

      <Card className="mb-6 !p-4 text-sm">
        <div className="font-semibold mb-1">How a call flows</div>
        <ol className="text-[var(--muted)] space-y-0.5 list-decimal list-inside">
          <li>Auth greeting → captures <b>first &amp; last name</b></li>
          <li>Asks <b>ZIP</b> → <b>date of birth</b> (reads back the age)</li>
          <li>&ldquo;Okay [name], how can I help?&rdquo; → open AI Q&amp;A in your tone &amp; voice</li>
          <li>Hears a <b>money word</b> → routes to the highest bidder for that keyword by ZIP/age. Sounds like an <b>insurance</b> buyer → &ldquo;we&apos;re a free service&rdquo; → highest-bidding agent, or the default house number.</li>
        </ol>
      </Card>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Stat label="AI Mode" value={agent.active && ai ? "Answering" : "Forwarding"} sub={agent.active && ai ? "AI qualifies, then transfers" : "straight to agent/house"} tone={agent.active && ai ? "up" : "default"} />
        <Stat label="AI-Handled Calls" value={num(answeredCount)} sub="with a transcript" tone="gold" />
        <Stat label="Voice" value={agent.voice.replace("Polly.", "").replace("-Neural", "")} sub="text-to-speech" tone="default" />
      </div>

      <Section title="Configure the agent" desc="Changes are live on the very next call.">
        <VoiceAgentForm
          initial={{ active: agent.active, voice: agent.voice, tone: agent.tone, greeting: agent.greeting, systemPrompt: agent.systemPrompt, questions, forwardWhenDone: agent.forwardWhenDone, maxTurns: agent.maxTurns, engine: agent.engine }}
          voices={VOICES}
          engines={engines}
          aiConnected={!!ai}
        />
      </Section>

      <Section title="Call Transcripts" desc="Exactly what the AI said and what each caller answered — use this to refine the script & knowledge above.">
        {recent.length === 0 ? (
          <div className="card p-6 text-center text-[var(--muted)] text-sm">No AI-handled calls yet. Once xAI Grok is connected and a call comes into 1-800-MEDIGAP, the full conversation appears here.</div>
        ) : (
          <div className="space-y-4">
            {recent.map((c) => {
              let dialogue: Turn[] = [];
              try { dialogue = c.transcript ? JSON.parse(c.transcript) : []; } catch {}
              return (
                <div key={c.id} className="card p-4">
                  <div className="flex items-center justify-between mb-3 text-sm">
                    <span className="font-medium">{c.lead?.name || c.fromNumber || "Caller"} · <span className="text-[var(--muted)]">{[c.zip, c.state].filter(Boolean).join(" ")}</span></span>
                    <span className="text-[var(--muted)] text-xs">{cst(c.createdAt)} · {c.disposition}</span>
                  </div>
                  <div className="space-y-1.5">
                    {dialogue.map((d, i) => (
                      <div key={i} className={`text-sm flex gap-2 ${d.role === "assistant" ? "" : "justify-end"}`}>
                        <span className={`inline-block rounded-2xl px-3 py-1.5 max-w-[80%] ${d.role === "assistant" ? "bg-[var(--panel2)]" : "bg-[var(--brand)]/15 text-[var(--text)]"}`}>
                          <span className="text-[10px] uppercase tracking-wide text-[var(--muted)] block">{d.role === "assistant" ? "🤖 Agent" : "👤 Caller"}</span>
                          {d.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </>
  );
}
