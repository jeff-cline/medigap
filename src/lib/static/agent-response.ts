import { aiReply as realAiReply } from "@/lib/voice";

const SYSTEM =
  "You are a warm, concise phone agent for 1-800-MEDIGAP, America's free Medicare help line. " +
  "Using the guidance, reply to the caller in ONE short, natural, friendly sentence (max 25 words). " +
  "Never say you are an AI or a bot. Plain spoken text only — no markdown, no quotes.";

// Turn a rule's guidance (context) into what the agent actually says, phrased in its own words by
// the AI. Falls back to the guidance text verbatim if the AI is unavailable/slow — so the call is
// never blocked and the behavior degrades gracefully when no AI provider is configured.
export async function responseFromContext(
  context: string,
  callerSaid: string,
  deps: { aiReply?: typeof realAiReply } = {},
): Promise<string> {
  const ctx = (context || "").trim();
  if (!ctx) return "";
  const ai = deps.aiReply || realAiReply;
  const out = await ai(
    [
      { role: "system", content: SYSTEM },
      { role: "user", content: `Caller said: "${(callerSaid || "").slice(0, 200)}". Guidance for your reply: ${ctx.slice(0, 400)}` },
    ],
    { maxTokens: 60, temperature: 0.4, timeoutMs: 4000, purpose: "agent-rule-response" },
  );
  const clean = (out || "").replace(/^["']+|["']+$/g, "").trim();
  return clean || ctx; // fallback to the guidance text
}
