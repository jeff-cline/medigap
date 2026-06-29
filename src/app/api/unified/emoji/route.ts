import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { canUnified } from "@/lib/unified";

// Set a contact's category emoji. God + assistants only.
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || !canUnified(s)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const leadId = String(b.leadId || "");
  const emoji = String(b.emoji || "").slice(0, 8);
  if (!leadId) return NextResponse.json({ error: "Missing leadId" }, { status: 400 });
  await db.lead.update({ where: { id: leadId }, data: { emoji } }).catch(() => {});
  return NextResponse.json({ ok: true, emoji });
}
