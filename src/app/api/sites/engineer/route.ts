import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isClaudeConnected } from "@/lib/claude";
import { engineerBrief } from "@/lib/sitebuilder";

// Expand a rough prompt into a structured build brief (Claude). God/staff only.
export async function POST(req: NextRequest) {
  const s = await getSession();
  const ok = !!s && (s.role === "god" || s.role === "marketing" || s.role === "accounting" || !!s.impersonatorUid);
  if (!ok) return NextResponse.json({ error: "God / staff only" }, { status: 403 });

  if (!(await isClaudeConnected())) {
    return NextResponse.json({ ok: false, error: "Connect Claude (Anthropic) on the Integrations page first." }, { status: 200 });
  }

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  const prompt = String(body.prompt || "").trim();
  if (!id || !prompt) return NextResponse.json({ error: "Site id and prompt are required." }, { status: 400 });

  const site = await db.site.findUnique({ where: { id } });
  if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  await db.site.update({ where: { id }, data: { goal: prompt, buildStatus: "engineering" } }).catch(() => {});
  const brief = await engineerBrief(site, prompt);
  if (!brief) {
    await db.site.update({ where: { id }, data: { buildStatus: "none" } }).catch(() => {});
    return NextResponse.json({ ok: false, error: "Claude could not engineer a brief — try again or refine the prompt." }, { status: 200 });
  }

  await db.site.update({ where: { id }, data: { buildStatus: "brief_ready", buildBrief: JSON.stringify(brief) } });
  return NextResponse.json({ ok: true, brief });
}
