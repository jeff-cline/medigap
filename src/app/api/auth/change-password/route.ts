import { NextRequest, NextResponse } from "next/server";
import { getSession, createSession, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { password } = await req.json().catch(() => ({}));
  if (!password || String(password).length < 8)
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  const passwordHash = await hashPassword(String(password));
  await db.user.update({ where: { id: session.uid }, data: { passwordHash, mustChangePassword: false } });
  await createSession({ ...session, mustChangePassword: false });
  return NextResponse.json({ ok: true });
}
