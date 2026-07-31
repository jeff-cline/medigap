import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { notificationCounts } from "@/lib/notifications";

const STAFF = ["god", "marketing", "accounting", "assistant"];

export async function GET() {
  const s = await getSession();
  if (!s || !STAFF.includes(s.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json(await notificationCounts());
}
