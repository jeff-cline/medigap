import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/niches";

// robots.txt → /robots.txt. Crawl the marketing site; keep the app/portals out of the index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/api", "/agent", "/advertiser", "/investor", "/creator", "/brand", "/login", "/change-password"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
