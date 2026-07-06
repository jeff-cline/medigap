import { EXIT } from "@/lib/exit";
import { EXIT_MONEY } from "@/lib/exit-taxonomy";
import { BookButton } from "@/components/exit/ExitCTA";

// Footer — 4 discipline columns on one row (Readiness · Legal · Financial · Advisory) to pass
// authority juice back to every money word; login for returning members; 🚀 → R0cketShip.
const GROUP_ORDER = ["Readiness", "Legal", "Financial", "Advisory"];

export default function ExitFooter() {
  return (
    <footer className="border-t" style={{ background: "#050a18", borderColor: EXIT.colors.border }}>
      <div className="mx-auto max-w-6xl px-6 py-12 text-slate-300">
        {/* top: brand + CTAs + login */}
        <div className="flex flex-wrap items-start justify-between gap-6 pb-8 border-b" style={{ borderColor: EXIT.colors.border }}>
          <div>
            <div className="text-xl font-black text-white">Exit<span style={{ color: EXIT.colors.orange }}>Optimization</span></div>
            <p className="mt-2 text-sm text-slate-400 max-w-sm">{EXIT.tagline}</p>
            <a href="/business-valuation-calculators" className="mt-3 inline-block text-sm font-bold" style={{ color: EXIT.colors.orange3 }}>🧮 Free business valuation calculators →</a>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <BookButton label="Book a free consultation" size="sm" />
            <a href="/become-a-partner" className="inline-flex rounded-md border px-3 py-2 text-xs font-bold" style={{ borderColor: EXIT.colors.border, color: "#cbd5e1" }}>Become a partner</a>
            <a href="/login" className="inline-flex rounded-md border px-3 py-2 text-xs font-bold" style={{ borderColor: EXIT.colors.orange, color: EXIT.colors.orange3 }}>Log in</a>
          </div>
        </div>

        {/* the 4 discipline columns — one row */}
        <div className="grid gap-6 grid-cols-2 md:grid-cols-4 py-8">
          {GROUP_ORDER.map((g) => (
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

        {/* bottom bar */}
        <div className="pt-6 border-t flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500" style={{ borderColor: EXIT.colors.border }}>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <a href="/" className="hover:text-white">Home</a>
            <a href="/how-we-work" className="hover:text-white">How we work</a>
            <a href="/business-valuation-calculators" className="hover:text-white">Calculators</a>
            <a href="/faq" className="hover:text-white">FAQ</a>
            <a href="/become-a-partner" className="hover:text-white">Become a partner</a>
            <a href="/advertise" className="hover:text-white">Advertise</a>
            <a href="/login" className="hover:text-white">Log in</a>
            <a href="/sitemap.xml" className="hover:text-white">Sitemap</a>
            <a href="/llms.txt" className="hover:text-white">llms.txt</a>
          </div>
          <div className="flex items-center gap-3">
            <span>© 2026 {EXIT.brand}</span>
            <a href="https://r0cketship.com" target="_blank" rel="noopener" title="Powered by R0cketShip" className="text-lg hover:opacity-80">🚀</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
