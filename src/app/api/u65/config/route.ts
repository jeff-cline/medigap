import { NextRequest, NextResponse } from "next/server";
import { loadU65Config, saveU65Config } from "@/lib/u65-store";

export async function GET() {
  return NextResponse.json(await loadU65Config());
}

export async function POST(req: NextRequest) {
  const raw = await req.json().catch(() => ({}));
  const patch = raw && typeof raw === "object" ? raw : {};
  const saved = await saveU65Config(patch);
  return NextResponse.json(saved);
}
