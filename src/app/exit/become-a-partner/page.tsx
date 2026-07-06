import type { Metadata } from "next";
import { EXIT, exitVars } from "@/lib/exit";
import { partnerSignupOn } from "@/app/api/exit/partner-signup/route";
import ExitNav from "@/components/exit/ExitNav";
import PartnerSignupForm from "@/components/exit/PartnerSignupForm";
import ExitFooter from "@/components/exit/ExitFooter";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: `Become a Partner | ${EXIT.brand}`, description: "Run your ad in front of business owners planning their exit. Create a partner account and manage everything yourself." };

export default async function BecomePartner() {
  const on = await partnerSignupOn();
  return (
    <div style={exitVars} className="text-white"><div style={{ background: EXIT.colors.bg }}>
      <ExitNav />
      <section className="mx-auto max-w-4xl px-6 py-12 grid md:grid-cols-2 gap-8 items-start">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest" style={{ color: EXIT.colors.orange3 }}>Become a partner</div>
          <h1 className="mt-2 text-4xl sm:text-5xl font-black tracking-tight">Put your ad in front of owners planning an exit.</h1>
          <p className="mt-4 text-lg text-slate-300">Create a partner account, add your ad, and manage it yourself. Every customer who clicks your ad becomes a lead in your dashboard — a one-for-many marketing platform.</p>
          <ul className="mt-5 space-y-1.5 text-slate-300 text-sm">
            <li>▪ Self-serve — create &amp; edit your own ad anytime</li>
            <li>▪ See your clicks and the leads they generate</li>
            <li>▪ Reach business owners actively planning a sale</li>
          </ul>
        </div>
        {on ? <PartnerSignupForm /> : (
          <div className="rounded-2xl border p-8 text-center" style={{ borderColor: EXIT.colors.border, background: EXIT.colors.panel }}>
            <div className="text-3xl">⏳</div>
            <div className="mt-2 text-lg font-bold text-white">Partner applications are paused.</div>
            <p className="text-slate-400 mt-1">We're not onboarding new partners right now. <a href="/advertise" className="underline" style={{ color: EXIT.colors.orange3 }}>Reach out here →</a></p>
          </div>
        )}
      </section>
      <ExitFooter />
    </div></div>
  );
}
