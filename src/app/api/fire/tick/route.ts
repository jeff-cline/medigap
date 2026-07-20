import { NextRequest, NextResponse } from "next/server";
import { tickCampaigns } from "@/lib/fire-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Cron-triggered drip tick. Protected by the FIRE_CRON_KEY (header or ?key=).
async function run(req: NextRequest) {
  const key = req.headers.get("x-fire-key") || new URL(req.url).searchParams.get("key") || "";
  if (!process.env.FIRE_CRON_KEY || key !== process.env.FIRE_CRON_KEY) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const result = await tickCampaigns();
  return NextResponse.json(result);
}

export const GET = run;
export const POST = run;
