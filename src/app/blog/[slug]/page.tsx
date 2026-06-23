import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentSite } from "@/lib/site";
import { loadPage, siteNav } from "@/lib/sitepages";
import SiteShell from "@/components/site/SiteShell";
import SitePageRenderer from "@/components/site/SitePageRenderer";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const site = await getCurrentSite();
  if (!site) return {};
  const page = await loadPage(site.id, `blog/${(await params).slug}`);
  return page ? { title: `${page.title} — ${site.name}`, description: page.metaDescription } : {};
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const site = await getCurrentSite();
  if (!site) notFound();
  const { slug } = await params;
  const page = await loadPage(site.id, `blog/${slug}`);
  if (!page) notFound();
  const nav = await siteNav(site.id);
  return (
    <SiteShell brand={{ name: site.name, logoUrl: site.logoUrl, brandColor: site.brandColor }} nav={nav}>
      <SitePageRenderer blocks={page.blocks} />
    </SiteShell>
  );
}
