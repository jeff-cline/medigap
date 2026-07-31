import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { shortenUrl } from "@/lib/shorten";

const STAFF = ["god", "marketing", "accounting", "assistant"];

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || !STAFF.includes(s.role))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const b = await req.json().catch(() => ({} as any));
  const short = await shortenUrl(String(b.url || ""));
  return NextResponse.json({ short });
}
