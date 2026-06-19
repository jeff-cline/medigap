import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Create or update one of the signed-in advertiser's ads.
// owner = session.uid. On update we verify ownership before mutating.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const b = await req.json().catch(() => ({}));

  const kindRaw = String(b.kind || "text");
  const kind = ["text", "banner", "display"].includes(kindRaw) ? kindRaw : "text";
  const placementRaw = String(b.placement || "inline");
  const placement = ["inline", "sidebar", "footer", "exit"].includes(placementRaw) ? placementRaw : "inline";

  const headline = String(b.headline || "").trim();
  const body = String(b.body || "").trim();
  const assetUrl = String(b.assetUrl || "").trim();
  const targetUrl = String(b.targetUrl || "").trim();
  const bidCents = Math.max(1, Math.round(Number(b.bidCents) || 0));
  const active = b.active === undefined ? true : Boolean(b.active);

  if (!headline) {
    return NextResponse.json({ error: "A headline is required." }, { status: 400 });
  }

  if (b.id) {
    const existing = await db.ad.findUnique({ where: { id: String(b.id) } });
    if (!existing || existing.advertiserId !== session.uid) {
      return NextResponse.json({ error: "Ad not found." }, { status: 404 });
    }
    await db.ad.update({
      where: { id: existing.id },
      data: { kind, headline, body, assetUrl, targetUrl, bidCents, placement, active },
    });
  } else {
    await db.ad.create({
      data: {
        advertiserId: session.uid,
        kind,
        headline,
        body,
        assetUrl,
        targetUrl,
        bidCents,
        placement,
        active,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
