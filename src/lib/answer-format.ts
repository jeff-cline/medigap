// Splits an answer into paragraphs and distributes citations between them, so each paragraph can
// show the source favicon(s) beneath it. Shared by the live box (client) and the SEO pages (server).
export type Cite = { keyword: string; title: string; url: string; favicon: string };

export function interleave(answer: string, citations: Cite[]): { text: string; cites: Cite[] }[] {
  const paras = String(answer || "").split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  const list = paras.length ? paras : (String(answer || "").trim() ? [String(answer).trim()] : []);
  if (!list.length) return [];
  if (!citations?.length) return list.map((t) => ({ text: t, cites: [] }));
  const per = Math.max(1, Math.ceil(citations.length / list.length));
  return list.map((t, i) => ({ text: t, cites: citations.slice(i * per, i * per + per) }));
}
