import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Offers CRUD. Owners (brands) manage their own; God manages all + can flip scope to "network".
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const isGod = s.role === "god" || !!s.impersonatorUid;
  const b = await req.json().catch(() => ({}));
  const action = String(b.action || "save");

  if (action === "save") {
    const name = String(b.name || "").trim();
    if (!name) return NextResponse.json({ error: "Offer name is required." }, { status: 400 });
    const data = {
      name,
      description: String(b.description || "").slice(0, 600),
      url: String(b.url || "").trim().slice(0, 400),
      payoutCents: Math.max(0, Math.round(Number(b.payoutDollars) * 100) || 0),
      category: String(b.category || "").trim().slice(0, 40),
      // only God may publish to the whole network (JV backfill); owners stay "account".
      scope: isGod && b.scope === "network" ? "network" : "account",
      active: b.active !== false,
    };
    if (b.id) {
      const o = await db.offer.findUnique({ where: { id: String(b.id) } });
      if (!o) return NextResponse.json({ error: "Offer not found" }, { status: 404 });
      if (!isGod && o.ownerId !== s.uid) return NextResponse.json({ error: "Not your offer" }, { status: 403 });
      await db.offer.update({ where: { id: o.id }, data: { ...data, scope: isGod ? data.scope : o.scope } });
      return NextResponse.json({ ok: true, id: o.id });
    }
    const o = await db.offer.create({ data: { ...data, ownerId: b.ownerId && isGod ? String(b.ownerId) : s.uid } });
    return NextResponse.json({ ok: true, id: o.id });
  }

  const id = String(b.id || "");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const o = await db.offer.findUnique({ where: { id } });
  if (!o) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isGod && o.ownerId !== s.uid) return NextResponse.json({ error: "Not your offer" }, { status: 403 });

  if (action === "toggle") { await db.offer.update({ where: { id }, data: { active: !o.active } }); return NextResponse.json({ ok: true }); }
  if (action === "delete") { await db.offer.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
