import { db } from "@/lib/db";
import { Stat, Section } from "@/components/ui";
import { num, usd } from "@/lib/format";
import CouponManager from "@/components/CouponManager";

export const dynamic = "force-dynamic";

export default async function CouponsPage() {
  const [coupons, redemptions, bonusAgg] = await Promise.all([
    db.coupon.findMany({ orderBy: { createdAt: "desc" } }),
    db.couponRedemption.count(),
    db.couponRedemption.aggregate({ _sum: { bonusCents: true } }),
  ]);
  const active = coupons.filter((c) => c.active).length;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">Give partners credit toward pay-per-call. Two types: a <b>flat credit</b> (free balance) or a <b>matching deposit</b> (match a % of what they put in, up to a cap). Codes are entered at deposit.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Stat label="Active Coupons" value={num(active)} sub={`${num(coupons.length)} total`} tone="up" />
        <Stat label="Redemptions" value={num(redemptions)} sub="all-time" tone="gold" />
        <Stat label="Credit Granted" value={usd(bonusAgg._sum.bonusCents ?? 0)} sub="bonus balance issued" tone="gold" />
        <Stat label="—" value="" sub="" tone="default" />
      </div>

      <Section title="Manage coupons" desc="Create, pause, or delete. Applied when a partner deposits with the code.">
        <CouponManager coupons={coupons.map((c) => ({ id: c.id, code: c.code, kind: c.kind, amountCents: c.amountCents, percent: c.percent, maxRedemptions: c.maxRedemptions, redemptions: c.redemptions, oncePerUser: c.oncePerUser, active: c.active, note: c.note }))} />
      </Section>
    </>
  );
}
