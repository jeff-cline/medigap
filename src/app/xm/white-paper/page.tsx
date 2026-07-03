import type { Metadata } from "next";
import { XM, xmVars } from "@/lib/xm";
import XmLeadForm from "@/components/xm/XmLeadForm";
import XmFooter from "@/components/xm/XmFooter";

export const dynamic = "force-dynamic";
const R = XM.colors.red;

export const metadata: Metadata = {
  title: `Experiential Marketing White Paper — Free Download | ${XM.brand}`,
  description: `Download the ${XM.full} white paper: how top brands plan, produce, and measure experiential programs nationwide.`,
};

export default function XmWhitePaper() {
  return (
    <div style={xmVars} className="bg-black text-white min-h-screen">
      <div className="mx-auto max-w-4xl px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest" style={{ color: R }}>Free White Paper</div>
          <h1 className="mt-2 text-5xl font-black tracking-tight leading-tight">The experiential playbook for top brands.</h1>
          <p className="mt-4 text-white/60">How the world's biggest brands plan, produce, and measure experiential programs — reach math, market selection, activation menus, and the KPIs that prove ROI. Fill out the form and download instantly.</p>
          <ul className="mt-5 space-y-1.5 text-white/70 text-sm">
            <li>▪ The $33/1,000-eyeball reach model, explained</li>
            <li>▪ Choosing markets &amp; activation mix</li>
            <li>▪ Measurement &amp; attribution that holds up</li>
          </ul>
        </div>
        <div>
          <XmLeadForm kind="white-paper" cta="Download the white paper ↓" done="Your white paper is on the way." />
        </div>
      </div>
      <XmFooter />
    </div>
  );
}
