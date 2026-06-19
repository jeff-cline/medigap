import { db } from "@/lib/db";
import IntegrationCard, { IntegrationMeta } from "@/components/IntegrationCard";
import { TOLLFREE } from "@/lib/format";

type Status = "unconfigured" | "saved" | "verified" | "failed";

// Ordered top-down: do these in sequence to go live and start making money.
const ITEMS: (IntegrationMeta & { phase: string })[] = [
  {
    phase: "Start earning", key: "twilio", label: "Twilio — Toll-Free Call Tracking",
    blurb: `Routes & tracks 1-800-MEDIGAP (${TOLLFREE} / 1-800-633-4427). You already have the account.`,
    dataFlow: "every inbound call → Calls + the auction + call revenue in the ledger",
    oauth: false,
    steps: ["Twilio Console → Account → API keys & tokens. Copy your Account SID and Auth Token.", "Confirm 1-800-633-4427 is on the account.", "Just hit Test connection — Account SID + Auth Token are all you need to go green.", "Messaging Service SID is OPTIONAL (outbound SMS only). Get it later at Twilio Console → Messaging → Services → your service (starts with MG)."],
    fields: [{ name: "accountSid", label: "Account SID", placeholder: "ACxxxx" }, { name: "authToken", label: "Auth Token", type: "password" }, { name: "tollFree", label: "Toll-Free Number", placeholder: "+18006334427" }, { name: "messagingSid", label: "Messaging Service SID — optional (SMS only)", placeholder: "MGxxxx — leave blank for now" }],
  },
  {
    phase: "Start earning", key: "groq", label: "Groq — Voice AI Intake & Routing",
    blurb: "Answers calls, collects name/number/email/DOB/zip, detects money words, routes the lead.",
    dataFlow: "AI intake answers → the God-only customer journey on each lead",
    steps: ["Create an account at console.groq.com.", "API Keys → Create API Key.", "Copy the key (shown once).", "Save, then Test connection."],
    fields: [{ name: "apiKey", label: "Groq API Key", type: "password", placeholder: "gsk_xxx" }, { name: "model", label: "Model", placeholder: "llama-3.3-70b-versatile" }],
  },
  {
    phase: "Money rails", key: "stripe", label: "Stripe — All Billing & ACH", oauth: true,
    blurb: "Agent $99/mo seats, advertiser top-ups, investor deposits, Autonomous-Risk premium + carrier sweeps.",
    dataFlow: "deposits, charges & payouts → Transactions + the accounting ledger",
    steps: ["Stripe → Developers → API keys; copy Secret + Publishable.", "For carrier sweeps, enable Connect and copy the Connect client ID (ca_…).", "Save, then Connect to authorize via Stripe OAuth.", "Add a webhook to /api/stripe/webhook and paste the signing secret.", "Test connection."],
    fields: [{ name: "secretKey", label: "Secret Key", type: "password", placeholder: "sk_live_xxx" }, { name: "publishableKey", label: "Publishable Key", placeholder: "pk_live_xxx" }, { name: "webhookSecret", label: "Webhook Signing Secret", type: "password", placeholder: "whsec_xxx" }, { name: "connectId", label: "Connect Client ID", placeholder: "ca_xxx" }],
  },
  {
    phase: "Money rails", key: "claude", label: "Claude (Anthropic) — Autonomous Brain",
    blurb: "Powers Autonomous Logic, predictions, A/B decisions and deep-research optimizations.",
    dataFlow: "data-driven recommendations → the Autonomous Logic queue",
    steps: ["console.anthropic.com → API Keys → Create Key.", "Copy the key.", "Save, then Test connection."],
    fields: [{ name: "apiKey", label: "Anthropic API Key", type: "password", placeholder: "sk-ant-xxx" }, { name: "model", label: "Model", placeholder: "claude-opus-4-8" }],
  },
  {
    phase: "Remarketing", key: "klaviyo", label: "Klaviyo — Opted-In Remarketing", oauth: true,
    blurb: "Once a lead opts in, hand off to Klaviyo flows for fine-tuned, data-driven remarketing.",
    dataFlow: "opted-in profiles + flow events",
    steps: ["Klaviyo → Settings → API Keys for a Private Key, OR register an OAuth app.", "Save your keys below.", "Connect via OAuth (recommended) or just save the Private Key.", "Test connection."],
    fields: [{ name: "privateKey", label: "Private API Key", type: "password", placeholder: "pk_xxx" }, { name: "publicId", label: "Public / Site ID", placeholder: "ABC123" }, { name: "clientId", label: "OAuth Client ID (optional)" }, { name: "clientSecret", label: "OAuth Client Secret (optional)", type: "password" }],
  },
  {
    phase: "Remarketing", key: "zapmail", label: "Zapmail — Cold Email Sequence",
    blurb: "Your existing rule: sends the initial 1-2-3 emails to non-opted-in leads until they engage.",
    dataFlow: "email sends/opens push leads toward Klaviyo opt-in",
    steps: ["Reuse your existing Zapmail account/rule.", "Grab the API key from Zapmail settings.", "Save, then Test connection."],
    fields: [{ name: "apiKey", label: "Zapmail API Key", type: "password", placeholder: "zm_xxx" }, { name: "fromEmail", label: "From Address", placeholder: "offers@medigap.plus" }],
  },
  {
    phase: "Remarketing", key: "datamoon", label: "Datamoon — Data Append",
    blurb: "Enrich leads (DOB, address, contact) for remarketing and to share with agents post-sale.",
    dataFlow: "appended fields → each lead's record + agent CRM",
    steps: ["Request API access from Datamoon.", "Copy your API key & endpoint.", "Save, then Test connection."],
    fields: [{ name: "apiKey", label: "Datamoon API Key", type: "password", placeholder: "dm_xxx" }, { name: "endpoint", label: "Endpoint URL", placeholder: "https://api.datamoon.io/v1/append" }],
  },
  {
    phase: "Paid acquisition", key: "google_ads", label: "Google Ads + Google TV/Video", oauth: true,
    blurb: "Paid search & video. Spend flows back into the arbitrage math automatically.",
    dataFlow: "daily ad spend → ledger 'spend' (Google) → cost-of-goods, CPL & ROI",
    steps: ["Google Ads → Tools → API Center; get a Developer Token.", "Create OAuth credentials in Google Cloud; add this app's callback as a redirect URI.", "Save the Client ID/Secret + Customer ID.", "Connect to authorize with your Google login.", "Test connection."],
    fields: [{ name: "developerToken", label: "Developer Token", type: "password" }, { name: "clientId", label: "OAuth Client ID" }, { name: "clientSecret", label: "OAuth Client Secret", type: "password" }, { name: "customerId", label: "Customer ID", placeholder: "123-456-7890" }],
  },
  {
    phase: "Paid acquisition", key: "facebook", label: "Facebook / Meta + Video", oauth: true,
    blurb: "Paid social & video. Spend + results sync for blended CPL/ROAS.",
    dataFlow: "daily ad spend → ledger 'spend' (Facebook) → cost-of-goods, CPL & ROI",
    steps: ["Meta for Developers → create an app; add Marketing API.", "Copy App ID + App Secret; add this app's callback as a valid OAuth redirect URI.", "Save the App ID/Secret + Ad Account ID.", "Connect to authorize with your Facebook login.", "Test connection."],
    fields: [{ name: "appId", label: "App ID" }, { name: "appSecret", label: "App Secret", type: "password" }, { name: "adAccountId", label: "Ad Account ID", placeholder: "act_xxx" }, { name: "pixelId", label: "Pixel ID" }],
  },
  {
    phase: "Scale & arbitrage", key: "affiliate", label: "Affiliate / Exit-Traffic Networks",
    blurb: "Drop affiliate codes + APIs; we show their text/banner ads and read back click value for arbitrage.",
    dataFlow: "exit-click revenue → ledger 'revenue'",
    steps: ["Get your affiliate code + API key/postback URL from each network.", "Save, then Test connection (add more networks anytime)."],
    fields: [{ name: "network", label: "Network Name", placeholder: "MediaAlpha" }, { name: "affiliateCode", label: "Affiliate Code" }, { name: "apiKey", label: "API Key", type: "password" }, { name: "postbackUrl", label: "Postback / Click-Value URL", placeholder: "https://…" }],
  },
  {
    phase: "Scale & arbitrage", key: "vibe", label: "Vibe.co — Connected TV",
    blurb: "Streaming-TV ads. Upload spots; track calls/leads as house traffic.",
    dataFlow: "CTV spend → ledger 'spend' (tv)",
    steps: ["Vibe.co → Settings → API/Integrations.", "Copy your API key.", "Save, then Test connection + upload TV spots below."],
    fields: [{ name: "apiKey", label: "Vibe API Key", type: "password" }],
  },
];

