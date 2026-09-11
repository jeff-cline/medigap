import { db } from "./db";

// ---------------------------------------------------------------------------
// Google reCAPTCHA — the Core's standard form defence.
//
// Two keys, both from https://www.google.com/recaptcha/admin:
//   siteKey   — public, goes in the HTML / the browser script
//   secretKey — private, only ever used server-side against siteverify
//
// Drop them in at /dashboard/integrations (the "reCAPTCHA" card). Nothing is
// enforced until both are saved, so adding this cannot break lead capture on
// the day it ships.
//
// Supports v3 (invisible, returns a 0.0–1.0 score) and v2 (checkbox / invisible
// badge, pass-fail). The version is stored with the keys because the browser
// has to call a different API for each; siteverify itself is identical.
// ---------------------------------------------------------------------------

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

export type RecaptchaVersion = "v3" | "v2";

/**
 * monitor — verify and LOG, but let everything through.
 * enforce — actually block.
 *
 * Defaults to monitor. Turning reCAPTCHA on across a network of live forms is
 * exactly the kind of change that can silently stop every lead, so the first
 * state after saving keys is one that cannot cost anything. Watch
 * Dashboard → Form Spam for a day, confirm real submissions are arriving with
 * good scores, then switch to enforce.
 */
export type RecaptchaMode = "monitor" | "enforce";

export type RecaptchaConfig = {
  siteKey: string;
  secretKey: string;
  version: RecaptchaVersion;
  mode: RecaptchaMode;
  /** v3 only: submissions scoring below this are treated as bots. */
  minScore: number;
};

export async function getRecaptchaConfig(): Promise<RecaptchaConfig> {
  const row = await db.integration.findUnique({ where: { key: "recaptcha" } }).catch(() => null);
  let c: Record<string, unknown> = {};
  try { c = row ? JSON.parse(row.config || "{}") : {}; } catch { /* malformed config behaves as unset */ }
  const min = Number(c.minScore);
  return {
    siteKey: String(c.siteKey ?? "").trim(),
    secretKey: String(c.secretKey ?? "").trim(),
    version: c.version === "v2" ? "v2" : "v3",
    mode: c.mode === "enforce" ? "enforce" : "monitor",
    // 0.5 is Google's own default recommendation.
    minScore: Number.isFinite(min) && min > 0 && min < 1 ? min : 0.5,
  };
}

/** Enforcement is on only when BOTH keys are present. */
export function isRecaptchaEnabled(c: RecaptchaConfig): boolean {
  return Boolean(c.siteKey && c.secretKey);
}

/** What the browser is allowed to see: the site key is public by design. */
export async function publicRecaptchaConfig(): Promise<{ siteKey: string; version: RecaptchaVersion; enabled: boolean }> {
  const c = await getRecaptchaConfig();
  // Note: enabled is true in monitor mode too — we want tokens flowing so the
  // log is real. Only the blocking decision differs.
  return { siteKey: c.siteKey, version: c.version, enabled: isRecaptchaEnabled(c) };
}

// ---------------------------------------------------------------------------
// Circuit breaker.
//
// A wrong secret key rejects EVERY submission and looks exactly like a bot
// flood. Either way, refusing everything is the wrong response: if the key is
// broken we lose every lead on the network, and if it is a real flood the
// content heuristics still run underneath. So when reCAPTCHA has rejected a
// long unbroken run of submissions, we stop enforcing and say so loudly on the
// Form Spam page. It closes again as soon as anything passes.
// ---------------------------------------------------------------------------

const BREAK_AFTER = 20;        // consecutive rejections before we stop enforcing
const BREAK_WINDOW_MS = 600_000; // ...if they all landed within 10 minutes

let consecutiveFails = 0;
let firstFailAt = 0;
let breakerOpen = false;

function noteVerdict(passed: boolean) {
  if (passed) { consecutiveFails = 0; firstFailAt = 0; breakerOpen = false; return; }
  const now = Date.now();
  if (!consecutiveFails || now - firstFailAt > BREAK_WINDOW_MS) { firstFailAt = now; consecutiveFails = 0; }
  consecutiveFails++;
  if (consecutiveFails >= BREAK_AFTER) breakerOpen = true;
}

