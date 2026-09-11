import { NextResponse } from "next/server";
import { publicRecaptchaConfig } from "@/lib/recaptcha";

export const dynamic = "force-dynamic";

// The site key is public by design — it is meant to sit in the page source.
// The secret key is never read here.
//
// MUST NOT be HTTP-cached. This endpoint is the switch that tells every form
// whether to attach a token, and a cached "disabled" answer is silent: the
// browser keeps posting without a token, and the moment enforcement is turned
// on those submissions are dropped as bots. Caching it for five minutes was a
// real bug — after the keys were saved, pages kept seeing enabled:false.
//
// The database read is protected by a short in-process memo instead, which
// costs nothing and cannot go stale on someone else's machine.
let memo: { at: number; value: Awaited<ReturnType<typeof publicRecaptchaConfig>> } | null = null;
const MEMO_MS = 15_000;

export async function GET() {
  const now = Date.now();
  if (!memo || now - memo.at > MEMO_MS) {
    memo = { at: now, value: await publicRecaptchaConfig() };
  }
  return NextResponse.json(memo.value, {
    headers: { "cache-control": "no-store, must-revalidate" },
  });
}
