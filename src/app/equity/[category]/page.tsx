import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIES, byCategory, categoryOf, pathFor, type CategoryKey } from "@/lib/equity";
import QualifyForm from "../QualifyForm";

// A category hub — the middle tier of the silo. Every one of the 100 pages is
// reachable from its hub, and every hub is linked from the homepage and the
// footer, so nothing is more than two clicks from the root.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.key }));
}

type Params = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category } = await params;
  const c = CATEGORIES.find((x) => x.key === category);
  if (!c) return { title: "Not found", robots: { index: false } };
  const url = `https://equity.direct/${c.key}`;
  return {
    title: `${c.title} | Equity Direct`,
    description: c.description,
    alternates: { canonical: url },
    openGraph: { title: c.title, description: c.description, url, siteName: "Equity Direct" },
    twitter: { card: "summary_large_image", title: c.title, description: c.description },
  };
}

export default async function CategoryPage({ params }: Params) {
  const { category } = await params;
  if (!CATEGORIES.some((c) => c.key === category)) notFound();

  const cat = categoryOf(category as CategoryKey);
  const uses = byCategory(category as CategoryKey);

  const listLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: cat.title,
    itemListElement: uses.map((u, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: u.reason,
      url: `https://equity.direct${pathFor(u)}`,
    })),
  };

  return (
    <main>
      <script type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(listLd) }} />

      <div className="eq-wrap">
        <nav className="eq-crumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span>/</span>
          <span style={{ opacity: 0.85, margin: 0 }}>{cat.label}</span>
        </nav>
      </div>

      <div className="eq-wrap eq-article">
        <div className="eq-layout">
          <div>
            <h1 className="eq-h1" style={{ fontSize: "clamp(2rem,4.4vw,3rem)", marginTop: 12 }}>
              {cat.title}
            </h1>
            <p className="eq-lede">{cat.intro}</p>

            <section style={{ marginTop: 40 }} aria-labelledby="all-heading">
              <h2 id="all-heading" className="eq-h2" style={{ fontSize: "1.5rem" }}>
                {uses.length} reasons in this category
              </h2>
              <div className="eq-related-grid" style={{ marginTop: 18 }}>
                {uses.map((u) => (
                  <Link key={u.slug} href={pathFor(u)}>
                    <strong style={{ display: "block", color: "var(--parchment)", fontSize: "0.97rem" }}>
                      {u.reason}
                    </strong>
                    <span style={{ fontSize: "0.83rem", color: "var(--slate)" }}>
                      {u.partner}
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            <section style={{ marginTop: 44 }}>
              <h2 className="eq-h2" style={{ fontSize: "1.45rem" }}>Every category</h2>
              <div className="eq-related-grid" style={{ marginTop: 16 }}>
                {CATEGORIES.filter((c) => c.key !== cat.key).map((c) => (
                  <Link key={c.key} href={`/${c.key}`}>{c.label}</Link>
                ))}
              </div>
            </section>
          </div>

          <aside>
            <QualifyForm reason={cat.label} />
          </aside>
        </div>
      </div>
    </main>
  );
}
