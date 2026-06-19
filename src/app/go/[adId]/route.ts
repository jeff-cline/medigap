import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Tracked click redirect: charge the advertiser their CPC, debit balance, log revenue.
export async function GET(req: NextRequest, ctx: { params: Promise<{ adId: string }> }) {
  const { adId } = await ctx.params;
  const ad = await db.ad.findUnique({ where: { id: adId } });
  if (!ad) return NextResponse.redirect(new URL("/", req.url));
  const charge = Math.min(ad.bidCents, ad.balanceCents);
  if (charge > 0) {
    await db.$transaction([
      db.ad.update({ where: { id: ad.id }, data: { balanceCents: { decrement: charge } } }),
      db.adEvent.create({ data: { adId: ad.id, kind: "click", costCents: charge } }),
      db.ledgerEntry.create({ data: { type: "revenue", category: "click", channel: "advertiser", amountCents: charge, note: `Click on ad ${ad.id}` } }),
    ]);
  }
  const dest = ad.targetUrl && /^https?:\/\//.test(ad.targetUrl) ? ad.targetUrl : "/";
  return NextResponse.redirect(dest, { status: 302 });
}
