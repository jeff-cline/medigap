import { NextRequest, NextResponse } from "next/server";
import { getSession, startImpersonation, stopImpersonation } from "@/lib/auth";

export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  if (b.stop) return NextResponse.json(await stopImpersonation());
  const s = await getSession();
  if (!s || s.role !== "god") return NextResponse.json({ error: "Only God can impersonate." }, { status: 403 });
  const uid = String(b.uid || ""); if (!uid) return NextResponse.json({ error: "uid required" }, { status: 400 });
  return NextResponse.json(await startImpersonation(uid));
}
