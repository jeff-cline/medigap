import type { Metadata } from "next";
import { EXIT, exitVars } from "@/lib/exit";
import ExitNav from "@/components/exit/ExitNav";
import AdvertiseForm from "@/components/exit/AdvertiseForm";
import ExitFooter from "@/components/exit/ExitFooter";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: `Advertise With Us | ${EXIT.brand}`, description: "Reach business owners planning their exit. Tell us about your business." };

export default function Advertise() {
  return (
    <div style={exitVars} className="text-white"><div style={{ background: EXIT.colors.bg }}>
      <ExitNav />
      <section className="mx-auto max-w-4xl px-6 py-12 grid md:grid-cols-2 gap-8 items-start">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest" style={{ color: EXIT.colors.orange3 }}>Advertise with us</div>
          <h1 className="mt-2 text-4xl sm:text-5xl font-black tracking-tight">Get in front of owners planning their exit.</h1>
          <p className="mt-4 text-lg text-slate-300">Our calculator customers are business owners actively planning a sale. Tell us about your business and how we can help — we'll be in touch.</p>
          <p className="mt-3 text-slate-400 text-sm">Want to run ads inside the calculator platform? <a href="/become-a-partner" className="underline" style={{ color: EXIT.colors.orange3 }}>Become a partner →</a></p>
        </div>
        <AdvertiseForm />
      </section>
      <ExitFooter />
    </div></div>
  );
}
