import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const ALLOWED = ["god", "assistant"];
function gate(s: Awaited<ReturnType<typeof getSession>>) {
  const isGod = s?.role === "god" || !!s?.impersonatorUid;
  return !!s && (isGod || ALLOWED.includes(s.role));
}

export async function GET() {
  const s = await getSession();
  if (!gate(s)) return NextResponse.json({ error: "Founder / assistant only" }, { status: 403 });
  const templates = await db.emailTemplate.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ templates });
}

// Create / update / delete a template.
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!gate(s)) return NextResponse.json({ error: "Founder / assistant only" }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const action = String(b.action || "save");

  if (action === "delete") {
    if (!b.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await db.emailTemplate.delete({ where: { id: String(b.id) } }).catch(() => {});
    return NextResponse.json({ ok: true });
  }

  const name = String(b.name || "").trim();
  if (!name) return NextResponse.json({ error: "Template name is required." }, { status: 400 });
  const data = { name, subject: String(b.subject || ""), html: String(b.html || ""), text: String(b.text || "") };
  try {
    const row = b.id
      ? await db.emailTemplate.update({ where: { id: String(b.id) }, data })
      : await db.emailTemplate.create({ data });
    return NextResponse.json({ ok: true, id: row.id });
  } catch {
    return NextResponse.json({ error: `A template named “${name}” already exists.` }, { status: 409 });
  }
}
