import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// God-only: record a partner payout (the 21st settlement).
export async function POST(req: NextRequest) {
  const s = await getSession();
  const isGod = s?.role === "god" || !!s?.impersonatorUid;
  if (!s || !isGod) return NextResponse.json({ error: "God only" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const userId = String(body.userId || "");
  const amountCents = Math.round(Number(body.amountCents) || 0);
  if (!userId) return NextResponse.json({ error: "Missing user." }, { status: 400 });
  if (amountCents <= 0) return NextResponse.json({ error: "Nothing to pay." }, { status: 400 });

  await db.transaction.create({
    data: { kind: "payout", userId, amountCents, status: "settled", note: String(body.note || "Partner payout") },
  });
  return NextResponse.json({ ok: true });
}
