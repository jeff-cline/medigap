import { Card, Stat, Badge, Section } from "@/components/ui";
import { db } from "@/lib/db";
import { num, usd } from "@/lib/format";
import { getSetting } from "@/lib/queries";
import ChallengeBox from "@/components/ChallengeBox";

const MODE_DESC: Record<string, string> = {
  off: "Autonomy disabled — every action requires a human.",
  assist: "AI proposes; you approve each action before it runs.",
  learning: "AI acts on low-risk calls and queues high-stakes ones for your decision, learning from each answer.",
  full: "AI executes end-to-end and reports after the fact.",
};

function parseData(raw: string): [string, string][] {
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    return Object.entries(obj).map(([k, v]) => [k, String(v)]);
  } catch {
    return [];
  }
}

export default async function AutonomousPage() {
  const [logs, mode] = await Promise.all([
    db.autonomousLog.findMany({ orderBy: { createdAt: "desc" } }),
    getSetting("autonomousMode", "learning"),
  ]);

  const pinned = logs.filter((l) => l.pinned);
  const past = logs.filter((l) => !l.pinned);

  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const last7d = logs.filter((l) => l.createdAt.getTime() >= weekAgo).length;
  const autoApproved = past.length;
  const awaiting = pinned.length;
  const estProfitImpactCents = 1_284_00; // illustrative aggregate

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Autonomous Logic</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">
          The AI&apos;s decision log. Mode is set by the <code className="text-[var(--brand)]">autonomousMode</code> setting
          (off / assist / learning / full). Currently <Badge tone="gold">{mode}</Badge> — {MODE_DESC[mode] ?? MODE_DESC.learning}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Stat label="Decisions (7d)" value={num(last7d)} sub="logged actions" tone="up" />
        <Stat label="Auto-approved" value={num(autoApproved)} sub="ran without you" tone="gold" />
        <Stat label="Awaiting You" value={num(awaiting)} sub="needs decision" tone={awaiting > 0 ? "down" : "default"} />
        <Stat label="Est. Profit Impact" value={usd(estProfitImpactCents)} sub="from AI decisions" tone="gold" />
      </div>

      {pinned.length > 0 && (
        <Section title="Needs your decision" desc="High-stakes calls the AI escalated to you.">
          <div className="space-y-4">
            {pinned.map((l) => (
              <div key={l.id} className="card glow p-5 border-[var(--gold)]/50 !border">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="text-sm font-semibold text-[var(--gold)]">{l.decision}</div>
                  <span className="text-xs text-[var(--muted)]">{l.createdAt.toISOString().slice(0, 16).replace("T", " ")}</span>
                </div>
                {l.rationale && <p className="text-sm text-[var(--muted)] mb-3">{l.rationale}</p>}
                <div className="flex flex-wrap gap-2 mb-3">
                  {parseData(l.data).map(([k, v]) => (
                    <Badge key={k} tone="default">{k}: {v}</Badge>
                  ))}
                </div>
                <ChallengeBox question={l.question ?? "Approve this decision?"} />
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Decision Timeline" desc="Past autonomous decisions — newest first.">
        <Card>
          <ol className="space-y-4">
            {past.map((l) => (
              <li key={l.id} className="relative pl-5 border-l-2 border-[var(--brand)]/30">
                <span className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-[var(--brand)]" />
                <div className="flex items-start justify-between gap-4">
                  <div className="text-sm font-medium">{l.decision}</div>
                  <span className="text-xs text-[var(--muted)] shrink-0">{l.createdAt.toISOString().slice(0, 16).replace("T", " ")}</span>
                </div>
                {l.rationale && <p className="text-sm text-[var(--muted)] mt-1">{l.rationale}</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  {parseData(l.data).map(([k, v]) => (
                    <Badge key={k} tone="brand">{k}: {v}</Badge>
                  ))}
                </div>
              </li>
            ))}
            {past.length === 0 && <li className="text-sm text-[var(--muted)]">No past decisions logged yet.</li>}
          </ol>
        </Card>
        <p className="text-xs text-[var(--muted)] mt-2">Wired next: streaming decision feed + per-decision profit attribution.</p>
      </Section>
    </>
  );
}
