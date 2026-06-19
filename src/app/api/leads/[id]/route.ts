import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const STATUSES = ["new", "contacted", "sold", "dead"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const b = await req.json().catch(() => ({}));

  const data: { status?: string; agentId?: string | null } = {};

  if (typeof b.status === "string") {
    if (!STATUSES.includes(b.status)) return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    data.status = b.status;
  }
  if (b.agentId !== undefined) {
    data.agentId = b.agentId ? String(b.agentId) : null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  try {
    await db.lead.update({ where: { id }, data });
  } catch {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
