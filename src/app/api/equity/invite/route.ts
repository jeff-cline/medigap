import { NextResponse, type NextRequest } from "next/server";
import { guardForm } from "@/lib/form-guard";
import { acceptInvite, createPartnerSession } from "@/lib/equity/partner-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// A partner redeeming their invitation and choosing a password.
export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const gate = await guardForm(req, "equity_invite", b, {});
  if (gate.blocked) return gate.response;

  const r = await acceptInvite(String(b.token ?? ""), String(b.password ?? ""));
  if (!r.ok) return NextResponse.json(r, { status: 400 });

  // Sign them straight in — asking someone to log in immediately after setting
  // a password is a step that exists for no one's benefit.
  await createPartnerSession({ id: r.partner.id, email: r.partner.email, name: r.partner.name });
  return NextResponse.json({ ok: true });
}
