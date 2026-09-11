import { describe, it, expect } from "vitest";
import { spamScore } from "@/lib/spam-guard";

const REAL_SPAM: [string, string, string][] = [
  ["📩 Transfer № B4423 from Coinbase. NEXT ->> graph.org/Bitcoin-Mining-08-27?di7b7", "mvengesk@gmail.com", "954642190061"],
  ["📈 You have A NEW MESSAGE №T6481 READ → graph.org/Bitcoin", "hiagubacamara27@gmail.com", "954642190061"],
  ["💴 You have ONE MESSAGE №H7663 CONTINUE ⇒ graph.org/x", "rhouse1138@gmail.co", "12345678901"],
  ["🔐 Transfer # F4489 from Coinbase. GET -> graph.org/a", "jeff090263@hotmail.com", "954642190061"],
];
const REAL_PEOPLE: [string, string, string][] = [
  ["Jeff Cline", "jeff@acme.com", "2145550100"],
  ["Mary-Jane O'Connor", "mj@clinic.org", "9725551234"],
  ["Darlin Brown", "Darlin_Brown@outlook.com", "4695559876"],
  ["José Martínez", "jose@seguros.mx", "2105557788"],
];

describe("spam heuristics vs the live predictivedata.org attack", () => {
  it.each(REAL_SPAM)("blocks: %s", (name, email, phone) => {
    const r = spamScore({ names: [name], email, phone });
    expect(r.score, `reasons=${r.reasons.join(",")}`).toBeGreaterThanOrEqual(100);
  });
  it.each(REAL_PEOPLE)("allows: %s", (name, email, phone) => {
    const r = spamScore({ names: [name], email, phone });
    expect(r.score, `reasons=${r.reasons.join(",")}`).toBeLessThan(100);
  });
});
