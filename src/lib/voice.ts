import { db } from "./db";

export const DEFAULT_SYSTEM_PROMPT = `You are a warm, professional licensed-insurance intake assistant for Medigap.plus, helping U.S. seniors (65+) with Medicare.
Speak briefly and clearly — one or two short sentences per turn, easy for an older caller to follow on the phone.
Your job: collect the caller's FIRST NAME, DATE OF BIRTH, ZIP CODE, whether they have Medicare Parts A & B, and whether they currently have a Medicare Supplement or Advantage plan.
You may answer simple factual questions, but NEVER quote specific plan prices or make guarantees — say a licensed specialist will go over exact options and pricing.
Always move toward the next missing piece of information. Be kind and never pushy.
When you have the first name, date of birth, ZIP, and Medicare A&B status, say a brief reassuring line that you're connecting them to a licensed specialist now, and end that final message with the exact tag [TRANSFER] on its own.`;

export const DEFAULT_QUESTIONS = [
  { key: "name", ask: "May I have your first name?" },
  { key: "dob", ask: "And your date of birth?" },
  { key: "zip", ask: "What's your ZIP code?" },
  { key: "medicare", ask: "Do you currently have Medicare Parts A and B?" },
  { key: "plan", ask: "Do you have a Medicare Supplement or Advantage plan right now?" },
];

// Curated Twilio <Say> voices (Amazon Polly Neural + Google), labeled for the picker.
export const VOICES: { id: string; label: string }[] = [
  { id: "Polly.Joanna-Neural", label: "Joanna — US female, warm (recommended)" },
  { id: "Polly.Matthew-Neural", label: "Matthew — US male, friendly" },
  { id: "Polly.Kimberly-Neural", label: "Kimberly — US female, clear" },
  { id: "Polly.Salli-Neural", label: "Salli — US female, upbeat" },
  { id: "Polly.Joey-Neural", label: "Joey — US male, casual" },
  { id: "Polly.Kendra-Neural", label: "Kendra — US female, calm" },
  { id: "Polly.Stephen-Neural", label: "Stephen — US male, professional" },
  { id: "Polly.Ruth-Neural", label: "Ruth — US female, natural" },
  { id: "Google.en-US-Neural2-F", label: "Google Neural2-F — US female" },
  { id: "Google.en-US-Neural2-D", label: "Google Neural2-D — US male" },
];

export async function getVoiceAgent() {
  const existing = await db.voiceAgent.findUnique({ where: { id: "default" } });
  if (existing) return existing;
  return db.voiceAgent.create({
    data: { id: "default", systemPrompt: DEFAULT_SYSTEM_PROMPT, questions: JSON.stringify(DEFAULT_QUESTIONS) },
  });
}

// Returns the first connected voice-AI provider config (xAI Grok preferred, then Groq).
export async function getAIProvider(): Promise<{ provider: string; apiKey: string; model: string; url: string } | null> {
  const rows = await db.integration.findMany({ where: { key: { in: ["xai", "groq"] } } });
  const byKey = new Map(rows.map((r) => [r.key, r]));
  for (const key of ["xai", "groq"]) {
    const row = byKey.get(key);
    if (!row) continue;
    let cfg: Record<string, string> = {};
    try { cfg = JSON.parse(row.config); } catch {}
    if (!cfg.apiKey) continue;
    if (key === "xai") return { provider: "xai", apiKey: cfg.apiKey, model: cfg.model || "grok-2-latest", url: "https://api.x.ai/v1/chat/completions" };
    if (key === "groq") return { provider: "groq", apiKey: cfg.apiKey, model: cfg.model || "llama-3.3-70b-versatile", url: "https://api.groq.com/openai/v1/chat/completions" };
  }
  return null;
}

export type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

// Call the connected LLM (OpenAI-compatible). Returns the assistant text, or null on failure.
export async function aiReply(messages: ChatMsg[]): Promise<string | null> {
  const p = await getAIProvider();
  if (!p) return null;
  try {
    const res = await fetch(p.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${p.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: p.model, messages, temperature: 0.5, max_tokens: 120 }),
      signal: AbortSignal.timeout(9000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

// XML-escape for safe TwiML <Say>.
export function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
