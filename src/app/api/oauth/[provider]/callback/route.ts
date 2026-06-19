import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { OAUTH_PROVIDERS, callbackUrl } from "@/lib/oauth";

// Exchange the auth code for tokens and persist the connection.
export async function GET(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  const p = OAUTH_PROVIDERS[provider];
  const code = req.nextUrl.searchParams.get("code");
  const done = (status: string) => {
    const url = new URL("/dashboard/integrations", req.url);
    url.searchParams.set("oauth", `${provider}:${status}`);
    return NextResponse.redirect(url);
  };
  if (!p || !code) return done("error");

  const row = await db.integration.findUnique({ where: { key: p.integrationKey } });
  let config: Record<string, string> = {};
  try { config = row ? JSON.parse(row.config) : {}; } catch {}
  const clientId = config[p.clientIdField];
  const clientSecret = config[p.clientSecretField];
  if (!clientId || !clientSecret) return done("error");

  try {
    const origin = new URL(req.url).origin;
    const body = new URLSearchParams({
      client_id: clientId, client_secret: clientSecret, code,
      grant_type: "authorization_code", redirect_uri: callbackUrl(origin, provider),
    });
    const resp = await fetch(p.tokenUrl, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body });
    const data = await resp.json().catch(() => ({}));
    const accessToken = data.access_token || data.stripe_user_id || "";
    if (!accessToken) return done("error");
    await db.oAuthConnection.upsert({
      where: { provider },
      update: { accessToken, refreshToken: data.refresh_token || "", scope: p.scope, accountLabel: data.stripe_user_id || "", connectedAt: new Date() },
      create: { provider, accessToken, refreshToken: data.refresh_token || "", scope: p.scope, accountLabel: data.stripe_user_id || "" },
    });
    await db.integration.update({ where: { key: p.integrationKey }, data: { connected: true } }).catch(() => {});
    return done("connected");
  } catch {
    return done("error");
  }
}
