import { db } from "./db";

export type MammoLoc = {
  id: string;
  name: string;
  title: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  calendarUrl: string;
  imageUrl: string;
  serviceZips: string;
  lat: number | null;
  lng: number | null;
  notes: string;
  hours: string;
  requiresOrder: boolean;
  active: boolean;
  sortOrder: number;
};

export async function activeLocations(): Promise<MammoLoc[]> {
  return db.mammoLocation.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  }) as unknown as Promise<MammoLoc[]>;
}

export async function allLocations(): Promise<MammoLoc[]> {
  return db.mammoLocation.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  }) as unknown as Promise<MammoLoc[]>;
}

export const zipList = (l: Pick<MammoLoc, "serviceZips">): string[] =>
  (l.serviceZips || "").match(/\d{5}/g) ?? [];

export const fullAddress = (l: Pick<MammoLoc, "address1" | "city" | "state" | "zip">) =>
  [l.address1, l.city, [l.state, l.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");

/**
 * Rank locations for a ZIP.
 *
 * No geocoding service involved on purpose — US ZIP prefixes are broadly
 * geographic, so shared leading digits are a decent proximity proxy that costs
 * nothing and cannot rate-limit us. An exact match or a listed service ZIP
 * always wins. Real distance is used when both points have coordinates.
 */
export function rankForZip<T extends Pick<MammoLoc, "zip" | "serviceZips" | "name">>(
  locs: T[],
  zip: string,
): T[] {
  const z = String(zip ?? "").replace(/\D/g, "").slice(0, 5);
  if (!z) return locs;
  const score = (l: T) => {
    if (l.zip === z) return 0;
    if (zipList(l).includes(z)) return 1;
    let shared = 0;
    for (let i = 0; i < 5 && l.zip[i] === z[i]; i++) shared++;
    return 10 - shared;
  };
  return [...locs].sort((a, b) => score(a) - score(b) || a.name.localeCompare(b.name));
}
