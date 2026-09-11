import { NextRequest, NextResponse } from "next/server";
import { verifyCoreKey } from "@/lib/corekeys";
import { getZapConfig, verifyZapmailApi } from "@/lib/zapmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// CORE API — read-only Zapmail account status (mailbox emails + counts) for throttling other
// projects' cold-email campaigns. Auth: x-core-key + x-core-secret, scope email:send.
export async function GET(req: NextRequest) {
  const key = await verifyCoreKey(req, "email:send");
  if (!key) return NextResponse.json({ ok: false, error: "Invalid CORE API credentials or missing email:send scope." }, { status: 401 });

  const cfg = await getZapConfig();
  const mailboxes = (cfg?.mailboxes || []).map((m) => ({ email: m.email }));
  let active = mailboxes.length;
  const v = await verifyZapmailApi(cfg || undefined).catch(() => null);
  if (v?.ok && typeof v.mailboxes === "number") active = v.mailboxes;
  return NextResponse.json({ ok: true, storedMailboxes: mailboxes.length, activeMailboxes: active, mailboxes });
}
