import { NextRequest, NextResponse } from "next/server";
import { startImpersonation, stopImpersonation } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { userId, stop } = await req.json().catch(() => ({}));
  const res = stop ? await stopImpersonation() : await startImpersonation(String(userId));
  if ("error" in res) return NextResponse.json(res, { status: 403 });
  return NextResponse.json(res);
}
