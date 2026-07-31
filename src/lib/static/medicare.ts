import { aiReply as realAiReply, type ChatMsg } from "@/lib/voice";

type Intent = "gov" | "buy" | "plan";

// Only STRONG, unambiguous tokens keyword-match; genuinely ambiguous phrasing
// ("card", "sign up", "enroll", "insurance" alone) falls through to the AI fallback.
// BUY is checked first so the one monetizable intent is never stolen by a broad
// gov/plan token ("buy insurance, put it on my card" => buy, not gov).
const BUY_KW = ["quote", "medicare advantage", "advantage", "medigap", "supplement", "drug coverage", "plan g", "plan n", "how much", "buy insurance", "insurance quote", "save money on insurance", "buy a plan", "purchase"];
const PLAN_KW = ["social security", "part a", "part b", "part d", "retire", "retiring", "ready to retire", "start medicare", "get on medicare", "sign up for medicare", "signing up for medicare"];
const GOV_KW = ["medicare card", "replace my card", "replace card", "new card", "lost my card", "lost card", "my card", "medicare.gov", "medicare dot gov", "didn't get a bill", "did not get a bill", "bill paid", "medicare office", "government office"];

function hit(s: string, kws: string[]): boolean {
  return kws.some((k) => s.includes(k));
}

export function classifyMedicareIntent(speech: string): Intent | null {
  const s = (speech || "").toLowerCase().trim();
  if (!s) return null;
  if (hit(s, BUY_KW)) return "buy";
  if (hit(s, PLAN_KW)) return "plan";
  if (hit(s, GOV_KW)) return "gov";
  return null;
}

export function detectYesNo(speech: string, digit: string): "yes" | "no" | null {
  const d = (digit || "").trim();
  if (d === "1") return "yes";
  if (d === "2") return "no";
  const s = (speech || "").toLowerCase();
  if (/\b(yes|yeah|yep|sure|ok|okay|please|correct|let me join|join|i do|do it)\b/.test(s)) return "yes";
  if (/\b(no|nope|nah|don'?t|not interested|no thanks)\b/.test(s)) return "no";
  return null;
}

export function medicareInterrupt(speech: string): "what" | "service" | null {
  const s = (speech || "").toLowerCase().trim();
  if (!s) return null;
  // Only fire when the utterance carries NO real intent — so "I want an agent to sell me a plan"
  // classifies as buy, not a service interrupt. "agent"/"rep" are too ambiguous in an insurance
  // context to treat as a human-handoff request, so they're excluded here.
  if (classifyMedicareIntent(s)) return null;
  if (/\b(customer service|customer support|representative|speak to someone|speak to a person|real person|a human|human being)\b/.test(s)) return "service";
  if (/\bwhat\b/.test(s)) return "what";
  return null;
}

const AI_SYSTEM =
  "You classify a Medicare caller's intent into exactly one word: gov, buy, or plan. " +
  "gov = they want the government Medicare office / medicare.gov (replace a card, a billing problem). " +
  "buy = they want to purchase or price insurance (a quote, Medicare Advantage, drug coverage, saving money on insurance). " +
  "plan = they are planning retirement or starting Social Security / signing up for Medicare Part A or B. " +
  "Reply with ONLY the single word gov, buy, or plan.";

export async function classifyMedicareIntentAI(
  speech: string,
  deps: { aiReply?: typeof realAiReply } = {},
): Promise<Intent | null> {
  const ai = deps.aiReply || realAiReply;
  const messages: ChatMsg[] = [
    { role: "system", content: AI_SYSTEM },
    { role: "user", content: (speech || "").slice(0, 300) },
  ];
  const out = await ai(messages, { maxTokens: 4, temperature: 0, purpose: "medicare-intent" });
  const w = (out || "").toLowerCase().replace(/[^a-z]/g, "");
  return w === "gov" || w === "buy" || w === "plan" ? (w as Intent) : null;
}
