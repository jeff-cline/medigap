import Link from "next/link";
import { Card, Stat, Section } from "@/components/ui";
import JvControls from "@/components/jv/JvControls";
import FounderComms from "@/components/jv/FounderComms";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { num, usd2, cst } from "@/lib/format";
import { JV_TAG, FOUNDER_COMM_TAG, FOUNDER_ENGINES, interestLabel, priorityRank, FOUNDER, TOLLFREE_DISPLAY } from "@/lib/jv";
import { engineReady } from "@/lib/founder";

export const dynamic = "force-dynamic";

const PRI_TONE: Record<string, string> = { high: "text-[var(--danger)]", medium: "text-[var(--gold)]", low: "text-[var(--muted)]" };
const PRI_DOT: Record<string, string> = { high: "🔴", medium: "🟡", low: "⚪" };

export default async function JvDashboard() {
  const session = await getSession();
  const isGod = session?.role === "god" || !!session?.impersonatorUid;

  const leads = await db.lead.findMany({
    where: { tags: { contains: JV_TAG } },
    orderBy: { createdAt: "desc" },
    take: 1000,
    select: {
      id: true, name: true, phone: true, email: true, zip: true, state: true,
      priority: true, ltvMonthlyCents: true, jvInterest: true, status: true, createdAt: true,
      _count: { select: { notes: true } },
    },
  });

  // Rank: priority first, then LTV/mo.
  const ranked = [...leads].sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority) || b.ltvMonthlyCents - a.ltvMonthlyCents);

  const pipelineMonthly = leads.reduce((s, l) => s + l.ltvMonthlyCents, 0);
  const highCount = leads.filter((l) => l.priority === "high").length;

  // --- Founder Communication console data ---
  const commContacts = leads.filter((l) => l.email);
  const [founderEmails, templates, engineReadiness] = await Promise.all([
    db.emailMessage.findMany({
      where: { founder: true, direction: "outbound", leadId: { in: commContacts.map((c) => c.id) } },
      orderBy: { createdAt: "desc" },
      select: { leadId: true, templateId: true, templateName: true, engine: true, status: true, openedAt: true, repliedAt: true },
    }),
    db.emailTemplate.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, subject: true, html: true, text: true } }),
    Promise.all(FOUNDER_ENGINES.map(async (e) => ({ key: e.key, label: e.label, oneToOne: e.oneToOne, ready: await engineReady(e.key) }))),
  ]);
  const sentByLead = new Map<string, { templateId: string; templateName: string; engine: string; status: string; opened: boolean; replied: boolean }[]>();
  for (const m of founderEmails) {
    if (!m.leadId) continue;
    const arr = sentByLead.get(m.leadId) || [];
    arr.push({ templateId: m.templateId || "", templateName: m.templateName, engine: m.engine, status: m.status, opened: !!m.openedAt, replied: !!m.repliedAt });
    sentByLead.set(m.leadId, arr);
  }
  const contacts = commContacts.map((c) => ({ id: c.id, name: c.name, email: c.email, sent: sentByLead.get(c.id) || [] }));

  return (
    <>
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">JV / PE / VC — Founder&apos;s Deal Room</h1>
          <div className="flex flex-wrap gap-2">
            <Link href="/1-800-medigap" target="_blank" className="btn btn-ghost text-xs !py-1.5">🌐 1-800-MEDIGAP page ↗</Link>
            <Link href="/1-800-medigap-opportunity" target="_blank" className="btn btn-ghost text-xs !py-1.5">📈 Opportunity page ↗</Link>
          </div>
        </div>
        <p className="text-sm text-[var(--muted)] max-w-3xl mt-2">
          {FOUNDER.name}&apos;s personal CRM for the top of the business — investors, brand takeovers, ZIP/state/national
          sponsors, and strategic partners. Text them from <b>{TOLLFREE_DISPLAY}</b>; replies thread back here and ping
          your cell. Rank by priority and monthly value, keep notes, and store documents. Hand the day-to-day to an assistant.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat label="Deals" value={num(leads.length)} sub="in your deal room" tone="up" />
        <Stat label="Pipeline Value" value={`${usd2(pipelineMonthly)}/mo`} sub="sum of monthly LTV" tone="gold" />
        <Stat label="High Priority" value={num(highCount)} sub="work these first" tone={highCount ? "down" : "default"} />
        <Stat label="Public Page" value="1-800-MEDIGAP" sub="/1-800-medigap" tone="default" />
      </div>

      <div className="mb-6"><JvControls isGod={isGod} /></div>

      <Section title="Founder Communication" desc="Email in your voice — pick which engine to send from each time. Every send is logged to the CRM tagged FOUNDER COMMUNICATION; templates already sent to a person show next to their name, and the same template can't go twice via the same engine.">
        <FounderComms contacts={contacts} templates={templates} engines={engineReadiness} />
      </Section>

      <Section title="Deal Room" desc="Ranked by priority, then monthly value. Click a deal to text, take notes, and attach documents.">
        <Card className="!p-0 overflow-hidden overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Priority</th><th>Name</th><th>Interest</th><th>Phone</th>
                <th className="text-right">LTV / mo</th><th>Status</th><th className="text-right">Notes</th><th>Added</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((l) => (
                <tr key={l.id} className="hover:bg-[var(--panel2)] cursor-pointer">
                  <td><Link href={`/dashboard/jv/${l.id}`} className={`block text-xs font-semibold ${PRI_TONE[l.priority] || "text-[var(--muted)]"}`}>{PRI_DOT[l.priority] || "—"} {l.priority || "—"}</Link></td>
                  <td className="font-medium"><Link href={`/dashboard/jv/${l.id}`} className="block text-[var(--brand)] hover:underline">{l.name || "(no name)"} →</Link><div className="text-[var(--muted)] text-xs font-normal">{l.email || "—"}</div></td>
                  <td className="text-sm"><Link href={`/dashboard/jv/${l.id}`} className="block">{interestLabel(l.jvInterest)}</Link></td>
                  <td className="text-sm whitespace-nowrap"><Link href={`/dashboard/jv/${l.id}`} className="block">{l.phone || "—"}</Link></td>
                  <td className="text-right font-medium text-[var(--brand)]">{l.ltvMonthlyCents ? usd2(l.ltvMonthlyCents) : "—"}</td>
                  <td className="text-xs text-[var(--muted)]">{l.status}</td>
                  <td className="text-right text-[var(--muted)] text-sm">{l._count.notes || "—"}</td>
                  <td className="text-[var(--muted)] text-xs whitespace-nowrap">{cst(l.createdAt)}</td>
                </tr>
              ))}
              {ranked.length === 0 && <tr><td colSpan={8} className="text-center text-[var(--muted)] py-8">No deals yet — add one above, or they&apos;ll arrive from the 1-800-MEDIGAP partner pages.</td></tr>}
            </tbody>
          </table>
        </Card>
      </Section>
    </>
  );
}
