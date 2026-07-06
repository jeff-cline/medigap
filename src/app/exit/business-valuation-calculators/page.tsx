import type { Metadata } from "next";
import { EXIT, exitVars } from "@/lib/exit";
import { CALCULATORS } from "@/lib/calculators";
import { searchPhotos } from "@/lib/pexels";
import ExitNav from "@/components/exit/ExitNav";
import CalculatorSuite from "@/components/exit/CalculatorSuite";
import { CtaBand } from "@/components/exit/ExitCTA";
import ExitFooter from "@/components/exit/ExitFooter";

export const dynamic = "force-dynamic";
const O = EXIT.colors.orange;

export const metadata: Metadata = {
  title: `Business Valuation Calculators — Free Exit Planning Tools | ${EXIT.brand}`,
  description: `Six free calculators every owner needs for exit & valuation planning: business valuation, EBITDA add-backs, exit readiness, net proceeds, owner dependence, and value gap. Create a free account to unlock full reports.`,
};

export default async function CalculatorsLanding() {
  const imgs = await Promise.all(CALCULATORS.map((c) => searchPhotos(c.img, 1).then((p) => p[0]?.url || "").catch(() => "")));
  const images = Object.fromEntries(CALCULATORS.map((c, i) => [c.slug, imgs[i]]));

  return (
    <div style={exitVars} className="text-white"><div style={{ background: EXIT.colors.bg }}>
      <ExitNav />
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-4">
        <div className="text-xs font-bold uppercase tracking-widest" style={{ color: EXIT.colors.orange3 }}>Free tools · Exit &amp; valuation planning</div>
        <h1 className="mt-2 text-5xl font-black tracking-tight">Business valuation calculators.</h1>
        <p className="mt-3 text-lg text-slate-300 max-w-2xl">The six numbers every owner needs before an exit. Run any calculator free — then create a free account to unlock the full report, save your results, and use all six.</p>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-8">
        <CalculatorSuite images={images} />
      </section>
      <CtaBand />
      <ExitFooter />
    </div></div>
  );
}
