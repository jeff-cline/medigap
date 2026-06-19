import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/logic";

// Buy a coverage seat: ZIP, whole State, or Nationwide. Fee is deducted from the prepaid balance.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const scope = ["zip", "state", "national"].includes(String(b.scope)) ? String(b.scope) : "zip";
  let scopeValue = String(b.scopeValue || b.zip || "").trim();
  if (scope === "zip") {
    scopeValue = scopeValue.replace(/\D/g, "").slice(0, 5);
    if (scopeValue.length !== 5) return NextResponse.json({ error: "Enter a valid 5-digit ZIP." }, { status: 400 });
  } else if (scope === "state") {
    scopeValue = scopeValue.toUpperCase().slice(0, 2);
    if (scopeValue.length !== 2) return NextResponse.json({ error: "Enter a 2-letter state (e.g. TX)." }, { status: 400 });
  } else {
    scopeValue = "";
  }

  const s = await getSettings();
  const fee = scope === "national" ? s.seatNationalCents : scope === "state" ? s.seatStateCents : s.seatZipCents;

  const me = await db.user.findUnique({ where: { id: session.uid } });
  if ((me?.balanceCents ?? 0) < fee) {
    return NextResponse.json({ error: `Insufficient balance. This seat is $${(fee / 100).toFixed(0)}/mo — add funds first.` }, { status: 400 });
  }

  const paidThrough = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.agentSeat.create({ data: { agentId: session.uid, zip: scope === "zip" ? scopeValue : "", scope, scopeValue, monthlyFeeCents: fee, active: true, paidThrough } });
  await db.user.update({ where: { id: session.uid }, data: { balanceCents: { decrement: fee } } });
  await db.transaction.create({ data: { kind: "charge", userId: session.uid, amountCents: fee, status: "settled", note: `${scope} seat ${scopeValue || "USA"}` } });

  return NextResponse.json({ ok: true });
}
