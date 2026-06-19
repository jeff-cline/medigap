import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

function godOrStaff(role?: string, impersonatorUid?: string) {
  return role === "god" || !!impersonatorUid || role === "risk" || role === "accounting";
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
    const premiumCents = Math.round(Number(body.premiumCents) || 0) * 100;
    const sweepDays = Math.max(0, Math.round(Number(body.sweepDays) || 3));
    const row = await db.riskProduct.create({
      data: { name, premiumCents, sweepDays, apiConfig: "{}", active: true },
    });
    return NextResponse.json({ ok: true, id: row.id });
  }

  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  if (action === "toggle") {
    const row = await db.riskProduct.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await db.riskProduct.update({ where: { id }, data: { active: !row.active } });
    return NextResponse.json({ ok: true });
  }
  if (action === "delete") {
    await db.riskProduct.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
