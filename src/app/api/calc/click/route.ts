import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// A customer clicks a partner ad → log a CalcAdClick (a LEAD for that partner, with the customer
// info captured at signup) → redirect to the partner's site. One-for-many marketing.
export async function GET(req: NextRequest) {
  const adId = req.nextUrl.searchParams.get("ad") || "";
  const ad = adId ? await db.calcAd.findUnique({ where: { id: adId } }).catch(() => null) : null;
  if (!ad) return NextResponse.redirect(new URL("/account", req.url), 302);

  const s = await getSession();
  let name = "", email = "", phone = "";
  if (s?.uid) {
    const u = await db.user.findUnique({ where: { id: s.uid } }).catch(() => null);
    if (u) { name = u.name; email = u.email; phone = u.phone; }
  }
  await db.calcAdClick.create({ data: { adId: ad.id, partnerId: ad.partnerId, userId: s?.uid || "", name, email, phone } }).catch(() => {});

  let url = ad.ctaUrl.trim();
  if (url && !/^https?:\/\//i.test(url)) url = "https://" + url;
  return NextResponse.redirect(url || new URL("/account", req.url).toString(), 302);
}
