import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { OAUTH_PROVIDERS, callbackUrl } from "@/lib/oauth";

// Begin an OAuth authorization. Requires the app's client id to be saved in the
// provider's Integration config first; otherwise returns a clear instruction.
export async function GET(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "god") return NextResponse.json({ error: "God only" }, { status: 403 });
  const { provider } = await ctx.params;
  const p = OAUTH_PROVIDERS[provider];
  if (!p) return NextResponse.json({ error: "Unknown provider" }, { status: 404 });

  const row = await db.integration.findUnique({ where: { key: p.integrationKey } });
  let config: Record<string, string> = {};
  try { config = row ? JSON.parse(row.config) : {}; } catch {}
  const clientId = config[p.clientIdField];
  if (!clientId) {
    const url = new URL("/dashboard/integrations", req.url);
    url.searchParams.set("needs", provider);
    return NextResponse.redirect(url);
  }

  const origin = new URL(req.url).origin;
  const auth = new URL(p.authorizeUrl);
  auth.searchParams.set("client_id", clientId);
  auth.searchParams.set("redirect_uri", callbackUrl(origin, provider));
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("scope", p.scope);
  auth.searchParams.set("state", session.uid);
  for (const [k, v] of Object.entries(p.extraAuthParams || {})) auth.searchParams.set(k, v);
  return NextResponse.redirect(auth.toString());
}
