import type { Metadata } from "next";
import DwLogo from "@/components/doublewide/DwLogo";
import "../doublewide/doublewide.css";

export const metadata: Metadata = {
  title: "Connect your accounts — Doublewide Setup",
  description: "Step-by-step: connect your Facebook business account (and pages), Instagram and X so Doublewide can track and grow them.",
};

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-9 h-9 rounded-full bg-[var(--dw-navy)] text-white grid place-items-center font-bold">{n}</div>
      <div className="pb-2"><div className="font-semibold">{title}</div><div className="text-[15px] text-[var(--dw-muted)] mt-1 leading-relaxed">{children}</div></div>
    </div>
  );
}

export default function SetupPage() {
  const REDIRECT = "https://doublewide.ai/api/oauth/fb_social/callback";
  return (
    <div className="dw-root min-h-screen">
      <header className="border-b border-[var(--dw-border)]">
        <div className="mx-auto max-w-3xl px-6 h-16 flex items-center justify-between"><DwLogo /><span className="dw-chip">Account Setup</span></div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-4xl font-extrabold">Let&apos;s connect your <span className="dw-grad">accounts.</span></h1>
        <p className="mt-3 text-lg text-[var(--dw-muted)]">A few quick steps to link the Doublewide social accounts to the platform so we can track impressions, engagement and leads — and put your audience to work. Takes ~10 minutes.</p>

        {/* Facebook */}
        <div className="dw-card p-6 md:p-8 mt-8">
          <div className="flex items-center gap-2 mb-4"><span className="text-2xl">📘</span><h2 className="text-2xl font-bold">Facebook Business + your 10 Pages</h2></div>
          <p className="text-[15px] text-[var(--dw-muted)] mb-5">This single connection also covers Instagram. Use the Facebook login that manages the Doublewide Business portfolio (the one with the 10 pages).</p>
          <div className="space-y-4">
            <Step n={1} title="Open Meta for Developers">Go to <b className="text-[var(--dw-ink)]">developers.facebook.com</b> and log in with the account that manages the 10 pages.</Step>
            <Step n={2} title="Create an app">Top-right <b className="text-[var(--dw-ink)]">My Apps → Create App</b>. Use case <b className="text-[var(--dw-ink)]">Other</b> → type <b className="text-[var(--dw-ink)]">Business</b>. Name it <b className="text-[var(--dw-ink)]">Doublewide Social</b>.</Step>
            <Step n={3} title="Add the products">On the dashboard, click <b className="text-[var(--dw-ink)]">Set up</b> on <b className="text-[var(--dw-ink)]">Facebook Login for Business</b> and <b className="text-[var(--dw-ink)]">Instagram Graph API</b>.</Step>
            <Step n={4} title="Add our redirect URL">Under <b className="text-[var(--dw-ink)]">Facebook Login → Settings</b>, paste this into <b className="text-[var(--dw-ink)]">Valid OAuth Redirect URIs</b>:
              <div className="mt-2 dw-soft px-3 py-2 font-mono text-sm break-all">{REDIRECT}</div>
            </Step>
            <Step n={5} title="Make sure all 10 pages are in the Business portfolio">In <b className="text-[var(--dw-ink)]">business.facebook.com → Business settings → Accounts → Pages</b>, confirm the 10 pages are there (add any that are missing).</Step>
            <Step n={6} title="Send us two values">From <b className="text-[var(--dw-ink)]">App Settings → Basic</b>, copy and send Jeff: <b className="text-[var(--dw-ink)]">App ID</b> and <b className="text-[var(--dw-ink)]">App Secret</b> (click &ldquo;Show&rdquo; on the secret).</Step>
          </div>
          <div className="mt-6 dw-soft p-4 text-sm">
            <b className="text-[var(--dw-ink)]">What to send Jeff:</b> Meta <b>App ID</b>, Meta <b>App Secret</b>, and a note that the 10 pages are in the Business portfolio.
          </div>
        </div>

        {/* Instagram */}
        <div className="dw-card p-6 md:p-8 mt-6">
          <div className="flex items-center gap-2 mb-4"><span className="text-2xl">📸</span><h2 className="text-2xl font-bold">Instagram</h2></div>
          <p className="text-[15px] text-[var(--dw-muted)]">Instagram runs through the same Meta app. Just make sure each Instagram account is a <b className="text-[var(--dw-ink)]">Business or Creator</b> account and <b className="text-[var(--dw-ink)]">linked to its Facebook Page</b> (Instagram app → Settings → Account type, then link to the Page). Nothing else to send — it connects with Facebook.</p>
        </div>

        {/* X */}
        <div className="dw-card p-6 md:p-8 mt-6">
          <div className="flex items-center gap-2 mb-4"><span className="text-2xl">✖️</span><h2 className="text-2xl font-bold">X (Twitter)</h2></div>
          <div className="space-y-4">
            <Step n={1} title="Open the X Developer Portal">Go to <b className="text-[var(--dw-ink)]">developer.x.com</b>, sign in with the Doublewide X account, and choose <b className="text-[var(--dw-ink)]">Sign up (Free)</b>.</Step>
            <Step n={2} title="Open your app's keys">In the Developer Portal, open the auto-created app → <b className="text-[var(--dw-ink)]">Keys and tokens</b>.</Step>
            <Step n={3} title="Send us three values">Copy and send Jeff: <b className="text-[var(--dw-ink)]">API Key</b>, <b className="text-[var(--dw-ink)]">API Key Secret</b>, and <b className="text-[var(--dw-ink)]">Bearer Token</b>.</Step>
          </div>
        </div>

        <div className="dw-card p-6 mt-8 text-center">
          <p className="text-lg">Send everything to <a href="mailto:jeff.cline@me.com" className="dw-gold font-semibold underline">jeff.cline@me.com</a></p>
          <p className="text-sm text-[var(--dw-muted)] mt-1">The moment we plug these in, your dashboards light up — impressions, engagement, trending posts and every lead, all in one place.</p>
        </div>
        <p className="text-center text-xs text-[var(--dw-muted)] mt-6">Powered by the R0cketShip Core · Doublewide Media</p>
      </main>
    </div>
  );
}
