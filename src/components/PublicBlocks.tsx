import Link from "next/link";
import { TOLLFREE, TOLLFREE_TEL } from "@/lib/format";
import { Card, Badge } from "@/components/ui";

export function TrustBand() {
  return (
    <section className="border-y border-[var(--border)] bg-[var(--panel)]">
      <div className="mx-auto max-w-7xl px-6 py-10 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-3xl md:text-4xl font-extrabold text-gradient">36,000+</div>
          <div className="mt-1 text-sm text-[var(--muted)]">calls handled / yr</div>
        </div>
        <div>
          <div className="text-3xl md:text-4xl font-extrabold text-gradient">100,000+</div>
          <div className="mt-1 text-sm text-[var(--muted)]">seniors helped</div>
        </div>
        <div>
          <div className="text-3xl md:text-4xl font-extrabold text-[var(--gold)]">★ 4.8</div>
          <div className="mt-1 text-sm text-[var(--muted)]">avg specialist rating</div>
        </div>
      </div>
    </section>
  );
}

export function BenefitGrid({ items }: { items: string[][] }) {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      {items.map(([icon, title, body]) => (
        <Card key={title}>
          <div className="text-3xl">{icon}</div>
          <h3 className="mt-3 font-semibold text-lg">{title}</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">{body}</p>
        </Card>
      ))}
    </div>
  );
}

export function FaqSection({ faqs }: { faqs: string[][] }) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-14">
      <h2 className="text-2xl md:text-3xl font-bold text-center">Frequently asked questions</h2>
      <div className="mt-8 space-y-4">
        {faqs.map(([q, a]) => (
          <Card key={q}>
            <h3 className="font-semibold">{q}</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">{a}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function FinalCta({ title, body }: { title: string; body: string }) {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-14">
      <div className="card glow p-8 md:p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 brand-gradient opacity-[0.08]" />
        <div className="relative">
          <h2 className="text-2xl md:text-4xl font-extrabold">{title}</h2>
          <p className="mt-3 text-[var(--muted)] max-w-2xl mx-auto">{body}</p>
          <div className="mt-7 flex flex-wrap gap-3 justify-center">
            <a href={`tel:${TOLLFREE_TEL}`} className="btn btn-brand text-lg">📞 {TOLLFREE}</a>
            <Link href="#quote" className="btn btn-ghost text-lg">Request a callback</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function VerticalHero({
  badge,
  title,
  gradientTail,
  subhead,
  vertical,
  disclaimer,
  LeadForm,
}: {
  badge: string;
  title: string;
  gradientTail: string;
  subhead: string;
  vertical: string;
  disclaimer?: boolean;
  LeadForm: React.ComponentType<{ vertical?: string; compact?: boolean }>;
}) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 brand-gradient opacity-[0.07]" />
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center relative">
        <div>
          <Badge tone="brand">{badge}</Badge>
          <h1 className="mt-5 text-4xl md:text-6xl font-extrabold leading-tight">
            {title} <span className="text-gradient">{gradientTail}</span>
          </h1>
          <p className="mt-5 text-lg text-[var(--muted)]">{subhead}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href={`tel:${TOLLFREE_TEL}`} className="btn btn-brand text-base">📞 Call {TOLLFREE} — Free</a>
            <a href="#quote" className="btn btn-ghost text-base">Get a free review</a>
          </div>
          {disclaimer && (
            <p className="mt-4 text-xs text-[var(--muted)]">
              Not affiliated with or endorsed by the U.S. government or federal Medicare program.
            </p>
          )}
        </div>
        <div id="quote">
          <LeadForm vertical={vertical} />
        </div>
      </div>
    </section>
  );
}
