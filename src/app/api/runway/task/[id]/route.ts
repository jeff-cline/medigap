import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTask } from "@/lib/runway";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s || !["god", "marketing"].includes(s.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  const r = await getTask(id);
  const d = r.data as { status?: string; output?: string[] } | null;
  return NextResponse.json({ ok: r.ok, status: d?.status || "RUNNING", urls: d?.output || [] });
}
