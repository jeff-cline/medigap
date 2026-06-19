import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// God-only: save integration keys. In prod, encrypt `config` at rest (e.g. KMS/libsodium).
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || s.role !== "god") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { key, config, connected } = await req.json().catch(() => ({}));
  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });
  await db.integration.upsert({
    where: { key: String(key) },
    update: { config: JSON.stringify(config ?? {}), connected: !!connected, updatedAt: new Date() },
    create: { key: String(key), label: String(key), config: JSON.stringify(config ?? {}), connected: !!connected },
  });
  return NextResponse.json({ ok: true });
}
