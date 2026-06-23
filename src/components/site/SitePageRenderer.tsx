import Link from "next/link";
import LeadForm from "@/components/LeadForm";
import { SeniorHeroArt, CareIcon } from "@/components/SeniorArt";
import { TOLLFREE, TOLLFREE_TEL } from "@/lib/format";
import type { Block, ImageRef } from "@/lib/blocks";

// Tiny, safe markdown → JSX: paragraphs split on blank lines, **bold** inline.
// No raw HTML is ever injected (model output is treated as text).
function MD({ text }: { text: string }) {
  const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return (
    <>
      {paras.map((p, i) => (
        <p key={i} className="mt-3 first:mt-0 text-[var(--muted)] leading-relaxed">
          {p.split(/(\*\*[^*]+\*\*)/g).map((seg, j) =>
            seg.startsWith("**") && seg.endsWith("**") ? <strong key={j} className="text-[var(--text)] font-semibold">{seg.slice(2, -2)}</strong> : <span key={j}>{seg}</span>,
          )}
        </p>
      ))}
    </>
  );
}

function Photo({ image, className = "" }: { image: ImageRef; className?: string }) {
  return (
    <figure className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.url} alt={image.alt} className="w-full h-auto rounded-2xl object-cover" loading="lazy" />
      {image.photographer && (
        <figcaption className="mt-1 text-[10px] text-[var(--muted)]">
          Photo: {image.photographerUrl ? <a href={image.photographerUrl} target="_blank" rel="noopener" className="hover:text-[var(--brand)]">{image.photographer}</a> : image.photographer} / Pexels
        </figcaption>
      )}
    </figure>
  );
}

function CallCta({ headline, sub }: { headline: string; sub?: string }) {
  return (
    <section className="border-y border-[var(--border)] bg-[var(--panel)]">
      <div className="mx-auto max-w-7xl px-6 py-12 text-center">
        <h2 className="text-2xl md:text-3xl font-bold">{headline}</h2>
        {sub && <p className="mt-3 text-[var(--muted)]">{sub}</p>}
        <a href={`tel:${TOLLFREE_TEL}`} className="btn btn-brand text-lg mt-6">📞 {TOLLFREE}</a>
      </div>
    </section>
  );
}

export default function SitePageRenderer({ blocks, vertical = "medicare" }: { blocks: Block[]; vertical?: string }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "hero":
            return (
              <section key={i} className="relative overflow-hidden">
                <div className="absolute inset-0 brand-gradient opacity-[0.07]" />
                <div className="mx-auto max-w-7xl px-6 py-16 md:py-20 grid md:grid-cols-2 gap-12 items-center relative">
                  <div>
                    <h1 className="text-4xl md:text-5xl font-extrabold leading-tight"><span className="text-gradient">{b.headline}</span></h1>
                    {b.sub && <p className="mt-5 text-lg text-[var(--muted)]">{b.sub}</p>}
                    <div className="mt-7 flex flex-wrap gap-3">
                      <a href={`tel:${TOLLFREE_TEL}`} className="btn btn-brand text-base">📞 Call {TOLLFREE} — Free</a>
                      <a href="#quote" className="btn btn-ghost text-base">Get a free quote</a>
                    </div>
                  </div>
                  <div id="quote">{b.image ? <Photo image={b.image} /> : <SeniorHeroArt className="w-full max-w-md mx-auto" />}</div>
                </div>
              </section>
            );
          case "richText":
            return (
              <section key={i} className="mx-auto max-w-3xl px-6 py-10">
                {b.heading && <h2 className="text-2xl font-bold mb-3">{b.heading}</h2>}
                <MD text={b.markdown} />
              </section>
            );
          case "featureGrid":
            return (
              <section key={i} className="mx-auto max-w-7xl px-6 py-12">
                {b.heading && <h2 className="text-2xl font-bold text-center mb-8">{b.heading}</h2>}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {b.items.map((it, j) => {
                    const inner = (
                      <>
                        <CareIcon kind={it.icon || "user"} />
                        <div className="mt-3 font-semibold">{it.title}</div>
                        <div className="text-sm text-[var(--muted)] mt-1">{it.body}</div>
                      </>
                    );
                    return it.href ? (
                      <Link key={j} href={it.href} className="card p-5 hover:glow transition block">{inner}</Link>
                    ) : (
                      <div key={j} className="card p-5">{inner}</div>
                    );
                  })}
                </div>
              </section>
            );
          case "imageWithText":
            return (
              <section key={i} className="mx-auto max-w-7xl px-6 py-12">
                <div className={`grid md:grid-cols-2 gap-10 items-center ${b.flip ? "md:[&>*:first-child]:order-2" : ""}`}>
                  {b.image ? <Photo image={b.image} /> : <SeniorHeroArt className="w-full max-w-md mx-auto" />}
                  <div>
                    {b.heading && <h2 className="text-2xl font-bold mb-3">{b.heading}</h2>}
                    <MD text={b.body} />
                  </div>
                </div>
              </section>
            );
          case "stat":
            return (
              <section key={i} className="mx-auto max-w-7xl px-6 py-10">
                <div className="grid gap-6 sm:grid-cols-3 text-center">
                  {b.items.map((it, j) => (
                    <div key={j}><div className="text-3xl font-extrabold text-gradient">{it.value}</div><div className="text-sm text-[var(--muted)] mt-1">{it.label}</div></div>
                  ))}
                </div>
              </section>
            );
          case "quote":
            return (
              <section key={i} className="mx-auto max-w-3xl px-6 py-10 text-center">
                <blockquote className="text-xl italic text-[var(--text)]">“{b.text}”</blockquote>
                {b.attribution && <div className="mt-3 text-sm text-[var(--muted)]">— {b.attribution}</div>}
              </section>
            );
          case "faq":
            return (
              <section key={i} className="mx-auto max-w-3xl px-6 py-10">
                {b.heading && <h2 className="text-2xl font-bold mb-6">{b.heading}</h2>}
                <div className="space-y-3">
                  {b.items.map((it, j) => (
                    <details key={j} className="card p-4 group">
                      <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">{it.q}<span className="text-[var(--brand)] group-open:rotate-45 transition">+</span></summary>
                      <div className="mt-2 text-sm text-[var(--muted)] leading-relaxed">{it.a}</div>
                    </details>
                  ))}
                </div>
              </section>
            );
          case "cta":
            return b.mode === "form" ? (
              <section key={i} className="mx-auto max-w-2xl px-6 py-12" id="quote">
                <h2 className="text-2xl font-bold text-center mb-2">{b.headline}</h2>
                {b.sub && <p className="text-center text-[var(--muted)] mb-6">{b.sub}</p>}
                <LeadForm vertical={vertical} />
              </section>
            ) : (
              <CallCta key={i} headline={b.headline} sub={b.sub} />
            );
          default:
            return null;
        }
      })}
    </>
  );
}
