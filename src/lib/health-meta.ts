import type { Metadata } from "next";

export const BASE = "https://healthinsuranceapplication.com";

export function hiaMeta(title: string, description: string, path: string): Metadata {
  const url = BASE + path;
  return {
    title, description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "Private Health Insurance", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export const orgLd = {
  "@context": "https://schema.org", "@type": "Organization",
  name: "Private Health Insurance", url: BASE,
  description: "An independent repository of publicly available private health insurance applications, enrollment forms, and carrier PDFs.",
};

export const webPageLd = (name: string, path: string, description: string) => ({
  "@context": "https://schema.org", "@type": "WebPage", name, url: BASE + path, description, isPartOf: { "@type": "WebSite", name: "Private Health Insurance", url: BASE },
});

export const breadcrumbLd = (items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org", "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: BASE + it.path })),
});

export const collectionLd = (name: string, path: string, items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org", "@type": "CollectionPage", name, url: BASE + path,
  hasPart: items.map((it) => ({ "@type": "WebPage", name: it.name, url: BASE + it.path })),
});

export const digitalDocLd = (name: string, path: string, description: string, sourceUrl: string) => ({
  "@context": "https://schema.org", "@type": "DigitalDocument", name, url: BASE + path, description,
  ...(sourceUrl ? { sameAs: sourceUrl } : {}),
});

// Serialize an array of JSON-LD objects into <script> markup for dangerouslySetInnerHTML.
export const ldScript = (...objs: unknown[]) => objs.map((o) => JSON.stringify(o)).join("</script><script type=\"application/ld+json\">");
