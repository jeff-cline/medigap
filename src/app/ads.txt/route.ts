import { NextRequest } from "next/server";
import { adsensePubIdForHost, adsenseEnabledForHost } from "@/lib/adsense";

export const dynamic = "force-dynamic";

// Host-aware ads.txt — authorizes Google AdSense to sell this domain's inventory using the
// publisher id assigned to that host. Required for ads to serve (and a verification signal).
export async function GET(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0];
  const on = await adsenseEnabledForHost(host);
  if (!on) return new Response("", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const pub = (await adsensePubIdForHost(host)).replace(/^ca-/, ""); // pub-XXXXXXXX
  const body = `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
