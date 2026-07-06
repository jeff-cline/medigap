import type { Metadata } from "next";
import { EXIT, EXIT_WAYS, exitVars } from "@/lib/exit";
import { EXIT_MONEY, exitGroups } from "@/lib/exit-taxonomy";
import ExitLeadForm from "@/components/exit/ExitLeadForm";
import ExitNav from "@/components/exit/ExitNav";
import { BookButton, CtaBand } from "@/components/exit/ExitCTA";
import ExitFooter from "@/components/exit/ExitFooter";

export const dynamic = "force-dynamic";
const O = EXIT.colors.orange;

export const metadata: Metadata = {
  title: `${EXIT.brand} — Double or Triple Your Exit Valuation`,
  description: `We help owners multiply their exit multiple. Business valuation, sale & succession attorneys, M&A CPAs, exit consultants, sell-side readiness, QoE & due-diligence prep — one team, one goal. Book a free consultation.`,
};

export default function ExitHome() {
  return (
    <div style={exitVars} className="text-white" >
      <div style={{ background: EXIT.colors.bg }}>
        <ExitNav />
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: "radial-gradient(900px 500px at 80% -10%, #f9731622, transparent 60%)" }} />
          <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-12 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-widest" style={{ borderColor: "#f9731655", color: EXIT.colors.orange3 }}>Exit Optimization · IP &amp; Technology as a Multiplier</div>
              <h1 className="mt-5 text-5xl sm:text-6xl font-black tracking-tight leading-[0.98]">Double — even <span style={{ color: O }}>triple</span> — your exit valuation.</h1>
              <p className="mt-5 text-lg text-slate-300 max-w-xl">Most owners leave 30–60% of their value on the table. We assemble the attorneys, CPAs, and advisors — and the technology, data, and leadership — that expand your multiple and get you paid at the close.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <BookButton label="Book a free consultation" size="lg" />
                <a href="/how-we-work" className="inline-flex items-center rounded-md border px-7 py-4 text-base font-bold hover:bg-white/5" style={{ borderColor: EXIT.colors.border }}>3 ways to work with us</a>
              </div>
            </div>
            <div><ExitLeadForm /></div>
          </div>
        </section>

        {/* 3 WAYS TO WORK */}
        <section className="mx-auto max-w-6xl px-6 py-12 border-t" style={{ borderColor: EXIT.colors.border }}>
          <h2 className="text-3xl font-black tracking-tight">Three ways to work with us</h2>
          <p className="text-slate-400 mt-1">Each is available based on the opportunity — we'll recommend the right fit.</p>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {EXIT_WAYS.map((w) => (
              <div key={w.n} className="rounded-2xl border p-6" style={{ borderColor: EXIT.colors.border, background: EXIT.colors.panel }}>
                <div className="text-3xl font-black" style={{ color: O }}>{w.n}</div>
                <div className="mt-1 text-xl font-black">{w.title}</div>
                <p className="mt-2 text-sm text-slate-400">{w.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* MONEY-WORD GRID (grouped) */}
        <section className="mx-auto max-w-6xl px-6 py-12 border-t" style={{ borderColor: EXIT.colors.border }}>
          <h2 className="text-3xl font-black tracking-tight">The specialists who protect &amp; multiply your value</h2>
          <p className="text-slate-400 mt-1">One team, quarterbacked under a single plan — every discipline pointed at your exit.</p>
          {exitGroups().map((g) => (
            <div key={g} className="mt-7">
              <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: EXIT.colors.orange3 }}>{g}</div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {EXIT_MONEY.filter((m) => m.group === g).map((m) => (
                  <a key={m.slug} href={`/${m.slug}`} className="group rounded-2xl border p-5 hover:border-[color:var(--orange)] transition-colors" style={{ borderColor: EXIT.colors.border, background: EXIT.colors.panel }}>
                    <div className="font-black text-lg group-hover:text-white">{m.name}</div>
                    <div className="text-sm text-slate-400 mt-1">{m.blurb}</div>
                    <div className="mt-3 text-sm font-bold" style={{ color: O }}>Learn more →</div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </section>

        <CtaBand />
        <ExitFooter />
      </div>
    </div>
  );
}
