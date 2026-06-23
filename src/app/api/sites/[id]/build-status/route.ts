import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Poll a site's build status/progress for the dashboard UI. God/staff only.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  const ok = !!s && (s.role === "god" || s.role === "marketing" || s.role === "accounting" || !!s.impersonatorUid);
  if (!ok) return NextResponse.json({ error: "God / staff only" }, { status: 403 });

  const { id } = await ctx.params;
  const site = await db.site.findUnique({
    where: { id },
    select: { buildStatus: true, buildProgress: true, pages: { select: { slug: true, kind: true, title: true, published: true } } },
  });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let progress: unknown = {};
  try { progress = JSON.parse(site.buildProgress || "{}"); } catch {}
  return NextResponse.json({ buildStatus: site.buildStatus, progress, pages: site.pages }, { headers: { "Cache-Control": "no-store" } });
}
