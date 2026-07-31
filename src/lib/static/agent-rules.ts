// Trainable off-menu response rules for the Static voice agent.
export type AgentRule = {
  id?: string;
  kind: string; // custom | representative | what | stuck
  trigger: string;
  label?: string;
  response: string;
  sms: string;
  continueMenu: boolean;
  active: boolean;
  builtin?: boolean;
  sortOrder?: number;
};

// Fixed word-sets for the built-in "representative" handler (the caller wants a human).
export const REP_WORDS = ["representative", "customer service", "operator", "real person", "speak to someone", "speak to a person", "talk to someone", "a human", "human being", "agent", "a rep"];

const has = (s: string, phrases: string[]) => phrases.some((p) => new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(s));

// Match a caller utterance to a rule. Custom rules (by trigger substring) win first, then the
// built-in representative / what handlers. Returns null when nothing matches (caller may have
// picked a menu item, which the engine checks separately). Pure + testable.
export function matchAgentRule(speech: string, rules: AgentRule[]): AgentRule | null {
  const s = (speech || "").toLowerCase().trim();
  if (!s) return null;

  const custom = rules
    .filter((r) => r.active && r.kind === "custom")
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  for (const r of custom) {
    const triggers = r.trigger.split(/[,|]/).map((t) => t.trim().toLowerCase()).filter(Boolean);
    if (triggers.some((t) => s.includes(t))) return r;
  }

  const rep = rules.find((r) => r.active && r.kind === "representative");
  if (rep && has(s, REP_WORDS)) return rep;

  const what = rules.find((r) => r.active && r.kind === "what");
  if (what && /\bwhat\b/.test(s)) return what;

  return null;
}

// The built-in rule to use when a caller gives two unrecognized answers in a row.
export function stuckRule(rules: AgentRule[]): AgentRule | null {
  return rules.find((r) => r.active && r.kind === "stuck") || rules.find((r) => r.active && r.kind === "representative") || null;
}

// Seeded, editable built-ins.
export const BUILTIN_RULES: AgentRule[] = [
  {
    kind: "representative", trigger: "", label: "Wants a representative / human", builtin: true, active: true, continueMenu: true, sortOrder: 1,
    response: "I hear you — I can text you more information right now, and I'll do my best to help you here as well.",
    sms: "Thanks for calling 1-800-MEDIGAP — America's free help line. Here's more information: https://el.ag/medicare-plans. You can also call us anytime at 1-800-MEDIGAP.",
  },
  {
    kind: "what", trigger: "", label: "Says 'what?' / confused", builtin: true, active: true, continueMenu: true, sortOrder: 2,
    response: "1-800-MEDIGAP is America's first autonomous voice engine in training. We're here to help you save time and money. Let me text you more information, and let's see how we can help.",
    sms: "Thanks for calling 1-800-MEDIGAP. Here's more information: https://el.ag/medicare-plans. Call us anytime at 1-800-MEDIGAP.",
  },
  {
    kind: "stuck", trigger: "", label: "Stuck (2 unrecognized answers)", builtin: true, active: true, continueMenu: true, sortOrder: 3,
    response: "No problem — I'll text you more information so you have it, and let's see how we can help you today.",
    sms: "Thanks for calling 1-800-MEDIGAP. Here's more information: https://el.ag/medicare-plans. Call us anytime at 1-800-MEDIGAP.",
  },
];

// Idempotent: ensure the built-in rules exist (by kind). Never overwrites edits.
export async function ensureAgentRules(db: any): Promise<void> {
  for (const r of BUILTIN_RULES) {
    const existing = await db.agentRule.findFirst({ where: { kind: r.kind, builtin: true } });
    if (!existing) await db.agentRule.create({ data: { kind: r.kind, trigger: r.trigger, label: r.label, response: r.response, sms: r.sms, continueMenu: r.continueMenu, active: r.active, builtin: true, sortOrder: r.sortOrder } });
  }
}
