import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentSite } from "@/lib/site";
import { blogPosts, siteNav } from "@/lib/sitepages";
import SiteShell from "@/components/site/SiteShell";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getCurrentSite();
  return site ? { title: `Blog — ${site.name}`, description: `Resources and guidance from ${site.name}.` } : {};
}

export default async function BlogIndex() {
  const site = await getCurrentSite();
  if (!site) notFound();
  const [posts, nav] = await Promise.all([blogPosts(site.id), siteNav(site.id)]);
  if (posts.length === 0) notFound();
  return (
    <SiteShell brand={{ name: site.name, logoUrl: site.logoUrl, brandColor: site.brandColor }} nav={nav}>
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-3xl font-extrabold mb-2"><span className="text-gradient">Blog</span></h1>
        <p className="text-[var(--muted)] mb-8">Guidance and resources from {site.name}.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {posts.map((p) => (
            <Link key={p.slug} href={`/${p.slug}`} className="card p-5 hover:glow transition block">
              <div className="font-semibold">{p.title}</div>
              {p.metaDescription && <div className="text-sm text-[var(--muted)] mt-1">{p.metaDescription}</div>}
              <div className="mt-3 text-sm text-[var(--brand)]">Read more →</div>
            </Link>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
