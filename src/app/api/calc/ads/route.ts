import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
function gate(s: Awaited<ReturnType<typeof getSession>>) { return !!s && (s.role === "god" || !!s.impersonatorUid); }

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!gate(s)) return NextResponse.json({ error: "God only" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const a = String(b.action || "");
  try {
    if (a === "createPartner") {
      const p = await db.calcPartner.create({ data: { name: String(b.name || "Partner"), category: String(b.category || "advertiser"), contactEmail: String(b.contactEmail || ""), logoUrl: String(b.logoUrl || "") } });
      return NextResponse.json({ ok: true, id: p.id });
    }
    if (a === "createAd") {
      if (!b.partnerId) return NextResponse.json({ error: "Pick a partner" }, { status: 400 });
      const max = await db.calcAd.aggregate({ _max: { sortOrder: true } });
      const ad = await db.calcAd.create({ data: {
        partnerId: String(b.partnerId), title: String(b.title || "Untitled"), description: String(b.description || ""),
        imageUrl: String(b.imageUrl || ""), ctaLabel: String(b.ctaLabel || "Learn more"), ctaUrl: String(b.ctaUrl || ""),
        category: String(b.category || "advertiser"), sortOrder: (max._max.sortOrder || 0) + 1,
      } });
      return NextResponse.json({ ok: true, id: ad.id });
    }
    if (a === "updateAd") {
      const data: Record<string, unknown> = {};
      for (const k of ["title", "description", "imageUrl", "ctaLabel", "ctaUrl", "category"] as const) if (b[k] !== undefined) data[k] = String(b[k]);
      if (b.active !== undefined) data.active = !!b.active;
      if (b.sortOrder !== undefined) data.sortOrder = Number(b.sortOrder);
      await db.calcAd.update({ where: { id: String(b.id) }, data });
      return NextResponse.json({ ok: true });
    }
    if (a === "reorderAd") {
      const ad = await db.calcAd.findUnique({ where: { id: String(b.id) } });
      if (!ad) return NextResponse.json({ error: "not found" }, { status: 404 });
      const neighbor = await db.calcAd.findFirst({
        where: b.dir === "up" ? { sortOrder: { lt: ad.sortOrder } } : { sortOrder: { gt: ad.sortOrder } },
        orderBy: { sortOrder: b.dir === "up" ? "desc" : "asc" },
      });
      if (neighbor) { await db.calcAd.update({ where: { id: ad.id }, data: { sortOrder: neighbor.sortOrder } }); await db.calcAd.update({ where: { id: neighbor.id }, data: { sortOrder: ad.sortOrder } }); }
      return NextResponse.json({ ok: true });
    }
    if (a === "deleteAd") { await db.calcAd.delete({ where: { id: String(b.id) } }); return NextResponse.json({ ok: true }); }
    if (a === "setPartnerSignup") {
      const row = await db.integration.findUnique({ where: { key: "exit" } });
      let cfg: Record<string, unknown> = {}; try { cfg = row ? JSON.parse(row.config) : {}; } catch {}
      cfg.partnerSignup = b.on ? "on" : "off";
      await db.integration.upsert({ where: { key: "exit" }, update: { config: JSON.stringify(cfg) }, create: { key: "exit", label: "Exit Optimization", config: JSON.stringify(cfg), connected: true, status: "" } });
      return NextResponse.json({ ok: true, on: !!b.on });
    }
    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (e) { return NextResponse.json({ error: String(e).slice(0, 200) }, { status: 200 }); }
}
