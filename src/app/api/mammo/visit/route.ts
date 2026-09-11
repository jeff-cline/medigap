import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMammoSession } from "@/lib/mammo-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Visitor identification: a first-party id, the page, and the campaign source.
//
// /answers/* paths are collapsed before storage. A log saying someone read
// about dense breasts is an inference about their body, and holding that is
// not worth the funnel detail.
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const vid = String(b.visitorId ?? "").slice(0, 64);
  if (!vid) return NextResponse.json({ ok: true });

  let path = String(b.path ?? "").slice(0, 200);
  if (path.startsWith("/answers/")) path = "/answers/*";

  const s = await getMammoSession().catch(() => null);
  await db.mammoVisitor.create({
    data: {
      visitorId: vid, path,
      referer: String(b.referer ?? "").slice(0, 300),
      utm: JSON.stringify(b.utm ?? {}).slice(0, 1000),
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "",
      userAgent: (req.headers.get("user-agent") ?? "").slice(0, 300),
      accountId: s?.id ?? "",
    },
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
