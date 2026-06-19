import { Card, Stat, Badge, Section, AIButton } from "@/components/ui";
import { usd2, num } from "@/lib/format";

type SampleWord = {
  word: string;
  partner: string;
  action: "transfer" | "qualify";
  payoutCents: number;
  detections: number;
};

export default function MoneyWordsPage() {
  // MoneyWord table EMPTY — render realistic sample.
  const words: SampleWord[] = [
    { word: "peptides", partner: "VitalPeptide Rx", action: "qualify", payoutCents: 8500, detections: 142 },
    { word: "diabetes", partner: "GlucoCare Supply", action: "transfer", payoutCents: 6200, detections: 318 },
    { word: "back brace", partner: "OrthoDirect DME", action: "transfer", payoutCents: 4500, detections: 211 },
    { word: "hearing aid", partner: "AudioPlus", action: "qualify", payoutCents: 5400, detections: 97 },
    { word: "final expense", partner: "Legacy Life", action: "transfer", payoutCents: 9100, detections: 64 },
  ];

  const activeWords = words.length;
  const totalDetections = words.reduce((s, w) => s + w.detections, 0);
  const avgPayoutCents = Math.round(words.reduce((s, w) => s + w.payoutCents, 0) / words.length);
  const topWord = [...words].sort((a, b) => b.detections - a.detections)[0];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Money Words</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">
          When the voice AI hears a &ldquo;money word&rdquo; (e.g. <span className="text-[var(--gold)]">peptides</span>) mid-call,
          it re-routes the conversation to an alternate monetization flow — a hot transfer to a partner, or an
          AI-qualify sequence using that partner&apos;s logic — without dropping the caller.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Stat label="Active Money Words" value={num(activeWords)} sub="armed in the voice AI" tone="up" />
        <Stat label="Detections" value={num(totalDetections)} sub="this month" />
        <Stat label="Avg Payout" value={usd2(avgPayoutCents)} sub="per qualified route" tone="gold" />
        <Stat label="Top Word" value={`“${topWord.word}”`} sub={`${num(topWord.detections)} detections`} />
      </div>

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
                <th>Partner</th>
                <th>Action</th>
                <th className="text-right">Payout</th>
                <th className="text-right">Detections</th>
              </tr>
            </thead>
            <tbody>
              {words.map((w, i) => (
                <tr key={i}>
                  <td className="font-medium">&ldquo;{w.word}&rdquo;</td>
                  <td>{w.partner}</td>
                  <td>{w.action === "transfer" ? <Badge tone="brand">hot transfer</Badge> : <Badge tone="up">AI qualify</Badge>}</td>
                  <td className="text-right text-[var(--brand)]">{usd2(w.payoutCents)}</td>
                  <td className="text-right text-[var(--muted)]">{num(w.detections)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <p className="text-xs text-[var(--muted)] mt-2">Wired next: MoneyWord table → voice-AI intent listener &amp; partner routing webhook.</p>
      </Section>

      <Section title="Sample Qualification Flow — “peptides”" desc="When AI-qualify fires, the AI runs the partner's script before transfer.">
        <Card>
          <ol className="space-y-3 text-sm">
            {[
              ["Detect", "Caller mentions “peptides” during the Medigap call.", "default"],
              ["Confirm intent", "“It sounds like you’re interested in peptide therapy — is that right?”", "brand"],
              ["Qualify — age", "“Are you between 30 and 75 years old?”", "default"],
              ["Qualify — Rx", "“Do you currently have a prescription, or would you like a telehealth consult?”", "default"],
              ["Qualify — payment", "“Peptide programs start around $129/mo — is that something you can budget for?”", "default"],
              ["Route", "Qualified → hot transfer to VitalPeptide Rx. Payout fires on connect.", "gold"],
            ].map(([step, copy, tone], i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 mt-0.5"><Badge tone={tone as "default" | "brand" | "gold"}>{i + 1}</Badge></span>
                <div>
                  <div className="font-medium">{step}</div>
                  <div className="text-[var(--muted)]">{copy}</div>
                </div>
              </li>
            ))}
          </ol>
        </Card>
        <p className="text-xs text-[var(--muted)] mt-2">Wired next: partner-specific qualify scripts stored in MoneyWord.logic.</p>
      </Section>
    </>
  );
}
