import { NextResponse, type NextRequest } from "next/server";

// Expose the current pathname to server components (so we only fire tracking pixels on
// public marketing pages, never the admin dashboard).
export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // The vanity URLs are typed in caps (e.g. /1-800-MEDIGAP). Our routes are lowercase —
  // redirect any mixed/upper-case 1-800-medigap path to its canonical lowercase form.
  if (/^\/1-800-medigap/i.test(path) && path !== path.toLowerCase()) {
    const url = req.nextUrl.clone();
    url.pathname = path.toLowerCase();
    return NextResponse.redirect(url, 308);
  }

  // doublewide.ai is a separate brand on the same Core: serve its landing at the root,
  // while /login, /dashboard, /api, etc. still pass through to the shared Core.
  const host = (req.headers.get("host") || "").split(":")[0].toLowerCase();
  if ((host === "doublewide.ai" || host === "www.doublewide.ai") && path === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/doublewide";
    return NextResponse.rewrite(url);
  }

  // 1-800-medigap.com is a fully STANDALONE senior brand (its own look + footer), wired to the Core.
  // Serve the standalone silo hub at the root; medigap.plus root is untouched.
  if ((host === "1-800-medigap.com" || host === "www.1-800-medigap.com") && path === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/medigap-home";
    return NextResponse.rewrite(url);
  }

  const headers = new Headers(req.headers);
  headers.set("x-pathname", path);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
