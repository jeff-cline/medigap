import { HIA } from "@/lib/health";

const C = HIA.colors;
const Call = ({ label = "Call 1-800-MEDIGAP", block = false }: { label?: string; block?: boolean }) => (
  <a href={`tel:${HIA.tel}`} className={`${block ? "block w-full text-center" : "inline-flex items-center gap-2"} rounded-lg font-bold text-white px-5 py-3`} style={{ background: C.green }}>📞 {label}</a>
);

export function Crumbs({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs mb-3" style={{ color: C.muted }}>
      {items.map((b, i) => <span key={i}>{i > 0 && " › "}{b.href ? <a href={b.href} className="hover:underline" style={{ color: C.blue }}>{b.name}</a> : <span>{b.name}</span>}</span>)}
    </nav>
  );
}

export default function HiaShell({ children, crumbs }: { children: React.ReactNode; crumbs?: { name: string; href?: string }[] }) {
  return (
    <div style={{ background: C.white, color: C.ink, fontFamily: "-apple-system,Helvetica Neue,Arial,sans-serif", minHeight: "100vh" }}>
      {/* TOP NAV — home button "Private Health Insurance" on every page (crawlable text) */}
      <header style={{ background: C.navy }} className="text-white">
        <div className="mx-auto max-w-6xl px-5 h-14 flex items-center justify-between">
          <a href="/" className="font-black tracking-tight text-lg text-white" aria-label={`${HIA.brand} — home`}>Private <span style={{ color: "#9ec1ff" }}>Health Insurance</span></a>
          <div className="hidden sm:block"><Call /></div>
        </div>
      </header>

      {/* TOP BANNER */}
      <div style={{ background: C.soft, borderBottom: `1px solid ${C.border}` }}>
        <div className="mx-auto max-w-6xl px-5 py-2.5 text-center text-sm font-semibold" style={{ color: C.navy }}>
          Private Health Insurance Questions? <a href={`tel:${HIA.tel}`} style={{ color: C.green }} className="font-bold">Call {HIA.telDisplay}</a>
        </div>
      </div>

      {/* BODY + SIDE SKYSCRAPER CTA */}
      <div className="mx-auto max-w-6xl px-5 py-8 grid gap-8 lg:grid-cols-[1fr_300px]">
        <main>
          {crumbs && <Crumbs items={crumbs} />}
          {children}
          <p className="mt-10 text-xs rounded-lg p-4" style={{ background: C.soft, color: C.muted, border: `1px solid ${C.border}` }}>{HIA.disclaimer}</p>
        </main>
        <aside className="hidden lg:block">
          <div className="sticky top-6 rounded-xl p-6 text-center text-white" style={{ background: `linear-gradient(160deg, ${C.navy}, ${C.blue})` }}>
            <div className="text-sm font-bold uppercase tracking-widest" style={{ color: "#bcd4ff" }}>Need help?</div>
            <div className="mt-2 text-2xl font-black leading-tight">Private Health Insurance help — free.</div>
            <p className="mt-2 text-sm text-white/80">Questions about an application, a supplement, or a policy? Talk to a specialist.</p>
            <div className="mt-4"><Call block /></div>
          </div>
        </aside>
      </div>

      {/* BOTTOM CTA */}
      <section style={{ background: C.navy }} className="text-white">
        <div className="mx-auto max-w-6xl px-5 py-10 text-center">
          <h2 className="text-2xl font-black">Private Health Insurance questions?</h2>
          <p className="mt-1 text-white/70">A licensed specialist can help you find the right application and answer your questions — free.</p>
          <div className="mt-4 flex justify-center"><Call /></div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#071d3f" }} className="text-white/70">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <div className="grid gap-6 sm:grid-cols-3 text-sm">
            <div>
              <a href="/" className="text-white font-black">Private Health Insurance</a>
              <p className="mt-2 text-white/50">A repository of publicly available private health insurance applications, enrollment forms, and carrier PDFs.</p>
            </div>
            <div className="space-y-1.5">
              <div className="text-xs uppercase tracking-widest text-white/40 mb-1">Explore</div>
              <a href="/health-insurance-companies" className="block hover:text-white">Health Insurance Companies</a>
              <a href="/apply" className="block hover:text-white">Apply by State</a>
              <a href="/insurance-quotes" className="block hover:text-white">Insurance Quotes</a>
              <a href="/health-insurance-plans" className="block hover:text-white">Health Insurance Plans</a>
              <a href="/health-savings-account" className="block hover:text-white">Health Savings Account (HSA)</a>
            </div>
            <div className="space-y-1.5">
              <div className="text-xs uppercase tracking-widest text-white/40 mb-1">Resources</div>
              <a href="/sitemap.html" className="block hover:text-white">HTML Sitemap</a>
              <a href="/sitemap.xml" className="block hover:text-white">XML Sitemap</a>
              <a href="/aeo-sitemap" className="block hover:text-white">AEO / Answer Engine</a>
              <a href="/faq" className="block hover:text-white">Frequently Asked Questions</a>
            </div>
          </div>
          <div className="mt-8 pt-5 border-t border-white/10 text-xs text-white/40">© 2026 healthinsuranceapplication.com · Not affiliated with or endorsed by any insurance carrier. <a href="https://1-800-medigap.com" className="text-white/60">MEDIGAP</a></div>
        </div>
      </footer>

      {/* STICKY MOBILE CTA */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 p-3" style={{ background: "rgba(11,43,92,.96)" }}>
        <Call label="Call 1-800-MEDIGAP" block />
      </div>
    </div>
  );
}

// FAQ block + FAQPage JSON-LD (used on every page).
export function FaqBlock({ faqs, id = "faq" }: { faqs: { q: string; a: string }[]; id?: string }) {
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  return (
    <section id={id} className="mt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <h2 className="text-2xl font-black" style={{ color: C.navy }}>Frequently asked questions</h2>
      <div className="mt-4 divide-y" style={{ borderColor: C.border }}>
        {faqs.map((f, i) => <details key={i} className="py-3 border-t" style={{ borderColor: C.border }}><summary className="cursor-pointer font-semibold" style={{ color: C.ink }}>{f.q}</summary><p className="mt-2 text-sm" style={{ color: C.muted }} dangerouslySetInnerHTML={{ __html: f.a }} /></details>)}
      </div>
    </section>
  );
}
