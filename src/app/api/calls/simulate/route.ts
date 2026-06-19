import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { routeCall } from "@/lib/logic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const zip = String(b.zip || "").trim();
  const state = String(b.state || "").trim().toUpperCase();

  if (!zip && !state) {
    return NextResponse.json({ error: "Provide a zip or state to route." }, { status: 400 });
  }

  let leadId: string | undefined = b.leadId ? String(b.leadId) : undefined;
  // If no lead specified, attach a random existing lead (best-effort) for a realistic journey.
  if (!leadId) {
    const count = await db.lead.count();
    if (count > 0) {
      const skip = Math.floor(Math.random() * count);
      const lead = await db.lead.findFirst({ skip, select: { id: true } });
      leadId = lead?.id;
    }
  }

  const { winner, priceCents, call } = await routeCall({
    zip,
    state,
    leadId,
    source: b.source ? String(b.source) : undefined,
    moneyWord: b.moneyWord ? String(b.moneyWord) : undefined,
  });

  return NextResponse.json({
    ok: true,
    callId: call.id,
    winner: winner?.agentId ?? null,
    priceCents,
  });
}
