import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const TEMP_PASSWORD = "TEMP!234";

export async function POST(req: NextRequest) {
  const s = await getSession();
  const isGod = s?.role === "god" || !!s?.impersonatorUid;
  if (!s || !isGod) {
    return NextResponse.json({ error: "God only" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");

  if (action === "create") {
    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "").trim();
    const role = String(body.role || "agent").trim();
    if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });
    const passwordHash = await bcrypt.hash(TEMP_PASSWORD, 10);
    try {
      const user = await db.user.create({
        data: { email, name, role, passwordHash, mustChangePassword: true, status: "active" },
      });
      return NextResponse.json({ ok: true, id: user.id, tempPassword: TEMP_PASSWORD });
    } catch {
      return NextResponse.json({ error: `A user with ${email} already exists.` }, { status: 409 });
    }
  }

  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "Missing user id." }, { status: 400 });

  if (action === "approve") {
    await db.user.update({ where: { id }, data: { status: "active" } });
    return NextResponse.json({ ok: true });
  }
  if (action === "pause") {
    await db.user.update({ where: { id }, data: { status: "paused" } });
    return NextResponse.json({ ok: true });
  }
  if (action === "reset") {
    const passwordHash = await bcrypt.hash(TEMP_PASSWORD, 10);
    await db.user.update({ where: { id }, data: { mustChangePassword: true, passwordHash } });
    return NextResponse.json({ ok: true, tempPassword: TEMP_PASSWORD });
  }
  if (action === "update") {
    const data: Record<string, unknown> = {};
    if (typeof body.name === "string") data.name = body.name.trim();
    if (typeof body.phone === "string") data.phone = body.phone.trim();
    if (typeof body.role === "string" && body.role.trim()) data.role = body.role.trim();
    if (typeof body.status === "string" && body.status.trim()) data.status = body.status.trim();
    await db.user.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  }
  if (action === "deposit") {
    const cents = Math.round((Number(body.amount) || 0) * 100);
    if (cents <= 0) return NextResponse.json({ error: "Amount must be positive." }, { status: 400 });
    await db.user.update({ where: { id }, data: { balanceCents: { increment: cents } } });
    await db.transaction.create({ data: { kind: "deposit", userId: id, amountCents: cents, status: "settled", note: "Pay-per-call deposit (God)" } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
