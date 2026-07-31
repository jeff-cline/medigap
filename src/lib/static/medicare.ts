import { aiReply as realAiReply, type ChatMsg } from "@/lib/voice";

type Intent = "gov" | "buy" | "plan";

// Priority-ordered so specific plan/gov tokens beat generic "insurance".
const PLAN_KW = ["retire", "retiring", "ready to retire", "sign up", "signup", "enroll", "part a", "part b", "part d", "start medicare", "get on medicare", "social security", "how do i get"];
const GOV_KW = ["replace", "my card", "new card", "lost my card", "lost card", "didn't get", "did not get", "bill paid", "medicare.gov", "medicare dot gov", "government", "the office", "card"];
const BUY_KW = ["buy", "quote", "how much", "save money on insurance", "advantage", "medicare advantage", "drug", "drug coverage", "supplement", "medigap", "plan g", "plan n", "need insurance", "insurance quote"];

function hit(s: string, kws: string[]): boolean {
  return kws.some((k) => s.includes(k));
}

export function classifyMedicareIntent(speech: string): Intent | null {
  const s = (speech || "").toLowerCase().trim();
  if (!s) return null;
  if (hit(s, PLAN_KW)) return "plan";
  if (hit(s, GOV_KW)) return "gov";
  if (hit(s, BUY_KW)) return "buy";
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
  if (/\b(customer service|representative|rep|agent|speak to someone|real person)\b/.test(s)) return "service";
  // "what" only when it's the gist (short), not embedded in a real intent
  if (/\bwhat\b/.test(s) && !classifyMedicareIntent(s)) return "what";
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
