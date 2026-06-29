import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { canUnified } from "@/lib/unified";

// Set a contact's founder rocket score (0–5 🚀). Founder + assistants only.
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!canUnified(s)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const leadId = String(b.leadId || "");
  const score = Math.max(0, Math.min(5, Math.round(Number(b.score) || 0)));
  if (!leadId) return NextResponse.json({ error: "Missing leadId" }, { status: 400 });
  await db.lead.update({ where: { id: leadId }, data: { score } }).catch(() => {});
  return NextResponse.json({ ok: true, score });
}
