import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readInbox, Provider } from "@/lib/imap";

// Read a mailbox's inbound email (Zapmail cold mailbox or Google Workspace business mailbox).
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || !["god", "marketing", "accounting"].includes(s.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { provider } = await req.json().catch(() => ({}));
  if (!["google_workspace", "zapmail"].includes(String(provider))) return NextResponse.json({ error: "Unknown mailbox" }, { status: 400 });
  const r = await readInbox(provider as Provider, 25);
  return NextResponse.json(r);
}
