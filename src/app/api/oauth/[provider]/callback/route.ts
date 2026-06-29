import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { OAUTH_PROVIDERS, callbackUrl, isSocialProvider, socialPlatform } from "@/lib/oauth";

// Exchange the auth code for tokens and persist the connection (global for ads/billing,
// per-user for Doublewide social).
export async function GET(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  const p = OAUTH_PROVIDERS[provider];
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state") || ""; // the connecting user's id
  const social = isSocialProvider(provider);
  const done = (status: string) => {
    const url = new URL(social ? "/creator" : "/dashboard/integrations", req.url);
    url.searchParams.set(social ? "fb" : "oauth", social ? status : `${provider}:${status}`);
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
    let accessToken = data.access_token || data.stripe_user_id || "";
    if (!accessToken) return done("error");

    // ---- Doublewide SOCIAL: store per-user + pull their identity and pages ----
    if (social && state) {
      // Upgrade the short-lived token to a long-lived one (~60 days).
      try {
        const ll = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${accessToken}`);
        const lld = await ll.json().catch(() => ({}));
        if (lld.access_token) accessToken = lld.access_token;
      } catch {}
      let accountId = "", accountName = "", pages = "[]", lastError = "";
      try {
        const me = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${accessToken}`).then((r) => r.json());
        accountId = me.id || ""; accountName = me.name || "";
        const pg = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=id,name,category,access_token,followers_count&access_token=${accessToken}`).then((r) => r.json());
        if (Array.isArray(pg.data)) pages = JSON.stringify(pg.data.map((x: Record<string, unknown>) => ({ id: x.id, name: x.name, category: x.category, access_token: x.access_token, followers: x.followers_count })));
        else if (pg.error) lastError = String(pg.error.message || "");
      } catch (e) { lastError = String(e); }
      const platform = socialPlatform(provider);
      await db.socialConnection.upsert({
        where: { userId_platform: { userId: state, platform } },
        update: { accessToken, scope: p.scope, accountId, accountName, pages, lastError, connectedAt: new Date() },
        create: { userId: state, platform, accessToken, scope: p.scope, accountId, accountName, pages, lastError },
      });
      await db.integration.update({ where: { key: p.integrationKey }, data: { connected: true } }).catch(() => {});
      return done("connected");
    }

    // ---- Global ads/billing connection (unchanged) ----
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
