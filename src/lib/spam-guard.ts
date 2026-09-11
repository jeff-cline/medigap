import type { NextRequest } from "next/server";

/**
 * Shared bot/spam guard for public form submissions across the Core.
 *
 * Bots hammer our public forms with random-gibberish payloads (e.g. business
 * "Qjrpxp LLC", money word "mxghiigiukdycynmzudbgryz", phone "awfSTyTvcEhxRwCwF").
 * This scores a submission on content heuristics + honeypot + per-IP rate limit
 * and tells the route to silently drop it (return ok:true, create nothing, send
 * no email) so the bot gets no signal and the founder gets no junk.
 *
 * Conservative by design: a real "Jeff Cline / Acme Insurance LLC" scores 0.
 */

// Note: 'y' is treated as a CONSONANT here — bot gibberish leans on y/w to fake
// vowels, and real words carry enough true vowels to pass anyway.
const VOWELS = new Set("aeiouAEIOU");

/** A single word token that looks machine-generated. */
function isGibberishToken(raw: string): boolean {
  const a = raw.replace(/[^A-Za-z]/g, "");
  if (a.length < 5) return false;
  const vowels = [...a].filter((c) => VOWELS.has(c)).length;
  const ratio = vowels / a.length;

  let run = 0, maxRun = 0;
  for (const c of a) { if (!VOWELS.has(c)) { run++; if (run > maxRun) maxRun = run; } else run = 0; }

  // interior upper/lower flips (random MiXeD case like "RyudcqNJIkWnuBEqc")
  let flips = 0;
  for (let i = 1; i < a.length; i++) {
    if (/[A-Z]/.test(a[i]) !== /[A-Z]/.test(a[i - 1])) flips++;
  }

  if (vowels === 0) return true;                    // "Qjrpxp"
  if (a.length >= 8 && ratio < 0.18) return true;   // consonant soup
  if (maxRun >= 6) return true;                       // "...dycynmz..."
  if (a.length >= 8 && flips >= 4) return true;       // random MiXeD case
  if (a.length >= 14 && ratio < 0.38) return true;    // long unbroken low-vowel token
  return false;
}

/** Does a free-text field (name, company, etc.) look like gibberish? */
export function textLooksSpammy(text: string | undefined | null): boolean {
  const tokens = String(text ?? "").split(/[\s,._/\\|-]+/).filter(Boolean);
  return tokens.some(isGibberishToken);
}

export type GuardInput = {
  honeypot?: unknown;             // a hidden field real users never fill
  texts?: (string | undefined)[];  // name / company / keywords to gibberish-check
  /**
   * NAME-like fields only (first/last name, business name). These get strict
   * rules that would be wrong on a message body: a real person's name never
   * contains a URL or an emoji, but a legitimate enquiry might.
   */
  names?: (string | undefined)[];
  email?: string;
  phone?: string;
};

// A bare domain ("graph.org/x") counts — the payloads in the wild skip the scheme.
const URLISH = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|org|net|io|ru|cn|xyz|top|info|biz|app|link|site|online|shop|club|live|vip)\b)/i;
// Pictographs, dingbats, arrows, numero sign — none belong in a name field.
const SYMBOLS = /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u2116]/u;

/** A name field carrying a link or emoji is spam, full stop. */
export function nameLooksSpammy(text: string | undefined | null): string | null {
  const t = String(text ?? "");
  if (!t.trim()) return null;
  if (URLISH.test(t)) return "url-in-name";
  if (SYMBOLS.test(t)) return "symbol-in-name";
  // Real names are short. 70+ characters is a payload, not a person.
  if (t.length > 70) return "overlong-name";
  return null;
}

export function spamScore(inp: GuardInput): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  if (typeof inp.honeypot === "string" && inp.honeypot.trim()) { score += 100; reasons.push("honeypot"); }

  // A phone number with real letters in it is always a bot.
  if (inp.phone && (inp.phone.replace(/[^A-Za-z]/g, "").length >= 3)) { score += 100; reasons.push("alpha-phone"); }

  // Name-field rules first: these are the high-confidence ones.
  for (const n of inp.names ?? []) {
    const hit = nameLooksSpammy(n);
    if (hit) { score += 100; reasons.push(hit); break; }
  }

  let gib = 0;
  for (const t of [...(inp.texts ?? []), ...(inp.names ?? [])]) if (textLooksSpammy(t)) gib++;
  if (gib >= 2) { score += 100; reasons.push(`gibberish×${gib}`); }
  else if (gib === 1) { score += 50; reasons.push("gibberish×1"); }

  // dotted-gmail spam signature: "con.n.orgain.es.3.80@gmail.com"
  if (inp.email) {
    const lp = inp.email.split("@")[0] || "";
    if ((lp.match(/\./g) || []).length >= 3) { score += 50; reasons.push("dotted-email"); }
  }

  return { score, reasons };
}

// Per-process in-memory rate limiter (best-effort; each pm2 worker has its own).
const hits = new Map<string, number[]>();
export function rateLimited(ip: string, max = 8, windowMs = 60_000): boolean {
  if (!ip) return false;
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return arr.length > max;
}

export function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for") || "";
  return xff.split(",")[0].trim() || req.headers.get("x-real-ip") || "";
}

/**
 * The one call routes make. Returns { blocked } — when true, the route should
 * `return NextResponse.json({ ok: true })` and do nothing else.
 */
export function isSpamSubmission(
  req: NextRequest,
  inp: GuardInput,
  opts: { threshold?: number; rateMax?: number } = {}
): { blocked: boolean; reasons: string[]; score: number } {
  const ip = clientIp(req);
  const { score, reasons } = spamScore(inp);
  if (rateLimited(ip, opts.rateMax ?? 8)) { reasons.push("rate-limit"); return { blocked: true, reasons, score }; }
  return { blocked: score >= (opts.threshold ?? 100), reasons, score };
}
