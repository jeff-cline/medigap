import { NextRequest, NextResponse } from "next/server";
import { keywordCpc, baseCpc } from "@/lib/cpc";

export const dynamic = "force-dynamic";
const parseList = (s: unknown) => String(s ?? "").split(/[\n,]+/).map((x) => x.trim().toLowerCase()).filter(Boolean).slice(0, 30);

// Live cost-per-click reveal for the Join page ("This is your base cost per click, up 22% YoY").
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const moneyWord = String(b.moneyWord || "").trim().toLowerCase();
  if (!moneyWord) return NextResponse.json({ error: "Enter your money word." }, { status: 400 });
  const rows = await keywordCpc([moneyWord, ...parseList(b.adjacent), ...parseList(b.supporting)]);
  return NextResponse.json({ base: baseCpc(rows), rows, up: 22 });
}
