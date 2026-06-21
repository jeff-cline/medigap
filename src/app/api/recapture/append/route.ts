import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { appendLead, getPDConfig } from "@/lib/predictivedata";

export const maxDuration = 300;

// Bulk PredictiveData append for a selected set of recapture leads. God/staff only.
// Runs with light concurrency so a "select all → append all" stays responsive.
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || !["god", "marketing", "accounting"].includes(s.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!(await getPDConfig())) return NextResponse.json({ ok: false, error: "Connect PredictiveData on the Integrations page first." }, { status: 200 });

  const b = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(b.leadIds) ? b.leadIds.map(String).slice(0, 1000) : [];
  if (!ids.length) return NextResponse.json({ error: "No leads selected." }, { status: 400 });

  let matched = 0, processed = 0;
  const POOL = 5;
  for (let i = 0; i < ids.length; i += POOL) {
    const slice = ids.slice(i, i + POOL);
    const results = await Promise.all(slice.map((id) => appendLead(id).catch(() => ({ ok: false, matched: false }))));
    for (const r of results) { processed++; if (r.matched) matched++; }
  }
  return NextResponse.json({ ok: true, processed, matched });
}
