export type Seg = { text: string; hit: boolean };

function esc(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Split body into consecutive segments; hit=true segments are case-insensitive matches
// of one of the keywords (longest first). Preserves the original casing of matches.
export function highlightKeywords(body: string, keywords: string[]): Seg[] {
  const kws = [...new Set(keywords.map((k) => (k || "").trim()).filter(Boolean))].sort(
    (a, b) => b.length - a.length,
  );
  if (!body) return [{ text: "", hit: false }];
  if (kws.length === 0) return [{ text: body, hit: false }];
  const re = new RegExp(kws.map(esc).join("|"), "gi");
  const segs: Seg[] = [];
  let last = 0;
  for (const m of body.matchAll(re)) {
    const i = m.index ?? 0;
    if (i > last) segs.push({ text: body.slice(last, i), hit: false });
    segs.push({ text: m[0], hit: true });
    last = i + m[0].length;
  }
  if (last < body.length) segs.push({ text: body.slice(last), hit: false });
  return segs.length ? segs : [{ text: body, hit: false }];
}
