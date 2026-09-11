import { NextResponse } from "next/server";
import { publicRecaptchaConfig } from "@/lib/recaptcha";

export const dynamic = "force-dynamic";

// Public on purpose: the site key is meant to be in the page source. The secret
// key is never read here. Cached briefly so a hundred forms do not each hit the
// database on first paint.
export async function GET() {
  const cfg = await publicRecaptchaConfig();
  return NextResponse.json(cfg, {
    headers: { "cache-control": "public, max-age=300" },
  });
}
