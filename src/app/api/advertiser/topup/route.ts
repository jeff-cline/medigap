import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Top up an advertiser's prepaid ad balance.
//
// Balance is tracked per-Ad (Ad.balanceCents), so a top-up does two things:
//   1) Records the money movement as a settled Transaction (kind:"topup").
//   2) Credits the full amount to ONE ad — the advertiser's most recent ad
//      (newest createdAt), preferring an active one when available. We credit a
//      single ad rather than splitting so the deposited dollars stay intact and
//      easy to reconcile against the Transaction. If the advertiser has no ads
//      yet, the Transaction still records the credit and it can be applied to
//      the first ad they create.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const amountCents = Math.round(Number(b.amountCents) || 0);
  if (amountCents <= 0) {
    return NextResponse.json({ error: "Enter an amount greater than $0." }, { status: 400 });
  }

  // Ledger entry for the money movement.
  await db.transaction.create({
    data: {
      kind: "topup",
      userId: session.uid,
      amountCents,
      status: "settled",
      note: "Balance top-up",
    },
  });

  // Credit the full amount to the most recent ad (active preferred).
  const target =
    (await db.ad.findFirst({
      where: { advertiserId: session.uid, active: true },
      orderBy: { createdAt: "desc" },
    })) ??
    (await db.ad.findFirst({
      where: { advertiserId: session.uid },
      orderBy: { createdAt: "desc" },
    }));

  if (target) {
    await db.ad.update({
      where: { id: target.id },
      data: { balanceCents: { increment: amountCents } },
    });
  }

  return NextResponse.json({ ok: true, applied: !!target });
}
