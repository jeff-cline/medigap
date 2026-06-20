import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCheckoutSession } from "@/lib/stripe";
import { recordCouponRedemption } from "@/lib/coupons";
import { fulfillUpgrade } from "../checkout/route";

// Stripe success redirect → verify payment, fulfill the upgrade, return to the portal.
export async function GET(req: NextRequest) {
  const s = await getSession();
  const u = req.nextUrl.searchParams.get("u") || "";
  const sessionId = req.nextUrl.searchParams.get("session_id") || "";
  const back = (q: string) => NextResponse.redirect(new URL(`/agent?upgrade=${q}`, req.url));
  if (!s || !u || !sessionId) return back("error");

  const cs = await getCheckoutSession(sessionId);
  const paid = (cs.data as { payment_status?: string })?.payment_status === "paid";
  if (!paid) return back("unpaid");

  const up = await db.upgrade.findUnique({ where: { id: u } });
  if (up && up.status === "ordered") {
    if (up.couponCode) await recordCouponRedemption(up.couponCode, s.uid, 0);
    await fulfillUpgrade(u, s.uid, up.kind);
  }
  return back("success");
}
