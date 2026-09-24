import { NextResponse, type NextRequest } from "next/server";
import { guardForm } from "@/lib/form-guard";
import { verifyPartner, createPartnerSession, destroyPartnerSession } from "@/lib/equity/partner-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const gate = await guardForm(req, "equity_partner_login", b, {
    email: String(b.email ?? ""),
  });
  if (gate.blocked) return gate.response;

  const r = await verifyPartner(String(b.email ?? ""), String(b.password ?? ""));
  if (!r.ok) return NextResponse.json(r, { status: 401 });

  await createPartnerSession({ id: r.partner.id, email: r.partner.email, name: r.partner.name });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await destroyPartnerSession();
  return NextResponse.json({ ok: true });
}
