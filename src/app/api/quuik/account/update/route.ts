import { NextRequest, NextResponse } from "next/server";
import { getSession, isGod } from "@/lib/auth";
import { getProfile, patchProfile } from "@/lib/advertiser";
import { setMeta } from "@/lib/moneycloud";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
const parseList = (s: unknown) => String(s ?? "").split(/[\n,]+/).map((x) => x.trim().toLowerCase()).filter(Boolean).slice(0, 30);

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || (!isGod(s) && !["advertiser", "moneywords"].includes(s.role))) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const adjacent = parseList(b.adjacent), supporting = parseList(b.supporting);
  const bidCents = Math.max(0, Math.min(100000, Math.round(Number(b.bidCents) || 0)));
  await patchProfile(s.uid, { adjacent, supporting });
  const p = await getProfile(s.uid);
  const word = (p?.moneyWord || "").toLowerCase();
  if (word) {
    // keep their live cloud entry in sync (only matters once approved/live)
    if (p?.status === "active" || p?.status === "founding") { await setMeta(word, { adjacent, supporting }).catch(() => {}); }
    if (bidCents > 0) await db.agentBid.updateMany({ where: { agentId: s.uid, keyword: word }, data: { amountCents: bidCents } }).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
