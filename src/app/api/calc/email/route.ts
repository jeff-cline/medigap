import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { EXIT_EMAILS } from "@/lib/exit-emails";

export const dynamic = "force-dynamic";
function gate(s: Awaited<ReturnType<typeof getSession>>) { return !!s && (s.role === "god" || !!s.impersonatorUid); }

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!gate(s)) return NextResponse.json({ error: "God only" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const a = String(b.action || "");
  if (a === "seed") {
    for (let i = 0; i < EXIT_EMAILS.length; i++) await db.calcEmail.upsert({ where: { weekIndex: i }, update: {}, create: { weekIndex: i, subject: EXIT_EMAILS[i].subject, storyHeader: EXIT_EMAILS[i].story } });
    return NextResponse.json({ ok: true });
  }
  if (a === "save") {
    const wi = Number(b.weekIndex);
    await db.calcEmail.upsert({
      where: { weekIndex: wi },
      update: { subject: String(b.subject || ""), storyHeader: String(b.storyHeader || ""), active: b.active !== false },
      create: { weekIndex: wi, subject: String(b.subject || ""), storyHeader: String(b.storyHeader || ""), active: b.active !== false },
    });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
