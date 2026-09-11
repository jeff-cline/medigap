import { NextRequest, NextResponse } from "next/server";
import { loginManager, createManagerSession, destroyManagerSession } from "@/lib/mammo-auth";
import { guardForm } from "@/lib/form-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const gate = await guardForm(req, "mammo_manager_login", b, { email: String(b.email ?? ""), rateMax: 10 });
  if (gate.blocked) return gate.response;

  const r = await loginManager(String(b.email ?? ""), String(b.password ?? ""));
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: 401 });

  await createManagerSession({ id: r.manager.id, email: r.manager.email, name: r.manager.name });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await destroyManagerSession();
  return NextResponse.json({ ok: true });
}
