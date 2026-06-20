import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { audienceCount, AudienceFilter } from "@/lib/comms";

// Live audience size for a segment filter.
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || !["god", "marketing", "accounting"].includes(s.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const count = await audienceCount((b.filter || { type: "all" }) as AudienceFilter);
  return NextResponse.json({ ok: true, count });
}
