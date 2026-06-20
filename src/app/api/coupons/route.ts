import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Manage coupons (God / accounting only).
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || !["god", "accounting"].includes(s.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const action = String(b.action || "create");

  if (action === "create") {
    const code = String(b.code || "").trim().toUpperCase();
    const kind = b.kind === "match" ? "match" : "credit";
    if (!code) return NextResponse.json({ error: "Code is required." }, { status: 400 });
    const amountCents = Math.round((Number(b.amount) || 0) * 100); // credit: bonus; match: cap
    const percent = Math.max(0, Math.min(1000, Math.round(Number(b.percent) || 0)));
    if (kind === "credit" && amountCents <= 0) return NextResponse.json({ error: "Enter a credit amount." }, { status: 400 });
    if (kind === "match" && percent <= 0) return NextResponse.json({ error: "Enter a match percent." }, { status: 400 });
    try {
      const row = await db.coupon.create({ data: { code, kind, amountCents, percent, maxRedemptions: Math.max(0, Math.round(Number(b.maxRedemptions) || 0)), oncePerUser: b.oncePerUser !== false, note: String(b.note || "").trim() } });
      return NextResponse.json({ ok: true, id: row.id });
    } catch { return NextResponse.json({ error: `Coupon "${code}" already exists.` }, { status: 409 }); }
  }
  const id = String(b.id || "");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  if (action === "toggle") { const c = await db.coupon.findUnique({ where: { id } }); if (c) await db.coupon.update({ where: { id }, data: { active: !c.active } }); return NextResponse.json({ ok: true }); }
  if (action === "delete") { await db.coupon.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
