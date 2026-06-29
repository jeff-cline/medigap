import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { canUnified } from "@/lib/unified";

// Find any contact to start a text/email from the unified inbox. God (founder) only.
export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!canUnified(s)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (q.length < 2) return NextResponse.json({ leads: [] });
  // `mode: insensitive` is honored on prod (Postgres); the local SQLite types don't include it,
  // so build the filter loosely.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { OR: [
    { name: { contains: q, mode: "insensitive" } },
    { email: { contains: q, mode: "insensitive" } },
    { phone: { contains: q.replace(/\D/g, "") || q } },
    { emoji: q }, // type an emoji to find everyone tagged with it (e.g. 👤 synced contacts)
  ] };
  const leads = await db.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 15,
    select: { id: true, name: true, phone: true, email: true },
  });
  return NextResponse.json({ leads });
}
