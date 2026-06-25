import Link from "next/link";
import DwLogo from "@/components/doublewide/DwLogo";
import DwIntake from "@/components/doublewide/DwIntake";
import { searchPhotos } from "@/lib/pexels";

export const dynamic = "force-dynamic";

const STATS = [
  ["50M+", "micro-influencers worldwide"],
  ["7×", "higher engagement vs. macro"],
  ["1:1", "trust with their audience"],
  ["$0", "wasted — every lead is tracked"],
];
const CREATOR = [
  ["Connect your accounts", "Link Facebook, Instagram and X in a click — we read the data, you keep the relationships."],
  ["Grab a tracked link or form", "Drop our smart forms into any post. Every click and lead is attributed to you."],
  ["Get paid forever", "Earn a revenue share or activation fee on every customer you send — for as long as they spend."],
];
const BRAND = [
  ["Reach real audiences", "Vetted micro-influencers with engaged, trusting followers — not vanity reach."],
  ["Track lead → revenue", "Every click flows into the Core CRM. See exactly which creator drove which dollar."],
  ["Scale what works", "Run offers across the whole network as backfill, and double down on the winners."],
];

async function img(q: string): Promise<string> {
  try { const [p] = await searchPhotos(q, 1); return p?.url || ""; } catch { return ""; }
}

