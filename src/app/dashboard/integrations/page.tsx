import { db } from "@/lib/db";
import IntegrationCard, { IntegrationMeta } from "@/components/IntegrationCard";
import QuinStreetCard from "@/components/QuinStreetCard";
import { STAGE, isQsVertical, type QsVertical } from "@/lib/quinstreet";
import { verticalLabel } from "@/lib/affiliate";
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
    phase: "Start earning", key: "xai", label: "xAI (Grok) — Voice AI Intake & Routing ★",
    blurb: "Grok answers calls, collects name/number/email/DOB/zip, detects money words, routes the lead. Recommended voice brain.",
    dataFlow: "AI intake answers → the God-only customer journey on each lead",
    steps: ["Sign in at console.x.ai.", "API Keys → Create API Key (the key starts with xai-).", "Copy the key.", "Paste below and hit Test connection."],
    fields: [{ name: "apiKey", label: "xAI API Key", type: "password", placeholder: "xai-..." }, { name: "model", label: "Model", placeholder: "grok-2-latest" }],
  },
  {
    phase: "Start earning", key: "groq", label: "Groq — Voice AI (alternative)",
    blurb: "Fast open-model inference (Llama). Alternative voice brain to xAI Grok. NOTE: Groq keys start with gsk_ (different company from xAI/Grok).",
    dataFlow: "AI intake answers → the God-only customer journey on each lead",
    steps: ["Create an account at console.groq.com (NOT x.ai).", "API Keys → Create API Key (starts with gsk_).", "Copy the key (shown once).", "Save, then Test connection."],
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
    phase: "Money rails", key: "elevenlabs", label: "ElevenLabs — Voice Clone & Voiceovers",
    blurb: "Clones your spokesperson's voice and generates voiceovers (TV/Runway). Powers the /voice engine.",
    dataFlow: "cloned voice + script → mp3 voiceover (fit to a timeframe) for Runway / TV",
    steps: ["elevenlabs.io → Profile → API Keys; create a key (starts with sk_).", "Save it here + Test connection.", "Then go to medigap.plus/voice and upload your voice sample to clone it (sets the voice_id)."],
    fields: [{ name: "apiKey", label: "ElevenLabs API Key", type: "password", placeholder: "sk_xxx" }, { name: "voiceId", label: "Voice ID (set automatically when you clone on /voice)" }, { name: "model", label: "Model (optional)", placeholder: "eleven_multilingual_v2" }, { name: "costPer1kChars", label: "Est. $ per 1,000 chars (cost display)", placeholder: "0.15" }],
  },
  {
    phase: "Money rails", key: "syncso", label: "Sync.so — Lip-Sync (TV Studio)",
    blurb: "Re-syncs your spokesperson's mouth to the cloned voiceover. Powers the TV Commercial Studio at /dashboard/tv.",
    dataFlow: "face clip + cloned voiceover → lip-synced video (his mouth says your new script)",
    steps: ["Create an account at sync.so → API keys; create a key (starts with sk-).", "Paste below + Test connection.", "Note: each plan caps generation length (e.g. 20s) — longer spots need a plan upgrade.", "Then produce spots in the TV Commercial Studio (left nav)."],
    fields: [{ name: "apiKey", label: "Sync.so API Key", type: "password", placeholder: "sk-xxx" }, { name: "model", label: "Model (optional)", placeholder: "lipsync-2" }, { name: "maxSeconds", label: "Plan max seconds per generation", placeholder: "20" }, { name: "costPerSec", label: "Est. $ per second (cost display)", placeholder: "0.10" }],
  },
  {
    phase: "Remarketing", key: "klaviyo", label: "Klaviyo — Opted-In Remarketing", oauth: true,
    blurb: "Once a lead opts in, hand off to Klaviyo flows for fine-tuned, data-driven remarketing.",
    dataFlow: "opted-in profiles + flow events",
    steps: ["Klaviyo → Settings → API Keys for a Private Key, OR register an OAuth app.", "Save your keys below.", "Connect via OAuth (recommended) or just save the Private Key.", "Test connection."],
    fields: [{ name: "privateKey", label: "Private API Key", type: "password", placeholder: "pk_xxx" }, { name: "publicId", label: "Public / Site ID", placeholder: "ABC123" }, { name: "clientId", label: "OAuth Client ID (optional)" }, { name: "clientSecret", label: "OAuth Client Secret (optional)", type: "password" }],
  },
  {
    phase: "Remarketing", key: "zapmail", label: "Zapmail — Cold / Non-Opted Email",
    blurb: "Seasoned mailboxes for cold (non-opted-in) outreach. Sends + reads replies via the Zapmail mailbox's SMTP/IMAP. Goal: move engagers into Klaviyo's opted-in flows.",
    dataFlow: "cold sends → engaged leads → Klaviyo opt-in; replies show in Communications → Cold inbox",
    steps: ["In Zapmail (zapmail.io), open a sending mailbox; copy its SMTP + IMAP creds (host smtp.gmail.com / imap.gmail.com for Google mailboxes, port 587/993, the email, an App Password).", "Paste below + your From address, then Test connection (we verify the SMTP login).", "Optional: add your Zapmail API key (mailbox management).", "Used ONLY for cold/non-opted email — opted-in marketing runs through Klaviyo."],
    fields: [{ name: "fromEmail", label: "From Address (the mailbox)", placeholder: "outreach@yoursend.com" }, { name: "smtpHost", label: "SMTP Host", placeholder: "smtp.gmail.com" }, { name: "smtpPort", label: "SMTP Port", placeholder: "587" }, { name: "imapHost", label: "IMAP Host (read replies)", placeholder: "imap.gmail.com" }, { name: "smtpUser", label: "Mailbox Email", placeholder: "outreach@yoursend.com" }, { name: "smtpPass", label: "App Password", type: "password" }, { name: "apiKey", label: "Zapmail API Key (optional)", type: "password" }],
  },
  {
    phase: "Remarketing", key: "smtp", label: "Generic SMTP — Founder Comm engine",
    blurb: "A generic SMTP mailbox selectable as a 'send from' engine in the Founder Communication console (in addition to Personal/Google and Cold/Zapmail).",
    dataFlow: "one-at-a-time founder emails → CRM (tagged FOUNDER COMMUNICATION)",
    steps: ["From any provider, get SMTP host/port + the mailbox email + an App Password (or SMTP password).", "Paste below + your From address, then Test connection (we verify the SMTP login).", "Selectable as the 'SMTP' engine when composing in JV → Founder Communication."],
    fields: [{ name: "fromEmail", label: "From Address", placeholder: "you@yourdomain.com" }, { name: "smtpHost", label: "SMTP Host", placeholder: "smtp.yourhost.com" }, { name: "smtpPort", label: "SMTP Port", placeholder: "587" }, { name: "imapHost", label: "IMAP Host (read replies, optional)", placeholder: "imap.yourhost.com" }, { name: "smtpUser", label: "Mailbox Email", placeholder: "you@yourdomain.com" }, { name: "smtpPass", label: "Password / App Password", type: "password" }],
  },
  {
    phase: "Remarketing", key: "predictivedata", label: "PredictiveData — Data Append",
    blurb: "Enrich every lead in real time (name, age/DOB, address, income, credit range, interests) by phone or email.",
    dataFlow: "auto-appends new callers & form leads → each lead's record + Appended Data",
    steps: ["Get your API key + website slug from your PredictiveData account.", "Paste both below. The website slug identifies your account.", "Save, then Test connection — new leads enrich automatically by phone."],
    fields: [{ name: "apiKey", label: "PredictiveData API Key", type: "password", placeholder: "your api key" }, { name: "website", label: "Website Slug", placeholder: "your-account-slug" }],
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
    phase: "Social media", key: "fb_social", label: "Facebook / Meta — Social Accounts (Doublewide)", oauth: true,
    blurb: "Connect a business portfolio of Facebook Pages (and Instagram via Meta Graph) to pull impressions, engagement and trending posts into the Core — and run lead forms that attribute back to the creator.",
    dataFlow: "social metrics + lead-form submissions → Core dashboard & CRM (creator-attributed)",
    steps: ["Meta for Developers → create an app with the Pages + Instagram Graph permissions.", "Add this app's callback as an OAuth redirect URI.", "Save the App ID/Secret.", "Connect to authorize the business portfolio (Krystalore can connect her own).", "Test connection."],
    fields: [{ name: "appId", label: "Meta App ID" }, { name: "appSecret", label: "Meta App Secret", type: "password" }, { name: "businessId", label: "Business Portfolio ID (pulls the whole portfolio)", placeholder: "1531355990484848" }, { name: "accessToken", label: "Page/User Access Token (optional)", type: "password" }],
  },
  {
    phase: "Social media", key: "ig_social", label: "Instagram — Social Accounts (Doublewide)", oauth: true,
    blurb: "Instagram business/creator accounts via the Meta Graph API — followers, reach, engagement and top posts into the Core.",
    dataFlow: "IG metrics + form submissions → Core dashboard & CRM",
    steps: ["Use the same Meta app with Instagram Graph permissions.", "Link the IG business accounts to the connected Pages.", "Connect & Test."],
    fields: [{ name: "accessToken", label: "Access Token", type: "password" }, { name: "igBusinessId", label: "IG Business Account ID (optional)" }],
  },
  {
    phase: "Social media", key: "x_social", label: "X / Twitter — Social Accounts (Doublewide)", oauth: true,
    blurb: "Connect X accounts to pull post impressions and engagement into the Core social dashboard.",
    dataFlow: "X metrics + form submissions → Core dashboard & CRM",
    steps: ["X Developer Portal → create a project/app; enable the v2 API.", "Copy the API Key/Secret + Bearer Token.", "Save, Connect & Test."],
    fields: [{ name: "apiKey", label: "API Key" }, { name: "apiSecret", label: "API Secret", type: "password" }, { name: "bearerToken", label: "Bearer Token", type: "password" }],
  },
  {
    phase: "Scale & arbitrage", key: "affiliate", label: "Affiliate / Exit-Traffic Networks",
    blurb: "Drop affiliate codes + APIs; we show their text/banner ads and read back click value for arbitrage.",
    dataFlow: "exit-click revenue → ledger 'revenue'",
    steps: ["Get your affiliate code + API key/postback URL from each network.", "Save, then Test connection (add more networks anytime)."],
    fields: [{ name: "network", label: "Network Name", placeholder: "MediaAlpha" }, { name: "affiliateCode", label: "Affiliate Code" }, { name: "apiKey", label: "API Key", type: "password" }, { name: "postbackUrl", label: "Postback / Click-Value URL", placeholder: "https://…" }],
  },
  {
    phase: "Scale & arbitrage", key: "rakuten", label: "Rakuten Advertising — medig.app offers",
    blurb: "Powers the medig.app offer landers: pulls approved advertiser offers, generates tracked deep links, and imports commissions for the reporting engine.",
    dataFlow: "keyword landers → tracked click-outs → Rakuten transactions → revenue reporting",
    steps: [
      "In the Rakuten Advertising portal → Tools → API Access, copy your Client ID and Client Secret.",
      "Find your Account SID (the token 'scope') — Rakuten portal → Account / Publisher settings, shown as 'SID' or 'Site ID' (a numeric account id). Paste it as SID below.",
      "Save + Test connection — the Core auto-generates the OAuth token from these (no manual token needed; it refreshes hourly).",
      "Then manage offers + landers under the left-nav 'Medig.app' tab.",
    ],
    fields: [
      { name: "clientId", label: "Client ID" },
      { name: "clientSecret", label: "Client Secret", type: "password" },
      { name: "sid", label: "Account SID (token scope — numeric)", placeholder: "e.g. 1234567" },
    ],
  },
  {
    phase: "Scale & arbitrage", key: "runway", label: "RunwayML — AI Video & Graphics",
    blurb: "Generates social-media video/graphics AND powers the TV Studio 'look prompt' — restyle a spot's background/feel from one prompt (video-to-video).",
    dataFlow: "AI-generated video/image assets → media kits + TV-commercial look restyling",
    steps: ["Create an account at runwayml.com → dev.runwayml.com (developer API).", "API Keys → create a key.", "Paste below and Test connection.", "Powers the $1,500 upgrades + the TV Commercial Studio look/background prompt."],
    fields: [{ name: "apiKey", label: "RunwayML API Key", type: "password", placeholder: "key_..." }, { name: "costPerSec", label: "Est. $ per second (cost display)", placeholder: "0.15" }],
  },
  {
    phase: "Scale & arbitrage", key: "dataforseo", label: "DataForSEO — Keyword CPC & Search Volume",
    blurb: "Live cost-per-click & search volume per keyword — powers Money Word Cloud pricing (CPC × 5 call value).",
    dataFlow: "keyword CPC → money-word call values on /money-word-cloud",
    steps: ["Create an account at dataforseo.com.", "If it asks for an IP to whitelist, use this server's IP: 137.220.56.129.", "Find your API Login (email) and API Password in the dashboard.", "Paste both below and Test connection.", "Money-word call values switch from modeled to live CPC."],
    fields: [{ name: "login", label: "API Login", placeholder: "you@email.com" }, { name: "password", label: "API Password", type: "password" }],
  },
  {
    phase: "Scale & arbitrage", key: "google_workspace", label: "Google Workspace — Business Email",
    blurb: "Your company/employee email. Powers all transactional alerts (new-account notifications, etc.) and the business inbox shown in Communications.",
    dataFlow: "transactional alerts out; business inbox in",
    steps: ["At admin.google.com confirm your Workspace domain.", "Create/choose a sending mailbox (e.g. alerts@yourcompany.com) and generate an App Password (myaccount.google.com → Security → App passwords).", "Host smtp.gmail.com / imap.gmail.com, ports 587 / 993.", "Paste below, then Test connection (verifies SMTP)."],
    fields: [{ name: "domain", label: "Workspace Domain", placeholder: "yourcompany.com" }, { name: "fromEmail", label: "From Address", placeholder: "alerts@yourcompany.com" }, { name: "smtpHost", label: "SMTP Host", placeholder: "smtp.gmail.com" }, { name: "smtpPort", label: "SMTP Port", placeholder: "587" }, { name: "imapHost", label: "IMAP Host (read inbox)", placeholder: "imap.gmail.com" }, { name: "smtpUser", label: "Mailbox Email", placeholder: "alerts@yourcompany.com" }, { name: "smtpPass", label: "App Password", type: "password" }],
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

  // QuinStreet affiliate (its credential is the per-vertical prod quadTag, not a generic key).
  const qs = await db.affiliate.findFirst({ where: { slug: "quinstreet" }, include: { verticals: { orderBy: { label: "asc" } } } });
  const qsVerticals = (qs?.verticals || []).filter((v) => isQsVertical(v.vertical)).map((v) => ({
    id: v.id, vertical: v.vertical, label: verticalLabel(v.vertical), quadTag: v.quadTag,
    isTest: !v.quadTag || v.quadTag === STAGE[v.vertical as QsVertical].testQuadTag, hasEndpoint: !!v.pingUrl,
  }));
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

      {qs && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)] mb-3">
            <span className="text-gradient">Affiliate revenue</span> · QuinStreet (call ping-post)
          </h2>
          <QuinStreetCard affiliateId={qs.id} mode={qs.mode} verticals={qsVerticals} />
        </section>
      )}

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
