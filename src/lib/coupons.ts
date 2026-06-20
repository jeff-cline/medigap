import { db } from "./db";

// Validate + apply a coupon to a deposit. Adds the bonus to the user's balance, records the
// redemption, and returns the bonus granted. Pure server-side; safe to call from deposit routes.
export async function applyCoupon(code: string, userId: string, depositCents: number): Promise<{ ok: boolean; bonusCents: number; error?: string; label?: string }> {
  const c = await db.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!c || !c.active) return { ok: false, bonusCents: 0, error: "Invalid or inactive coupon." };
  if (c.expiresAt && c.expiresAt < new Date()) return { ok: false, bonusCents: 0, error: "Coupon expired." };
  if (c.maxRedemptions > 0 && c.redemptions >= c.maxRedemptions) return { ok: false, bonusCents: 0, error: "Coupon fully redeemed." };
  if (c.oncePerUser) {
    const used = await db.couponRedemption.findFirst({ where: { couponId: c.id, userId } });
    if (used) return { ok: false, bonusCents: 0, error: "You already used this coupon." };
  }

  let bonus = 0;
  if (c.kind === "credit") bonus = c.amountCents; // flat credit (e.g., $100 free)
  else if (c.kind === "match") bonus = Math.min(Math.round((depositCents * c.percent) / 100), c.amountCents || Infinity); // match % up to cap
  if (bonus <= 0) return { ok: false, bonusCents: 0, error: "Coupon grants no credit on this deposit." };

  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { balanceCents: { increment: bonus } } }),
    db.coupon.update({ where: { id: c.id }, data: { redemptions: { increment: 1 } } }),
    db.couponRedemption.create({ data: { couponId: c.id, userId, bonusCents: bonus } }),
    db.transaction.create({ data: { kind: "deposit", userId, amountCents: bonus, status: "settled", note: `Coupon ${c.code} (${c.kind === "credit" ? "credit" : `${c.percent}% match`})` } }),
  ]);
  return { ok: true, bonusCents: bonus, label: c.code };
}
