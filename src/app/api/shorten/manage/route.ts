import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createShortlink, listShortlinks } from "@/lib/shorten";

const STAFF = ["god", "marketing", "accounting", "assistant"];

async function guard() {
  const s = await getSession();
  return s && STAFF.includes(s.role) ? null : NextResponse.json({ error: "forbidden" }, { status: 403 });
}

// List saved short links.
export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  return NextResponse.json({ links: await listShortlinks() });
}

// Create a short link with a specific word.
export async function POST(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;
  const b = await req.json().catch(() => ({}) as any);
  const r = await createShortlink(String(b.word || ""), String(b.url || ""));
  if (!r.ok) return NextResponse.json({ error: r.error || "Could not create." }, { status: 400 });
  return NextResponse.json({ short: r.short, links: await listShortlinks() });
}