/** Are we actually enforcing right now? Mode says yes AND the breaker is closed. */
function enforcingNow(cfg: RecaptchaConfig): boolean {
  return cfg.mode === "enforce" && !breakerOpen;
}

export function recaptchaBreakerState(): { open: boolean; consecutiveFails: number } {
  return { open: breakerOpen, consecutiveFails };
}

type SiteVerifyResponse = {
  success?: boolean;
  score?: number;
  action?: string;
  hostname?: string;
  challenge_ts?: string;
  "error-codes"?: string[];
};

export type RecaptchaResult = {
  ok: boolean;
  /** False in monitor mode: the verdict is real but must not be acted on. */
  enforcing?: boolean;
  /** True when we let it through without a verdict (not configured, or Google unreachable). */
  skipped: boolean;
  score?: number;
  reason: string;
};

/**
 * Verify a token with Google.
 *
 * Deliberate failure policy:
 *   - not configured        → allow (skipped). Keys are the on-switch.
 *   - Google unreachable    → allow (skipped). A Google outage must not cost
 *                             us every lead on the network; the heuristic
 *                             guard still runs alongside this.
 *   - Google says invalid   → BLOCK. This is the actual verdict we asked for.
 *   - v3 score below floor  → BLOCK.
 */
export async function verifyRecaptcha(
  token: string | undefined | null,
  opts: { ip?: string; action?: string } = {},
): Promise<RecaptchaResult> {
  const cfg = await getRecaptchaConfig();
  if (!isRecaptchaEnabled(cfg)) return { ok: true, skipped: true, reason: "not-configured", enforcing: false };

  const t = String(token ?? "").trim();
  // Configured but no token: the browser never solved a challenge. Bots posting
  // straight at the endpoint land here, which is the whole point.
  if (!t) { noteVerdict(false); return { ok: false, skipped: false, reason: "missing-token", enforcing: enforcingNow(cfg) }; }

  const body = new URLSearchParams({ secret: cfg.secretKey, response: t });
  if (opts.ip) body.set("remoteip", opts.ip);

  let data: SiteVerifyResponse;
  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ok: true, skipped: true, reason: `siteverify-http-${res.status}`, enforcing: false };
    data = (await res.json()) as SiteVerifyResponse;
  } catch {
    return { ok: true, skipped: true, reason: "siteverify-unreachable", enforcing: false };
  }

  if (!data.success) {
    const codes = (data["error-codes"] ?? []).join(",");
    // NOTE: Google does NOT reliably distinguish "your secret key is wrong"
    // from "that token is bad" — verified against the live API, a garbage
    // secret, an empty secret and a site key pasted into the secret field ALL
    // come back as `invalid-input-response`. So a wrong key is indistinguishable
    // from a bot here, and the protection against a mistyped key cannot live in
    // this branch. It lives in the circuit breaker below and in monitor mode.
    noteVerdict(false);
    return { ok: false, skipped: false, reason: codes || "rejected", enforcing: enforcingNow(cfg) };
  }

  if (cfg.version === "v3") {
    const score = typeof data.score === "number" ? data.score : undefined;
    if (score !== undefined && score < cfg.minScore) {
      // A low score is a real verdict about a real visitor, not a key problem,
      // so it must NOT trip the breaker — otherwise a genuine bot flood would
      // disable the defence that is working.
      noteVerdict(true);
      return { ok: false, skipped: false, score, reason: `low-score(${score})`, enforcing: enforcingNow(cfg) };
    }
    // An action mismatch means the token was minted for a different form and
    // replayed here.
    if (opts.action && data.action && data.action !== opts.action) {
      noteVerdict(true); // the token itself verified — the key is fine
      return { ok: false, skipped: false, score, reason: `action-mismatch(${data.action})`, enforcing: enforcingNow(cfg) };
    }
    noteVerdict(true);
    return { ok: true, skipped: false, score, reason: "ok", enforcing: enforcingNow(cfg) };
  }

  noteVerdict(true);
  return { ok: true, skipped: false, reason: "ok", enforcing: enforcingNow(cfg) };
}
