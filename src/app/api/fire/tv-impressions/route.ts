import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { TV_NUMBERS, saveTvImpressions } from "@/lib/tv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const seeOther = (path: string) => new NextResponse(null, { status: 303, headers: { Location: path } });

// Save the Vibe.co impressions per TV campaign so calls-per-1k-impressions can be computed.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return seeOther("/login");
  const fd = await req.formData().catch(() => new FormData());
  const map: Record<string, number> = {};
  for (const n of TV_NUMBERS) {
    map[n.key] = Math.max(0, Math.round(parseFloat(String(fd.get(`imp_${n.key}`) ?? "0")) || 0));
  }
  await saveTvImpressions(map);
  return seeOther("/fire?tab=tv&ok=1");
}
