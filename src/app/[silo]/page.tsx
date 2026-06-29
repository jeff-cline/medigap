import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiloShell from "@/components/silo/SiloShell";
import SiloArticle from "@/components/silo/SiloArticle";
import { loadSilo, siloMeta, relatedSilos, siloImage } from "@/lib/silos";
import { MEDIGAP } from "@/lib/medigap-brand";

function altFor(desc: string, h1: string) {
  const d = (desc || "").replace(/[.\s]+$/, "");
  const cap = d ? d[0].toUpperCase() + d.slice(1) : "Seniors getting trusted guidance";
  return `${cap}, illustrating ${h1} — 1-800-MEDIGAP, ${MEDIGAP.tagline}.`;
}

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ silo: string }> }): Promise<Metadata> {
  const { silo } = await params;
  const s = loadSilo(silo);
  if (!s) return {};
  const url = `${MEDIGAP.url}/${silo}`;
  return {
    title: s.pillar.metaTitle, description: s.pillar.metaDescription,
    alternates: { canonical: url },
    openGraph: { title: s.pillar.metaTitle, description: s.pillar.metaDescription, url, type: "website" },
    twitter: { card: "summary_large_image", title: s.pillar.metaTitle, description: s.pillar.metaDescription },
  };
}

export default async function PillarPage({ params }: { params: Promise<{ silo: string }> }) {
  const { silo } = await params;
  const s = loadSilo(silo);
  if (!s) notFound();
  const meta = siloMeta(silo);

  const childLinks = s.children.map((c) => ({ href: `/${silo}/${c.slug}`, label: c.page.h1 || c.keyword }));
  const related = relatedSilos(silo, 6).map((r) => ({ href: `/${r.slug}`, label: r.name, sub: r.group }));
  const img = siloImage(silo);
  const image = img ? { url: img.url, alt: altFor(img.desc, s.pillar.h1), credit: img.credit } : undefined;

  return (
    <SiloShell path={silo}>
      <SiloArticle
        page={s.pillar}
        path={silo}
        crumbs={[{ name: "Home", url: MEDIGAP.url }, { name: s.name, url: `${MEDIGAP.url}/${silo}` }]}
        links={childLinks}
        linksTitle={`Explore ${s.name}`}
        image={image}
      />
      {related.length > 0 && (
        <section className="mx-auto max-w-3xl px-5 mt-10">
          <h2 className="text-xl font-bold mb-3">Related guides{meta ? "" : ""}</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {related.map((r) => (
              <a key={r.href} href={r.href} className="rounded-lg border border-[var(--border)] px-4 py-2.5 hover:border-[var(--brand)] transition">
                <span className="font-medium">{r.label}</span><span className="block text-xs text-[var(--muted)]">{r.sub}</span>
              </a>
            ))}
          </div>
        </section>
      )}
    </SiloShell>
  );
}
