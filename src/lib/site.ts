import { headers } from "next/headers";
import { db } from "./db";

export type SiteBrand = {
  id: string;
  name: string;
  hostname: string;
  logoUrl: string;
  brandColor: string;
  heroHeadline: string;
  footerLinks: { label: string; href: string }[];
};

// Resolve the white-label site for the current request's hostname. Returns null
// for the flagship medigap.plus host (or any host without a configured Site), so
// the default branding is used.
export async function getCurrentSite(): Promise<SiteBrand | null> {
  const h = await headers();
  let raw = (h.get("x-forwarded-host") || h.get("host") || "").split(":")[0].toLowerCase().trim();
  if (raw.startsWith("www.")) raw = raw.slice(4); // treat www.<domain> as the apex site
  if (!raw || raw === "medigap.plus" || raw.startsWith("localhost") || /^\d+\.\d+\.\d+\.\d+$/.test(raw)) {
    return null;
  }
  const site = await db.site.findUnique({ where: { hostname: raw } }).catch(() => null);
  if (!site || !site.active) return null;
  let footerLinks: { label: string; href: string }[] = [];
  try { const a = JSON.parse(site.footerLinks || "[]"); if (Array.isArray(a)) footerLinks = a; } catch {}
  return {
    id: site.id,
    name: site.name,
    hostname: site.hostname,
    logoUrl: site.logoUrl || "",
    brandColor: site.brandColor || "",
    heroHeadline: site.heroHeadline || "",
    footerLinks,
  };
}
