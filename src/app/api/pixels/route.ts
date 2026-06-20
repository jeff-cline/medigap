import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Manage tracking pixels (God / marketing only).
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || !["god", "marketing"].includes(s.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const action = String(b.action || "create");

  if (action === "create") {
    if (!b.name || !b.code) return NextResponse.json({ error: "Name and pixel code are required." }, { status: 400 });
    const row = await db.pixel.create({ data: { name: String(b.name).trim(), code: String(b.code), siteId: b.siteId ? String(b.siteId) : null, active: true } });
    return NextResponse.json({ ok: true, id: row.id });
  }
  const id = String(b.id || "");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  if (action === "update") {
    await db.pixel.update({ where: { id }, data: { name: String(b.name || "").trim(), code: String(b.code || ""), siteId: b.siteId ? String(b.siteId) : null } });
    return NextResponse.json({ ok: true });
  }
  if (action === "toggle") {
    const p = await db.pixel.findUnique({ where: { id } });
    if (p) await db.pixel.update({ where: { id }, data: { active: !p.active } });
    return NextResponse.json({ ok: true });
  }
  if (action === "delete") {
    await db.pixel.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
