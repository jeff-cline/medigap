import { NextRequest, NextResponse } from "next/server";

// Creator tracked link: /c/<code>?to=<url> — drops a 90-day attribution cookie (dw_ref)
// then redirects. Any lead/form the visitor submits gets tied back to <code>.
export async function GET(req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const ref = (code || "").trim().slice(0, 60);
  const to = req.nextUrl.searchParams.get("to") || "https://doublewide.ai";
  // only allow http(s) redirects
  const dest = /^https?:\/\//i.test(to) ? to : "https://doublewide.ai";
  const res = NextResponse.redirect(dest, 302);
  if (ref) res.cookies.set("dw_ref", ref, { maxAge: 60 * 60 * 24 * 90, path: "/", sameSite: "lax" });
  return res;
}
