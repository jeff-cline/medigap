import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { MEDIGAPP, offersForKeyword, offersForPage, type Offer } from "@/lib/medigapp";
import { getCategory, getSub, isPhoneVertical } from "@/lib/rak-taxonomy";
import { pageContent } from "@/lib/rak-content";
import MedigappSearch from "@/components/MedigappSearch";
import MedigappFooter from "@/components/MedigappFooter";

export const dynamic = "force-dynamic";
const C = MEDIGAPP.colors;
const vars = { "--bg": C.bg, "--ink": C.ink, "--brand": C.brand, "--green": C.green, "--gold": C.gold, "--soft": C.soft, "--border": C.border, "--muted": C.muted } as React.CSSProperties;
const baseOf = (xp: string) => (xp.startsWith("/r") ? "/r" : "");

async function resolve(slug: string) {
  const cat = getCategory(slug);
  const sub = getSub(slug);
  const rakPage = await db.rakPage.findUnique({ where: { slug } }).catch(() => null);
  return { cat, sub, rakPage };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { cat, sub, rakPage } = await resolve(slug);
  if (cat) return { title: `${cat.name} Offers & Deals | ${MEDIGAPP.brand}`, description: `Compare the best ${cat.name.toLowerCase()} offers across ${cat.subs.length} categories.` };
  const name = sub?.sub.name || rakPage?.moneyWord || rakPage?.title || slug.replace(/-/g, " ");
  const catName = sub?.cat.name || "offers";
  const phone = sub ? isPhoneVertical(sub.cat.slug) : true;
  const c = pageContent(name, catName, phone);
  return { title: c.title, description: rakPage?.intro?.slice(0, 155) || c.metaDescription };
}

