import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
const PROFILES = "advertiser:profiles";

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.redirect(new URL("/login", req.url), 303);
  const form = await req.formData().catch(() => null);
  const plan = String(form?.get("plan") || "free").slice(0, 40);

  // Records the chosen plan on the member's advertiser profile (God-visible).
  const row = await db.setting.findUnique({ where: { key: PROFILES } }).catch(() => null);
  const map: Record<string, Record<string, unknown>> = row?.value
    ? (() => { try { return JSON.parse(row.value); } catch { return {}; } })()
    : {};
  map[s.uid] = { ...(map[s.uid] || {}), plan, planAt: new Date().toISOString() };
  await db.setting.upsert({ where: { key: PROFILES }, update: { value: JSON.stringify(map) }, create: { key: PROFILES, value: JSON.stringify(map) } });

  return NextResponse.redirect(new URL("/account", req.url), 303);
}
