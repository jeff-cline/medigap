import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Stat, Section } from "@/components/ui";
import { num } from "@/lib/format";
import CalcAdsAdmin from "@/components/CalcAdsAdmin";
import { partnerSignupOn } from "@/app/api/exit/partner-signup/route";

export const dynamic = "force-dynamic";

export default async function CalcAdsDashboard() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (!(s.role === "god" || s.impersonatorUid)) redirect("/dashboard");

  const [partners, adRows, clicks, accounts, signupOn] = await Promise.all([
    db.calcPartner.findMany({ orderBy: { createdAt: "desc" } }),
    db.calcAd.findMany({ include: { partner: true, _count: { select: { clicks: true } } }, orderBy: { sortOrder: "asc" } }),
    db.calcAdClick.count(),
    db.user.count({ where: { source: { contains: "exitoptimization calculators" } } }),
    partnerSignupOn(),
  ]);
  const ads = adRows.map((a) => ({ id: a.id, partnerId: a.partnerId, partnerName: a.partner.name, title: a.title, description: a.description, imageUrl: a.imageUrl, ctaLabel: a.ctaLabel, ctaUrl: a.ctaUrl, category: a.category, sortOrder: a.sortOrder, active: a.active, clicks: a._count.clicks }));

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">🧮 Calculator Ad Network</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">Partner ad blocks shown inside the exitoptimization.com calculator backend. Every customer click becomes a lead for that partner — a one-for-many marketing platform. Reorder ads with ↑ ↓.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat label="Partners" value={num(partners.length)} tone="up" />
        <Stat label="Ad blocks" value={num(ads.length)} />
        <Stat label="Clicks → partner leads" value={num(clicks)} tone="gold" />
        <Stat label="Calculator accounts" value={num(accounts)} tone="up" />
      </div>
      <Section title="Manage partners & ads" desc="Create partners, build ad blocks (upload an image), and arrange the layout.">
        <CalcAdsAdmin partners={partners.map((p) => ({ id: p.id, name: p.name, category: p.category }))} ads={ads} signupOn={signupOn} />
      </Section>
    </>
  );
}
