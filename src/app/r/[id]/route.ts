import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { promoteStage } from "@/lib/recapture";

// Tracked CTA link used in cold outreach: /r/<leadId>?to=/medicare
// A click means the recapture contact engaged a call-to-action → promote to "clicked"
// and forward them to the funnel page (carrying ?lead so the form can opt them in).
const ALLOWED = /^\/[a-z0-9/_-]*$/i;

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  let to = url.searchParams.get("to") || "/medicare";
  if (!ALLOWED.test(to)) to = "/medicare";

  const lead = await db.lead.findUnique({ where: { id }, select: { id: true } }).catch(() => null);
  if (lead) {
    await promoteStage(lead.id, "clicked");
    const dest = new URL(to, url.origin);
    dest.searchParams.set("lead", lead.id); // lets the landing form opt the lead in
    return NextResponse.redirect(dest, 302);
  }
  return NextResponse.redirect(new URL(to, url.origin), 302);
}
