import { Card, Stat, Badge, Section, AIButton } from "@/components/ui";
import CrudForm, { ToggleActive } from "@/components/CrudForm";
import MoneyWordCloud from "@/components/MoneyWordCloud";
import { db } from "@/lib/db";
import { usd2, num } from "@/lib/format";

function parseLogic(raw: string): string[] {
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr.map((x) => String(x));
    return [];
  } catch {
    return [];
  }
}

export default async function MoneyWordsPage() {
  const [words, users] = await Promise.all([
    db.moneyWord.findMany({ orderBy: { payoutCents: "desc" } }),
    db.user.findMany({ where: { role: { not: "consumer" } }, orderBy: { name: "asc" }, select: { id: true, name: true, email: true, role: true, phone: true } }),
  ]);
  const userName = new Map(users.map((u) => [u.id, u.name || u.email]));
  const claimRows = await db.agentBid.findMany({ where: { keyword: { not: "" } }, select: { keyword: true } });
  const claimCount = new Map<string, number>();
  claimRows.forEach((c) => claimCount.set(c.keyword.toLowerCase(), (claimCount.get(c.keyword.toLowerCase()) || 0) + 1));
  const routeOptions = [
    { value: "", label: "— Auction / house default —" },
    ...users.map((u) => ({ value: u.id, label: `${u.name || u.email} (${u.role}${u.phone ? "" : " · no phone!"})` })),
  ];

  const active = words.filter((w) => w.active);
  const activeWords = active.length;
  const avgPayoutCents = words.length ? Math.round(words.reduce((s, w) => s + w.payoutCents, 0) / words.length) : 0;
  const topPayoutCents = words.reduce((m, w) => Math.max(m, w.payoutCents), 0);
  const transferCount = words.filter((w) => w.action === "transfer").length;
  const qualifyCount = words.filter((w) => w.action === "qualify").length;

  const sampleQualify = words.find((w) => w.action === "qualify");
  const sampleSteps = sampleQualify ? parseLogic(sampleQualify.logic) : [];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Money Words</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">
          When the voice AI hears a &ldquo;money word&rdquo; (e.g. <span className="text-[var(--gold)]">peptides</span>)
          mid-call, it re-routes the conversation to an alternate monetization flow — a hot transfer to a partner, or an
          AI-qualify sequence using that partner&apos;s stored logic — without dropping the caller. Each word maps to a
          partner, an action, and a payout.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Stat label="Active Words" value={num(activeWords)} sub={`${num(words.length)} total`} tone="up" />
        <Stat label="Avg Payout" value={usd2(avgPayoutCents)} sub="per routed call" tone="gold" />
        <Stat label="Top Payout" value={usd2(topPayoutCents)} sub="best partner route" tone="gold" />
        <Stat label="Transfer / Qualify" value={`${num(transferCount)} / ${num(qualifyCount)}`} sub="by action" />
      </div>

      <Section title="Money Word Cloud" desc="Bigger = triggered more. This is also live to partners at /money-word-cloud." action={<a href="/money-word-cloud" target="_blank" className="text-sm text-[var(--brand)]">View public page ↗</a>}>
        <Card glow><MoneyWordCloud words={words.map((w) => ({ word: w.word, triggers: w.triggers }))} /></Card>
      </Section>

      <Section
        title="Armed Money Words"
        desc="Each word maps to a partner and an action: hot transfer, or AI-qualify with partner logic."
        action={<AIButton label="Suggest new words" />}
      >
        <Card className="!p-0 overflow-hidden">
          <table>
            <thead>
              <tr>
                <th>Word</th>
                <th className="text-right">Triggered</th>
                <th>Claimed</th>
                <th>Partner</th>
                <th>Action</th>
                <th>Routes To</th>
                <th className="text-right">Payout</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {words.map((w) => (
                <tr key={w.id}>
                  <td className="font-medium">&ldquo;{w.word}&rdquo;</td>
                  <td className="text-right font-medium text-[var(--gold)]">{w.triggers}×</td>
                  <td>{claimCount.get(w.word.toLowerCase()) ? <Badge tone="up">{claimCount.get(w.word.toLowerCase())} claimed</Badge> : <Badge tone="default">available</Badge>}</td>
                  <td>{w.partner || "—"}</td>
                  <td>
                    {w.action === "transfer" ? <Badge tone="brand">hot transfer</Badge> : <Badge tone="up">AI qualify</Badge>}
                  </td>
                  <td className="text-sm">{w.routeUserId ? <span className="text-[var(--brand)]">{userName.get(w.routeUserId) || "user"}</span> : w.routeNumber ? w.routeNumber : <span className="text-[var(--muted)]">auction/house</span>}</td>
                  <td className="text-right text-[var(--brand)]">{usd2(w.payoutCents)}</td>
                  <td>{w.active ? <Badge tone="up">active</Badge> : <Badge tone="down">paused</Badge>}</td>
                  <td className="text-right">
                    <ToggleActive endpoint="/api/money-words" id={w.id} active={w.active} />
                  </td>
                </tr>
              ))}
              {words.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-[var(--muted)] py-8">
                    No money words yet — add one below.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </Section>

      {sampleQualify && (
        <Section
          title={`Sample Qualification Flow — “${sampleQualify.word}”`}
          desc="When AI-qualify fires, the AI runs the partner's stored script before transfer."
        >
          <Card>
            {sampleSteps.length > 0 ? (
              <ol className="space-y-3 text-sm">
                {sampleSteps.map((copy, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="shrink-0 mt-0.5">
                      <Badge tone={i === sampleSteps.length - 1 ? "gold" : "brand"}>{i + 1}</Badge>
                    </span>
                    <div className="text-[var(--muted)]">{copy}</div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-[var(--muted)]">
                This word has no stored logic steps yet — add a JSON array of questions to MoneyWord.logic to script the
                qualify flow.
              </p>
            )}
          </Card>
        </Section>
      )}

      <Section title="Add a money word" desc="Arm a new word with a partner, action, and payout.">
        <Card glow>
          <CrudForm
            endpoint="/api/money-words"
            submitLabel="Arm word"
            successNote="Money word armed."
            fields={[
              { name: "word", label: "Word / Phrase", placeholder: "peptides", required: true },
              { name: "partner", label: "Partner", placeholder: "VitalPeptide Rx" },
              {
                name: "flowAction",
                label: "Action",
                type: "select",
                options: [
                  { value: "transfer", label: "Hot transfer" },
                  { value: "qualify", label: "AI qualify" },
                ],
              },
              { name: "payoutCents", label: "Payout (USD)", type: "number", placeholder: "85" },
              { name: "routeUserId", label: "Route to (user)", type: "select", options: routeOptions },
              { name: "routeNumber", label: "…or route to a number", placeholder: "+1 972 555 0123" },
            ]}
          />
          <p className="text-xs text-[var(--muted)] mt-3">Payout is in dollars (stored as cents). Pick the partner rep this hot transfer should ring (their user needs a phone), or type a direct number. Leave both blank to use the auction / house default.</p>
        </Card>
      </Section>
    </>
  );
}
