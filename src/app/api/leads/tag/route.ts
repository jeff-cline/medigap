import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { parseTags } from "@/lib/recapture";

// Bulk add/remove a tag (e.g. "chapter-1") across selected leads. God/staff only.
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || !["god", "marketing", "accounting"].includes(s.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(b.leadIds) ? b.leadIds.map(String).slice(0, 5000) : [];
  const tag = String(b.tag || "").trim().toLowerCase().replace(/\s+/g, "-");
  const remove = b.remove === true;
  if (!ids.length) return NextResponse.json({ error: "No leads selected." }, { status: 400 });
  if (!tag) return NextResponse.json({ error: "Tag is required." }, { status: 400 });

  const leads = await db.lead.findMany({ where: { id: { in: ids } }, select: { id: true, tags: true } });
  let updated = 0;
  for (const l of leads) {
    const cur = parseTags(l.tags);
    const has = cur.includes(tag);
    let next = cur;
    if (remove && has) next = cur.filter((t) => t !== tag);
    else if (!remove && !has) next = [...cur, tag];
    else continue;
    await db.lead.update({ where: { id: l.id }, data: { tags: JSON.stringify(next) } }).catch(() => {});
    updated++;
  }
  return NextResponse.json({ ok: true, updated, tag });
}
