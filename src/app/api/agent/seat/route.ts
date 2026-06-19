import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const SEAT_FEE_CENTS = 9900;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const zip = String(b.zip || "").replace(/\D/g, "").slice(0, 5);
  if (zip.length !== 5) {
    return NextResponse.json({ error: "Enter a valid 5-digit ZIP." }, { status: 400 });
  }

  const paidThrough = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db.agentSeat.create({
    data: {
      agentId: session.uid,
      zip,
      monthlyFeeCents: SEAT_FEE_CENTS,
      active: true,
      paidThrough,
    },
  });

  await db.transaction.create({
    data: {
      kind: "charge",
      userId: session.uid,
      amountCents: SEAT_FEE_CENTS,
      note: `Seat ${zip}`,
    },
  });

  return NextResponse.json({ ok: true });
}
