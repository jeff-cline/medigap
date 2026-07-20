import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Start / pause a campaign.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  const { id } = await params;
  const parsed = z.object({ action: z.enum(["start", "pause"]) }).safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "action required (start|pause)." }, { status: 400 });

  const camp = await db.emailCampaign.findUnique({ where: { id } });
  if (!camp) return NextResponse.json({ ok: false, error: "Campaign not found." }, { status: 404 });

  if (parsed.data.action === "start") {
    await db.emailCampaign.update({ where: { id }, data: { status: "running", startedAt: camp.startedAt ?? new Date() } });
  } else {
    await db.emailCampaign.update({ where: { id }, data: { status: "paused" } });
  }
  return NextResponse.json({ ok: true });
}
