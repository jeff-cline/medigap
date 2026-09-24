import { NextResponse, type NextRequest } from "next/server";
import { guardForm } from "@/lib/form-guard";
import { issueMagicToken } from "@/lib/equity/account";
import { sendMagicLink } from "@/lib/equity/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const gate = await guardForm(req, "equity_signin", b, { email: String(b.email ?? "") });
  if (gate.blocked) return gate.response;

  const r = await issueMagicToken(String(b.email ?? ""));
  // Always the same answer whether or not the address exists — otherwise this
  // becomes a way to find out who has an account.
  if (r) {
    await sendMagicLink(r.account.email, r.account.firstName, r.token).catch(() => null);
  }
  return NextResponse.json({ ok: true });
}
