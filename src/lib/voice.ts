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
  { field: "dob", ask: "Perfect — and what is your date of birth? Please say the month, day, and year — for example, June fifth, nineteen fifty." },
];

// Curated Twilio <Say> voices (Amazon Polly Neural + Google); female-first per request.
// Ordered clearest / most human-sounding first. All are NEURAL voices (Twilio's highest quality).
// `sample` is a line spoken by the "▶ Play sample" preview. `gender` helps the browser preview pick a match.
export const VOICES: { id: string; label: string; gender: "female" | "male"; sample: string }[] = [
  { id: "Polly.Ruth-Neural", label: "Ruth — US female · most natural ★", gender: "female", sample: "Hi, thank you for calling 1-800-MEDIGAP. I'm here to help — and this won't cost you anything." },
  { id: "Polly.Joanna-Neural", label: "Joanna — US female · warm (recommended)", gender: "female", sample: "Hello, and thank you for calling. I'd be happy to help you with your Medicare today." },
  { id: "Polly.Danielle-Neural", label: "Danielle — US female · friendly", gender: "female", sample: "Hi there! Thanks for calling — let's get you to the right person." },
  { id: "Polly.Kimberly-Neural", label: "Kimberly — US female · clear", gender: "female", sample: "Thank you for calling. Could you share your first and last name for me?" },
  { id: "Polly.Kendra-Neural", label: "Kendra — US female · calm", gender: "female", sample: "Of course. There's no charge for this — I'm happy to help." },
  { id: "Polly.Salli-Neural", label: "Salli — US female · upbeat", gender: "female", sample: "Great! Let me get a few quick details so I can help you out." },
  { id: "Polly.Matthew-Neural", label: "Matthew — US male · natural", gender: "male", sample: "Hi, thanks for calling 1-800-MEDIGAP. I'll connect you with a licensed specialist." },
  { id: "Polly.Stephen-Neural", label: "Stephen — US male · professional", gender: "male", sample: "Thank you for calling. I can help you compare your options at no cost." },
  { id: "Google.en-US-Neural2-F", label: "Google Neural2-F — US female", gender: "female", sample: "Hello, thank you for calling. How can I help you today?" },
];

// The AI "brain" engines you can run the voice agent on. Prices are public list estimates
// ($ per 1M tokens) — used only to estimate per-call cost so you can compare highest vs lowest.
export const ENGINES: { id: string; label: string; model: string; tier: string; note: string; inPerM: number; outPerM: number }[] = [
  { id: "xai", label: "xAI Grok", model: "grok-4.20-0309-non-reasoning", tier: "Most human-like", note: "Most natural, nuanced replies. Higher cost.", inPerM: 5, outPerM: 15 },
  { id: "groq", label: "Groq · Llama 3.3 70B", model: "llama-3.3-70b-versatile", tier: "Fastest / lowest cost", note: "Very fast, much cheaper. Slightly less nuanced.", inPerM: 0.59, outPerM: 0.79 },
];
// Rough tokens used by one ~8-turn qualifying call (for the cost estimate).
export const EST_TOKENS_PER_CALL = { input: 1500, output: 1000 };
export function estCallCost(e: { inPerM: number; outPerM: number }): number {
  return (EST_TOKENS_PER_CALL.input / 1e6) * e.inPerM + (EST_TOKENS_PER_CALL.output / 1e6) * e.outPerM;
}
// Actual $ for a given token volume on a given engine (used by the AI Spend accounting).
export function costFromTokens(engineId: string, promptTokens: number, completionTokens: number): number {
  const e = ENGINES.find((x) => x.id === engineId) || ENGINES[0];
  return (promptTokens / 1e6) * e.inPerM + (completionTokens / 1e6) * e.outPerM;
}

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

// Words that are NEVER a person's name — used to detect garbage voice-transcribed "names"
// (e.g. "Do the new federal.") so we don't store or ping junk that buyers reject.
const NAME_STOP = new Set(
  ("the a an and or but do does did is are was were be been being new federal government " +
    "what whats how why when where who whom which yes yeah no nope please hello hi hey um uh i me my mine we us you your " +
    "it its this that these those for to of on in at with from by about want wanted need needed help call calling called " +
    "phone number talk talking speak speaking someone somebody anyone anybody agent representative rep person people " +
    "medicare medicaid medigap supplement supplements insurance plan plans coverage social security benefits here there " +
    "okay ok thanks thank sir maam have has had get got give can could would should will just like know think see " +
    "go going come came trying try looking only over still back again now today").split(/\s+/)
);

