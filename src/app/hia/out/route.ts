import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Outbound link to a public carrier resource. If the target is missing or no longer reachable,
// 301 back to the homepage (per spec — dead PDFs never dead-end).
export async function GET(req: NextRequest) {
  const host = (req.headers.get("host") || "healthinsuranceapplication.com").split(":")[0];
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const home = `${proto}://${host}/`;
  const u = req.nextUrl.searchParams.get("u") || "";
  if (!u || !/^https?:\/\//i.test(u)) return NextResponse.redirect(home, 301);
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const r = await fetch(u, { method: "HEAD", redirect: "follow", signal: ctrl.signal }).catch(() => null);
    clearTimeout(t);
    if (r && r.status < 400) return NextResponse.redirect(u, 302);
    // some servers reject HEAD — try a light GET before giving up
    const ctrl2 = new AbortController();
    const t2 = setTimeout(() => ctrl2.abort(), 6000);
    const r2 = await fetch(u, { method: "GET", redirect: "follow", signal: ctrl2.signal }).catch(() => null);
    clearTimeout(t2);
    if (r2 && r2.status < 400) return NextResponse.redirect(u, 302);
    return NextResponse.redirect(home, 301);
  } catch {
    return NextResponse.redirect(home, 301);
  }
}
