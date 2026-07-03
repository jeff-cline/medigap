import { XM } from "@/lib/xm";
import { XM_SILOS } from "@/lib/xm-taxonomy";

// XM footer: full silo interlinking + every sitemap (XML, AEO answers, llms.txt) so we pull
// traffic from Google, Yahoo, and answer engines (ChatGPT, Perplexity).
export default function XmFooter({ base = "" }: { base?: string }) {
  return (
    <footer style={{ background: "#000" }} className="text-white mt-16">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="text-2xl font-black tracking-tight">XM<span style={{ color: XM.colors.red }}>.</span></div>
            <p className="mt-2 text-sm text-white/50">{XM.tagline}</p>
            <a href={`${base}/start`} className="mt-4 inline-block rounded-full px-5 py-2.5 text-sm font-bold text-white" style={{ background: XM.colors.red }}>Start a project →</a>
          </div>
          <div className="md:col-span-2 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            {XM_SILOS.map((s) => (
              <a key={s.slug} href={`${base}/${s.slug}`} className="text-white/60 hover:text-white">{s.name}</a>
            ))}
          </div>
          <div className="text-sm">
            <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Explore</div>
            <div className="space-y-1.5">
              <a href={`${base}/calculator`} className="block text-white/60 hover:text-white">Reach Calculator</a>
              <a href={`${base}/white-paper`} className="block text-white/60 hover:text-white">Download White Paper</a>
              <a href={`${base}/answers`} className="block text-white/60 hover:text-white">Answers (AEO)</a>
              <a href={`${base}/start`} className="block text-white/60 hover:text-white">Start a Project</a>
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-white/40 mt-5 mb-2">Sitemaps</div>
            <div className="space-y-1.5">
              <a href={`${base}/sitemap.xml`} className="block text-white/60 hover:text-white">XML Sitemap</a>
              <a href={`${base}/answers`} className="block text-white/60 hover:text-white">Answer-Engine (AEO) Index</a>
              <a href={`${base}/llms.txt`} className="block text-white/60 hover:text-white">llms.txt (ChatGPT · Perplexity)</a>
              <a href={`${base}/robots.txt`} className="block text-white/60 hover:text-white">Robots</a>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-white/40">
          <span>© 2026 {XM.full} · {XM.domain} · Experiential marketing for the world's biggest brands.</span>
          <a href="https://r0cketship.com" target="_blank" className="hover:text-white/70">Powered by R0cketShip 🚀</a>
        </div>
      </div>
    </footer>
  );
}
