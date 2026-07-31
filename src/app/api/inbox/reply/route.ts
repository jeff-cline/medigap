import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendReply } from "@/lib/inbox";

const STAFF = ["god", "marketing", "accounting", "assistant"];

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || !STAFF.includes(s.role))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const b = await req.json().catch(() => ({} as any));
  const r = await sendReply({
    sender: String(b.sender || ""),
    ourNumber: String(b.ourNumber || ""),
    body: String(b.body || ""),
    leadId: b.leadId ?? null,
  });
  return NextResponse.json(r, { status: r.ok ? 200 : 400 });
}
