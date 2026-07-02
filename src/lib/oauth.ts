// OAuth provider registry. The God account registers an app once (client id/secret in the
// Integration config), then can click "Connect" to authorize with live credentials.
export type OAuthProvider = {
  id: string;
  label: string;
  authorizeUrl: string;
  tokenUrl: string;
  scope: string;
  // Where the client id/secret live inside the Integration.config JSON for this provider's key.
  integrationKey: string;
  clientIdField: string;
  clientSecretField: string;
  extraAuthParams?: Record<string, string>;
};

export const OAUTH_PROVIDERS: Record<string, OAuthProvider> = {
  google_ads: {
    id: "google_ads", label: "Google Ads", integrationKey: "google_ads",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scope: "https://www.googleapis.com/auth/adwords",
    clientIdField: "clientId", clientSecretField: "clientSecret",
    extraAuthParams: { access_type: "offline", prompt: "consent" },
  },
  facebook: {
    id: "facebook", label: "Meta / Facebook", integrationKey: "facebook",
    authorizeUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
    scope: "ads_read,ads_management,business_management",
    clientIdField: "appId", clientSecretField: "appSecret",
  },
  // Doublewide SOCIAL connect — Pages + Instagram + insights. Per-user (a creator connects their
  // own; god can impersonate to do it for them). App ID/Secret live in the fb_social integration.
  fb_social: {
    id: "fb_social", label: "Facebook (Doublewide social)", integrationKey: "fb_social",
    authorizeUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
    // Default = scopes that work WITHOUT App Review (page list + engagement). Insights/Instagram
    // scopes (read_insights, instagram_basic, instagram_manage_insights) must be ACTIVATED in the
    // Meta app first; add them via the fb_social integration `scope` field once approved.
    scope: "public_profile,pages_show_list,pages_read_engagement,business_management",
    clientIdField: "appId", clientSecretField: "appSecret",
  },
  stripe: {
    id: "stripe", label: "Stripe Connect", integrationKey: "stripe",
    authorizeUrl: "https://connect.stripe.com/oauth/authorize",
    tokenUrl: "https://connect.stripe.com/oauth/token",
    scope: "read_write",
    clientIdField: "connectId", clientSecretField: "secretKey",
  },
  klaviyo: {
    id: "klaviyo", label: "Klaviyo", integrationKey: "klaviyo",
    authorizeUrl: "https://www.klaviyo.com/oauth/authorize",
    tokenUrl: "https://a.klaviyo.com/oauth/token",
    scope: "accounts:read profiles:write lists:write campaigns:write",
    clientIdField: "clientId", clientSecretField: "clientSecret",
  },
};

export function callbackUrl(origin: string, provider: string) {
  return `${origin}/api/oauth/${provider}/callback`;
}

// Per-USER social providers — anyone signed in can connect their own account (god, or a creator,
// or god impersonating a creator). The token is stored per user in SocialConnection, not globally.
export const SOCIAL_PROVIDERS = new Set(["fb_social"]);
export const isSocialProvider = (p: string) => SOCIAL_PROVIDERS.has(p);
export const socialPlatform = (provider: string) => (provider === "fb_social" ? "facebook" : provider);
