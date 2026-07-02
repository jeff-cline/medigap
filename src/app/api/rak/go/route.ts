import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rakSubId } from "@/lib/medigapp";
import { trackedLink } from "@/lib/rakuten";

export const dynamic = "force-dynamic";

// Outbound offer click: log a RakClick(kind=out) with a unique subId (u1), then redirect to the
// Rakuten deep link with that subId appended — so commissions in Advanced Reports attribute back
// to this exact page + offer. This is the spine of "which page/ad monetizes best".
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("s") || "";
  const offerId = req.nextUrl.searchParams.get("o") || "";
  const offer = offerId ? await db.rakOffer.findUnique({ where: { id: offerId } }).catch(() => null) : null;

  const click = await db.rakClick.create({
    data: {
      kind: "out", slug, offerId,
      subId: rakSubId(slug, offerId),
      ref: req.headers.get("referer") || "",
      ip: (req.headers.get("x-forwarded-for") || "").split(",")[0].trim(),
      ua: (req.headers.get("user-agent") || "").slice(0, 200),
    },
  }).catch(() => null);

  // unique per-click subId so we can attribute the exact click → the event
  const subId = click ? `${rakSubId(slug, offerId)}_${click.id.slice(-8)}` : rakSubId(slug, offerId);
  const dest = offer?.deepLink ? trackedLink(offer.deepLink, subId) : "";

  // No live deep link yet (pre-Rakuten-go-live) → return to the lander they came from
  // (preserves the /r mirror host+prefix) instead of dead-ending.
  if (!dest) return NextResponse.redirect(req.headers.get("referer") || new URL(`/${slug}`, req.url).toString(), 302);
  return NextResponse.redirect(dest, 302);
}
