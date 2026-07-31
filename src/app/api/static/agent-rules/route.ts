import { NextRequest, NextResponse } from "next/server";
import { getSession, isGod } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureAgentRules } from "@/lib/static/agent-rules";

async function guard() {
  const s = await getSession();
  return isGod(s) ? null : NextResponse.json({ error: "forbidden" }, { status: 403 });
}

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  await ensureAgentRules(db); // make sure the built-ins exist
  const rules = await db.agentRule.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  return NextResponse.json({ rules });
}

// action: create | update | delete
export async function POST(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;
  const b = await req.json().catch(() => ({}) as any);
  const action = String(b.action || "create");

  if (action === "delete") {
    if (!b.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    // built-ins can be turned off but not deleted
    const row = await db.agentRule.findUnique({ where: { id: String(b.id) } });
    if (row?.builtin) return NextResponse.json({ error: "Built-in rules can't be deleted — turn it off instead." }, { status: 400 });
    await db.agentRule.delete({ where: { id: String(b.id) } }).catch(() => {});
    return NextResponse.json({ ok: true });
  }

  const fields = {
    trigger: String(b.trigger || "").slice(0, 300),
    label: String(b.label || "").slice(0, 120),
    response: String(b.response || "").slice(0, 1000),
    sms: String(b.sms || "").slice(0, 1000),
    continueMenu: b.continueMenu !== false,
    active: b.active !== false,
  };

  if (action === "update") {
    if (!b.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await db.agentRule.update({ where: { id: String(b.id) }, data: fields }).catch(() => {});
    return NextResponse.json({ ok: true });
  }

  // create custom rule
  if (!fields.trigger.trim()) return NextResponse.json({ error: "A trigger word or phrase is required." }, { status: 400 });
  if (!fields.response.trim() && !fields.sms.trim()) return NextResponse.json({ error: "Add a spoken response and/or a text to send." }, { status: 400 });
  const created = await db.agentRule.create({ data: { kind: "custom", builtin: false, sortOrder: 100, ...fields } });
  return NextResponse.json({ ok: true, id: created.id });
}
