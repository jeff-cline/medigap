import Link from "next/link";
import { Card, Stat, Section, Badge } from "@/components/ui";
import { db } from "@/lib/db";
import { num, usd, cst } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PlaybookPage() {
  // Every lead from the /playbook funnel (source "Playbook · <host>").
  const leads = await db.lead.findMany({
    where: { source: { startsWith: "Playbook" } },
    orderBy: { createdAt: "desc" }, take: 1000,
    select: { id: true, name: true, source: true, status: true, valueCents: true, jvInterest: true, createdAt: true },
  });

  // Group by the referring white-label host (parsed from source).
  const bySite = new Map<string, { host: string; leads: number; sold: number; revenueCents: number }>();
  for (const l of leads) {
    const host = (l.source.split("·")[1] || "direct").trim() || "direct";
    const g = bySite.get(host) || { host, leads: 0, sold: 0, revenueCents: 0 };
    g.leads++; if (l.status === "sold") g.sold++; g.revenueCents += l.valueCents;
    bySite.set(host, g);
  }
  const sites = [...bySite.values()].sort((a, b) => b.leads - a.leads);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Playbook Funnel</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">
          Leads from the <Link href="/playbook" className="text-[var(--brand)]">disruption playbook</Link> — &ldquo;every industry is a geek away from being uberized.&rdquo;
          The sizzle page renders branded on every white-label site; this tracks <b className="text-[var(--text)]">which site referred each lead</b> so we can compensate those owners later. Every lead also lands in the <Link href="/dashboard/jv" className="text-[var(--brand)]">JV deal room</Link>.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Stat label="Playbook leads" value={num(leads.length)} sub={`from ${sites.length} sites`} tone="up" />
        <Stat label="Converted" value={num(sites.reduce((s, x) => s + x.sold, 0))} sub="sold" tone="gold" />
        <Stat label="Revenue" value={usd(sites.reduce((s, x) => s + x.revenueCents, 0))} sub="from playbook leads" tone="up" />
      </div>

      <Section title="By referring site" desc="Which white-label site generated each lead — the basis for future payouts.">
        <Card className="!p-0 overflow-hidden">
          <table>
            <thead><tr><th>Referring site</th><th className="text-right">Leads</th><th className="text-right">Converted</th><th className="text-right">Revenue</th></tr></thead>
            <tbody>
              {sites.map((s) => (
                <tr key={s.host}>
                  <td className="font-medium">{s.host}</td>
                  <td className="text-right">{num(s.leads)}</td>
                  <td className="text-right">{num(s.sold)}</td>
                  <td className="text-right text-[var(--brand)]">{usd(s.revenueCents)}</td>
                </tr>
              ))}
              {sites.length === 0 && <tr><td colSpan={4} className="text-center text-[var(--muted)] py-8">No playbook leads yet. Share <code className="text-[var(--brand2)]">&lt;any-site&gt;/playbook</code> and referrals show up here by site.</td></tr>}
            </tbody>
          </table>
        </Card>
      </Section>

      <Section title="Recent leads" desc="Newest first — click into the deal room.">
        <Card className="!p-0 overflow-hidden">
          <table>
            <thead><tr><th>Name</th><th>From site</th><th>Status</th><th className="text-right">Value</th><th>Created</th></tr></thead>
            <tbody>
              {leads.slice(0, 50).map((l) => (
                <tr key={l.id}>
                  <td className="font-medium"><Link href={`/dashboard/jv/${l.id}`} className="text-[var(--brand)] hover:underline">{l.name || "Unnamed"}</Link></td>
                  <td className="text-[var(--muted)] text-sm">{(l.source.split("·")[1] || "—").trim()}</td>
                  <td><Badge tone={l.status === "sold" ? "up" : "default"}>{l.status}</Badge></td>
                  <td className="text-right">{l.valueCents > 0 ? usd(l.valueCents) : "—"}</td>
                  <td className="text-[var(--muted)] text-xs">{cst(l.createdAt)}</td>
                </tr>
              ))}
              {leads.length === 0 && <tr><td colSpan={5} className="text-center text-[var(--muted)] py-6">None yet.</td></tr>}
            </tbody>
          </table>
        </Card>
      </Section>
    </>
  );
}
