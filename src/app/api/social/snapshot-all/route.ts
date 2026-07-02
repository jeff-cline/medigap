import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pullFacebook, fbConfig } from "@/lib/social";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Daily auto-pull: snapshot every connected social account so the day/week/month trends build
// themselves. Hit by the server cron (key-gated). Also callable by god from the dashboard.
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") || "";
  if (!process.env.AUTH_SECRET || key !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const conns = await db.socialConnection.findMany({ where: { platform: "facebook" } });
  const targets = conns.length ? conns.map((c) => ({ userId: c.userId, name: c.accountName || c.userId })) : ((await fbConfig()).accessToken ? [{ userId: "system", name: "System User token" }] : []);
  let captured = 0;
  const results: { account: string; captured: number; error?: string }[] = [];
  for (const c of targets) {
    const r = await pullFacebook(c.userId).catch((e) => ({ ok: false, captured: 0, error: String(e) }));
    captured += r.captured;
    results.push({ account: c.name, captured: r.captured, error: r.error });
  }
  return NextResponse.json({ ok: true, accounts: targets.length, captured, results, at: new Date().toISOString() });
}
