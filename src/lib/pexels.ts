import { db } from "./db";
import type { ImageRef } from "./blocks";

// Royalty-free photo search via Pexels (integration key "pexels"). Returns [] when the
// key is missing or the call fails so the site builder can fall back to SVG art —
// a missing photo source must NEVER fail a build.

async function pexelsKey(): Promise<string | null> {
  const row = await db.integration.findUnique({ where: { key: "pexels" } });
  if (!row) return null;
  try { const c = JSON.parse(row.config) as { apiKey?: string }; return c.apiKey || null; } catch { return null; }
}

export async function isPexelsConnected(): Promise<boolean> {
  return (await pexelsKey()) !== null;
}

export async function searchPhotos(query: string, count = 1): Promise<ImageRef[]> {
  const key = await pexelsKey();
  if (!key) return [];
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${Math.min(15, Math.max(1, count))}&orientation=landscape`;
    const res = await fetch(url, { headers: { Authorization: key }, signal: AbortSignal.timeout(12000) });
    if (!res.ok) return [];
    const data = await res.json();
    const photos = Array.isArray(data?.photos) ? data.photos : [];
    return photos.slice(0, count).map((p: Record<string, unknown>): ImageRef => {
      const src = (p.src || {}) as Record<string, string>;
      return {
        url: src.landscape || src.large || src.medium || "",
        alt: String(p.alt || query),
        photographer: String(p.photographer || ""),
        photographerUrl: String(p.photographer_url || ""),
      };
    }).filter((i: ImageRef) => i.url);
  } catch { return []; }
}

// One photo for a topic (or null → caller uses SVG art).
export async function photoFor(query: string): Promise<ImageRef | null> {
  const [img] = await searchPhotos(query, 1);
  return img || null;
}
