import { NextRequest, NextResponse } from "next/server";
import { getSession, isGod } from "@/lib/auth";
import { getHealthFallbackNumber, setHealthFallbackNumber } from "@/lib/static/settings";

async function guard() {
  const s = await getSession();
  return isGod(s) ? null : NextResponse.json({ error: "forbidden" }, { status: 403 });
}

export async function GET() {
  const bad = await guard(); if (bad) return bad;
  return NextResponse.json({ healthFallbackNumber: await getHealthFallbackNumber() });
}

export async function POST(req: NextRequest) {
  const bad = await guard(); if (bad) return bad;
  const body = await req.json().catch(() => ({} as any));
  await setHealthFallbackNumber(String(body.healthFallbackNumber ?? ""));
  return NextResponse.json({ healthFallbackNumber: await getHealthFallbackNumber() });
}
