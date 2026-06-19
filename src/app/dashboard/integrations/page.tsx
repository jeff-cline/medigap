import { db } from "@/lib/db";
import IntegrationCard, { IntegrationMeta } from "@/components/IntegrationCard";
import { Section } from "@/components/ui";
import { TOLLFREE } from "@/lib/format";

// The master setup checklist — every key & connection in one place.
const GROUPS: { title: string; desc: string; items: IntegrationMeta[] }[] = [
  {
    title: "Calls & Voice — the money engine",
    desc: "Get calls tracking the moment these are connected. Highest-value path in the system.",
    items: [
      {
        key: "twilio", label: "Twilio — Toll-Free Call Tracking", blurb: `Routes & tracks 1-800-MEDIGAP (${TOLLFREE} / 1-800-633-4427). You already have the account.`,
        steps: ["Log in to Twilio Console → Account → API keys & tokens.", "Copy your Account SID and Auth Token.", "Confirm the toll-free number 1-800-633-4427 is on the account.", "Paste below and Save — calls begin tracking immediately."],
        fields: [{ name: "accountSid", label: "Account SID", placeholder: "ACxxxxxxxx" }, { name: "authToken", label: "Auth Token", type: "password", placeholder: "••••••" }, { name: "tollFree", label: "Toll-Free Number", placeholder: "+18006334427" }, { name: "messagingSid", label: "Messaging Service SID (for SMS blasts)", placeholder: "MGxxxx" }],
      },
      {
        key: "groq", label: "Groq — Voice AI Intake & Routing", blurb: "Answers calls, collects name/number/email/DOB/zip, detects money words, routes the lead.",
        steps: ["Create a Groq account at console.groq.com.", "Go to API Keys → Create API Key.", "Copy the key (shown once).", "Paste below — Groq will run the intake + routing flow."],
        fields: [{ name: "apiKey", label: "Groq API Key", type: "password", placeholder: "gsk_xxx" }, { name: "model", label: "Model", placeholder: "llama-3.3-70b-versatile" }],
      },
    ],
  },
  {
    title: "Email, SMS & Data",
    desc: "Cold-to-opted-in journey: Zapmail seeds 1-2-3, then move everyone into Klaviyo flows. Datamoon appends missing data.",
    items: [
      {
        key: "zapmail", label: "Zapmail — Cold Email Sequence", blurb: "Your existing rule: sends initial 1-2-3 emails to non-opted-in leads until they engage.",
        steps: ["Reuse your existing Zapmail account/rule.", "Grab the API key from Zapmail settings.", "Paste below; the system fires sequence #1 on new lead, escalating until click/opt-in."],
        fields: [{ name: "apiKey", label: "Zapmail API Key", type: "password", placeholder: "zm_xxx" }, { name: "fromEmail", label: "From Address", placeholder: "offers@medigap.plus" }],
      },
      {
        key: "klaviyo", label: "Klaviyo — Opted-In Remarketing", blurb: "Once a lead opts in, hand off to Klaviyo flows for fine-tuned, data-driven remarketing.",
        oauth: true,
        steps: ["Klaviyo → Settings → API Keys for a Private Key, OR register an OAuth app for Client ID/Secret.", "Save your keys below.", "Click Connect to authorize via Klaviyo OAuth (recommended), or just save the Private Key.", "Opted-in profiles sync automatically with funnel tags."],
        fields: [{ name: "privateKey", label: "Private API Key", type: "password", placeholder: "pk_xxx" }, { name: "publicId", label: "Public / Site ID", placeholder: "ABC123" }, { name: "clientId", label: "OAuth Client ID (optional)" }, { name: "clientSecret", label: "OAuth Client Secret (optional)", type: "password" }],
      },
      {
        key: "datamoon", label: "Datamoon — Data Append", blurb: "Enrich leads (DOB, address, contact) so we can remarket and share with agents post-sale.",
        steps: ["Request API access from Datamoon.", "Copy your API key & endpoint.", "Paste below — leads are appended on intake and on bulk import."],
        fields: [{ name: "apiKey", label: "Datamoon API Key", type: "password", placeholder: "dm_xxx" }, { name: "endpoint", label: "Endpoint URL", placeholder: "https://api.datamoon.io/v1/append" }],
      },
    ],
  },
  {
    title: "Billing & Money Movement",
    desc: "Advertiser top-ups, agent seats, investor ACH, and Autonomous-Risk premium collection + carrier sweeps.",
    items: [
      {
        key: "stripe", label: "Stripe — All Billing & ACH", blurb: "Charges, prepaid balances, $99/mo agent seats, investor deposits, Connect sweeps to carriers.",
        oauth: true,
        steps: ["Stripe Dashboard → Developers → API keys.", "Copy the Secret key and Publishable key.", "For carrier sweeps, enable Stripe Connect and copy the Connect client ID (ca_...).", "Save, then click Connect to authorize via Stripe OAuth.", "Add a webhook to /api/stripe/webhook and paste the signing secret."],
        fields: [{ name: "secretKey", label: "Secret Key", type: "password", placeholder: "sk_live_xxx" }, { name: "publishableKey", label: "Publishable Key", placeholder: "pk_live_xxx" }, { name: "webhookSecret", label: "Webhook Signing Secret", type: "password", placeholder: "whsec_xxx" }, { name: "connectId", label: "Connect Client ID", placeholder: "ca_xxx" }],
      },
    ],
  },
  {
    title: "Ad Channels — spend tracking & A/B",
    desc: "The platform pulls spend back in and compares cost-per-dollar to dollars made; it manages tracking links & A/B tests.",
    items: [
      {
        key: "google_ads", label: "Google Ads + Google TV/Video", blurb: "Paid search & video. Spend flows back into the arbitrage math automatically.",
        oauth: true,
        steps: ["Google Ads → Tools → API Center; get a Developer Token.", "Create OAuth credentials (Client ID/Secret) in Google Cloud; add this app's callback as a redirect URI.", "Save the Client ID/Secret below.", "Click Connect to authorize with your Google login — daily spend & conversions sync."],
        fields: [{ name: "developerToken", label: "Developer Token", type: "password" }, { name: "clientId", label: "OAuth Client ID" }, { name: "clientSecret", label: "OAuth Client Secret", type: "password" }, { name: "customerId", label: "Customer ID", placeholder: "123-456-7890" }],
      },
      {
        key: "facebook", label: "Facebook / Meta + Video", blurb: "Paid social & video. Spend + results sync for blended CPL/ROAS.",
        oauth: true,
        steps: ["Meta for Developers → create an app; add Marketing API.", "Copy the App ID and App Secret; add this app's callback as a valid OAuth redirect URI.", "Save the App ID/Secret + your Ad Account ID below.", "Click Connect to authorize with your Facebook login."],
        fields: [{ name: "appId", label: "App ID" }, { name: "appSecret", label: "App Secret", type: "password" }, { name: "adAccountId", label: "Ad Account ID", placeholder: "act_xxx" }, { name: "pixelId", label: "Pixel ID" }],
      },
      {
        key: "vibe", label: "Vibe.co — Connected TV", blurb: "Streaming-TV ads. Upload spots; track calls/leads as house traffic.",
        steps: ["Vibe.co → Settings → API/Integrations.", "Copy your API key.", "Paste below + upload TV spots in Marketing Assets."],
        fields: [{ name: "apiKey", label: "Vibe API Key", type: "password" }],
      },
    ],
  },
  {
    title: "AI & Affiliate",
    desc: "Claude runs the autonomous logic & predictions. Affiliate/exit-traffic offers power pay-per-click arbitrage.",
    items: [
      {
        key: "claude", label: "Claude (Anthropic) — Autonomous Brain", blurb: "Powers Autonomous Logic, predictions, A/B decisions, and the deep-research optimizations.",
        steps: ["console.anthropic.com → API Keys → Create Key.", "Copy the key.", "Paste below — the autonomous engine starts proposing & (in full mode) making decisions."],
        fields: [{ name: "apiKey", label: "Anthropic API Key", type: "password", placeholder: "sk-ant-xxx" }, { name: "model", label: "Model", placeholder: "claude-opus-4-8" }],
      },
      {
        key: "affiliate", label: "Affiliate / Exit-Traffic Networks", blurb: "Drop affiliate codes + APIs; we display their text/banner ads and read back click value for arbitrage.",
        steps: ["Get your affiliate code + API key/postback URL from each network.", "Paste below (add more networks anytime).", "Offers render as text/banner/exit units with click value tracked back in."],
        fields: [{ name: "network", label: "Network Name", placeholder: "e.g. MediaAlpha" }, { name: "affiliateCode", label: "Affiliate Code" }, { name: "apiKey", label: "API Key", type: "password" }, { name: "postbackUrl", label: "Postback / Click-Value URL", placeholder: "https://..." }],
      },
    ],
  },
];

