import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/logic";

// Persist an investor deposit.
//
// For the session user we upsert their Investor row (creating one with
// accredited=false if they have none yet), increment depositedCents by the
// deposit, and credit the post-management-fee amount to deployedCents (their
// capital is the "next money in line" on media). We also write two
// Transactions: the gross deposit and the management fee charge, so the
// statement reconciles to the cent.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const amountCents = Math.round(Number(b.amountCents) || 0);
  if (amountCents <= 0) {
    return NextResponse.json({ error: "Enter an amount greater than $0." }, { status: 400 });
  }

  const { mgmtFeePct } = await getSettings();
  const feeCents = Math.round(amountCents * (mgmtFeePct / 100));
  const deployedAfterFee = amountCents - feeCents;

  const existing = await db.investor.findFirst({ where: { userId: session.uid } });
  if (existing) {
    await db.investor.update({
      where: { id: existing.id },
      data: {
        depositedCents: { increment: amountCents },
        deployedCents: { increment: deployedAfterFee },
      },
    });
  } else {
    await db.investor.create({
      data: {
        userId: session.uid,
        accredited: false,
        depositedCents: amountCents,
        deployedCents: deployedAfterFee,
        profitCents: 0,
      },
    });
  }

  // Money-movement records.
  await db.transaction.create({
    data: {
      kind: "deposit",
      userId: session.uid,
      amountCents,
      status: "settled",
      note: "Investor deposit",
    },
  });
  await db.transaction.create({
    data: {
      kind: "fee",
      userId: session.uid,
      amountCents: feeCents,
      status: "settled",
      note: `Management fee (${mgmtFeePct}%)`,
    },
  });

  return NextResponse.json({ ok: true, deployedAfterFee });
}
