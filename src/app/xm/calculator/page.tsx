import type { Metadata } from "next";
import { XM, xmVars } from "@/lib/xm";
import XmCalculator from "@/components/xm/XmCalculator";
import XmFooter from "@/components/xm/XmFooter";

export const dynamic = "force-dynamic";
const R = XM.colors.red;

export const metadata: Metadata = {
  title: `Experiential Marketing Reach Calculator | ${XM.brand}`,
  description: `Enter your budget, markets, and target eyeballs — get a custom experiential marketing proposal priced at $${XM.cpmDollars}/1,000 eyeballs.`,
};

export default function XmCalcPage() {
  return (
    <div style={xmVars} className="bg-black text-white min-h-screen">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="text-xs font-bold uppercase tracking-widest" style={{ color: R }}>Reach Calculator</div>
        <h1 className="mt-2 text-5xl font-black tracking-tight">Model your reach in seconds.</h1>
        <p className="mt-3 text-white/60 max-w-2xl">Enter your budget, how many markets you want, and the eyeballs you want to reach. We price experiential reach at <b className="text-white">${XM.cpmDollars} per 1,000 eyeballs</b> and return a custom proposal.</p>
        <div className="mt-8"><XmCalculator /></div>
        <p className="mt-6 text-xs text-white/40">Estimates are planning figures. Limited to budget items. May vary. To reach KPIs, we may activate other known industry best practices to meet KPIs, including technology and AI.</p>
      </div>
      <XmFooter />
    </div>
  );
}
