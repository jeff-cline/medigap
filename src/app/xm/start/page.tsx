import type { Metadata } from "next";
import { XM, xmVars } from "@/lib/xm";
import XmLeadForm from "@/components/xm/XmLeadForm";
import XmFooter from "@/components/xm/XmFooter";

export const dynamic = "force-dynamic";
const R = XM.colors.red;

export const metadata: Metadata = {
  title: `Start a Project | ${XM.full} (${XM.brand})`,
  description: `Start an experiential marketing project. Tell us your brand, budget, and markets — we'll return a custom plan and projected reach.`,
};

export default function XmStart() {
  return (
    <div style={xmVars} className="bg-black text-white min-h-screen">
      <div className="mx-auto max-w-4xl px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest" style={{ color: R }}>Start a Project</div>
          <h1 className="mt-2 text-5xl font-black tracking-tight leading-tight">Let's build the moment.</h1>
          <p className="mt-4 text-white/60">Tell us who you are and where you're headed. We'll come back with a custom experiential plan, a market strategy, and a projected-reach estimate at <b className="text-white">${XM.cpmDollars}/1,000 eyeballs</b>.</p>
          <p className="mt-4 text-white/50 text-sm">Prefer to model it first? <a href="/calculator" className="underline hover:text-white">Try the reach calculator →</a></p>
        </div>
        <div>
          <XmLeadForm kind="start" cta="Start my project →" done="Project request received." />
        </div>
      </div>
      <XmFooter />
    </div>
  );
}
