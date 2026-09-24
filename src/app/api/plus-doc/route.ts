import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Serves The Plus Network memorandum.
 *
 * Deliberately an API route rather than a bare file in public/: middleware
 * rewrites unreserved paths on the 1800medigap.biz host into the /biz segment,
 * so /the-plus-network-memorandum.pdf would resolve to /biz/... and 404.
 * The middleware matcher excludes api/, so this path is safe on every host.
 */

const FILENAME = "the-plus-network-memorandum.pdf";

export async function GET() {
  try {
    const buf = await readFile(join(process.cwd(), "public", FILENAME));
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="The-Plus-Network_Investment-Memorandum.pdf"`,
        "Content-Length": String(buf.byteLength),
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch {
    return NextResponse.json({ error: "Memorandum unavailable" }, { status: 404 });
  }
}
