import { NextRequest, NextResponse } from "next/server";
import { coreManifest } from "@/lib/core-manifest";

export const dynamic = "force-dynamic";

// Public capabilities manifest — hand this URL to another agent so it knows what the Core offers.
export async function GET(req: NextRequest) {
  const host = (req.headers.get("host") || "medigap.plus").split(":")[0];
  const manifest = await coreManifest(`https://${host}`);
  return NextResponse.json(manifest, { headers: { "Cache-Control": "public, max-age=300" } });
}
