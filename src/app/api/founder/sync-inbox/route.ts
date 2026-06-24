import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { syncInbox } from "@/lib/founder";

const ALLOWED = ["god", "assistant"];

// Pull inbound email over IMAP, match to contacts, persist replies. God / assistant only.
export async function POST() {
  const s = await getSession();
  const isGod = s?.role === "god" || !!s?.impersonatorUid;
  if (!s || (!isGod && !ALLOWED.includes(s.role))) return NextResponse.json({ error: "Founder / assistant only" }, { status: 403 });
  const r = await syncInbox();
  return NextResponse.json(r);
}
