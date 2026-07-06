import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Partner self-management: an adpartner edits/creates ONLY their own partner's ads.
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || s.role !== "adpartner") return NextResponse.json({ error: "Partners only" }, { status: 403 });
  const partner = await db.calcPartner.findFirst({ where: { ownerId: s.uid } });
  if (!partner) return NextResponse.json({ error: "No partner profile" }, { status: 404 });
  const b = await req.json().catch(() => ({}));
  const a = String(b.action || "");
  try {
    if (a === "createAd") {
      const max = await db.calcAd.aggregate({ _max: { sortOrder: true } });
      await db.calcAd.create({ data: { partnerId: partner.id, title: String(b.title || "Untitled"), description: String(b.description || ""), imageUrl: String(b.imageUrl || ""), ctaLabel: String(b.ctaLabel || "Learn more"), ctaUrl: String(b.ctaUrl || ""), category: partner.category, sortOrder: (max._max.sortOrder || 0) + 1 } });
      return NextResponse.json({ ok: true });
    }
    if (a === "updateAd") {
      const ad = await db.calcAd.findUnique({ where: { id: String(b.id) } });
      if (!ad || ad.partnerId !== partner.id) return NextResponse.json({ error: "Not your ad" }, { status: 403 });
      const data: Record<string, unknown> = {};
      for (const k of ["title", "description", "imageUrl", "ctaLabel", "ctaUrl"] as const) if (b[k] !== undefined) data[k] = String(b[k]);
      if (b.active !== undefined) data.active = !!b.active;
      await db.calcAd.update({ where: { id: ad.id }, data });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (e) { return NextResponse.json({ error: String(e).slice(0, 200) }, { status: 200 }); }
}
