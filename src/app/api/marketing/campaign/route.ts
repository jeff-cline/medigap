import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Marketing console: create campaigns / toggle them active.
// God or staff (marketing) may write — same gating style as the rest of the API.
function canWrite(role: string | undefined, impersonatorUid: string | undefined) {
  return role === "god" || !!impersonatorUid || role === "marketing" || role === "staff";
}

const CHANNELS = ["google", "facebook", "tv", "vibe", "organic"];

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || !canWrite(s.role, s.impersonatorUid)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const action = body?.action;

  if (action === "toggle") {
    if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const existing = await db.campaign.findUnique({ where: { id: String(body.id) } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await db.campaign.update({ where: { id: existing.id }, data: { active: !existing.active } });
    return NextResponse.json({ ok: true });
  }

  if (action === "create") {
    const channel = CHANNELS.includes(body.channel) ? body.channel : "google";
    const name = String(body.name || "").trim();
    if (!name) return NextResponse.json({ error: "Campaign name required" }, { status: 400 });
    const variant = body.variant === "B" ? "B" : "A";
    const spendCents = Math.max(0, Math.round(Number(body.spendCents) || 0));
    await db.campaign.create({
      data: {
        channel,
        name,
        vertical: String(body.vertical || "medicare").trim() || "medicare",
        variant,
        headline: String(body.headline || "").trim(),
        description: String(body.description || "").trim(),
        spendCents,
        active: true,
      },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
