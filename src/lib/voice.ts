import { db } from "./db";

export const DEFAULT_SYSTEM_PROMPT = `You are a licensed-insurance intake concierge for Medigap.plus, a FREE service helping U.S. seniors (65+) with Medicare.
You have already authenticated the caller and collected their name, ZIP and date of birth.
Now help them: answer their questions briefly and factually in one or two short sentences, easy for an older person to follow on the phone.
NEVER quote specific plan prices or guarantee coverage — say a licensed specialist will go over exact options.
Your goal is to quickly discern what they need:
- If they want to buy, compare, switch, or ask about Medicare / supplement / Advantage / coverage / enrollment, tell them "We're a free service and I'll connect you with a licensed agent who can help" and end your message with the exact tag [TRANSFER:insurance].
- If they mention a product we monetize separately (a "money word" you'll be told about), acknowledge warmly and end with [TRANSFER:moneyword].
- If after a couple of exchanges intent is unclear, gently steer toward how we can help with their Medicare and transfer.
VARY YOUR WORDING: never repeat a sentence or phrase you have already used on this call. Reassure them we're a free service and we're here to help, but say it a fresh way each time (e.g. "there's no charge for this", "this won't cost you anything", "happy to help at no cost") instead of repeating the same line. Your ultimate goal is to surface what they need and get them to one of our armed money words or a licensed agent.
Keep it human and kind.`;

export const DEFAULT_INTAKE = [
  { field: "name", ask: "Please share your first and last name after the tone." },
  { field: "zip", ask: "Great — what ZIP code are you calling from?" },
  { field: "dob", ask: "Perfect — and what is your date of birth?" },
];

// Curated Twilio <Say> voices (Amazon Polly Neural + Google); female-first per request.
export const VOICES: { id: string; label: string }[] = [
  { id: "Polly.Joanna-Neural", label: "Joanna — US female, warm (recommended)" },
  { id: "Polly.Kimberly-Neural", label: "Kimberly — US female, clear" },
  { id: "Polly.Salli-Neural", label: "Salli — US female, upbeat" },
  { id: "Polly.Kendra-Neural", label: "Kendra — US female, calm" },
  { id: "Polly.Ruth-Neural", label: "Ruth — US female, natural" },
  { id: "Polly.Danielle-Neural", label: "Danielle — US female, friendly" },
  { id: "Google.en-US-Neural2-F", label: "Google Neural2-F — US female" },
  { id: "Polly.Matthew-Neural", label: "Matthew — US male" },
  { id: "Polly.Stephen-Neural", label: "Stephen — US male, professional" },
];

export async function getVoiceAgent() {
  const existing = await db.voiceAgent.findUnique({ where: { id: "default" } });
  if (existing) return existing;
  return db.voiceAgent.create({ data: { id: "default", systemPrompt: DEFAULT_SYSTEM_PROMPT, questions: JSON.stringify(DEFAULT_INTAKE) } });
}

export type IntakeStep = { field: string; ask: string };
export function getIntake(agent: { questions: string }): IntakeStep[] {
  try { const q = JSON.parse(agent.questions); if (Array.isArray(q) && q.length) return q; } catch {}
  return DEFAULT_INTAKE;
}

export function firstName(full: string) {
  return (full || "").trim().split(/\s+/)[0]?.replace(/[^a-zA-Z'-]/g, "") || "";
}

// Best-effort age from a spoken DOB ("January 5th 1950", "5/5/50", "1950"). Returns null if unsure.
export function ageFromSpeech(text: string): number | null {
  const now = new Date().getFullYear();
  const y4 = text.match(/\b(19\d{2}|20[0-2]\d)\b/);
  if (y4) { const age = now - parseInt(y4[1], 10); if (age > 0 && age < 120) return age; }
  const y2 = text.match(/\b['’]?(\d{2})\b\s*$/); // trailing 2-digit year
  if (y2) { const yy = parseInt(y2[1], 10); const yr = yy > 25 ? 1900 + yy : 2000 + yy; const age = now - yr; if (age > 30 && age < 120) return age; }
  return null;
}

// Scan an utterance for an active money word (or any of its variant aliases).
export async function detectMoneyWord(text: string) {
  const t = (text || "").toLowerCase();
  const words = await db.moneyWord.findMany({ where: { active: true } });
  return words.find((w) => {
    if (w.word && t.includes(w.word.toLowerCase())) return true;
    try { const al = JSON.parse(w.aliases); if (Array.isArray(al)) return al.some((a: string) => a && t.includes(String(a).toLowerCase())); } catch {}
    return false;
  }) || null;
}

// AI-extract the real money words (topics/products) from a transcript, ignoring intent words.
export async function extractMoneyWords(transcript: { role: string; text: string }[]): Promise<string[]> {
  const callerText = transcript.filter((t) => t.role === "user").map((t) => t.text).join(" ");
  if (!callerText.trim()) return [];
  const reply = await aiReply([
    { role: "system", content: `You extract "money words" from a phone transcript — the specific products, services, conditions, devices, or supplies the caller wants help with that we could monetize (e.g. "incontinence", "incontinence supplies", "peptides", "hearing aids", "diabetic supplies", "back brace"). IGNORE generic intent/connector words like speak, talk, agent, someone, somebody, help, find, provider, supplier, specialist, Medicare, insurance, plan, coverage. Return ONLY a compact JSON array of 1-5 short lowercase phrases, most specific/valuable first. If none, return [].` },
    { role: "user", content: callerText.slice(0, 2000) },
  ]);
  if (!reply) return [];
  try {
    const m = reply.match(/\[[\s\S]*\]/);
    const arr = JSON.parse(m ? m[0] : reply);
    return Array.isArray(arr) ? arr.map((x) => String(x).toLowerCase().trim()).filter(Boolean).slice(0, 6) : [];
  } catch { return []; }
}

export async function getAIProvider(): Promise<{ provider: string; apiKey: string; model: string; url: string } | null> {
  const rows = await db.integration.findMany({ where: { key: { in: ["xai", "groq"] } } });
  const byKey = new Map(rows.map((r) => [r.key, r]));
  for (const key of ["xai", "groq"]) {
    const row = byKey.get(key);
    if (!row) continue;
    let cfg: Record<string, string> = {};
    try { cfg = JSON.parse(row.config); } catch {}
    if (!cfg.apiKey) continue;
    if (key === "xai") return { provider: "xai", apiKey: cfg.apiKey, model: cfg.model || "grok-4.20-0309-non-reasoning", url: "https://api.x.ai/v1/chat/completions" };
    if (key === "groq") return { provider: "groq", apiKey: cfg.apiKey, model: cfg.model || "llama-3.3-70b-versatile", url: "https://api.groq.com/openai/v1/chat/completions" };
  }
  return null;
}

export type ChatMsg = { role: "system" | "user" | "assistant"; content: string };
export async function aiReply(
  messages: ChatMsg[],
  opts: { maxTokens?: number; temperature?: number; timeoutMs?: number } = {},
): Promise<string | null> {
  const p = await getAIProvider();
  if (!p) return null;
  try {
    const res = await fetch(p.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${p.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: p.model, messages, temperature: opts.temperature ?? 0.5, max_tokens: opts.maxTokens ?? 120 }),
      signal: AbortSignal.timeout(opts.timeoutMs ?? 9000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch { return null; }
}

export function esc(s: string) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
