import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { buildCloud } from "@/lib/wordcloud";

// Live feed for the Arm-Cloud page. Returns the current candidate words across all
// call transcripts (armed words already filtered out). Polled by the client so new
// words bubble in as calls come in.
export async function GET() {
  const s = await getSession();
  const allowed = !!s && (["god", "moneywords", "marketing"].includes(s.role) || !!s.impersonatorUid);
  if (!allowed) return NextResponse.json({ error: "God / staff only" }, { status: 403 });
  const cloud = await buildCloud();
  return NextResponse.json(cloud, { headers: { "Cache-Control": "no-store" } });
}