export default async function IntegrationsPage({ searchParams }: { searchParams: Promise<{ oauth?: string; needs?: string }> }) {
  const sp = await searchParams;
  const rows = await db.integration.findMany();
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const all = GROUPS.flatMap((g) => g.items);
  const connectedCount = all.filter((i) => byKey.get(i.key)?.connected).length;
  const oauthStatus = sp?.oauth?.split(":") ?? [];
  const needs = sp?.needs;

  return (
    <>
      {oauthStatus[1] === "connected" && (
        <div className="card mb-4 p-3 border-l-4 border-l-[var(--brand)] text-sm">✓ Connected <b>{oauthStatus[0]}</b> via OAuth.</div>
      )}
      {oauthStatus[1] === "error" && (
        <div className="card mb-4 p-3 border-l-4 border-l-[var(--danger)] text-sm">Couldn&apos;t finish the <b>{oauthStatus[0]}</b> OAuth — check the Client ID/Secret and redirect URI, then try Connect again.</div>
      )}
      {needs && (
        <div className="card mb-4 p-3 border-l-4 border-l-[var(--gold)] text-sm">Save the Client ID &amp; Secret for <b>{needs}</b> first, then click Connect.</div>
      )}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Integrations</h1>
          <p className="text-sm text-[var(--muted)]">One checklist for every key & connection. Complete these to make the platform 100% live.</p>
        </div>
        <div className="card px-5 py-3 text-center">
          <div className="text-2xl font-bold text-gradient">{connectedCount}/{all.length}</div>
          <div className="text-xs text-[var(--muted)]">connected</div>
        </div>
      </div>

      <div className="card p-4 mb-8">
        <div className="h-2 rounded-full bg-[var(--panel2)] overflow-hidden">
          <div className="h-full brand-gradient" style={{ width: `${(connectedCount / all.length) * 100}%` }} />
        </div>
        <p className="text-xs text-[var(--muted)] mt-2">Priority order to start earning fastest: <b className="text-[var(--text)]">Twilio → Groq → Stripe → Claude</b>, then channels & data.</p>
      </div>

      {GROUPS.map((g) => (
        <Section key={g.title} title={g.title} desc={g.desc}>
          <div className="grid gap-4 lg:grid-cols-2">
            {g.items.map((meta) => {
              const row = byKey.get(meta.key);
              let initial: Record<string, string> = {};
              try { initial = row ? JSON.parse(row.config) : {}; } catch { initial = {}; }
              return <IntegrationCard key={meta.key} meta={meta} initial={initial} initialConnected={!!row?.connected} />;
            })}
          </div>
        </Section>
      ))}

      <Section title="Marketing Assets & TV Spots" desc="Upload videos & creatives once; reuse across Google TV, Vibe.co, Facebook video and landing pages.">
        <div className="card p-6 border-dashed border-2 border-[var(--border)] text-center">
          <div className="text-3xl">🎬</div>
          <p className="mt-2 text-sm text-[var(--muted)]">Drag & drop TV spots, banners and product videos here.</p>
          <button className="btn btn-ghost text-sm mt-3">Upload assets</button>
          <p className="text-xs text-[var(--muted)] mt-3">Wired next: S3/Cloudflare R2 asset store + per-channel transcoding.</p>
        </div>
      </Section>
    </>
  );
}
