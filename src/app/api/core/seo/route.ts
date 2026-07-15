import { NextRequest, NextResponse } from "next/server";
import { verifyCoreKey } from "@/lib/corekeys";
import { getKeywordCpcCents } from "@/lib/dataforseo";

export const dynamic = "force-dynamic";

// CORE API — keyword CPC lookup via the Core's DataForSEO. Auth: x-core-key + x-core-secret,
// scope seo:read. Body: { keyword } → { ok, keyword, cpcCents } (cost-per-click in US cents).
export async function POST(req: NextRequest) {
  const key = await verifyCoreKey(req, "seo:read");
  if (!key) return NextResponse.json({ ok: false, error: "Invalid CORE API credentials or missing seo:read scope." }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const keyword = String(b.keyword || "").trim();
  if (!keyword) return NextResponse.json({ ok: false, error: "keyword is required." }, { status: 400 });

  const cpcCents = await getKeywordCpcCents(keyword);
  if (cpcCents == null) return NextResponse.json({ ok: false, error: "No data (DataForSEO not connected or no result for that keyword)." }, { status: 502 });
  return NextResponse.json({ ok: true, keyword, cpcCents });
}
