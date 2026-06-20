import { db } from "./db";

// Read a reference image with Claude vision: what it shows, the exact words/text on it,
// and its color palette — so a campaign can match the brand the user dropped in.

export type RefAnalysis = { description: string; words: string[]; colors: string[] };

async function claudeConfig(): Promise<{ apiKey: string; model: string } | null> {
  const row = await db.integration.findUnique({ where: { key: "claude" } });
  if (!row) return null;
  try {
    const c = JSON.parse(row.config) as { apiKey?: string; model?: string };
    if (!c.apiKey) return null;
    return { apiKey: c.apiKey, model: c.model || "claude-opus-4-8" };
  } catch { return null; }
}

// Analyze a publicly-reachable image URL. Returns null if Claude isn't connected or fails.
export async function analyzeReference(absoluteUrl: string): Promise<RefAnalysis | null> {
  const cfg = await claudeConfig();
  if (!cfg) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": cfg.apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: cfg.model,
        max_tokens: 700,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "url", url: absoluteUrl } },
            { type: "text", text: `This is a brand/reference asset for an ad. Return ONLY compact JSON: {"description":"...","words":["..."],"colors":["#hex",...]}. description = what the image shows and its visual style; words = every readable word/phrase of text in the image, verbatim; colors = the 2-6 dominant brand colors as hex. If a field is empty use [].` },
          ],
        }],
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text: string = data?.content?.[0]?.text || "";
    const m = text.match(/\{[\s\S]*\}/);
    const j = JSON.parse(m ? m[0] : text);
    return {
      description: String(j.description || "").slice(0, 600),
      words: Array.isArray(j.words) ? j.words.map((w: unknown) => String(w)).filter(Boolean).slice(0, 25) : [],
      colors: Array.isArray(j.colors) ? j.colors.map((c: unknown) => String(c)).filter((c: string) => /^#?[0-9a-fA-F]{3,8}$/.test(c)).map((c: string) => (c.startsWith("#") ? c : `#${c}`)).slice(0, 6) : [],
    };
  } catch { return null; }
}
