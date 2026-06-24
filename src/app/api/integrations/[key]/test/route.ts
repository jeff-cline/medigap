import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { verifyEmail } from "@/lib/email";

// Live health check per provider. Returns {ok, status, message} and records it on the
// Integration row so the panel can show green / amber / red.
async function ping(url: string, init: RequestInit): Promise<{ ok: boolean; code: number; body: string }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    const body = await res.text().catch(() => "");
    return { ok: res.ok, code: res.status, body: body.slice(0, 300) };
  } catch (e) {
    return { ok: false, code: 0, body: e instanceof Error ? e.message : "network error" };
  } finally {
    clearTimeout(t);
  }
}
const b64 = (s: string) => Buffer.from(s).toString("base64");

export async function POST(req: NextRequest, ctx: { params: Promise<{ key: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "god") return NextResponse.json({ error: "God only" }, { status: 403 });
  const { key } = await ctx.params;

  const row = await db.integration.findUnique({ where: { key } });
  let cfg: Record<string, string> = {};
  try { cfg = row ? JSON.parse(row.config) : {}; } catch {}
  const oauth = await db.oAuthConnection.findUnique({ where: { provider: key } }).catch(() => null);

  let ok = false;
  let message = "";
  const need = (...f: string[]) => f.filter((x) => !cfg[x] || !cfg[x].trim());

  switch (key) {
    case "twilio": {
      const miss = need("accountSid", "authToken");
      if (miss.length) { message = `Missing: ${miss.join(", ")}`; break; }
      const r = await ping(`https://api.twilio.com/2010-04-01/Accounts/${cfg.accountSid}.json`, { headers: { Authorization: `Basic ${b64(`${cfg.accountSid}:${cfg.authToken}`)}` } });
      ok = r.ok; message = ok ? "Authenticated with Twilio. Call tracking ready." : `Twilio rejected the credentials (HTTP ${r.code}).`;
      break;
    }
    case "groq": {
      const miss = need("apiKey");
      if (miss.length) { message = "Missing: apiKey"; break; }
      const r = await ping("https://api.groq.com/openai/v1/models", { headers: { Authorization: `Bearer ${cfg.apiKey}` } });
      ok = r.ok; message = ok ? "Groq key valid. Voice AI ready." : `Groq rejected the key (HTTP ${r.code}). (Groq keys start with gsk_ — an xAI key starts with xai-, use the xAI card.)`;
      break;
    }
    case "xai": {
      const miss = need("apiKey");
      if (miss.length) { message = "Missing: apiKey"; break; }
      // xAI is OpenAI-compatible; /v1/models returns 200 for any valid key.
      const r = await ping("https://api.x.ai/v1/models", { headers: { Authorization: `Bearer ${cfg.apiKey}` } });
      ok = r.ok; message = ok ? "xAI (Grok) key valid. Voice AI ready." : `xAI rejected the key (HTTP ${r.code}). xAI keys start with xai-.`;
      break;
    }
    case "claude": {
      const miss = need("apiKey");
      if (miss.length) { message = "Missing: apiKey"; break; }
      const r = await ping("https://api.anthropic.com/v1/models", { headers: { "x-api-key": cfg.apiKey, "anthropic-version": "2023-06-01" } });
      ok = r.ok; message = ok ? "Claude key valid. Autonomous brain ready." : `Anthropic rejected the key (HTTP ${r.code}).`;
      break;
    }
    case "stripe": {
      const miss = need("secretKey");
      if (miss.length) { message = "Missing: secretKey"; break; }
      const r = await ping("https://api.stripe.com/v1/balance", { headers: { Authorization: `Bearer ${cfg.secretKey}` } });
      ok = r.ok; message = ok ? "Stripe key valid. Billing & payouts ready." : `Stripe rejected the key (HTTP ${r.code}).`;
      break;
    }
    case "klaviyo": {
      if (cfg.privateKey) {
        const r = await ping("https://a.klaviyo.com/api/accounts/", { headers: { Authorization: `Klaviyo-API-Key ${cfg.privateKey}`, revision: "2024-10-15", accept: "application/json" } });
        ok = r.ok; message = ok ? "Klaviyo key valid. Remarketing ready." : `Klaviyo rejected the key (HTTP ${r.code}).`;
      } else if (oauth?.accessToken) {
        ok = true; message = "Connected via OAuth.";
      } else { message = "Add a Private API Key or click Connect (OAuth)."; }
      break;
    }
    case "facebook": {
      if (oauth?.accessToken) {
        const r = await ping(`https://graph.facebook.com/v19.0/me?access_token=${encodeURIComponent(oauth.accessToken)}`, {});
        ok = r.ok; message = ok ? "Meta OAuth token valid. Spend will sync to Accounting." : `Meta token check failed (HTTP ${r.code}).`;
      } else { message = "Save App ID/Secret, then click Connect to authorize."; }
      break;
    }
    case "google_ads": {
      if (oauth?.accessToken) { ok = true; message = "Connected via Google OAuth. Spend will sync to Accounting."; }
      else if (!need("clientId", "clientSecret").length) { message = "Credentials saved — click Connect to authorize via Google."; }
      else { message = "Add OAuth Client ID/Secret, then Connect."; }
      break;
    }
    // Providers without a universal verification endpoint: confirm required fields are present.
    case "dataforseo": {
      const miss = need("login", "password");
      if (miss.length) { message = `Missing: ${miss.join(", ")}`; break; }
      const r = await ping("https://api.dataforseo.com/v3/appendix/user_data", { headers: { Authorization: "Basic " + b64(`${cfg.login}:${cfg.password}`) } });
      ok = r.ok; message = ok ? "DataForSEO connected. Live keyword CPC enabled." : `DataForSEO rejected the credentials (HTTP ${r.code}).`;
      break;
    }
    case "zapmail": {
      if (need("smtpHost", "smtpUser", "smtpPass").length) { message = "Add the mailbox SMTP host, email & app password."; break; }
      const v = await verifyEmail("zapmail");
      ok = v.ok; message = ok ? "Zapmail mailbox verified — cold email ready." : `SMTP login failed: ${v.error}`;
      break;
    }
    case "google_workspace": {
      if (need("smtpHost", "smtpUser", "smtpPass").length) { message = "Add the mailbox SMTP host, email & app password."; break; }
      const v = await verifyEmail("google_workspace");
      ok = v.ok; message = ok ? "Google Workspace verified — business email & alerts ready." : `SMTP login failed: ${v.error}`;
      break;
    }
    case "smtp": {
      if (need("smtpHost", "smtpUser", "smtpPass").length) { message = "Add the SMTP host, email & password."; break; }
      const v = await verifyEmail("smtp");
      ok = v.ok; message = ok ? "Generic SMTP verified — selectable as a Founder Comm engine." : `SMTP login failed: ${v.error}`;
      break;
    }
    case "predictivedata": {
      const miss = need("apiKey", "website");
      if (miss.length) { message = `Missing: ${miss.join(", ")}`; break; }
      // Real auth check: a lookup with valid creds returns success (even with no match).
      const r = await ping("https://app.retargetiq.com/api/v2/GetDataByPhone", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: cfg.apiKey, website: cfg.website, phone: "5555555555" }),
      });
      let authOk = r.ok;
      try { if (r.body && JSON.parse(r.body).success === false) authOk = false; } catch {}
      ok = authOk; message = ok ? "PredictiveData connected. Leads will enrich automatically." : `PredictiveData rejected the credentials (HTTP ${r.code}). Check the API key and website slug.`;
      break;
    }
    case "vibe": { ok = !need("apiKey").length; message = ok ? "Keys saved. CTV ready." : "Missing: apiKey"; break; }
    case "runway": {
      if (need("apiKey").length) { message = "Missing: apiKey"; break; }
      const r = await ping("https://api.dev.runwayml.com/v1/organization", { headers: { Authorization: `Bearer ${cfg.apiKey}`, "X-Runway-Version": "2024-11-06" } });
      ok = r.ok; message = ok ? "RunwayML connected. Video & graphics ready." : `RunwayML rejected the key (HTTP ${r.code}).`;
      break;
    }
    case "affiliate": { ok = !need("apiKey").length; message = ok ? "Keys saved. Exit-traffic offers armed." : "Missing: apiKey"; break; }
    default: { message = "No test available for this integration."; }
  }

  // For providers we can only field-check, treat success as "saved" (amber→ok); live-pinged ones are "verified".
  const liveTested = ["twilio", "groq", "xai", "claude", "stripe", "klaviyo", "facebook", "predictivedata", "dataforseo", "zapmail", "google_workspace", "runway"].includes(key);
  const status = ok ? (liveTested ? "verified" : "saved") : (Object.keys(cfg).length ? "failed" : "unconfigured");
  await db.integration.upsert({
    where: { key },
    update: { connected: ok, status, lastTestedAt: new Date(), lastError: ok ? "" : message },
    create: { key, label: key, connected: ok, status, lastTestedAt: new Date(), lastError: ok ? "" : message },
  });

  return NextResponse.json({ ok, status, message });
}
