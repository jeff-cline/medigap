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

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
