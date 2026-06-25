import { NextRequest, NextResponse } from "next/server";
import { verifyCoreKey } from "@/lib/corekeys";

export const runtime = "nodejs";

// Auth check for the CORE API. GET with x-core-key + x-core-secret headers.
export async function GET(req: NextRequest) {
  const key = await verifyCoreKey(req);
  if (!key) return NextResponse.json({ ok: false, error: "Invalid or missing CORE API credentials." }, { status: 401 });
  return NextResponse.json({ ok: true, authenticated: true, name: key.name, scopes: key.scopes });
}
