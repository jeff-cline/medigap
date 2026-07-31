import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { cannedList, cannedCreate, cannedUpdate, cannedDelete } from "@/lib/inbox";

const STAFF = ["god", "marketing", "accounting", "assistant"];

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s || !STAFF.includes(s.role))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const canned = await cannedList();
  return NextResponse.json({ canned });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || !STAFF.includes(s.role))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const b = await req.json().catch(() => ({} as any));
  const action = b.action;

  if (action === "create") {
    const result = await cannedCreate({
      label: b.label,
      keywords: b.keywords,
      reply: b.reply,
      sortOrder: b.sortOrder,
    });
    return NextResponse.json(result, { status: 200 });
  }

  if (action === "update") {
    const result = await cannedUpdate(String(b.id), b.patch ?? {});
    return NextResponse.json(result, { status: 200 });
  }

  if (action === "delete") {
    await cannedDelete(String(b.id));
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
