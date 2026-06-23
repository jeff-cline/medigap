import { db } from "./db";

// Text/JSON generation via Claude (Anthropic). Same integration row + config shape as
// src/lib/vision.ts (key "claude", default model claude-opus-4-8).

export async function claudeConfig(): Promise<{ apiKey: string; model: string } | null> {
  const row = await db.integration.findUnique({ where: { key: "claude" } });
  if (!row) return null;
  try {
    const c = JSON.parse(row.config) as { apiKey?: string; model?: string };
    if (!c.apiKey) return null;
    return { apiKey: c.apiKey, model: c.model || "claude-opus-4-8" };
  } catch { return null; }
}

export async function isClaudeConnected(): Promise<boolean> {
  return (await claudeConfig()) !== null;
}

// One-shot completion. Returns the text content, or null if Claude isn't connected / fails.
export async function claudeText(
  opts: { system?: string; prompt: string; maxTokens?: number; timeoutMs?: number; temperature?: number },
): Promise<string | null> {
  const cfg = await claudeConfig();
  if (!cfg) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": cfg.apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: cfg.model,
        max_tokens: opts.maxTokens ?? 2000,
        temperature: opts.temperature ?? 0.7,
        ...(opts.system ? { system: opts.system } : {}),
        messages: [{ role: "user", content: opts.prompt }],
      }),
      signal: AbortSignal.timeout(opts.timeoutMs ?? 60000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.content?.[0]?.text?.trim() || null;
  } catch { return null; }
}

// Parse the first {...} or [...] JSON value out of a model response (handles ```json fences).
export function extractJson<T = unknown>(text: string | null): T | null {
  if (!text) return null;
  const cleaned = text.replace(/```json/gi, "```").replace(/```/g, "");
  const m = cleaned.match(/[[{][\s\S]*[\]}]/);
  if (!m) return null;
  try { return JSON.parse(m[0]) as T; } catch { return null; }
}

// Convenience: ask for JSON and parse it in one call.
export async function claudeJson<T = unknown>(
  opts: { system?: string; prompt: string; maxTokens?: number; timeoutMs?: number; temperature?: number },
): Promise<T | null> {
  return extractJson<T>(await claudeText(opts));
}
