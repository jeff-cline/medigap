import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Partner self-service: deposit into the pay-per-call balance + toggle availability.
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const action = String(b.action || "");

  if (action === "deposit") {
    const cents = Math.round((Number(b.amount) || 0) * 100);
    if (cents <= 0) return NextResponse.json({ error: "Enter a positive amount." }, { status: 400 });
    await db.user.update({ where: { id: s.uid }, data: { balanceCents: { increment: cents } } });
    await db.transaction.create({ data: { kind: "deposit", userId: s.uid, amountCents: cents, status: "settled", note: "Pay-per-call deposit" } });
    return NextResponse.json({ ok: true });
  }
  if (action === "availability") {
    await db.user.update({ where: { id: s.uid }, data: { available: !!b.available } });
    return NextResponse.json({ ok: true });
  }
  if (action === "phone") {
    await db.user.update({ where: { id: s.uid }, data: { phone: String(b.phone || "").trim() } });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
