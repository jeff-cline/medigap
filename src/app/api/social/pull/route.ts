import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { pullFacebook, fbConfig } from "@/lib/social";

// God: capture a fresh metrics snapshot for every connected social account.
// Also handles the "Clear preview data" form action (deletes the sample snapshots).
export async function POST(req: Request) {
  const s = await getSession();
  if (!s || (s.role !== "god" && !s.impersonatorUid)) return NextResponse.json({ error: "God only" }, { status: 403 });

  if ((req.headers.get("content-type") || "").includes("form")) {
    const form = await req.formData().catch(() => null);
    if (form?.get("clearSample")) {
      await db.socialSnapshot.deleteMany({ where: { userId: "sample" } });
      return NextResponse.redirect(new URL("/dashboard/social-metrics", req.url), 303);
    }
  }

  const conns = await db.socialConnection.findMany({ where: { platform: "facebook" }, select: { userId: true } });
  // OAuth-connected users, else a pasted System User token pulls the business portfolio directly.
  const targets = conns.length ? conns.map((c) => c.userId) : ((await fbConfig()).accessToken ? ["system"] : []);
  if (targets.length === 0) return NextResponse.json({ error: "No Facebook connection yet — connect via Facebook, or paste a System User token on Integrations → Facebook (Doublewide)." }, { status: 400 });

  let captured = 0; const errors: string[] = [];
  for (const uid of targets) {
    const r = await pullFacebook(uid);
    captured += r.captured;
    if (!r.ok && r.error) errors.push(r.error);
  }
  return NextResponse.json({ ok: true, captured, connections: targets.length, errors: [...new Set(errors)] });
}
