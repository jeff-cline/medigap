import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { cannedCreate, sendReply } from "@/lib/inbox";

const STAFF = ["god", "marketing", "accounting", "assistant"];
const MIN_KEYWORD = 3; // keyword is substring-matched against every inbound text — too-short = matches everything

// Collapse whitespace/newlines and cap length so a sloppy multi-line highlight
// can't become a junk keyword.
function normalizeKeyword(raw: string): string {
  return String(raw || "").replace(/\s+/g, " ").trim().slice(0, 60);
}

// Save the highlighted text as a canned keyword AND send the reply now.
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || !STAFF.includes(s.role))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const b = await req.json().catch(() => ({}) as any);
  const keyword = normalizeKeyword(b.keyword);
  const body = String(b.body || "").trim();
  const sender = String(b.sender || "");
  const ourNumber = String(b.ourNumber || "");
  if (!keyword || !body || !sender)
    return NextResponse.json({ error: "keyword, body and sender are required" }, { status: 400 });
  if (keyword.length < MIN_KEYWORD)
    return NextResponse.json(
      { error: `Highlight at least ${MIN_KEYWORD} characters — a shorter keyword would auto-answer almost every text.` },
      { status: 400 },
    );

  // 1) Save the canned (the keyword mapping is wanted regardless of send outcome).
  //    Skip if an active canned row already covers this exact keyword (avoid duplicate rows).
  const kw = keyword.toLowerCase();
  let saved = false;
  try {
    const existing = await db.cannedResponse.findMany({ where: { active: true } });
    const already = existing.some((c) => {
      try {
        return (JSON.parse(c.keywords) as unknown[]).map((k) => String(k).toLowerCase()).includes(kw);
      } catch {
        return false;
      }
    });
    if (!already) await cannedCreate({ label: keyword, keywords: [keyword], reply: body });
    saved = true; // covered — either newly created or already present
  } catch {
    saved = false;
  }
  // 2) Send the reply now.
  const sent = await sendReply({ sender, ourNumber, body, leadId: b.leadId ?? null });
  return NextResponse.json({ saved, sent: sent.ok, error: sent.ok ? undefined : sent.error });
}
