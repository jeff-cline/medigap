import type { Metadata } from "next";
import { XM, xmVars } from "@/lib/xm";
import { XM_SILOS } from "@/lib/xm-taxonomy";
import { searchPhotos } from "@/lib/pexels";
import XmFooter from "@/components/xm/XmFooter";

export const dynamic = "force-dynamic";
const R = XM.colors.red;

export const metadata: Metadata = {
  title: `${XM.full} Agency for Top Brands | ${XM.brand}`,
  description: `${XM.tagline} Brand activations, mobile tours, glass box trucks, pop-ups, festivals, and immersive XR — designed, produced, and measured nationwide at $${XM.cpmDollars}/1,000 eyeballs.`,
};

export default async function XmHome() {
  const featured = XM_SILOS.slice(0, 6);
  const [hero, ...imgs] = await Promise.all([
    searchPhotos("brand experiential marketing event crowd lights", 1).then((p) => p[0]?.url || "").catch(() => ""),
    ...featured.map((s) => searchPhotos(s.img, 1).then((p) => p[0]?.url || "").catch(() => "")),
  ]);

  return (
    <div style={xmVars} className="bg-black text-white">
      {/* HERO */}
      <section className="relative min-h-[86vh] flex items-center overflow-hidden">
        {hero && /* eslint-disable-next-line @next/next/no-img-element */ <img src={hero} alt="Experiential marketing brand activation" className="absolute inset-0 w-full h-full object-cover opacity-40" />}
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,.85))" }} />
        <div className="relative mx-auto max-w-6xl px-6 py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-widest">
            <span style={{ color: R }}>●</span> Experiential Marketing · Nationwide
          </div>
          <h1 className="mt-5 text-5xl sm:text-7xl font-black tracking-tight leading-[0.95] max-w-4xl">
            We build brand moments<br />the world <span style={{ color: R }}>can't scroll past.</span>
          </h1>
          <p className="mt-6 text-lg text-white/70 max-w-2xl">{XM.tagline} Strategy, production, and measurable reach — from glass box trucks to festivals, pop-ups, and immersive XR — activated in every market that matters.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/start" className="rounded-full px-7 py-3.5 text-base font-bold text-white" style={{ background: R }}>Start a project →</a>
            <a href="/calculator" className="rounded-full px-7 py-3.5 text-base font-bold border border-white/25 hover:bg-white/10">Reach calculator</a>
            <a href="/white-paper" className="rounded-full px-7 py-3.5 text-base font-semibold text-white/80 hover:text-white">Download white paper ↓</a>
          </div>
        </div>
      </section>

      {/* STAT STRIP */}
      <section className="border-y border-white/10 bg-black">
        <div className="mx-auto max-w-6xl px-6 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[["$33", "per 1,000 eyeballs"], ["50", "markets, one standard"], ["22", "activation disciplines"], ["100%", "measured reach"]].map(([n, l]) => (
            <div key={l}><div className="text-4xl font-black" style={{ color: R }}>{n}</div><div className="text-xs uppercase tracking-widest text-white/50 mt-1">{l}</div></div>
          ))}
        </div>
      </section>

      {/* FEATURED CAPABILITIES */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-black tracking-tight">What we activate</h2>
        <p className="text-white/60 mt-2">Twenty-two experiential disciplines, engineered for brands that lead.</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((s, i) => (
            <a key={s.slug} href={`/${s.slug}`} className="group relative overflow-hidden rounded-2xl border border-white/10 aspect-[4/3]">
              {imgs[i] && /* eslint-disable-next-line @next/next/no-img-element */ <img src={imgs[i]} alt={s.name} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition" />}
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent, rgba(0,0,0,.9))" }} />
              <div className="absolute bottom-0 p-5">
                <div className="text-xl font-black">{s.name}</div>
                <div className="text-sm text-white/60">{s.blurb}</div>
                <div className="mt-2 text-sm font-bold" style={{ color: R }}>Explore →</div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ALL DISCIPLINES (typographic, high-contrast) */}
      <section className="bg-black border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Every discipline</div>
          <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {XM_SILOS.map((s) => (
              <a key={s.slug} href={`/${s.slug}`} className="flex items-center justify-between border-b border-white/10 py-2 hover:text-white text-white/70">
                <span className="font-bold">{s.name}</span><span style={{ color: R }}>→</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h2 className="text-4xl sm:text-5xl font-black tracking-tight">Ready to build the moment?</h2>
        <p className="text-white/60 mt-3 max-w-xl mx-auto">Tell us your budget, markets, and the reach you want. We'll return a custom plan — and a projected-eyeballs estimate — fast.</p>
        <div className="mt-7 flex flex-wrap gap-3 justify-center">
          <a href="/start" className="rounded-full px-8 py-4 text-base font-bold text-white" style={{ background: R }}>Start a project →</a>
          <a href="/calculator" className="rounded-full px-8 py-4 text-base font-bold border border-white/25 hover:bg-white/10">Try the calculator</a>
        </div>
      </section>

      <XmFooter />
    </div>
  );
}
