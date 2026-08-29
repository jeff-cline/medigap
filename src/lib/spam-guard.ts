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
  email?: string;
  phone?: string;
};

export function spamScore(inp: GuardInput): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  if (typeof inp.honeypot === "string" && inp.honeypot.trim()) { score += 100; reasons.push("honeypot"); }

  // A phone number with real letters in it is always a bot.
  if (inp.phone && (inp.phone.replace(/[^A-Za-z]/g, "").length >= 3)) { score += 100; reasons.push("alpha-phone"); }

  let gib = 0;
  for (const t of inp.texts ?? []) if (textLooksSpammy(t)) gib++;
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
