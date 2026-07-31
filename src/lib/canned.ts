export type Canned = { id: string; keywords: string; reply: string; active: boolean; sortOrder: number };

export function matchCanned(body: string, canneds: Canned[]): Canned | null {
  const b = (body || "").toLowerCase();
  const active = canneds.filter((c) => c.active).sort((a, z) => a.sortOrder - z.sortOrder);
  for (const c of active) {
    let kws: string[]; try { kws = JSON.parse(c.keywords || "[]"); } catch { kws = []; }
    if (!Array.isArray(kws)) kws = [];
    if (kws.some((k) => k && b.includes(String(k).toLowerCase()))) return c;
  }
  return null;
}
