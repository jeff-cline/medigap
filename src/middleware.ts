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

  // medig.app — Rakuten-monetized lead/offer landers on the Core. Public paths serve the
  // /medigapp segment; shared Core routes (login, dashboard, api, tracking) pass through.
  const RESERVED = /^\/(login|change-password|dashboard|vos|r|robots|sitemap|_next|favicon)/i;
  if (host === "medig.app" || host === "www.medig.app") {
    if (!RESERVED.test(path)) {
      const url = req.nextUrl.clone();
      url.pathname = path === "/" ? "/medigapp" : `/medigapp${path}`;
      return NextResponse.rewrite(url);
    }
  }

  // el.ag — same medig.app engine, but its HOMEPAGE is the /directory; keywords sit directly
  // after the root (el.ag/medicare-insurance → the lander). It's a full SEO/AEO site, so its
  // sitemap.xml / robots.txt / answers / llms.txt serve the medigapp versions too.
  if (host === "el.ag" || host === "www.el.ag") {
    if (!/^\/(login|change-password|dashboard|vos|_next|favicon)/i.test(path)) {
      const url = req.nextUrl.clone();
      url.pathname = path === "/" ? "/medigapp/directory" : `/medigapp${path}`;
      return NextResponse.rewrite(url);
    }
  }

  // medigap.plus/r/* — a WORKING mirror of the full medig.app site (same pages + tracking),
  // for testing on the live HTTPS domain before medig.app DNS is pointed.
  if (path === "/r" || path.startsWith("/r/")) {
    const url = req.nextUrl.clone();
    const rest = path.slice(2); // strip "/r"
    url.pathname = rest && rest !== "/" ? `/medigapp${rest}` : "/medigapp";
    const h = new Headers(req.headers);
    h.set("x-pathname", path); // pages read this to prefix internal links with /r
    return NextResponse.rewrite(url, { request: { headers: h } });
  }

  const headers = new Headers(req.headers);
  headers.set("x-pathname", path);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
