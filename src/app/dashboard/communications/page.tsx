import { db } from "@/lib/db";
import { Stat, Badge, Section } from "@/components/ui";
import { num, cst } from "@/lib/format";
import CommComposer from "@/components/CommComposer";

export const dynamic = "force-dynamic";

export default async function CommunicationsPage() {
  const [sites, words, withPhone, withEmail, optOuts, campaigns, zap] = await Promise.all([
    db.site.findMany({ select: { id: true, name: true } }),
    db.moneyWord.findMany({ select: { word: true } }),
    db.lead.count({ where: { phone: { not: "" } } }),
    db.lead.count({ where: { email: { not: "" } } }),
    db.lead.count({ where: { OR: [{ smsOptOut: true }, { emailOptOut: true }] } }),
    db.commCampaign.findMany({ orderBy: { createdAt: "desc" }, take: 15 }),
    db.integration.findUnique({ where: { key: "zapmail" } }),
  ]);
  let zc: Record<string, string> = {}; try { zc = zap ? JSON.parse(zap.config) : {}; } catch {}
  const smtpReady = !!(zc.smtpHost && zc.smtpUser && zc.smtpPass);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Communications</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">One portal to text, email, or both — to any segment (missed calls, a money word, a website, status, source) or an uploaded list. Merge fields, opt-out compliance, and live audience counts built in.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat label="Textable" value={num(withPhone)} sub="leads with a phone" tone="up" />
        <Stat label="Emailable" value={num(withEmail)} sub="leads with an email" tone="up" />
        <Stat label="Opted Out" value={num(optOuts)} sub="auto-excluded" tone={optOuts ? "down" : "default"} />
        <Stat label="Campaigns" value={num(campaigns.length)} sub="recent" tone="gold" />
      </div>

      <Section title="Compose & send" desc="Pick an audience, channel, and message.">
        <CommComposer sites={sites} moneyWords={words.map((w) => w.word)} smtpReady={smtpReady} />
      </Section>

      <Section title="Campaign Log" desc="Every blast you've sent.">
        <div className="card !p-0 overflow-hidden">
          <table>
            <thead><tr><th>When (CT)</th><th>Name</th><th>Channel</th><th className="text-right">Sent</th><th className="text-right">Failed</th></tr></thead>
            <tbody>
              {campaigns.length === 0 && <tr><td colSpan={5} className="text-center text-[var(--muted)] py-6">No campaigns yet.</td></tr>}
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td className="text-[var(--muted)] text-sm whitespace-nowrap">{cst(c.createdAt)}</td>
                  <td className="font-medium">{c.name}</td>
                  <td><Badge tone="brand">{c.channel}</Badge></td>
                  <td className="text-right text-[var(--brand)]">{c.sent}</td>
                  <td className="text-right text-[var(--muted)]">{c.failed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}
