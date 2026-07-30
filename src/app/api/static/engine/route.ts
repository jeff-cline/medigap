import { NextRequest, NextResponse } from "next/server";
import { getSession, isGod } from "@/lib/auth";
import { getActiveEngine, setActiveEngine } from "@/lib/static/engine";

export async function GET() {
  const s = await getSession();
  if (!isGod(s)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json({ engine: await getActiveEngine() });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!isGod(s)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({} as any));
  await setActiveEngine(body.engine === "static" ? "static" : "fluid");
  return NextResponse.json({ engine: await getActiveEngine() });
}
