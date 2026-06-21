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

  const headers = new Headers(req.headers);
  headers.set("x-pathname", path);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
