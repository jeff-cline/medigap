import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { sendVibeEvent, clientIp } from "@/lib/vibe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const seeOther = (path: string) => new NextResponse(null, { status: 303, headers: { Location: path } });
const VALID = new Set(["sVPVYAbscyg", "UEjhba0es1E", "Wk0OWf06RrY"]);

// Records a vote for a favorite TV ad on /private-health-insurance. One vote per browser (cookie).
export async function POST(req: NextRequest) {
  const fd = await req.formData().catch(() => new FormData());
  const ad = String(fd.get("ad") || "");
  if (!VALID.has(ad)) return seeOther("/private-health-insurance#ads");

  const jar = await cookies();
  if (jar.get("mg_ad_voted")?.value) return seeOther(`/private-health-insurance?voted=${ad}#ads`); // already voted — no double count

  const row = await db.setting.findUnique({ where: { key: "adVotes" } }).catch(() => null);
  let votes: Record<string, number> = {};
  try { votes = row ? JSON.parse(row.value) : {}; } catch { votes = {}; }
  votes[ad] = (votes[ad] || 0) + 1;
  await db.setting.upsert({ where: { key: "adVotes" }, update: { value: JSON.stringify(votes) }, create: { key: "adVotes", value: JSON.stringify(votes) } }).catch(() => {});

  // Vibe conversion: attribute this vote to the TV household by IP (fire-and-forget).
  void sendVibeEvent("vote", clientIp(req));

  const res = seeOther(`/private-health-insurance?voted=${ad}#ads`);
  res.cookies.set("mg_ad_voted", ad, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 180 * 86400 });
  return res;
}
