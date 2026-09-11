import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readReviewInbox } from "@/lib/spam-inbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Reads the reserved spam-review mailbox. God only — it contains whatever the
// founder forwarded, which is other people's submissions.
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "god") {
    return NextResponse.json({ error: "God only" }, { status: 403 });
  }
  const r = await readReviewInbox(25);
  return NextResponse.json(r);
}
