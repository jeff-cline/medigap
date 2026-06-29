import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { canUnified } from "@/lib/unified";

// Mark a contact's inbound messages as read in the unified inbox. God (founder) only.
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!canUnified(s)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const leadId = String(b.leadId || "");
  if (!leadId) return NextResponse.json({ error: "Missing leadId" }, { status: 400 });
  const now = new Date();
  await Promise.all([
    db.emailMessage.updateMany({ where: { leadId, direction: "inbound", readAt: null }, data: { readAt: now } }),
    db.smsMessage.updateMany({ where: { leadId, direction: "inbound", readAt: null }, data: { readAt: now } }),
  ]);
  return NextResponse.json({ ok: true });
}
