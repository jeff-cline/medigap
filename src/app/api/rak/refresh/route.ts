import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { refreshRakOffers } from "@/lib/rak-refresh";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Real-time keyword offer refresh. GET = server cron (key-gated). POST = god manual "Refresh now".
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") || "";
  if (!process.env.AUTH_SECRET || key !== process.env.AUTH_SECRET) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const r = await refreshRakOffers();
  return NextResponse.json({ ...r, at: new Date().toISOString() });
}

export async function POST() {
  const s = await getSession();
  if (!s || (s.role !== "god" && s.role !== "marketing" && !s.impersonatorUid)) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const r = await refreshRakOffers();
  return NextResponse.json(r);
}
