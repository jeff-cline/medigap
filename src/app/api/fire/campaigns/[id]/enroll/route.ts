import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { enrollListIntoCampaign } from "@/lib/fire-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Add a list's contacts into an existing campaign and (re)start sending — the "Add to Bucket" action.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  const { id } = await params;
  const parsed = z.object({ listId: z.string().min(1) }).safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Pick a list." }, { status: 400 });

  const camp = await db.emailCampaign.findUnique({ where: { id } });
  if (!camp) return NextResponse.json({ ok: false, error: "Campaign not found." }, { status: 404 });

  const { added, skipped } = await enrollListIntoCampaign(id, parsed.data.listId);
  // start sending the newly-added recipients (they're due now)
  if (added > 0) await db.emailCampaign.update({ where: { id }, data: { status: "running", startedAt: camp.startedAt ?? new Date() } });

  return NextResponse.json({ ok: true, added, skipped });
}
