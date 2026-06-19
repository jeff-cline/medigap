import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

function godOrStaff(role?: string, impersonatorUid?: string) {
  return role === "god" || !!impersonatorUid || role === "marketing" || role === "accounting";
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || !godOrStaff(s.role, s.impersonatorUid)) {
    return NextResponse.json({ error: "God / staff only" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");

  if (action === "create") {
    const name = String(body.name || "").trim();
    if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
    const payoutCents = Math.round(Number(body.payoutCents) || 0) * 100;
    const row = await db.upsellOffer.create({
      data: {
        name,
        trigger: String(body.trigger || "").trim(),
        vendor: String(body.vendor || "").trim(),
        payoutCents,
        active: true,
      },
    });
    return NextResponse.json({ ok: true, id: row.id });
  }

  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  if (action === "toggle") {
    const row = await db.upsellOffer.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await db.upsellOffer.update({ where: { id }, data: { active: !row.active } });
    return NextResponse.json({ ok: true });
  }
  if (action === "delete") {
    await db.upsellOffer.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
