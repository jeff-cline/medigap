import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { extractMoneyWords, getAIProvider } from "@/lib/voice";

// AI-detect the money words in a call's transcript (God/staff). Caches them on the call.
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s || !["god", "marketing", "moneywords"].includes(s.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!(await getAIProvider())) return NextResponse.json({ ok: false, error: "Connect xAI (Grok) on Integrations to use AI detection." }, { status: 200 });
  const { id } = await ctx.params;
  const call = await db.call.findUnique({ where: { id } });
  if (!call?.transcript) return NextResponse.json({ ok: false, error: "No transcript on this call." }, { status: 200 });
  let turns: { role: string; text: string }[] = [];
  try { turns = JSON.parse(call.transcript); } catch {}
  const words = await extractMoneyWords(turns);
  await db.call.update({ where: { id }, data: { detectedWords: JSON.stringify(words) } }).catch(() => {});
  return NextResponse.json({ ok: true, words });
}
