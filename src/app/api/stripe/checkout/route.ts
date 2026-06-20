import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { createCheckoutSession, stripeKey } from "@/lib/stripe";
import { couponPreview } from "@/lib/coupons";
import { createImageTask } from "@/lib/runway";
import { notifyNewAccount } from "@/lib/email";

const PRICE = 150000; // $1,500

// Partner-facing: buy a $1,500 media upgrade via Stripe Checkout (coupon-eligible).
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const kind = b.kind === "mediakit" ? "mediakit" : "video";
  const name = kind === "video" ? "Social Media Video Upgrade" : "Media Kit & Brand Guidelines";

  const cp = await couponPreview(String(b.couponCode || ""), PRICE);
  const paid = Math.max(0, PRICE - cp.discount);
  const site = await db.site.findFirst({ where: { ownerId: s.uid } }).catch(() => null);
  const up = await db.upgrade.create({ data: { siteId: site?.id, kind, amountCents: PRICE, paidCents: paid, couponCode: cp.label, status: "ordered" } });

  // Fully covered by coupon → no payment needed.
  if (paid <= 0) {
    await fulfillUpgrade(up.id, s.uid, kind);
    return NextResponse.json({ ok: true, free: true });
  }
  if (!(await stripeKey())) return NextResponse.json({ error: "Stripe isn't connected yet — ask your admin to connect it." }, { status: 200 });

  const r = await createCheckoutSession({
    amountCents: paid, name,
    successUrl: `https://medigap.plus/api/stripe/confirm?u=${up.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: "https://medigap.plus/agent?upgrade=canceled",
    customerEmail: s.email, metadata: { upgradeId: up.id, uid: s.uid, kind },
  });
  const url = (r.data as { url?: string })?.url;
  if (!r.ok || !url) return NextResponse.json({ error: r.error || "Could not start checkout." }, { status: 200 });
  return NextResponse.json({ ok: true, url });
}

// Mark paid, kick off generation, and email the God inbox that a build was purchased.
export async function fulfillUpgrade(upgradeId: string, uid: string, kind: string) {
  const up = await db.upgrade.update({ where: { id: upgradeId }, data: { status: "generating" } }).catch(() => null);
  const user = await db.user.findUnique({ where: { id: uid } });
  const r = await createImageTask(`High-quality vertical 9:16 ${kind === "video" ? "social video ad" : "brand graphic"} for ${user?.name || "a senior insurance partner"}. Premium, trustworthy.`).catch(() => null);
  if (r && (r.data as { id?: string })?.id) await db.upgrade.update({ where: { id: upgradeId }, data: { note: `Runway task ${(r.data as { id?: string }).id}` } }).catch(() => {});
  // Email God that a project build was purchased.
  notifyNewAccount({ name: `${user?.name || user?.email} bought ${kind === "video" ? "Video" : "Media Kit"} build`, email: user?.email || "", role: "upgrade-purchase", phone: user?.phone || "", source: `Upgrade ${up?.id}`, id: upgradeId }).catch(() => {});
}
