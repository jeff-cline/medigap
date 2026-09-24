import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { quuikAsk, pickAd, pickCitations, logImpression, logQuestion } from "@/lib/quuik";
import { captureQA } from "@/lib/gptfinder";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { q } = await req.json().catch(() => ({}));
  const query = String(q || "").trim();
  if (!query) return NextResponse.json({ error: "Ask something." }, { status: 400 });
  const h = await headers();
  const ip = (h.get("x-real-ip") || (h.get("x-forwarded-for") || "").split(",")[0] || "").trim();
  const [ans, ad, citations] = await Promise.all([quuikAsk(query), pickAd(query), pickCitations(query)]);
  if (ad) logImpression(ad.keyword, query, ip);
  logQuestion(query, ip, citations.map((c) => c.keyword));
  captureQA({ question: query, answer: ans.answer || "", citations }).catch(() => {});
  return NextResponse.json({
    answer: ans.answer, error: ans.error,
    ad: ad ? { keyword: ad.keyword, title: ad.title, desc: ad.desc, image: ad.image, url: `https://el.ag/${encodeURIComponent(ad.keyword)}` } : null,
    citations,
  });
}
