import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

function godOrStaff(role?: string, impersonatorUid?: string) {
  return role === "god" || !!impersonatorUid || role === "moneywords" || role === "marketing";
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || !godOrStaff(s.role, s.impersonatorUid)) {
    return NextResponse.json({ error: "God / staff only" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");

  if (action === "create") {
    const word = String(body.word || "").trim().toLowerCase();
    if (!word) return NextResponse.json({ error: "Word is required." }, { status: 400 });
    const payoutCents = Math.round(Number(body.payoutCents) || 0) * 100;
    try {
      const row = await db.moneyWord.create({
        data: {
          word,
          partner: String(body.partner || "").trim(),
          action: body.flowAction === "qualify" ? "qualify" : "transfer",
          logic: String(body.logic || "[]"),
          payoutCents,
          routeUserId: body.routeUserId ? String(body.routeUserId) : null,
          routeNumber: String(body.routeNumber || "").trim(),
          active: true,
        },
      });
      return NextResponse.json({ ok: true, id: row.id });
    } catch {
      return NextResponse.json({ error: `"${word}" is already a money word.` }, { status: 409 });
    }
  }

  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  if (action === "toggle") {
    const row = await db.moneyWord.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await db.moneyWord.update({ where: { id }, data: { active: !row.active } });
    return NextResponse.json({ ok: true });
  }
  if (action === "delete") {
    await db.moneyWord.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
