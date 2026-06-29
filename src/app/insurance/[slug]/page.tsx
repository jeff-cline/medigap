import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NicheLanding from "@/components/niche/NicheLanding";
import { getNiche, nicheSlugs, SITE_URL } from "@/lib/niches";

export function generateStaticParams() {
  return nicheSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const n = getNiche(slug);
  if (!n) return {};
  const url = `${SITE_URL}/insurance/${n.slug}`;
  return {
    title: n.metaTitle,
    description: n.metaDescription,
    keywords: n.secondaryKeywords,
    alternates: { canonical: url },
    openGraph: { title: n.metaTitle, description: n.metaDescription, url, type: "website" },
    twitter: { card: "summary_large_image", title: n.metaTitle, description: n.metaDescription },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const n = getNiche(slug);
  if (!n) notFound();
  return <NicheLanding niche={n} />;
}
