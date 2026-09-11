import Link from 'next/link'
import { SEO_PAGES, MEDICAL_DISCLAIMER } from '@/lib/mammo'

// Shared chrome for mammo.express. Type is deliberately large and contrast
// deliberately high — the core audience is 40+, often on a phone.

export function MammoHeader() {
  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF]/95 backdrop-blur border-b border-[#2E1065]/10">
      <div className="max-w-6xl mx-auto px-4 h-[72px] flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 min-w-0 group">
          <span className="w-10 h-10 rounded-2xl bg-[#7C3AED] text-white grid place-items-center font-black shrink-0 group-hover:scale-105 transition-transform">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="min-w-0">
            <span className="block font-black text-lg tracking-tight text-[#2E1065] leading-none">Mammo Express</span>
            <span className="hidden sm:block text-[11px] font-bold text-[#2E1065]/55 leading-none mt-1">
              Book it yourself. Walk in, walk out.
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link href="/locations" className="hidden sm:block text-sm font-bold text-[#2E1065]/75 hover:text-[#7C3AED] px-3 py-2">Locations</Link>
          <Link href="/prepare" className="hidden sm:block text-sm font-bold text-[#2E1065]/75 hover:text-[#7C3AED] px-3 py-2">Prepare</Link>
          <Link href="/faq" className="hidden md:block text-sm font-bold text-[#2E1065]/75 hover:text-[#7C3AED] px-3 py-2">Questions</Link>
          <Link href="/login" className="text-sm font-bold text-[#2E1065]/75 hover:text-[#7C3AED] px-3 py-2">Log in</Link>
          <Link href="/signup"
            className="rounded-xl bg-[#2E1065] hover:bg-[#7C3AED] text-white font-black text-sm px-4 sm:px-5 py-2.5 transition-colors whitespace-nowrap">
            Create an account
          </Link>
        </nav>
      </div>
    </header>
  )
}

export function MammoFooter() {
  return (
    <footer className="bg-[#2E1065] text-white/85">
      <div className="max-w-6xl mx-auto px-4 py-14">
        {/* opt-in to the wider network — the Core's standard footer slot */}
        <div className="rounded-3xl bg-white/5 border border-white/10 p-6 sm:p-8 mb-12">
          <h2 className="font-black text-white text-xl mb-2">Stay on top of the rest of your health</h2>
          <p className="text-sm text-white/70 max-w-2xl mb-5">
            Mammo Express is part of a wider network of health and wellness services. Opt in and we
            will let you know when something genuinely useful is available in your area — screening,
            prevention, and practitioners who take your time seriously. One email at a time, and you
            can leave whenever you like.
          </p>
          <form action="/api/mammo/subscribe" method="post" className="flex flex-col sm:flex-row gap-2 max-w-lg">
            <input type="email" name="email" required placeholder="you@example.com"
              aria-label="Email address"
              className="flex-1 rounded-xl px-4 py-3 text-[#2E1065] font-medium" />
            <button className="rounded-xl bg-[#7C3AED] hover:bg-[#5B21B6] text-white font-black px-6 py-3 transition-colors">
              Keep me posted
            </button>
          </form>
          <p className="text-[11px] text-white/45 mt-3">
            Email only. We never sell your details, and we never text you without separate, explicit consent.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="font-black text-white mb-3 text-sm uppercase tracking-widest">Book</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/signup" className="hover:text-[#C4B5FD]">Create an account</Link></li>
              <li><Link href="/locations" className="hover:text-[#C4B5FD]">Find a location</Link></li>
              <li><Link href="/how-it-works" className="hover:text-[#C4B5FD]">How it works</Link></li>
              <li><Link href="/login" className="hover:text-[#C4B5FD]">Log in</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-black text-white mb-3 text-sm uppercase tracking-widest">Prepare</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/prepare" className="hover:text-[#C4B5FD]">How to prepare</Link></li>
              <li><Link href="/prepare/checklist.pdf" className="hover:text-[#C4B5FD]">Printable checklist (PDF)</Link></li>
              <li><Link href="/faq" className="hover:text-[#C4B5FD]">Questions and answers</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-black text-white mb-3 text-sm uppercase tracking-widest">Answers</h3>
            <ul className="space-y-2 text-sm">
              {SEO_PAGES.slice(0, 4).map((p) => (
                <li key={p.slug}><Link href={`/answers/${p.slug}`} className="hover:text-[#C4B5FD]">{p.h1}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-black text-white mb-3 text-sm uppercase tracking-widest">More</h3>
            <ul className="space-y-2 text-sm">
              {SEO_PAGES.slice(4).map((p) => (
                <li key={p.slug}><Link href={`/answers/${p.slug}`} className="hover:text-[#C4B5FD]">{p.h1}</Link></li>
              ))}
              <li><Link href="/answers" className="hover:text-[#C4B5FD]">All answers</Link></li>
            </ul>
          </div>
        </div>

        {/* machine-readable index — asked for explicitly, and genuinely useful
            to answer engines that do not crawl HTML well */}
        <div className="border-t border-white/10 pt-6 mb-6">
          <h3 className="font-black text-white/70 mb-3 text-xs uppercase tracking-widest">Site index</h3>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/55">
            <li><Link href="/sitemap" className="hover:text-[#C4B5FD] underline">HTML sitemap</Link></li>
            <li><a href="/sitemap.xml" className="hover:text-[#C4B5FD] underline">XML sitemap</a></li>
            <li><a href="/sitemap.txt" className="hover:text-[#C4B5FD] underline">Text sitemap</a></li>
            <li><a href="/llms.txt" className="hover:text-[#C4B5FD] underline">llms.txt (answer engines)</a></li>
            <li><a href="/answers/feed.json" className="hover:text-[#C4B5FD] underline">Answer feed (JSON)</a></li>
            <li><a href="/robots.txt" className="hover:text-[#C4B5FD] underline">robots.txt</a></li>
          </ul>
        </div>

        <div className="border-t border-white/10 pt-6 space-y-4">
          <p className="text-xs text-white/55 leading-relaxed max-w-4xl">{MEDICAL_DISCLAIMER}</p>
          <p className="text-xs text-white/45 leading-relaxed max-w-4xl">
            Screening guidance on this site is drawn from the{' '}
            <a href="https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/breast-cancer-screening" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/70">U.S. Preventive Services Task Force</a>,{' '}
            <a href="https://www.cdc.gov/breast-cancer/about/mammograms.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/70">CDC</a>,{' '}
            <a href="https://www.fda.gov/radiation-emitting-products/mammography-information-patients/frequently-asked-questions-about-mqsa" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/70">FDA</a> and{' '}
            <a href="https://www.cancer.gov/types/breast/screening/mammograms" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/70">National Cancer Institute</a>.
            Not affiliated with or endorsed by any government agency.
          </p>
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Mammo Express. In a medical emergency call 911.
          </p>
        </div>
      </div>
    </footer>
  )
}
