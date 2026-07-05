import type { Metadata } from "next";
import { EXIT, exitVars } from "@/lib/exit";
import { EXIT_MONEY, exitGroups } from "@/lib/exit-taxonomy";
import ExitFooter from "@/components/exit/ExitFooter";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: `Sitemap | ${EXIT.brand}`, description: "Every page on Exit Optimization." };

export default function HtmlSitemap() {
  return (
    <div style={exitVars} className="text-white"><div style={{ background: EXIT.colors.bg }}>
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-4xl font-black tracking-tight">Sitemap</h1>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <a href="/" className="hover:text-white" style={{ color: EXIT.colors.orange3 }}>Home</a>
          <a href="/how-we-work" className="hover:text-white" style={{ color: EXIT.colors.orange3 }}>How we work</a>
          <a href="/faq" className="hover:text-white" style={{ color: EXIT.colors.orange3 }}>FAQ</a>
        </div>
        {exitGroups().map((g) => (
          <div key={g} className="mt-8">
            <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: EXIT.colors.orange3 }}>{g}</div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {EXIT_MONEY.filter((m) => m.group === g).map((m) => (
                <div key={m.slug}>
                  <a href={`/${m.slug}`} className="font-bold hover:text-white">{m.name}</a>
                  <div className="mt-1 space-y-0.5">
                    {m.subs.map((s) => <a key={s.slug} href={`/${s.slug}`} className="block text-sm text-slate-400 hover:text-white">{s.title}</a>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
      <ExitFooter />
    </div></div>
  );
}
