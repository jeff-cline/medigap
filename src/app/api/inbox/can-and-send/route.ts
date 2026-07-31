import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { cannedCreate, sendReply } from "@/lib/inbox";

const STAFF = ["god", "marketing", "accounting", "assistant"];

// Save the highlighted text as a canned keyword AND send the reply now.
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || !STAFF.includes(s.role))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const b = await req.json().catch(() => ({}) as any);
  const keyword = String(b.keyword || "").trim();
  const body = String(b.body || "").trim();
  const sender = String(b.sender || "");
  const ourNumber = String(b.ourNumber || "");
  if (!keyword || !body || !sender)
    return NextResponse.json({ error: "keyword, body and sender are required" }, { status: 400 });

  // 1) Save the canned (the keyword mapping is wanted regardless of send outcome).
  let saved = false;
  try {
    await cannedCreate({ label: keyword, keywords: [keyword], reply: body });
    saved = true;
  } catch {
    saved = false;
  }
  // 2) Send the reply now.
  const sent = await sendReply({ sender, ourNumber, body, leadId: b.leadId ?? null });
  return NextResponse.json({ saved, sent: sent.ok, error: sent.ok ? undefined : sent.error });
}
