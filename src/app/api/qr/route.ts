import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { randomCode } from "@/lib/qr";

function gate(s: Awaited<ReturnType<typeof getSession>>) {
  return !!s && (s.role === "god" || s.role === "marketing" || !!s.impersonatorUid);
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!gate(s)) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const action = String(b.action || "create");

  if (action === "create") {
    const label = String(b.label || "").trim() || "Untitled QR";
    let targetUrl = String(b.targetUrl || "").trim();
    if (!targetUrl) return NextResponse.json({ error: "Destination URL required" }, { status: 400 });
    if (!/^https?:\/\//i.test(targetUrl)) targetUrl = "https://" + targetUrl;
    const source = String(b.source || "other");
    let code = randomCode();
    for (let i = 0; i < 5; i++) { if (!(await db.qrCode.findUnique({ where: { code } }))) break; code = randomCode(); }
    const qr = await db.qrCode.create({ data: { code, label, targetUrl, source, kind: "campaign" } });
    return NextResponse.json({ ok: true, id: qr.id, code: qr.code });
  }
  if (action === "delete") {
    await db.qrCode.delete({ where: { id: String(b.id || "") } }).catch(() => {});
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
