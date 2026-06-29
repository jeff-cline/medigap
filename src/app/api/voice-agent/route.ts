import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Save the Voice Agent config (God/staff only).
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || !["god", "marketing"].includes(s.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof b.active === "boolean") data.active = b.active;
  if (typeof b.forwardWhenDone === "boolean") data.forwardWhenDone = b.forwardWhenDone;
  if (typeof b.voice === "string") data.voice = b.voice;
  if (typeof b.tone === "string") data.tone = b.tone;
  if (typeof b.greeting === "string") data.greeting = b.greeting;
  if (typeof b.systemPrompt === "string") data.systemPrompt = b.systemPrompt;
  if (typeof b.maxTurns === "number") data.maxTurns = Math.max(2, Math.min(20, b.maxTurns));
  if (typeof b.engine === "string" && ["", "xai", "groq"].includes(b.engine)) data.engine = b.engine;
  if (Array.isArray(b.questions)) data.questions = JSON.stringify(b.questions);
  data.updatedAt = new Date();
  await db.voiceAgent.upsert({ where: { id: "default" }, update: data, create: { id: "default", ...data } });
  return NextResponse.json({ ok: true });
}
