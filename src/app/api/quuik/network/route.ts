import { NextResponse } from "next/server";
import { getCloud } from "@/lib/moneycloud";
import { readClicks, readEvents } from "@/lib/network-leads";
import { readQuestions } from "@/lib/quuik";

export const dynamic = "force-dynamic";
const CORS: Record<string,string> = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
export function OPTIONS() { return new NextResponse(null, { headers: CORS }); }

// Live network state for the "Change the World" deck — businesses (with favicons) + real signal counts.
export async function GET() {
  const cloud = await getCloud();
  const entries = cloud
    .map((e) => ({ title: e.title, keyword: e.keyword, url: `https://el.ag/${encodeURIComponent(e.keyword)}`, favicon: e.favicon, image: e.image || null }))
    .sort((a, b) => a.title.localeCompare(b.title));
  let clicks = 0, events = 0, questions = 0;
  try { clicks = readClicks(100000).length; } catch {}
  try { events = readEvents(100000).length; } catch {}
  try { questions = readQuestions(100000).length; } catch {}
  const CORE = 4; // R0cketShip, Quuik, predictivedata, medigap.ai
  return NextResponse.json({
    businesses: entries.length + CORE,
    networkSites: entries.length,
    signals: clicks + events + questions,
    clicks, events, questions,
    entries,
    at: new Date().toISOString(),
  }, { headers: CORS });
}
