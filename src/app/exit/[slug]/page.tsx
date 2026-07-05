import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EXIT, EXIT_WAYS, exitVars } from "@/lib/exit";
import { exitMoney, exitSub, EXIT_MONEY } from "@/lib/exit-taxonomy";
import { exitContent } from "@/lib/exit-content";
import { searchPhotos } from "@/lib/pexels";
import ExitLeadForm from "@/components/exit/ExitLeadForm";
import { BookButton, CtaBand } from "@/components/exit/ExitCTA";
import ExitFooter from "@/components/exit/ExitFooter";

export const dynamic = "force-dynamic";
const O = EXIT.colors.orange;

function resolve(slug: string) {
  const money = exitMoney(slug);
  if (money) return { kind: "money" as const, name: money.name, a: money.a, money, sub: null };
  const s = exitSub(slug);
  if (s) return { kind: "sub" as const, name: s.sub.title, a: "", money: s.money, sub: s.sub };
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const r = resolve(slug);
  if (!r) return {};
  const c = exitContent(r.name, r.a, r.kind === "money");
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function ExitSlug({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = resolve(slug);
  if (!r) notFound();
  const c = exitContent(r.name, r.a, r.kind === "money");
  const seed = [...slug].reduce((x, ch) => x + ch.charCodeAt(0), 0);
  const photos = await searchPhotos(r.money.img, 5).then((p) => p.map((x) => x.url)).catch(() => []);
  const hero = photos.length ? photos[seed % photos.length] : "";
  const alt = `${r.name} — business exit optimization advisor | Exit Optimization image`;

  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: c.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  const crumbs = [{ n: "Home", u: "/" }, ...(r.kind === "sub" ? [{ n: r.money.name, u: `/${r.money.slug}` }] : []), { n: r.name, u: `/${slug}` }];
  const crumbLd = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs.map((b, i) => ({ "@type": "ListItem", position: i + 1, name: b.n, item: b.u })) };
  // anchor-text interlinks back to money words (authority juice)
  const related = EXIT_MONEY.filter((m) => m.group === r.money.group && m.slug !== r.money.slug).slice(0, 4);
  const cross = EXIT_MONEY.filter((m) => m.group !== r.money.group).slice(0, 6);

  return (
    <div style={exitVars} className="text-white">
      <div style={{ background: EXIT.colors.bg }}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbLd) }} />

        {/* HERO */}
        <section className="relative overflow-hidden border-b" style={{ borderColor: EXIT.colors.border }}>
          {hero && /* eslint-disable-next-line @next/next/no-img-element */ <img src={hero} alt={alt} className="absolute inset-0 w-full h-full object-cover opacity-20" />}
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #020617cc, #020617)" }} />
          <div className="relative mx-auto max-w-5xl px-6 py-12">
            <nav className="text-xs text-slate-400 mb-3">{crumbs.map((b, i) => <span key={b.u}>{i > 0 && " › "}<a href={b.u} className="hover:text-white">{b.n}</a></span>)}</nav>
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: EXIT.colors.orange3 }}>{r.money.group}</div>
            <h1 className="mt-2 text-4xl sm:text-5xl font-black tracking-tight max-w-3xl">{c.headline}</h1>
            <p className="mt-4 text-lg text-slate-300 max-w-2xl">{c.intro}</p>
            <div className="mt-6 flex flex-wrap gap-3"><BookButton label="Book a free consultation" size="lg" /><a href="/how-we-work" className="inline-flex items-center rounded-md border px-6 py-3 text-sm font-bold hover:bg-white/5" style={{ borderColor: EXIT.colors.border }}>How we work</a></div>
          </div>
        </section>

        {/* CONTENT + inline CTAs + interlinks */}
        <section className="mx-auto max-w-3xl px-6 py-12">
          {c.sections.map((s, i) => (
            <div key={i} className="mb-9">
              <h2 className="text-2xl font-black tracking-tight">{s.h2}</h2>
              <p className="mt-3 text-slate-300 leading-relaxed">{s.body}</p>
              {i === 0 && (
                <p className="mt-3 text-slate-300">Related: {related.map((m, k) => <span key={m.slug}>{k > 0 && " · "}<a href={`/${m.slug}`} className="underline" style={{ color: EXIT.colors.orange3 }}>{m.name}</a></span>)}.</p>
              )}
              {i === 1 && <div className="mt-4 rounded-lg border p-4 flex flex-wrap items-center justify-between gap-3" style={{ borderColor: EXIT.colors.border, background: EXIT.colors.panel }}><span className="text-sm text-slate-300">Want the specifics for your company?</span><BookButton label="Book a free consultation" size="sm" /></div>}
            </div>
          ))}

          {r.kind === "money" && (
            <div className="rounded-xl border p-5 mb-4" style={{ borderColor: EXIT.colors.border, background: EXIT.colors.panel }}>
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: EXIT.colors.orange3 }}>{r.name} — go deeper</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {r.money.subs.map((s) => <a key={s.slug} href={`/${s.slug}`} className="text-sm text-slate-300 hover:text-white">→ {s.title}</a>)}
              </div>
            </div>
          )}
          {r.kind === "sub" && <a href={`/${r.money.slug}`} className="inline-block rounded-md px-5 py-2.5 text-sm font-bold mb-4" style={{ background: O, color: EXIT.colors.bg }}>← All about {r.money.name}</a>}
        </section>

        {/* LEAD FORM */}
        <section className="mx-auto max-w-3xl px-6 pb-4"><ExitLeadForm /></section>

        {/* LONG-TAIL FAQ (AEO) */}
        <section className="mx-auto max-w-3xl px-6 py-12">
          <h2 className="text-3xl font-black tracking-tight">{r.name} — questions &amp; answers</h2>
          <div className="mt-5 divide-y" style={{ borderColor: EXIT.colors.border }}>
            {c.faqs.map((f, i) => (
              <details key={i} className="py-4 border-t" style={{ borderColor: EXIT.colors.border }}><summary className="cursor-pointer font-bold">{f.q}</summary><p className="mt-2 text-slate-400 leading-relaxed">{f.a}</p></details>
            ))}
          </div>
          {/* cross-silo authority links */}
          <div className="mt-8 text-xs font-bold uppercase tracking-widest" style={{ color: EXIT.colors.orange3 }}>Explore more exit specialists</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {cross.map((m) => <a key={m.slug} href={`/${m.slug}`} className="rounded-full border px-3 py-1.5 text-sm text-slate-300 hover:text-white" style={{ borderColor: EXIT.colors.border }}>{m.name}</a>)}
          </div>
        </section>

        <CtaBand />
        <ExitFooter />
      </div>
    </div>
  );
}
