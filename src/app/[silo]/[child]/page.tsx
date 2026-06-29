import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiloShell from "@/components/silo/SiloShell";
import SiloArticle from "@/components/silo/SiloArticle";
import { loadSilo, getChild, siloImage } from "@/lib/silos";
import { MEDIGAP } from "@/lib/medigap-brand";

function altFor(desc: string, h1: string) {
  const d = (desc || "").replace(/[.\s]+$/, "");
  const cap = d ? d[0].toUpperCase() + d.slice(1) : "Seniors getting trusted guidance";
  return `${cap}, illustrating ${h1} — 1-800-MEDIGAP, ${MEDIGAP.tagline}.`;
}

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ silo: string; child: string }> }): Promise<Metadata> {
  const { silo, child } = await params;
  const s = loadSilo(silo);
  const c = s ? getChild(s, child) : null;
  if (!c) return {};
  const url = `${MEDIGAP.url}/${silo}/${child}`;
  return {
    title: c.page.metaTitle, description: c.page.metaDescription,
    alternates: { canonical: url },
    openGraph: { title: c.page.metaTitle, description: c.page.metaDescription, url, type: "article" },
    twitter: { card: "summary_large_image", title: c.page.metaTitle, description: c.page.metaDescription },
  };
}

export default async function ChildPage({ params }: { params: Promise<{ silo: string; child: string }> }) {
  const { silo, child } = await params;
  const s = loadSilo(silo);
  if (!s) notFound();
  const c = getChild(s, child);
  if (!c) notFound();

  // Interlink: up to the pillar + sibling pages (siloed).
  const links = [
    { href: `/${silo}`, label: `← ${s.name} (overview)`, sub: "pillar guide" },
    ...s.children.filter((x) => x.slug !== child).slice(0, 7).map((x) => ({ href: `/${silo}/${x.slug}`, label: x.page.h1 || x.keyword })),
  ];

  const img = siloImage(silo);
  const image = img ? { url: img.url, alt: altFor(img.desc, c.page.h1 || c.keyword), credit: img.credit } : undefined;

  return (
    <SiloShell path={`${silo}/${child}`}>
      <SiloArticle
        page={c.page}
        path={`${silo}/${child}`}
        image={image}
        crumbs={[
          { name: "Home", url: MEDIGAP.url },
          { name: s.name, url: `${MEDIGAP.url}/${silo}` },
          { name: c.page.h1 || c.keyword, url: `${MEDIGAP.url}/${silo}/${child}` },
        ]}
        links={links}
        linksTitle={`More on ${s.name}`}
      />
    </SiloShell>
  );
}
