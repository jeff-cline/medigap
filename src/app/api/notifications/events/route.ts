import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isGod } from "@/lib/auth";
import { db } from "@/lib/db";

async function guard() {
  const s = await getSession();
  return isGod(s) ? null : NextResponse.json({ error: "forbidden" }, { status: 403 });
}

const clampInt = (v: unknown, lo: number, hi: number, dflt: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt;
};

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  const events = await db.notificationEvent.findMany({ orderBy: [{ month: "asc" }, { day: "asc" }] });
  return NextResponse.json({ events });
}

// action: create | update | delete
export async function POST(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;
  const b = await req.json().catch(() => ({}) as any);
  const action = String(b.action || "create");

  if (action === "delete") {
    if (!b.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await db.notificationEvent.delete({ where: { id: String(b.id) } }).catch(() => {});
    return NextResponse.json({ ok: true });
  }

  const data = {
    title: String(b.title || "").slice(0, 200),
    message: String(b.message || "").slice(0, 1000),
    link: String(b.link || "").slice(0, 500),
    month: clampInt(b.month, 1, 12, 1),
    day: clampInt(b.day, 1, 31, 1),
    hour: clampInt(b.hour, 0, 23, 9),
    minute: clampInt(b.minute, 0, 59, 0),
    annual: b.annual !== false,
    year: clampInt(b.year, 0, 3000, 0),
    sendEmail: !!b.sendEmail,
    active: b.active !== false,
  };
  if (!data.message.trim()) return NextResponse.json({ error: "Message is required." }, { status: 400 });

  if (action === "update") {
    if (!b.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    // editing the schedule resets the sent-guard so a corrected date can fire again
    await db.notificationEvent.update({ where: { id: String(b.id) }, data: { ...data, lastSentYear: 0 } }).catch(() => {});
    return NextResponse.json({ ok: true });
  }
  const created = await db.notificationEvent.create({ data });
  return NextResponse.json({ ok: true, id: created.id });
}
