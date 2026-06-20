import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Card, Badge, Section } from "@/components/ui";
import { cstFull } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PartnerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = await db.partnerApplication.findUnique({ where: { id } });
  if (!app) notFound();
  const upgrades = await db.upgrade.findMany({ where: { applicationId: id }, orderBy: { createdAt: "desc" } });

  const row = (k: string, v: string) => v ? <div className="flex gap-3 border-b border-[var(--border)]/50 py-1.5 text-sm"><span className="text-[var(--muted)] w-40 shrink-0">{k}</span><span>{v}</span></div> : null;

  return (
    <>
      <div className="mb-6">
        <Link href="/dashboard/partners" className="text-sm text-[var(--muted)] hover:text-[var(--brand)]">← Partners</Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-bold">{app.businessName}</h1>
          <Badge tone={app.status === "generated" ? "up" : app.status === "rejected" ? "down" : "gold"}>{app.status}</Badge>
          <span className="text-sm text-[var(--gold)]">{app.revSharePct}% rev-share</span>
        </div>
        <p className="text-xs text-[var(--muted)] mt-1">{cstFull(app.createdAt)}</p>
      </div>

      <Section title="Deep-research intake">
        <Card>
          {row("Contact", app.contactName)}{row("Email", app.email)}{row("Phone", app.phone)}{row("Website", app.website)}{row("Desired domain", app.hostname)}
          {row("Vertical", app.vertical)}{row("Services", app.services)}{row("Audience", app.audience)}{row("USP", app.usp)}{row("Competitors", app.competitors)}
          {row("Geography", app.geography)}{row("Territory ZIPs (keep)", app.territoryZips)}{row("Unwanted → affiliate", app.unwantedLeads)}
          {row("Money words", app.moneyWords)}{row("Brand colors", app.brandColors)}{row("Logo", app.logoUrl)}{row("Primary CTA", app.primaryCta)}{row("Notes", app.notes)}
        </Card>
      </Section>

      {upgrades.length > 0 && (
        <Section title="Upgrades" desc="$1,500 media products ordered for this partner.">
          <Card className="!p-0 overflow-hidden">
            <table>
              <thead><tr><th>Kind</th><th>Status</th><th className="text-right">Paid</th><th>Coupon</th><th>Note</th></tr></thead>
              <tbody>
                {upgrades.map((u) => (
                  <tr key={u.id}>
                    <td className="font-medium">{u.kind === "video" ? "🎬 Video series" : "🎨 Media kit"}</td>
                    <td><Badge tone={u.status === "delivered" ? "up" : u.status === "failed" ? "down" : "gold"}>{u.status}</Badge></td>
                    <td className="text-right">${(u.paidCents / 100).toFixed(0)}</td>
                    <td className="text-[var(--muted)]">{u.couponCode || "—"}</td>
                    <td className="text-[var(--muted)] text-xs">{u.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>
      )}

      {app.status === "generated" && <p className="text-sm text-[var(--muted)]">Site is live & standalone — manage it on <Link href="/dashboard/sites" className="text-[var(--brand)]">Marketing Sites</Link>. Generate the <Link href={`/dashboard/partners/${app.id}/brand-kit`} className="text-[var(--brand)]">brand guidelines</Link>.</p>}
    </>
  );
}