const PHASES = ["Start earning", "Money rails", "Remarketing", "Paid acquisition", "Scale & arbitrage"];

export default async function IntegrationsPage({ searchParams }: { searchParams: Promise<{ oauth?: string; needs?: string }> }) {
  const sp = await searchParams;
  const rows = await db.integration.findMany();
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const statusOf = (key: string): Status => (byKey.get(key)?.status as Status) || "unconfigured";
  const verified = ITEMS.filter((i) => statusOf(i.key) === "verified").length;
  const oauthStatus = sp?.oauth?.split(":") ?? [];
  const needs = sp?.needs;

  // group preserving global step numbers
  let step = 0;
  const numbered = ITEMS.map((it) => ({ ...it, step: ++step, status: statusOf(it.key) }));

  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Integrations — Go-Live Checklist</h1>
          <p className="text-sm text-[var(--muted)]">Work top to bottom. Each one: read the steps → save keys (or Connect) → <b>Test connection</b> for a green light.</p>
        </div>
        <div className="card px-5 py-3 text-center shrink-0">
          <div className="text-2xl font-bold text-gradient">{verified}/{ITEMS.length}</div>
          <div className="text-xs text-[var(--muted)]">verified live</div>
        </div>
      </div>

      {oauthStatus[1] === "connected" && <div className="card mb-4 p-3 border-l-4 border-l-[var(--brand)] text-sm">✓ Connected <b>{oauthStatus[0]}</b> via OAuth. Hit <b>Test connection</b> to confirm the green light.</div>}
      {oauthStatus[1] === "error" && <div className="card mb-4 p-3 border-l-4 border-l-[var(--danger)] text-sm">Couldn&apos;t finish the <b>{oauthStatus[0]}</b> OAuth — check Client ID/Secret + redirect URI, then Connect again.</div>}
      {needs && <div className="card mb-4 p-3 border-l-4 border-l-[var(--gold)] text-sm">Save the Client ID &amp; Secret for <b>{needs}</b> first, then click Connect.</div>}

      <div className="card p-4 mb-8">
        <div className="h-2 rounded-full bg-[var(--panel2)] overflow-hidden">
          <div className="h-full brand-gradient" style={{ width: `${(verified / ITEMS.length) * 100}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs">
          <span className="text-[var(--muted)]">Legend:</span>
          <span><span style={{ color: "var(--brand)" }}>●</span> verified &amp; working</span>
          <span><span style={{ color: "var(--gold)" }}>●</span> keys saved — test it</span>
          <span><span style={{ color: "var(--danger)" }}>●</span> not connected</span>
        </div>
      </div>

      {PHASES.map((phase, pi) => (
        <section key={phase} className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)] mb-3">
            <span className="text-gradient">Phase {pi + 1}</span> · {phase}
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {numbered.filter((i) => i.phase === phase).map((it) => {
              const row = byKey.get(it.key);
              let initial: Record<string, string> = {};
              try { initial = row ? JSON.parse(row.config) : {}; } catch {}
              return <IntegrationCard key={it.key} meta={it} step={it.step} initial={initial} initialStatus={it.status} initialError={row?.lastError || ""} />;
            })}
          </div>
        </section>
      ))}

      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)] mb-3">Marketing Assets &amp; TV Spots</h2>
        <div className="card p-6 border-dashed border-2 border-[var(--border)] text-center">
          <div className="text-3xl">🎬</div>
          <p className="mt-2 text-sm text-[var(--muted)]">Drag &amp; drop TV spots, banners and product videos here (reused across Google TV, Vibe.co, Meta video and landing pages).</p>
          <button className="btn btn-ghost text-sm mt-3">Upload assets</button>
          <p className="text-xs text-[var(--muted)] mt-3">Saved to the asset store; available when you build a campaign or ad.</p>
        </div>
      </section>
    </>
  );
}
