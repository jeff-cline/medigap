import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { appendLead, getPDConfig } from "@/lib/predictivedata";

// Manually (re)enrich a lead via PredictiveData. God/staff only.
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s || !["god", "marketing", "accounting"].includes(s.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!(await getPDConfig())) return NextResponse.json({ ok: false, error: "Connect PredictiveData on the Integrations page first." }, { status: 200 });
  const { id } = await ctx.params;
  const r = await appendLead(id);
  return NextResponse.json(r);
}
