import raw from "@/data/carriers.json";
import { APP_TYPES, slugify, STATES } from "@/lib/health";

export type Application = {
  slug: string; title: string; description: string; pdf_url: string; source_page_url: string;
  product_type: string; form_type: string; state: string; year_detected: string; file_format: string;
  official_source: boolean; keywords: string[];
};
export type Carrier = {
  carrier_name: string; slug: string; parent_company: string; city: string; state: string; zip: string;
  website: string; public_email_addresses: string[]; carrier_type: string; states: string[]; products: string[];
  notes: string; source_urls: string[]; applications: Application[];
};

const CARRIERS: Carrier[] = (raw.carriers as Record<string, unknown>[]).map((c) => {
  const name = String(c.carrier_name);
  const slug = slugify(name);
  const website = String(c.website || "");
  const apps = (Array.isArray(c.apps) ? (c.apps as string[]) : []).filter((t) => APP_TYPES[t]).map((t): Application => {
    const meta = APP_TYPES[t];
    return {
      slug: slugify(meta.label), title: `${name} — ${meta.label}`, description: meta.desc(name),
      pdf_url: "", source_page_url: website, product_type: meta.product_type, form_type: meta.form_type,
      state: "", year_detected: "", file_format: "PDF", official_source: false, keywords: meta.keywords(name),
    };
  });
  return {
    carrier_name: name, slug, parent_company: String(c.parent_company || ""), city: String(c.city || ""), state: String(c.state || ""), zip: "",
    website, public_email_addresses: [], carrier_type: String(c.carrier_type || ""), states: (c.states as string[]) || [], products: (c.products as string[]) || [],
    notes: "", source_urls: website ? [website] : [], applications: apps,
  };
}).sort((a, b) => a.carrier_name.localeCompare(b.carrier_name));

export const allCarriers = () => CARRIERS;
export const carrierBySlug = (s: string) => CARRIERS.find((c) => c.slug === s) || null;
export const appBySlug = (cslug: string, aslug: string) => {
  const c = carrierBySlug(cslug); if (!c) return null;
  const a = c.applications.find((x) => x.slug === aslug); return a ? { carrier: c, app: a } : null;
};
export const carriersByState = (abbr: string) => CARRIERS.filter((c) => c.states.includes("national") || c.states.includes(abbr));
export const allApps = () => CARRIERS.flatMap((c) => c.applications.map((a) => ({ carrier: c, app: a })));
export const stateByAbbr = (abbr: string) => STATES.find((s) => s.abbr.toLowerCase() === abbr.toLowerCase()) || null;
