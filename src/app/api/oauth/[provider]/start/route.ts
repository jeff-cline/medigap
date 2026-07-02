import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { OAUTH_PROVIDERS, callbackUrl, isSocialProvider, publicOrigin } from "@/lib/oauth";

// Begin an OAuth authorization. Requires the app's client id to be saved in the
// provider's Integration config first; otherwise returns a clear instruction.
export async function GET(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const session = await getSession();
  const { provider } = await ctx.params;
  // Ads/billing OAuth = god only. SOCIAL connect = any signed-in user (a creator connecting their
  // own account, or god impersonating a creator). session.uid is the effective (impersonated) user.
  if (!session || (!isSocialProvider(provider) && session.role !== "god")) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  const p = OAUTH_PROVIDERS[provider];
  if (!p) return NextResponse.json({ error: "Unknown provider" }, { status: 404 });

  const row = await db.integration.findUnique({ where: { key: p.integrationKey } });
  let config: Record<string, string> = {};
  try { config = row ? JSON.parse(row.config) : {}; } catch {}
  const clientId = config[p.clientIdField];
  if (!clientId) {
    // App not configured yet. God → integrations to add the App ID/Secret; creator → friendly note.
    const url = isSocialProvider(provider)
      ? new URL("/creator?connect=notready", publicOrigin(req))
      : new URL("/dashboard/integrations", publicOrigin(req));
    if (!isSocialProvider(provider)) url.searchParams.set("needs", provider);
    return NextResponse.redirect(url);
  }

  const origin = publicOrigin(req);
  const auth = new URL(p.authorizeUrl);
  auth.searchParams.set("client_id", clientId);
  auth.searchParams.set("redirect_uri", callbackUrl(origin, provider));
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("scope", config.scope || p.scope); // per-integration override (add insights/IG scopes once activated in Meta)
  auth.searchParams.set("state", session.uid);
  for (const [k, v] of Object.entries(p.extraAuthParams || {})) auth.searchParams.set(k, v);
  return NextResponse.redirect(auth.toString());
}
