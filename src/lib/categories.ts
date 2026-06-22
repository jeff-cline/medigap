// Site verticals ("categories") and the money word each maps to. Adding a new
// category from the launch form creates the category AND its biddable money word,
// so the funnel and the auction stay connected.

export type Category = { value: string; label: string; word: string };

// The built-in categories.
export const BASE_CATEGORIES: Category[] = [
  { value: "medicare", label: "Medicare / Medigap", word: "medicare" },
  { value: "housing", label: "Senior Housing", word: "senior housing" },
  { value: "care", label: "In-Home Care", word: "in-home care" },
  { value: "alzheimers", label: "Alzheimer's / Memory Care", word: "memory care" },
];

// Title-case a slug for display, e.g. "senior_services" → "Senior Services".
export function labelFromSlug(slug: string): string {
  return slug.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}

// Turn a typed category name into a stable slug, e.g. "Senior Services" → "senior_services".
export function slugFromLabel(label: string): string {
  return label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

// The money-word phrase for a category: explicit base mapping, else the human label lowercased.
export function wordForCategory(value: string, label?: string): string {
  const base = BASE_CATEGORIES.find((c) => c.value === value);
  if (base) return base.word;
  return (label || labelFromSlug(value)).toLowerCase().trim();
}

// Merge the base categories with any custom verticals already on existing sites,
// so previously-added categories keep showing up in the dropdown.
export function mergeCategories(existingVerticals: string[]): Category[] {
  const out = [...BASE_CATEGORIES];
  const seen = new Set(out.map((c) => c.value));
  for (const v of existingVerticals) {
    const val = (v || "").trim();
    if (!val || seen.has(val)) continue;
    seen.add(val);
    out.push({ value: val, label: labelFromSlug(val), word: wordForCategory(val) });
  }
  return out;
}
