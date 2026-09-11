import { NextRequest, NextResponse } from "next/server";
import { loginMammo, createMammoSession } from "@/lib/mammo-auth";
import { guardForm } from "@/lib/form-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const gate = await guardForm(req, "mammo_login", b, { email: String(b.email ?? ""), rateMax: 12 });
  if (gate.blocked) return gate.response;

  const r = await loginMammo(String(b.email ?? ""), String(b.password ?? ""));
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: 401 });

  await createMammoSession({ id: r.account.id, email: r.account.email, firstName: r.account.firstName });
  return NextResponse.json({ ok: true });
}
