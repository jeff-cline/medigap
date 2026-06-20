import { NextResponse, type NextRequest } from "next/server";

// Expose the current pathname to server components (so we only fire tracking pixels on
// public marketing pages, never the admin dashboard).
export function middleware(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
