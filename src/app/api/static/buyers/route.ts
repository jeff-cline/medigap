import { NextRequest, NextResponse } from "next/server";
import { getSession, isGod } from "@/lib/auth";
import { listBuyers, createBuyer, updateBuyer, deleteBuyer, listZipRules, createZipRule, deleteZipRule } from "@/lib/static/buyers";

async function guard() {
  const s = await getSession();
  return isGod(s) ? null : NextResponse.json({ error: "forbidden" }, { status: 403 });
}

export async function GET(req: NextRequest) {
  const bad = await guard(); if (bad) return bad;
  const moneyWordId = req.nextUrl.searchParams.get("moneyWordId");
  if (!moneyWordId) return NextResponse.json({ error: "moneyWordId required" }, { status: 400 });
  return NextResponse.json({ buyers: await listBuyers(moneyWordId), zipRules: await listZipRules(moneyWordId) });
}

export async function POST(req: NextRequest) {
  const bad = await guard(); if (bad) return bad;
  const body = await req.json().catch(() => ({} as any));
  switch (body.action) {
    case "createBuyer": return NextResponse.json(await createBuyer({ moneyWordId: String(body.moneyWordId), name: body.name, defaultNumber: body.defaultNumber }));
    case "updateBuyer": return NextResponse.json(await updateBuyer(String(body.id), body.patch ?? {}));
    case "deleteBuyer": await deleteBuyer(String(body.id)); return NextResponse.json({ ok: true });
    case "createZip":   return NextResponse.json(await createZipRule({ moneyWordId: String(body.moneyWordId), buyerId: String(body.buyerId), zip: String(body.zip ?? ""), radiusMiles: body.radiusMiles }));
    case "deleteZip":   await deleteZipRule(String(body.id)); return NextResponse.json({ ok: true });
    default:            return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }
}
