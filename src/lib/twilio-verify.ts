import crypto from "crypto";
import { NextRequest } from "next/server";
import { getTwilioCfg } from "@/lib/sms";

const BASE = "https://medigap.plus";

// Twilio's algorithm: HMAC-SHA1( url + concat(sortedKey+value) ) with the auth token, base64.
export function twilioSignature(authToken: string, url: string, params: Record<string, string>): string {
  let data = url;
  for (const k of Object.keys(params).sort()) data += k + params[k];
  return crypto.createHmac("sha1", authToken).update(Buffer.from(data, "utf-8")).digest("base64");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a); const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

// Returns true if the request is a valid Twilio request.
// FAIL-OPEN only when no auth token is configured (pre-setup); otherwise a valid signature is required.
export async function verifyTwilioRequest(req: NextRequest, params: Record<string, string>): Promise<boolean> {
  const { authToken } = await getTwilioCfg();
  if (!authToken) return true; // not configured → don't block
  const sig = req.headers.get("x-twilio-signature") || "";
  if (!sig) return false;
  const url = BASE + req.nextUrl.pathname + req.nextUrl.search;
  return safeEqual(twilioSignature(authToken, url, params), sig);
}
