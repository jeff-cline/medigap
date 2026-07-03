import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { XM, xmVars } from "@/lib/xm";
import { xmSilo, xmSub, XM_SILOS } from "@/lib/xm-taxonomy";
import { xmContent } from "@/lib/xm-content";
import { searchPhotos } from "@/lib/pexels";
import XmFooter from "@/components/xm/XmFooter";

export const dynamic = "force-dynamic";
const R = XM.colors.red;

function resolve(slug: string) {
  const silo = xmSilo(slug);
  if (silo) return { kind: "silo" as const, name: silo.name, silo, sub: null };
  const s = xmSub(slug);
  if (s) return { kind: "sub" as const, name: s.sub.title, silo: s.silo, sub: s.sub };
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const r = resolve(slug);
  if (!r) return {};
  const c = xmContent(r.name, r.kind === "silo");
  return { title: c.metaTitle, description: c.metaDescription };
}

function CTA() {
  return (
    <div className="flex flex-wrap gap-3">
      <a href="/start" className="rounded-full px-6 py-3 text-sm font-bold text-white" style={{ background: R }}>Start a project →</a>
      <a href="/calculator" className="rounded-full px-6 py-3 text-sm font-bold border border-white/25 hover:bg-white/10">Reach calculator</a>
      <a href="/white-paper" className="rounded-full px-6 py-3 text-sm font-semibold text-white/70 hover:text-white">White paper ↓</a>
    </div>
  );
}

export default async function XmSlug({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = resolve(slug);
  if (!r) notFound();
  const c = xmContent(r.name, r.kind === "silo");
  // Every page gets a distinct, licensed image. Sub-pages of the same silo pick a different
  // photo (seeded by slug) and a different size/crop, so nothing looks reused; alts are
  // keyword-rich + ADA-descriptive + tagged "XM Marketing image".
  const photos = await searchPhotos(r.silo.img, 6).then((p) => p.map((x) => x.url)).catch(() => []);
  const seed = [...slug].reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const hero = photos.length ? photos[seed % photos.length] : "";
  const midImg = photos.length > 1 ? photos[(seed + 3) % photos.length] : hero;
  const heroAlt = `${r.name} — ${r.silo.name.toLowerCase()} experiential marketing brand activation nationwide | XM Marketing image`;
  const midAlt = `${r.name} brand experience example for top brands — experiential marketing | XM Marketing image`;
  const heroH = 46 + (seed % 5) * 4; // 46–62vh, varied so reused imagery reads unique
  const midH = 200 + (seed % 6) * 24; // 200–320px

  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: c.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  const crumbs = [{ n: "Home", u: "/" }, ...(r.kind === "sub" ? [{ n: r.silo.name, u: `/${r.silo.slug}` }] : []), { n: r.name, u: `/${slug}` }];
  const crumbLd = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.n, item: c.u })) };
  const related = r.silo.subs.filter((s) => s.slug !== slug);

  return (
    <div style={xmVars} className="bg-black text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbLd) }} />

      {/* HERO */}
      <section className="relative flex items-end overflow-hidden" style={{ minHeight: `${heroH}vh` }}>
        {hero && /* eslint-disable-next-line @next/next/no-img-element */ <img src={hero} alt={heroAlt} className="absolute inset-0 w-full h-full object-cover opacity-45" style={{ objectPosition: `${seed % 100}% center` }} />}
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,.4), rgba(0,0,0,.9))" }} />
        <div className="relative mx-auto max-w-5xl px-6 py-12 w-full">
          <nav className="text-xs text-white/50 mb-3">{crumbs.map((b, i) => <span key={b.u}>{i > 0 && " › "}<a href={b.u} className="hover:text-white">{b.n}</a></span>)}</nav>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight max-w-3xl">{c.headline}</h1>
          <p className="mt-4 text-lg text-white/70 max-w-2xl">{c.intro}</p>
          <div className="mt-6"><CTA /></div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="mx-auto max-w-3xl px-6 py-14">
        {c.sections.map((s, i) => (
          <div key={i} className="mb-9">
            <h2 className="text-2xl font-black tracking-tight">{s.h2}</h2>
            <p className="mt-3 text-white/70 leading-relaxed">{s.body}</p>
            {i === 0 && midImg && /* eslint-disable-next-line @next/next/no-img-element */ (
              <img src={midImg} alt={midAlt} loading="lazy" className="w-full rounded-2xl border border-white/10 mt-6 object-cover" style={{ height: `${midH}px` }} />
            )}
          </div>
        ))}
      </section>

      {/* INTERLINKING */}
      <section className="bg-black border-t border-white/10">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">{r.kind === "silo" ? `Explore ${r.name}` : `More on ${r.silo.name}`}</div>
          <div className="grid gap-3 sm:grid-cols-2">
            {r.kind === "silo" && <a href={`/${r.silo.slug}`} className="hidden" />}
            {(r.kind === "silo" ? r.silo.subs : related).map((s) => (
              <a key={s.slug} href={`/${s.slug}`} className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 hover:border-white/40">
                <span className="font-bold text-white/80">{s.title}</span><span style={{ color: R }}>→</span>
              </a>
            ))}
            {r.kind === "sub" && <a href={`/${r.silo.slug}`} className="flex items-center justify-between rounded-xl px-4 py-3 font-bold" style={{ background: R }}><span>All {r.silo.name} →</span></a>}
          </div>
          <div className="mt-6 text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Related disciplines</div>
          <div className="flex flex-wrap gap-2">
            {XM_SILOS.filter((s) => s.slug !== r.silo.slug).slice(0, 8).map((s) => <a key={s.slug} href={`/${s.slug}`} className="rounded-full border border-white/15 px-3 py-1.5 text-sm text-white/60 hover:text-white">{s.name}</a>)}
          </div>
        </div>
      </section>

      {/* LONG-TAIL FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-14">
        <h2 className="text-3xl font-black tracking-tight">{r.name} — questions &amp; answers</h2>
        <div className="mt-5 divide-y divide-white/10 border-y border-white/10">
          {c.faqs.map((f, i) => (
            <details key={i} className="py-4"><summary className="cursor-pointer font-bold text-white/90">{f.q}</summary><p className="mt-2 text-white/60 leading-relaxed">{f.a}</p></details>
          ))}
        </div>
        <div className="mt-10"><CTA /></div>
      </section>

      <XmFooter />
    </div>
  );
}
