import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// God-only: persist any subset of settings (key/value pairs).
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || s.role !== "god") return NextResponse.json({ error: "God only" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const entries = Object.entries(body || {}) as [string, unknown][];
  await Promise.all(
    entries.map(([key, value]) =>
      db.setting.upsert({ where: { key }, update: { value: String(value) }, create: { key, value: String(value) } })
    )
  );
  return NextResponse.json({ ok: true, saved: entries.length });
}