export default async function DoublewidePage() {
  const [hero, creatorImg, brandImg] = await Promise.all([
    img("content creator filming smartphone ring light"),
    img("young woman influencer phone social media"),
    img("marketing team meeting laptop analytics"),
  ]);
  const heroBg = hero || "";

  return (
    <div>
      {/* nav */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b border-[var(--dw-border)]">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <DwLogo />
          <nav className="hidden md:flex items-center gap-7 text-sm text-[var(--dw-muted)]">
            <a href="#creators" className="hover:text-[var(--dw-ink)]">For Creators</a>
            <a href="#brands" className="hover:text-[var(--dw-ink)]">For Brands</a>
            <a href="#how" className="hover:text-[var(--dw-ink)]">How it works</a>
            <Link href="/login" className="hover:text-[var(--dw-ink)]">Log in</Link>
          </nav>
          <a href="#join" className="dw-btn dw-btn-navy text-sm !py-2.5">Join free</a>
        </div>
      </header>

      {/* hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 pt-16 pb-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="dw-chip">Powered by the R0cketShip Core</span>
            <h1 className="mt-5 text-5xl md:text-6xl font-extrabold leading-[1.04]">
              Micro-influencers are <span className="dw-grad">the future of media.</span>
            </h1>
            <p className="mt-5 text-lg text-[var(--dw-muted)] max-w-xl leading-relaxed">
              Doublewide turns trusted creators into a measurable growth engine. <b className="text-[var(--dw-ink)]">Brands</b> reach
              engaged audiences; <b className="text-[var(--dw-ink)]">creators</b> get paid on every lead and sale — tracked, attributed
              and re-marketed forever inside one Core.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#join" className="dw-btn dw-btn-green text-base">I&apos;m a Creator — get paid →</a>
              <a href="#join" className="dw-btn dw-btn-gold text-base">I&apos;m a Brand — reach audiences →</a>
            </div>
            <div className="mt-10 grid grid-cols-4 gap-4">
              {STATS.map(([v, l]) => (
                <div key={l}><div className="text-2xl md:text-3xl font-extrabold dw-gold">{v}</div><div className="text-[11px] text-[var(--dw-muted)] leading-tight mt-1">{l}</div></div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="dw-card overflow-hidden dw-float">
              {heroBg ? <img src={heroBg} alt="Creator" className="w-full h-[420px] object-cover" /> : <div className="w-full h-[420px]" style={{ background: "linear-gradient(135deg,#c69a3e,#3f9d77)" }} />}
            </div>
            <div className="dw-card absolute -bottom-5 -left-5 p-4 w-56 hidden md:block">
              <div className="text-xs text-[var(--dw-muted)]">Lead attributed to</div>
              <div className="font-bold">@yourcreator</div>
              <div className="mt-1 text-sm dw-gold font-semibold">+ $5 activation · 1% revenue</div>
            </div>
          </div>
        </div>
      </section>

      {/* For creators */}
      <section id="creators" className="bg-[var(--dw-bg2)] border-y border-[var(--dw-border)]">
        <div className="mx-auto max-w-7xl px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div className="dw-card overflow-hidden order-2 lg:order-1">
            {creatorImg ? <img src={creatorImg} alt="Creator" className="w-full h-[360px] object-cover" /> : <div className="h-[360px]" style={{ background: "linear-gradient(135deg,#3f9d77,#4fb98c)" }} />}
          </div>
          <div className="order-1 lg:order-2">
            <span className="dw-chip">For Creators</span>
            <h2 className="mt-4 text-4xl font-bold">Get paid by the big companies — <span className="dw-grad">on your terms.</span></h2>
            <p className="mt-3 text-[var(--dw-muted)]">You built the audience. Now monetize it across the entire PredictiveData network — without giving up your relationships.</p>
            <div className="mt-6 space-y-4">
              {CREATOR.map(([t, d], i) => (
                <div key={t} className="flex gap-4"><div className="shrink-0 w-9 h-9 rounded-full bg-[var(--dw-green)] text-white grid place-items-center font-bold">{i + 1}</div><div><div className="font-semibold">{t}</div><div className="text-sm text-[var(--dw-muted)]">{d}</div></div></div>
              ))}
            </div>
            <a href="#join" className="dw-btn dw-btn-green mt-7">Join as a Creator →</a>
          </div>
        </div>
      </section>

      {/* For brands */}
      <section id="brands">
        <div className="mx-auto max-w-7xl px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="dw-chip">For Brands</span>
            <h2 className="mt-4 text-4xl font-bold">Engaged reach, <span className="dw-grad">measured to the dollar.</span></h2>
            <p className="mt-3 text-[var(--dw-muted)]">Stop guessing at influencer ROI. Every creator, click and conversion lands in one Core — fully tracked and re-marketable.</p>
            <div className="mt-6 space-y-4">
              {BRAND.map(([t, d], i) => (
                <div key={t} className="flex gap-4"><div className="shrink-0 w-9 h-9 rounded-full bg-[var(--dw-gold)] text-white grid place-items-center font-bold">{i + 1}</div><div><div className="font-semibold">{t}</div><div className="text-sm text-[var(--dw-muted)]">{d}</div></div></div>
              ))}
            </div>
            <a href="#join" className="dw-btn dw-btn-gold mt-7">Partner as a Brand →</a>
          </div>
          <div className="dw-card overflow-hidden">
            {brandImg ? <img src={brandImg} alt="Brand analytics" className="w-full h-[360px] object-cover" /> : <div className="h-[360px]" style={{ background: "linear-gradient(135deg,#1b2740,#c69a3e)" }} />}
          </div>
        </div>
      </section>

      {/* how it works */}
      <section id="how" className="bg-[var(--dw-navy)] text-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center max-w-2xl mx-auto">
            <span className="dw-chip !bg-white/10 !border-white/20 !text-white/80">The engine</span>
            <h2 className="mt-4 text-4xl font-bold">One Core. <span className="dw-grad">Every dot connected.</span></h2>
            <p className="mt-3 text-white/70">Social traffic becomes owned, monetizable relationships — managed, tracked and scaled in the R0cketShip Core.</p>
          </div>
          <div className="mt-12 grid md:grid-cols-4 gap-4">
            {[
              ["Connect", "Creators link their social accounts; brands bring offers."],
              ["Capture", "Smart forms turn posts & clicks into tracked leads in the Core."],
              ["Attribute", "Every lead is tied to its creator — through the whole network."],
              ["Monetize", "Pay creators a revenue share or activation fee on real spend, forever."],
            ].map(([t, d], i) => (
              <div key={t} className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <div className="text-sm font-mono text-[var(--dw-gold-2)]">0{i + 1}</div>
                <div className="text-lg font-semibold mt-2">{t}</div>
                <div className="text-sm text-white/65 mt-1">{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* join */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold">Engage as a <span className="dw-grad">creator or a brand.</span></h2>
          <p className="mt-3 text-[var(--dw-muted)]">One platform, two ways to win. Pick your side and connect to the Core.</p>
        </div>
        <DwIntake />
      </section>

      {/* footer */}
      <footer className="border-t border-[var(--dw-border)] bg-[var(--dw-bg2)]">
        <div className="mx-auto max-w-7xl px-6 py-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <DwLogo size="sm" />
            <p className="mt-2 text-sm text-[var(--dw-muted)] max-w-md">The media company for the micro-influencer era.</p>
            <p className="mt-1 text-xs text-[var(--dw-muted)]">
              On the R0cketShip Core (Mission Control) · R0cketShip Holdings · powered by PredictiveData.org &amp; VRTCLS · founder <a href="https://jeff-cline.com" className="underline">Jeff Cline</a>.
            </p>
          </div>
          <div className="text-sm">
            <Link href="/login" className="dw-btn !py-2 !px-4">Log in to the Core →</Link>
            <p className="text-[11px] text-[var(--dw-muted)] mt-2 text-right">© 2026 Doublewide Media</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
