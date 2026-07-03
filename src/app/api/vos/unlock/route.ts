import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Soft gate for /vos — anyone with the access word "krystalore" is let in (per spec).
// Cookie is per-host, so every white-label site gates independently.
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const pw = String(form?.get("password") || "").trim().toLowerCase();
  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "medigap.plus").split(",")[0].trim();
  const proto = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  const url = new URL("/vos", `${proto}://${host}`);

  if (pw !== "krystalore") {
    url.searchParams.set("e", "1");
    return NextResponse.redirect(url, 303);
  }
  const res = NextResponse.redirect(url, 303);
  res.cookies.set("vos_ok", "1", { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax" });
  return res;
}
