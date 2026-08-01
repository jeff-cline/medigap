import { NextRequest, NextResponse } from "next/server";
import { getSession, isGod } from "@/lib/auth";
import { db } from "@/lib/db";

async function guard() {
  const s = await getSession();
  return isGod(s) ? null : NextResponse.json({ error: "forbidden" }, { status: 403 });
}

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  const numbers = await db.trackingNumber.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ numbers });
}

// action: create | update | delete
export async function POST(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;
  const b = await req.json().catch(() => ({}) as any);
  const action = String(b.action || "update");

  if (action === "delete") {
    if (b.id) await db.trackingNumber.delete({ where: { id: String(b.id) } }).catch(() => {});
    return NextResponse.json({ ok: true });
  }

  const digits = String(b.number || "").replace(/\D/g, "");
  const fields = {
    label: String(b.label || "").slice(0, 120),
    campaign: String(b.campaign || "tv").slice(0, 40) || "tv",
    mode: b.mode === "direct" ? "direct" : "flow",
    moneyWordSlug: String(b.moneyWordSlug || "").slice(0, 120),
    thankYouText: String(b.thankYouText || "").slice(0, 1000),
    billableSeconds: Math.min(3600, Math.max(0, Math.round(Number(b.billableSeconds)) || 120)),
    active: b.active !== false,
  };

  if (action === "create") {
    if (digits.length < 10) return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
    if (fields.mode === "direct" && !fields.moneyWordSlug) return NextResponse.json({ error: "Pick a money word to route direct calls to." }, { status: 400 });
    const created = await db.trackingNumber.upsert({ where: { number: digits }, update: fields, create: { number: digits, ...fields } });
    return NextResponse.json({ ok: true, id: created.id });
  }

  // update
  if (!b.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  if (fields.mode === "direct" && !fields.moneyWordSlug) return NextResponse.json({ error: "Pick a money word to route direct calls to." }, { status: 400 });
  await db.trackingNumber.update({ where: { id: String(b.id) }, data: fields }).catch(() => {});
  return NextResponse.json({ ok: true });
}
