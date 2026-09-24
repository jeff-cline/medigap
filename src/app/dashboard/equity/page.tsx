import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, isGod } from "@/lib/auth";
import { db } from "@/lib/db";
import { bySlug, CATEGORIES } from "@/lib/equity";
import { getEquitySettings } from "@/lib/equity/settings";
import EquityCrm from "./EquityCrm";

export const dynamic = "force-dynamic";

// equity.direct CRM, inside the Core dashboard where the God account already
// lives. Every lead, which of the hundred keyword pages produced it, and what
// has happened since.
export default async function EquityDashboard() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isGod(session)) redirect("/dashboard");

  const [leads, partners, invites, accounts, emails, settings] = await Promise.all([
    db.eqLead.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      include: { notes: { orderBy: { createdAt: "desc" }, take: 20 } },
    }).catch(() => []),
    db.eqPartner.findMany({ orderBy: { createdAt: "desc" }, take: 200 }).catch(() => []),
    db.eqInvite.findMany({
      where: { usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" }, take: 50,
    }).catch(() => []),
    db.eqAccount.count().catch(() => 0),
    db.eqEmailLog.findMany({ orderBy: { createdAt: "desc" }, take: 40 }).catch(() => []),
    getEquitySettings(),
  ]);

  // If mail is failing, that needs to be the first thing seen — welcome emails
  // and lead alerts both go silent and nothing else looks wrong.
  const failedEmails = emails.filter((e) => !e.ok).length;

  // Which keyword pages actually produce leads. This is the number that should
  // drive where content effort goes next.
  const bySlugCount = new Map<string, number>();
  for (const l of leads) {
    if (l.slug) bySlugCount.set(l.slug, (bySlugCount.get(l.slug) ?? 0) + 1);
  }
  const topPages = [...bySlugCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([slug, n]) => ({ slug, n, reason: bySlug(slug)?.reason ?? slug }));

  const byCategoryCount = CATEGORIES.map((c) => ({
    key: c.key,
    label: c.label,
    n: leads.filter((l) => l.category === c.key).length,
  })).sort((a, b) => b.n - a.n);

  const partnerName = new Map(partners.map((p) => [p.id, p.name || p.email]));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-text">equity.direct</h1>
        <p className="mt-1 text-sm text-muted">
          Every lead, the page it came from, and what has happened since.{" "}
          <Link href="https://equity.direct" target="_blank" rel="noopener noreferrer"
                className="underline">
            View the site
          </Link>
        </p>
      </div>

      <EquityCrm
        leads={leads.map((l) => ({
          id: l.id, ref: l.ref,
          name: [l.firstName, l.lastName].filter(Boolean).join(" ") || "—",
          email: l.email, phone: l.phone, zip: l.zip,
          slug: l.slug, reason: bySlug(l.slug)?.reason ?? "",
          category: l.category,
          estValue: l.estValue, mortgageBal: l.mortgageBal, estEquity: l.estEquity,
          amountWanted: l.amountWanted, timeline: l.timeline,
          reasonNote: l.reasonNote,
          stage: l.stage,
          partner: l.partnerId ? (partnerName.get(l.partnerId) ?? "unknown") : "",
          // Whether we may legally call or text them. The CRM shows this on the
          // row, because "can I ring this person" is the first question anyone
          // working a lead list actually has.
          consented: Boolean(l.consentAt),
          consentAt: l.consentAt ? l.consentAt.toISOString() : null,
          nextFollowUp: l.nextFollowUp ? l.nextFollowUp.toISOString() : null,
          lastContact: l.lastContact ? l.lastContact.toISOString() : null,
          createdAt: l.createdAt.toISOString(),
          notes: l.notes.map((n) => ({
            id: n.id, kind: n.kind, body: n.body,
            author: n.authorName, createdAt: n.createdAt.toISOString(),
          })),
        }))}
        partners={partners.map((p) => ({
          id: p.id, email: p.email, name: p.name, company: p.company,
          code: p.code, vertical: p.vertical, active: p.active,
          hasPassword: Boolean(p.passwordHash),
          referrals: leads.filter((l) => l.partnerId === p.id).length,
          createdAt: p.createdAt.toISOString(),
        }))}
        pendingInvites={invites.map((i) => ({
          id: i.id, email: i.email,
          expiresAt: i.expiresAt.toISOString(),
          url: `https://equity.direct/partners/invite?token=${i.token}`,
        }))}
        topPages={topPages}
        byCategory={byCategoryCount}
        accountCount={accounts}
        settings={settings}
        emails={emails.map((e) => ({
          id: e.id, to: e.to, kind: e.kind, subject: e.subject,
          ok: e.ok, error: e.error, createdAt: e.createdAt.toISOString(),
        }))}
        failedEmails={failedEmails}
      />
    </div>
  );
}
