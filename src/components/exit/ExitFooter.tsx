import { EXIT } from "@/lib/exit";
import { EXIT_MONEY, exitGroups } from "@/lib/exit-taxonomy";
import { BookButton } from "@/components/exit/ExitCTA";

// Footer — links to ALL money-word landers (grouped) to pass authority juice back to them,
// plus every sitemap for SEO + answer engines.
export default function ExitFooter() {
  const groups = exitGroups();
  return (
    <footer className="border-t" style={{ background: "#050a18", borderColor: EXIT.colors.border }}>
      <div className="mx-auto max-w-6xl px-6 py-12 text-slate-300">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="text-xl font-black text-white">Exit<span style={{ color: EXIT.colors.orange }}>Optimization</span></div>
            <p className="mt-2 text-sm text-slate-400">{EXIT.tagline}</p>
            <div className="mt-4"><BookButton label="Book a free consultation" size="sm" /></div>
          </div>
          {groups.map((g) => (
            <div key={g}>
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: EXIT.colors.orange3 }}>{g}</div>
              <div className="space-y-1.5 text-sm">
                {EXIT_MONEY.filter((m) => m.group === g).map((m) => (
                  <a key={m.slug} href={`/${m.slug}`} className="block text-slate-400 hover:text-white">{m.name}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500" style={{ borderColor: EXIT.colors.border }}>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <a href="/" className="hover:text-white">Home</a>
            <a href="/how-we-work" className="hover:text-white">How we work</a>
            <a href="/faq" className="hover:text-white">FAQ (AEO)</a>
            <a href="/sitemap.xml" className="hover:text-white">XML Sitemap</a>
            <a href="/sitemap" className="hover:text-white">HTML Sitemap</a>
            <a href="/robots.txt" className="hover:text-white">Robots</a>
            <a href="/llms.txt" className="hover:text-white">llms.txt</a>
          </div>
          <span>© 2026 {EXIT.brand} · Double — even triple — your exit valuation.</span>
        </div>
      </div>
    </footer>
  );
}
