import { REP_WORDS } from "./agent-rules";

export type ExistingRule = { kind: string; trigger: string; label?: string; active: boolean };
export type ConflictCtx = { rules: ExistingRule[]; moneyWords: string[] };

// Two phrases "overlap" if one contains the other (matching is substring-based, case-insensitive).
function overlaps(a: string, b: string): boolean {
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  if (!x || !y) return false;
  return x.includes(y) || y.includes(x);
}

// Warn about a proposed trigger before saving a rule. Returns human-readable conflict messages.
// The most important: a trigger that overlaps a money word is SHADOWED (the menu match wins first),
// so the rule would never fire.
export function triggerConflicts(trigger: string, ctx: ConflictCtx): string[] {
  const phrases = trigger.split(/[,|]/).map((t) => t.trim()).filter(Boolean);
  if (phrases.length === 0) return [];
  const msgs: string[] = [];

  for (const p of phrases) {
    // money-word shadowing
    for (const mw of ctx.moneyWords) {
      if (overlaps(p, mw)) {
        msgs.push(`“${p}” overlaps the money word “${mw}”. Callers who say it get routed to that menu option, so this rule won’t fire.`);
      }
    }
    // existing custom rules
    for (const r of ctx.rules) {
      if (r.kind !== "custom" || !r.active) continue;
      for (const rp of r.trigger.split(/[,|]/).map((t) => t.trim()).filter(Boolean)) {
        if (overlaps(p, rp)) msgs.push(`“${p}” overlaps your existing rule (“${rp}”). The first-listed rule wins.`);
      }
    }
    // built-in representative
    const repHit = REP_WORDS.some((w) => overlaps(p, w));
    if (repHit && ctx.rules.some((r) => r.kind === "representative" && r.active)) {
      msgs.push(`“${p}” already triggers the built-in Representative rule.`);
    }
    // built-in what
    if (overlaps(p, "what") && ctx.rules.some((r) => r.kind === "what" && r.active)) {
      msgs.push(`“${p}” already triggers the built-in “what?” rule.`);
    }
  }
  return [...new Set(msgs)];
}