// Turn raw voice-transcribed speech into a clean person name, or "" if it's garbage (a sentence/fragment).
export function cleanPersonName(raw: string): string {
  if (!raw) return "";
  let s = raw.toLowerCase().replace(/[^a-z'’\-\s]/g, " ");
  s = s.replace(/\b(my name is|the name is|name is|i am|i'?m|this is|it'?s|call me)\b/g, " ");
  const words = s.trim().split(/\s+/).filter(Boolean);
  const namey: string[] = [];
  for (const w of words) {
    if (NAME_STOP.has(w)) { if (namey.length) break; else continue; }
    if (/^[a-z][a-z'’\-]{1,18}$/.test(w)) namey.push(w);
    if (namey.length >= 3) break;
  }
  if (!namey.length) return "";
  return namey.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

// Split a (cleaned) full name into first + last for partner APIs.
export function splitName(full: string): { firstName: string; lastName: string } {
  const parts = (full || "").trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") };
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

const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
function buildIso(m: number, d: number, yRaw: string | number): string {
  let y = typeof yRaw === "number" ? yRaw : parseInt(String(yRaw), 10);
  if (y < 100) y = y > 25 ? 1900 + y : 2000 + y;
  if (!m || !d || m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > new Date().getFullYear()) return "";
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// Fast, dependency-free normalize of a spoken/typed DOB → ISO "YYYY-MM-DD" (or "" if unsure).
// Handles "5/12/1955", "5 12 1955", "May 12 1955", "5-12-55". Spelled-out words → use normalizeDobAI.
export function normalizeDob(speech: string): string {
  if (!speech) return "";
  const s = speech.toLowerCase().replace(/(\d+)(st|nd|rd|th)\b/g, "$1").replace(/,/g, " ");
  const num = s.match(/\b(\d{1,2})\s*[/\-.]\s*(\d{1,2})\s*[/\-.]\s*(\d{2,4})\b/) || s.match(/\b(\d{1,2})\s+(\d{1,2})\s+(\d{2,4})\b/);
  if (num) { const iso = buildIso(+num[1], +num[2], num[3]); if (iso) return iso; }
  const mn = s.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})\b[^\d]*(\d{2,4})\b/);
  if (mn) { const iso = buildIso(MONTHS[mn[1]], +mn[2], mn[3]); if (iso) return iso; }
  return "";
}

// AI fallback for messy spoken dates ("January fifth nineteen fifty"). Returns ISO or "".
export async function normalizeDobAI(speech: string): Promise<string> {
  if (!speech) return "";
  const out = await aiReply([
    { role: "system", content: "Convert a spoken US date of birth into ISO format YYYY-MM-DD. Reply with ONLY the date (e.g. 1950-06-05), or the single word NONE if you cannot determine a full month, day and year." },
    { role: "user", content: speech },
  ], { maxTokens: 12, temperature: 0 }).catch(() => null);
  const m = (out || "").match(/\b(19\d{2}|20[0-2]\d)-(\d{2})-(\d{2})\b/);
  return m ? m[0] : "";
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
  const [rows, agent] = await Promise.all([
    db.integration.findMany({ where: { key: { in: ["xai", "groq"] } } }),
    db.voiceAgent.findUnique({ where: { id: "default" }, select: { engine: true } }).catch(() => null),
  ]);
  const byKey = new Map(rows.map((r) => [r.key, r]));
  // Honor the chosen engine first (if it's configured), else fall back to xai → groq.
  const pref = agent?.engine && ["xai", "groq"].includes(agent.engine) ? agent.engine : "";
  const order = pref ? [pref, ...["xai", "groq"].filter((k) => k !== pref)] : ["xai", "groq"];
  for (const key of order) {
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
  opts: { maxTokens?: number; temperature?: number; timeoutMs?: number; purpose?: string; callId?: string } = {},
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
    // Log token usage for the AI Spend accounting (fire-and-forget, never blocks the reply).
    const u = data?.usage;
    if (u) {
      db.aiUsage.create({ data: {
        provider: p.provider, model: p.model,
        promptTokens: Number(u.prompt_tokens || 0), completionTokens: Number(u.completion_tokens || 0),
        purpose: opts.purpose || "", callId: opts.callId || null,
      } }).catch(() => {});
    }
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch { return null; }
}

export function esc(s: string) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
