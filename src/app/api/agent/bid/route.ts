import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/logic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const { minCallBidCents } = await getSettings();

  const scopeRaw = String(b.scope || "zip");
  const scope = ["zip", "city", "state", "national"].includes(scopeRaw) ? scopeRaw : "zip";
  const scopeValue = scope === "national" ? "" : String(b.scopeValue || "").trim();
  const keyword = String(b.keyword || "").trim().toLowerCase();
  const amountCents = Math.round(Number(b.amountCents) || 0);
  const dailyCap = Math.max(0, Math.round(Number(b.dailyCap) || 0));
  const active = b.active === undefined ? true : Boolean(b.active);

  if (amountCents < minCallBidCents) {
    return NextResponse.json(
      { error: `Bid must be at least $${(minCallBidCents / 100).toFixed(0)} per call.` },
      { status: 400 }
    );
  }
  if (scope !== "national" && !scopeValue) {
    return NextResponse.json({ error: "A target (ZIP/city/state) is required for this scope." }, { status: 400 });
  }

  if (b.id) {
    const existing = await db.agentBid.findUnique({ where: { id: String(b.id) } });
    if (!existing || existing.agentId !== session.uid) {
      return NextResponse.json({ error: "Bid not found." }, { status: 404 });
    }
    await db.agentBid.update({
      where: { id: existing.id },
      data: { scope, scopeValue, keyword, amountCents, dailyCap, active },
    });
  } else {
    await db.agentBid.create({
      data: { agentId: session.uid, scope, scopeValue, keyword, amountCents, dailyCap, active },
    });
  }

  return NextResponse.json({ ok: true });
}
