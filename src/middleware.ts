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
  // mammo.express — the whole host is its own site, so everything that is not
  // shared infrastructure rewrites into /mammo.
  if (host === "mammo.express" || host === "www.mammo.express") {
    // /login and /logout are NOT shared: mammo.express has its own consumer
    // login at /mammo/login. Leaving them shared sent a woman booking a
    // mammogram to the Core's staff sign-in. The God account uses medigap.plus.
    const SHARED = ["/api", "/_next", "/favicon", "/dashboard", "/brand"];
    if (!SHARED.some((p) => path === p || path.startsWith(p))) {
      const url = req.nextUrl.clone();
      url.pathname = path === "/" ? "/mammo" : `/mammo${path}`;
      return NextResponse.rewrite(url);
    }
  }

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
  const RESERVED = /^\/(login|change-password|dashboard|unified|partner|agent|advertiser|investor|vos|r|robots|sitemap|ads\.txt|_next|favicon)/i;
  if (host === "medig.app" || host === "www.medig.app") {
    if (!RESERVED.test(path)) {
      const url = req.nextUrl.clone();
      url.pathname = path === "/" ? "/medigapp" : `/medigapp${path}`;
      return NextResponse.rewrite(url);
    }
  }

  // healthinsuranceapplication.com — programmatic SEO/AEO application repository (/hia segment).
  if (host === "healthinsuranceapplication.com" || host === "www.healthinsuranceapplication.com") {
    if (!/^\/(login|change-password|dashboard|unified|partner|agent|advertiser|investor|vos|ads\.txt|_next|favicon)/i.test(path)) {
      const url = req.nextUrl.clone();
      url.pathname = path === "/" ? "/hia" : `/hia${path}`;
      return NextResponse.rewrite(url);
    }
  }

  // 1800medigap.biz — investor / JV / BD power-platform lander (/biz segment).
  // /login, /dashboard, /unified etc. pass through to the Core (owner god access).
  if (host === "1800medigap.biz" || host === "www.1800medigap.biz") {
    if (!/^\/(login|change-password|dashboard|unified|partner|agent|advertiser|investor|vos|ads\.txt|_next|favicon)/i.test(path)) {
      const url = req.nextUrl.clone();
      url.pathname = path === "/" ? "/biz" : `/biz${path}`;
      return NextResponse.rewrite(url);
    }
  }

  // exitoptimization.com — SEO/AEO lead-gen site on the Core (serves the /exit segment).
  if (host === "exitoptimization.com" || host === "www.exitoptimization.com") {
    if (!/^\/(login|change-password|dashboard|unified|partner|agent|advertiser|investor|vos|ads\.txt|_next|favicon)/i.test(path)) {
      const url = req.nextUrl.clone();
      url.pathname = path === "/" ? "/exit" : `/exit${path}`;
      return NextResponse.rewrite(url);
    }
  }

  // experientialmarketing.ai (XM) — a standalone partner brand on the Core: public paths serve
  // the /xm segment; shared Core routes (login, dashboard, api, vos) pass through.
  if (host === "experientialmarketing.ai" || host === "www.experientialmarketing.ai") {
    // Minimal reserved set so XM serves its OWN sitemap.xml / robots.txt / llms.txt / answers.
    if (!/^\/(login|change-password|dashboard|unified|partner|agent|advertiser|investor|vos|ads\.txt|_next|favicon)/i.test(path)) {
      const url = req.nextUrl.clone();
      url.pathname = path === "/" ? "/xm" : `/xm${path}`;
      return NextResponse.rewrite(url);
    }
  }

  // el.ag — same medig.app engine, but its HOMEPAGE is the /directory; keywords sit directly
  // after the root (el.ag/medicare-insurance → the lander). It's a full SEO/AEO site, so its
  // sitemap.xml / robots.txt / answers / llms.txt serve the medigapp versions too.
  if (host === "el.ag" || host === "www.el.ag") {
    if (!/^\/(login|change-password|dashboard|unified|partner|agent|advertiser|investor|vos|ads\.txt|_next|favicon)/i.test(path)) {
      const url = req.nextUrl.clone();
      url.pathname = path === "/" ? "/medigapp/directory" : `/medigapp${path}`;
      return NextResponse.rewrite(url);
    }
  }

  // quuik.com — Trusted GPT answer box (host-routed to /quuik). Assets + api pass through.
  if (host === "quuik.com" || host === "www.quuik.com") {
    if (!/^\/(api|_next|favicon|quuik-assets)/i.test(path)) {
      const url = req.nextUrl.clone();
      url.pathname = path === "/" ? "/quuik" : `/quuik${path}`;
      { const res = NextResponse.rewrite(url); if (!req.cookies.get("rocket_vid")?.value) res.cookies.set("rocket_vid", crypto.randomUUID(), { path: "/", maxAge: 63072000, sameSite: "lax" }); return res; }
    }
  }

  // siimpler.com — email-consolidation platform (host-routed to /siimpler).
  if (host === "siimpler.com" || host === "www.siimpler.com") {
    if (!/^\/(api|_next|favicon|siimpler-assets|robots\.txt|sitemap\.xml)/i.test(path)) {
      const url = req.nextUrl.clone();
      url.pathname = path === "/" ? "/siimpler" : `/siimpler${path}`;
      { const res = NextResponse.rewrite(url); if (!req.cookies.get("rocket_vid")?.value) res.cookies.set("rocket_vid", crypto.randomUUID(), { path: "/", maxAge: 63072000, sameSite: "lax" }); return res; }
    }
  }

  // equity.direct — home-equity access marketing + lead-gen portal, host-routed
  // to /equity. The whole host is its own site, so everything that is not shared
  // Core infrastructure rewrites in.
  //
  // /login and /logout are deliberately NOT shared: equity.direct has its own
  // homeowner and partner sign-ins under /equity. The God account administers it
  // from medigap.plus, the same split mammo.express uses.
  //
  // robots.txt and sitemap.xml pass through so the host can serve its own — the
  // 100 keyword pages are the point of the site and have to be crawlable.
  if (host === "equity.direct" || host === "www.equity.direct") {
    const SHARED = ["/api", "/_next", "/favicon", "/dashboard", "/brand", "/uploads"];
    const OWN = /^\/(robots\.txt|sitemap\.xml|sitemap-.*\.xml)$/i.test(path);
    if (OWN) {
      const url = req.nextUrl.clone();
      url.pathname = `/equity${path}`;
      return NextResponse.rewrite(url);
    }
    if (!SHARED.some((p) => path === p || path.startsWith(p))) {
      const url = req.nextUrl.clone();
      url.pathname = path === "/" ? "/equity" : `/equity${path}`;
      const h = new Headers(req.headers);
      // Pages read this to know which keyword page a lead started on — the
      // attribution the CRM is built around.
      h.set("x-pathname", path);
      const res = NextResponse.rewrite(url, { request: { headers: h } });
      // First-party visitor id, same cookie the rest of the network uses, so a
      // homeowner's journey across sites stays one person.
      if (!req.cookies.get("rocket_vid")?.value) {
        res.cookies.set("rocket_vid", crypto.randomUUID(), {
          path: "/", maxAge: 63072000, sameSite: "lax",
        });
      }
      // Partner attribution. A referral link is ?p=<code>, and the code has to
      // survive the homeowner browsing several of the hundred pages before they
      // fill anything in — so it goes in a cookie rather than being read off
      // the URL at submit time. First touch wins: whoever actually sent them
      // keeps the credit even if they later arrive again from somewhere else.
      const p = req.nextUrl.searchParams.get("p");
      if (p && /^[a-z0-9]{4,16}$/.test(p) && !req.cookies.get("eq_ref")?.value) {
        res.cookies.set("eq_ref", p, {
          path: "/", maxAge: 60 * 60 * 24 * 90, sameSite: "lax",
        });
      }
      return res;
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
