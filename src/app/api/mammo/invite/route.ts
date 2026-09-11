import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashFor, createManagerSession } from "@/lib/mammo-auth";
import { guardForm } from "@/lib/form-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Accepting an invite: the manager sets their own password, so no password
// ever travels by email or sits in someone's clipboard.
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const gate = await guardForm(req, "mammo_invite", b, { names: [String(b.name ?? "")] });
  if (gate.blocked) return gate.response;

  const token = String(b.token ?? "");
  const password = String(b.password ?? "");
  if (password.length < 9) {
    return NextResponse.json({ error: "Password must be at least 9 characters." }, { status: 400 });
  }

  const inv = await db.mammoInvite.findUnique({ where: { token } });
  if (!inv || inv.usedAt || inv.expiresAt < new Date()) {
    return NextResponse.json({ error: "This invite link is no longer valid. Ask for a new one." }, { status: 400 });
  }

  const email = inv.email.toLowerCase();
  const name = String(b.name ?? inv.name ?? "").trim().slice(0, 120);
  const passwordHash = await hashFor(password);

  // Upsert so a re-invite of an existing manager just resets their password.
  const mgr = await db.mammoManager.upsert({
    where: { email },
    update: { passwordHash, active: true, name: name || undefined },
    create: { email, name, passwordHash },
  });
  await db.mammoInvite.update({ where: { id: inv.id }, data: { usedAt: new Date() } });

  await createManagerSession({ id: mgr.id, email: mgr.email, name: mgr.name });
  return NextResponse.json({ ok: true });
}
