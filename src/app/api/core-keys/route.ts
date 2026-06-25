import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { issueKey } from "@/lib/corekeys";

// God-only management of CORE API keys.
function gate(s: Awaited<ReturnType<typeof getSession>>) {
  return !!s && (s.role === "god" || !!s.impersonatorUid);
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!gate(s)) return NextResponse.json({ error: "God only" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const action = String(b.action || "");

  if (action === "issue") {
    const name = String(b.name || "").trim();
    if (!name) return NextResponse.json({ error: "Name the key (e.g. the partner)." }, { status: 400 });
    const scopes = Array.isArray(b.scopes) && b.scopes.length ? b.scopes.join(",") : "lead:create";
    const k = await issueKey({ name, scopes, ownerId: String(b.ownerId || "") });
    // returns the secret ONCE
    return NextResponse.json({ ok: true, keyId: k.keyId, secret: k.secret, scopes: k.scopes });
  }
  if (action === "revoke") {
    const id = String(b.id || "");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await db.apiKey.update({ where: { id }, data: { active: false, revokedAt: new Date() } }).catch(() => {});
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
