import type { Metadata } from "next";
import { EXIT, EXIT_WAYS, exitVars } from "@/lib/exit";
import ExitNav from "@/components/exit/ExitNav";
import BookEmbed from "@/components/exit/BookEmbed";
import ExitFooter from "@/components/exit/ExitFooter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Book a Free Consultation — Multiply Your Exit | ${EXIT.brand}`,
  description: `Book a free 30-minute consultation. We'll show you where your value is hiding and how we'd double — even triple — your exit valuation.`,
};

export default function BookPage() {
  return (
    <div style={exitVars} className="text-white"><div style={{ background: EXIT.colors.bg }}>
      <ExitNav />
      <section className="mx-auto max-w-5xl px-6 py-12 grid lg:grid-cols-2 gap-8 items-start">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest" style={{ color: EXIT.colors.orange3 }}>Free · 30 minutes · A working session, not a pitch</div>
          <h1 className="mt-2 text-4xl sm:text-5xl font-black tracking-tight">Book a free consultation to <span style={{ color: EXIT.colors.orange }}>multiply your exit.</span></h1>
          <p className="mt-4 text-lg text-slate-300">Pick a time that works. We'll review your situation and show you exactly where the value is hiding — and how we'd increase your multiple.</p>
          <div className="mt-6 space-y-3">
            {EXIT_WAYS.map((w) => (
              <div key={w.n} className="flex gap-3"><span className="font-black" style={{ color: EXIT.colors.orange }}>{w.n}</span><div><b className="text-white">{w.title}</b> <span className="text-slate-400 text-sm">— {w.desc}</span></div></div>
            ))}
          </div>
        </div>
        <BookEmbed />
      </section>
      <ExitFooter />
    </div></div>
  );
}
