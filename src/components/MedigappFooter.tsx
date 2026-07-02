import { MEDIGAPP } from "@/lib/medigapp";

const C = MEDIGAPP.colors;

// Shared footer for el.ag / medig.app pages: SEO + AEO links + a R0cketShip rocket.
// `base` keeps links correct under the medigap.plus/r mirror.
export default function MedigappFooter({ base = "" }: { base?: string }) {
  const links: [string, string][] = [
    ["Home", `${base}/`],
    ["Directory", `${base}/directory`],
    ["Answers (AEO)", `${base}/answers`],
    ["Sitemap (XML)", `${base}/sitemap.xml`],
    ["Robots", `${base}/robots.txt`],
    ["AI · llms.txt", `${base}/llms.txt`],
  ];
  return (
    <footer className="mt-12 border-t border-[var(--border)] pt-6">
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium">
        {links.map(([label, href]) => (
          <a key={href} href={href} className="text-[var(--muted)] hover:text-[var(--brand)]">{label}</a>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-center">
        <a href="https://r0cketship.com" target="_blank" rel="noopener" title="Powered by R0cketShip" className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 hover:border-[var(--brand)] transition-colors">
          <span className="grid place-items-center h-7 w-7 rounded-full text-[15px]" style={{ background: `linear-gradient(135deg, ${C.brand}, ${C.green})` }} aria-hidden>
            {/* rocketship */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
          </span>
          <span className="text-sm font-bold text-[var(--ink)]">Powered by <span style={{ color: C.brand }}>R0cketShip</span></span>
        </a>
      </div>

      <p className="mt-5 text-[10px] text-[var(--muted)] text-center leading-relaxed">© 2026 {MEDIGAPP.brand} · Not affiliated with or endorsed by the U.S. government, Medicare, or any insurer. Offers via Rakuten Advertising; we may earn a commission at no cost to you.</p>
    </footer>
  );
}
