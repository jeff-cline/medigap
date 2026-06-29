import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pageTargetFromCode, QR_BASE } from "@/lib/qr";

// Public QR scan endpoint: log the scan, then redirect to the target. Page QR codes (p-…) are
// lazy-created on first scan so they show up in the dashboard.
export async function GET(req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  let qr = await db.qrCode.findUnique({ where: { code } }).catch(() => null);

  if (!qr) {
    const pageTarget = pageTargetFromCode(code);
    if (pageTarget) {
      qr = await db.qrCode.create({ data: { code, label: code.slice(2).replace(/_/g, "/"), targetUrl: pageTarget, kind: "page", source: "page-qr" } }).catch(() => null);
    }
  }
  const target = qr?.targetUrl || QR_BASE;

  if (qr) {
    const ua = (req.headers.get("user-agent") || "").slice(0, 200);
    const ref = (req.headers.get("referer") || "").slice(0, 200);
    await Promise.all([
      db.qrCode.update({ where: { id: qr.id }, data: { scans: { increment: 1 }, lastScanAt: new Date() } }),
      db.qrScan.create({ data: { qrCodeId: qr.id, code, ua, ref } }),
    ]).catch(() => {});
  }
  return NextResponse.redirect(target, 302);
}