function CallBar() {
  return (
    <a href={`tel:${MEDIGAPP.tel}`} className="block w-full text-center text-white font-extrabold py-4 rounded-2xl text-2xl tracking-tight" style={{ background: `linear-gradient(110deg, ${C.brand}, ${C.green})` }}>
      📞 Call {MEDIGAPP.brand} — {MEDIGAPP.telDisplay}
      <span className="block text-[12px] font-semibold opacity-90 mt-0.5">{MEDIGAPP.tagline} · Free</span>
    </a>
  );
}
function OfferCard({ slug, o }: { slug: string; o: Offer }) {
  return (
    <a href={`/api/rak/go?s=${encodeURIComponent(slug)}&o=${encodeURIComponent(o.id)}`} target="_blank" rel="sponsored noopener" className="flex gap-4 items-center rounded-2xl border border-[var(--border)] bg-white p-4 hover:shadow-lg transition-shadow">
      {o.imageUrl
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={o.imageUrl} alt={o.title} className="h-16 w-16 rounded-xl object-cover shrink-0 bg-[var(--soft)]" />
        : <div className="h-16 w-16 rounded-xl shrink-0 grid place-items-center text-2xl" style={{ background: C.soft }}>🏷️</div>}
      <div className="min-w-0 flex-1">
        {o.advertiser && <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">{o.advertiser}</div>}
        <div className="font-bold leading-snug">{o.title}</div>
        {o.description && <div className="text-xs text-[var(--muted)] mt-0.5 line-clamp-2">{o.description}</div>}
      </div>
      <span className="shrink-0 rounded-full px-4 py-2 text-sm font-bold text-white" style={{ background: C.brand }}>View →</span>
    </a>
  );
}

export default async function SlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const base = baseOf((await headers()).get("x-pathname") || "");
  const { cat, sub, rakPage } = await resolve(slug);
  if (!cat && !sub && !rakPage) notFound();

  db.rakClick.create({ data: { kind: "view", slug } }).catch(() => {});

  // ---------- CATEGORY PAGE ----------
  if (cat) {
    const offers = await offersForKeyword(cat.name);
    const ld = {
      "@context": "https://schema.org", "@type": "CollectionPage", name: `${cat.name} — ${MEDIGAPP.brand}`,
      breadcrumb: { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${base || "/"}` },
        { "@type": "ListItem", position: 2, name: cat.name },
      ] },
      hasPart: cat.subs.map((s) => ({ "@type": "WebPage", name: s.name, url: `${base}/${s.slug}` })),
    };
    return (
      <div style={vars} className="min-h-screen bg-white text-[var(--ink)]">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
        <div className="mx-auto max-w-3xl px-5 py-6">
          {isPhoneVertical(cat.slug) && <CallBar />}
          <nav className="mt-4 text-xs text-[var(--muted)]"><a href={base || "/"} className="hover:text-[var(--brand)]">Home</a> › <span className="text-[var(--ink)]">{cat.name}</span></nav>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{cat.icon} {cat.name} offers &amp; deals</h1>
          <p className="mt-2 text-[15px] text-[var(--muted)]">Browse {cat.name.toLowerCase()} by category, or see today&apos;s top offers below.</p>
          <div className="mt-5"><MedigappSearch base={base} /></div>

          {offers.length > 0 && (<div className="mt-6 space-y-3"><div className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">Top {cat.name.toLowerCase()} offers</div>{offers.slice(0, 4).map((o) => <OfferCard key={o.id} slug={slug} o={o} />)}</div>)}

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {cat.subs.map((s) => (
              <a key={s.slug} href={`${base}/${s.slug}`} className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-white p-4 hover:border-[var(--brand)]">
                <span className="font-bold">{s.name}</span><span className="text-[var(--brand)] font-bold">→</span>
              </a>
            ))}
          </div>
          {isPhoneVertical(cat.slug) && <div className="mt-8"><CallBar /></div>}
          <MedigappFooter base={base} />
        </div>
      </div>
    );
  }

  // ---------- SUBCATEGORY / MONEY-WORD LANDER ----------
  const name = sub?.sub.name || rakPage?.moneyWord || rakPage?.title || slug.replace(/-/g, " ");
  const catName = sub?.cat.name || "Offers";
  const phone = sub ? isPhoneVertical(sub.cat.slug) : true; // money-word landers = medigap phone vertical
  const content = pageContent(name, catName, phone);
  const offers = rakPage ? await offersForPage(rakPage) : await offersForKeyword(name);

  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: content.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  const crumbLd = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: base || "/" },
    ...(sub ? [{ "@type": "ListItem", position: 2, name: sub.cat.name, item: `${base}/${sub.cat.slug}` }] : []),
    { "@type": "ListItem", position: sub ? 3 : 2, name },
  ] };

  return (
    <div style={vars} className="min-h-screen bg-white text-[var(--ink)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbLd) }} />
      <div className="mx-auto max-w-2xl px-4 py-5">
        {phone && <CallBar />}
        <nav className="mt-4 text-xs text-[var(--muted)]"><a href={base || "/"} className="hover:text-[var(--brand)]">Home</a>{sub && <> › <a href={`${base}/${sub.cat.slug}`} className="hover:text-[var(--brand)]">{sub.cat.name}</a></>} › <span className="text-[var(--ink)]">{name}</span></nav>

        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{rakPage?.headline || content.headline}</h1>
        <p className="mt-3 text-[15px] text-[var(--muted)] leading-relaxed">{rakPage?.intro || content.intro}</p>
        <div className="mt-4"><MedigappSearch base={base} /></div>

        {/* OFFERS — TOP */}
        <div className="mt-6 space-y-3">
          <div className="text-xs font-bold uppercase tracking-widest text-[var(--gold)] text-center">Top approved offers</div>
          {offers.length === 0
            ? <div className="rounded-2xl border border-[var(--border)] bg-[var(--soft)] p-6 text-center text-sm text-[var(--muted)]">New {name.toLowerCase()} offers loading{phone ? ` — call ${MEDIGAPP.brand} now for free help` : ""}.</div>
            : offers.slice(0, 4).map((o) => <OfferCard key={o.id} slug={slug} o={o} />)}
        </div>

        {/* CONTENT — with offers woven through */}
        <div className="mt-9 space-y-6">
          {content.sections.map((sec, i) => (
            <div key={i}>
              <h2 className="text-xl font-bold tracking-tight">{sec.h2}</h2>
              <p className="mt-2 text-[14px] text-[var(--muted)] leading-relaxed">{sec.body}</p>
              {i === 0 && offers.length > 4 && <div className="mt-4 space-y-3">{offers.slice(4, 8).map((o) => <OfferCard key={o.id} slug={slug} o={o} />)}</div>}
            </div>
          ))}
        </div>

        {offers.length > 8 && <div className="mt-6 space-y-3"><div className="text-xs font-bold uppercase tracking-widest text-[var(--gold)] text-center">More offers</div>{offers.slice(8).map((o) => <OfferCard key={o.id} slug={slug} o={o} />)}</div>}

        {/* LONG-TAIL FAQ (AEO) */}
        <div className="mt-10">
          <h2 className="text-2xl font-bold tracking-tight">{name} — questions &amp; answers</h2>
          <div className="mt-4 divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)]">
            {content.faqs.map((f, i) => (
              <details key={i} className="p-4"><summary className="cursor-pointer font-semibold">{f.q}</summary><p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">{f.a}</p></details>
            ))}
          </div>
        </div>

        {rakPage?.outro && <p className="mt-7 text-sm text-[var(--muted)] leading-relaxed text-center">{rakPage.outro}</p>}

        {phone && <div className="mt-8"><CallBar /></div>}
        <MedigappFooter base={base} />
      </div>
    </div>
  );
}
