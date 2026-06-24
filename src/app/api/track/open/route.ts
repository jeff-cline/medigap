import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// 1x1 transparent GIF returned for every email-open pixel hit.
const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

function gif() {
  return new NextResponse(PIXEL, {
    status: 200,
    headers: { "Content-Type": "image/gif", "Cache-Control": "no-store, no-cache, must-revalidate, private", "Content-Length": String(PIXEL.length) },
  });
}

// Public open-tracking pixel: GET /api/track/open?e=<openToken>. Marks the matching
// founder email as opened (first hit wins) and always returns the pixel. No auth —
// recipients' mail clients hit this directly.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("e") || "";
  if (token) {
    await db.emailMessage.updateMany({
      where: { openToken: token, openedAt: null },
      data: { openedAt: new Date() },
    }).catch(() => {});
  }
  return gif();
}
