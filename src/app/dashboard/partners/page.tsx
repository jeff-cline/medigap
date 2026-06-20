import { db } from "@/lib/db";
import { Card, Stat, Section } from "@/components/ui";
import { num, cst } from "@/lib/format";
import PartnerRow from "@/components/PartnerRow";
import TestVideo from "@/components/TestVideo";

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  const [apps, generated] = await Promise.all([
    db.partnerApplication.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    db.partnerApplication.count({ where: { status: "generated" } }),
  ]);
  const pending = apps.filter((a) => a.status === "new").length;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Affiliate Partners</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">Hand a business owner your onboarding link, set their revenue share, and one-click generate a baked standalone lead-gen site (their own CRM; overflow leads affiliate to you).</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Stat label="Applications" value={num(apps.length)} sub="total" tone="up" />
        <Stat label="Pending" value={num(pending)} sub="awaiting review" tone="gold" />
        <Stat label="Sites Generated" value={num(generated)} sub="standalone partners" tone="up" />
      </div>

      <Section title="Your onboarding link" desc="Share this with any business owner — their answers run deep research and queue their site.">
        <Card>
          <code className="text-[var(--brand2)] text-sm break-all">https://medigap.plus/onboard</code>
          <p className="text-xs text-[var(--muted)] mt-2">Public, no login required. Each submission lands here for review.</p>
        </Card>
      </Section>

      <Section title="Video Marketing — God test" desc="Validate the RunwayML pipeline before selling the $1,500 upgrades.">
        <TestVideo />
      </Section>

      <Section title="Applications" desc="Set rev-share, generate the site, order the $1,500 upgrades (coupon-eligible).">
        {apps.length === 0 ? (
          <Card><p className="text-sm text-[var(--muted)]">No applications yet — share your onboarding link.</p></Card>
        ) : apps.map((a) => (
          <div key={a.id}>
            <div className="text-[10px] text-[var(--muted)] mb-1">{cst(a.createdAt)}</div>
            <PartnerRow app={{ id: a.id, businessName: a.businessName, status: a.status, revSharePct: a.revSharePct, hostname: a.hostname, siteId: a.siteId, ownerId: a.ownerId }} />
          </div>
        ))}
      </Section>
    </>
  );
}
