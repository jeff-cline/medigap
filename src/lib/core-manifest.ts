import { db } from "@/lib/db";

// What each integration provides, in plain language for another agent.
const INTEGRATION_INFO: Record<string, string> = {
  zapmail: "Cold/marketing email (seasoned mailboxes). Use POST /api/core/email with provider:\"zapmail\".",
  google_workspace: "Business/transactional email. POST /api/core/email with provider:\"google_workspace\".",
  twilio: "SMS + voice. POST /api/core/sms.",
  elevenlabs: "AI voice / TTS + voice cloning.",
  syncso: "Sync.so lip-sync video.",
  runway: "RunwayML AI video & image.",
  predictivedata: "Visitor identification + data append/enrichment.",
  dataforseo: "Keyword CPC, search volume, SERP data.",
  stripe: "Payments / Stripe Connect.",
  klaviyo: "Opted-in marketing automation.",
  facebook: "Meta Marketing API (ad spend/results).",
  fb_social: "Facebook Pages + Instagram insights.",
  rakuten: "Rakuten Advertising affiliate offers + reporting.",
  adsense: "Google AdSense monetization + earnings reporting.",
};

export async function coreManifest(baseUrl: string) {
  const rows = await db.integration.findMany({ select: { key: true, label: true, connected: true } }).catch(() => []);
  const integrations = rows.map((r) => ({ key: r.key, label: r.label, connected: r.connected, provides: INTEGRATION_INFO[r.key] || "" }));

  return {
    name: "R0cketShip Core",
    version: "1.0",
    description:
      "A shared multi-tenant platform (medigap.plus + white-label sites) that exposes reusable email, SMS, CRM/lead, and AI/data services over an authenticated API. Other projects should CALL these endpoints rather than re-configuring integrations — e.g. Zapmail credentials live in the Core, so send email THROUGH /api/core/email instead of configuring Zapmail yourself.",
    baseUrl,
    ip: "137.220.56.129",
    humanDocs: `${baseUrl}/core-api`,
    auth: {
      scheme: "api-key-pair",
      headers: { "x-core-key": "the public key id (core_pk_…)", "x-core-secret": "the secret (core_sk_…, shown once at issuance)" },
      howToGetAKey: `Ask the Core owner to issue a key at ${baseUrl}/core-api (God only). Grant the scopes you need.`,
      note: "Every action endpoint requires a key with the matching scope. The manifest and /api/core/ping are the only unauthenticated reads. GET /api/core/ping verifies your key.",
    },
    scopes: ["lead:create", "email:send", "sms:send"],
    endpoints: [
      { method: "GET", path: "/api/core", auth: false, scope: null, description: "This capabilities manifest." },
      { method: "GET", path: "/api/core/ping", auth: true, scope: "(any)", description: "Verify your key — returns {ok, authenticated, name, scopes}." },
      { method: "POST", path: "/api/core/email", auth: true, scope: "email:send", description: "Send email via the Core (Zapmail by default).", body: { to: "string (comma-separated ok)", subject: "string", html: "string (or text)", text: "string?", provider: "\"zapmail\"|\"google_workspace\"|\"smtp\" (default zapmail)" } },
      { method: "POST", path: "/api/core/sms", auth: true, scope: "sms:send", description: "Send SMS via the Core's Twilio.", body: { to: "E.164 string", body: "string" } },
      { method: "POST", path: "/api/core/lead", auth: true, scope: "lead:create", description: "Push a lead into the Core CRM (enriched + attributed).", body: { name: "string", email: "string", phone: "string?", zip: "string?", state: "string?", creatorRef: "string?", notes: "string?" } },
    ],
    example: {
      sendEmailViaZapmail: `curl -X POST ${baseUrl}/api/core/email -H "x-core-key: core_pk_…" -H "x-core-secret: core_sk_…" -H "content-type: application/json" -d '{"to":"a@b.com","subject":"Hi","html":"<b>Hello</b>","provider":"zapmail"}'`,
    },
    capabilities: [
      "Email (Zapmail cold + Google Workspace transactional)",
      "SMS (Twilio)",
      "CRM lead capture + attribution to white-label sites",
      "Multi-tenant white-label hosting on one backend (host-based routing)",
      "SEO/AEO engines, calculators, partner ad networks",
      "AI: voice cloning (ElevenLabs), lip-sync (Sync.so), video (Runway)",
      "Data: PredictiveData enrichment, DataForSEO keywords, Rakuten offers, AdSense reporting",
    ],
    integrations,
    hostedSites: ["medigap.plus", "1-800-medigap.com", "doublewide.ai", "el.ag", "medig.app", "experientialmarketing.ai", "exitoptimization.com"],
  };
}
