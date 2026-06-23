import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { buildSiteBackground } from "@/lib/sitebuilder";

// Kick off a background build from the (possibly edited) brief. Returns immediately;
// the client polls /api/sites/[id]/build-status. God/staff only.
export async function POST(req: NextRequest) {
  const s = await getSession();
  const ok = !!s && (s.role === "god" || s.role === "marketing" || s.role === "accounting" || !!s.impersonatorUid);
  if (!ok) return NextResponse.json({ error: "God / staff only" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "Site id is required." }, { status: 400 });

  const site = await db.site.findUnique({ where: { id } });
  if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });
  if (site.buildStatus === "building") return NextResponse.json({ error: "A build is already running for this site." }, { status: 409 });

  // Accept an edited brief from the review panel; otherwise build from the stored one.
  const briefJson = body.brief ? JSON.stringify(body.brief) : site.buildBrief;
  await db.site.update({ where: { id }, data: { buildBrief: briefJson, buildStatus: "building", buildProgress: JSON.stringify({ done: 0, total: 0, current: "Queued…" }) } });

  buildSiteBackground(id);
  return NextResponse.json({ ok: true });
}
