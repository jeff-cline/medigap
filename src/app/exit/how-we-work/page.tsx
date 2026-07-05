import type { Metadata } from "next";
import { EXIT, EXIT_WAYS, exitVars } from "@/lib/exit";
import ExitLeadForm from "@/components/exit/ExitLeadForm";
import { BookButton, CtaBand } from "@/components/exit/ExitCTA";
import ExitFooter from "@/components/exit/ExitFooter";

export const dynamic = "force-dynamic";
const O = EXIT.colors.orange;

export const metadata: Metadata = {
  title: `How We Work — 3 Ways | ${EXIT.brand}`,
  description: `Three ways to engage: pay to play, we work for equity, or we work for backend success. Each available based on the opportunity. Book a free consultation.`,
};

export default function HowWeWork() {
  const detail = [
    "The fastest way to put the full team to work — a straightforward monthly engagement. Best when you want momentum now and to keep 100% of the upside.",
    "We take an equity stake and build alongside you as true partners. Best when alignment matters more than cash and you want owners in the boat with you.",
    "We're paid on the value we create at your exit — a success fee on everything above your baseline valuation. Best when you want partners whose entire incentive is a bigger exit.",
  ];
  return (
    <div style={exitVars} className="text-white"><div style={{ background: EXIT.colors.bg }}>
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="text-xs font-bold uppercase tracking-widest" style={{ color: EXIT.colors.orange3 }}>How we work</div>
        <h1 className="mt-2 text-5xl font-black tracking-tight">Three ways to work with us.</h1>
        <p className="mt-3 text-lg text-slate-300 max-w-2xl">One goal every time: double — even triple — your exit valuation. How we get paid flexes to the opportunity.</p>
        <div className="mt-9 space-y-4">
          {EXIT_WAYS.map((w, i) => (
            <div key={w.n} className="rounded-2xl border p-6 flex flex-wrap gap-5 items-start" style={{ borderColor: EXIT.colors.border, background: EXIT.colors.panel }}>
              <div className="text-4xl font-black" style={{ color: O }}>{w.n}</div>
              <div className="flex-1 min-w-[240px]"><div className="text-2xl font-black">{w.title}</div><p className="mt-1 text-slate-300">{w.desc}</p><p className="mt-2 text-sm text-slate-400">{detail[i]}</p></div>
            </div>
          ))}
        </div>
        <div className="mt-8"><BookButton label="Book a free consultation" size="lg" /></div>
        <div className="mt-10 max-w-xl"><ExitLeadForm /></div>
      </section>
      <CtaBand />
      <ExitFooter />
    </div></div>
  );
}
