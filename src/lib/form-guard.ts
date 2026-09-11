import type { NextRequest } from "next/server";
import { db } from "./db";
import { isSpamSubmission, clientIp, type GuardInput } from "./spam-guard";
import { verifyRecaptcha } from "./recaptcha";

// ---------------------------------------------------------------------------
// The ONE call every public form route in the Core makes.
//
//   const gate = await guardForm(req, "leads", body, { texts: [...], email, phone });
//   if (gate.blocked) return gate.response;
//
// Two layers, because neither is sufficient alone:
//   1. Google reCAPTCHA — stops the automated traffic outright.
//   2. Content heuristics (lib/spam-guard) — still catches the hand-typed and
//      captcha-farmed junk that scores as human.
//
// A blocked submission gets `{ ok: true }` and nothing else happens: no record,
// no email, no notification. The bot sees success and stops retrying, and the
// founder's inbox stays clean. Every block is logged to SpamBlock so we can
// prove it is working and find a form we missed.
//
// NEW FORMS: call this. It is the standard — there is no second way to do it.
// ---------------------------------------------------------------------------

const FIELD_SENT_BY_CLIENT = "recaptchaToken";

export type GuardOptions = GuardInput & {
  /** v3 action name, defaults to the form id. Must match the browser's. */
  action?: string;
  /** Heuristic score needed to block. Default 100. */
  threshold?: number;
  /** Per-IP submissions per minute before throttling. Default 8. */
  rateMax?: number;
};

export type GuardVerdict = {
  blocked: boolean;
  reason: string;
  /** Ready-made silent-success body for a blocked request. */
  response: Response;
};

/** Never log a full submission — keep the shape, drop anything identifying. */
function redact(body: Record<string, unknown>): string {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body ?? {})) {
    if (k === FIELD_SENT_BY_CLIENT) continue;
    if (typeof v === "string") {
      // Keep enough to recognise gibberish, not enough to be a data store.
      out[k] = v.length > 60 ? v.slice(0, 60) + "…" : v;
    } else if (typeof v === "number" || typeof v === "boolean") {
      out[k] = v;
    }
  }
  try { return JSON.stringify(out).slice(0, 2000); } catch { return "{}"; }
}

async function logBlock(
  req: NextRequest, form: string, source: string, reason: string,
  body: Record<string, unknown>, score?: number,
) {
  // Logging must never be the reason a request fails.
  await db.spamBlock.create({
    data: {
      form, source, reason,
      score: typeof score === "number" ? score : null,
      ip: clientIp(req),
      host: req.headers.get("host") || "",
      userAgent: (req.headers.get("user-agent") || "").slice(0, 300),
      payload: redact(body),
    },
  }).catch(() => {});
}

export async function guardForm(
  req: NextRequest,
  form: string,
  body: Record<string, unknown>,
  opts: GuardOptions = {},
): Promise<GuardVerdict> {
  const silent = Response.json({ ok: true });

  // --- layer 1: reCAPTCHA -------------------------------------------------
  const cap = await verifyRecaptcha(body?.[FIELD_SENT_BY_CLIENT] as string | undefined, {
    ip: clientIp(req),
    action: opts.action || form.replace(/[^a-zA-Z0-9_]/g, "_"),
  });
  const enforcing = cap.enforcing !== false;
  if (!cap.ok) {
    // In monitor mode we record the verdict and let it through, so switching
    // reCAPTCHA on can be watched before it is trusted.
    await logBlock(req, form, enforcing ? "recaptcha" : "recaptcha-monitor", cap.reason, body, cap.score);
    if (enforcing) return { blocked: true, reason: `recaptcha:${cap.reason}`, response: silent };
  } else if (!enforcing && !cap.skipped) {
    // Monitor mode logs the PASSES too — seeing real submissions score 0.9
    // beside bots scoring 0.1 is the evidence needed to switch to enforce.
    await logBlock(req, form, "recaptcha-pass", cap.reason, body, cap.score);
  }

  // --- layer 2: content heuristics + per-IP rate limit --------------------
  const heur = isSpamSubmission(req, {
    honeypot: opts.honeypot ?? body?._hp,
    texts: opts.texts,
    email: opts.email,
    phone: opts.phone,
  }, { threshold: opts.threshold, rateMax: opts.rateMax });

  if (heur.blocked) {
    const source = heur.reasons.includes("rate-limit") ? "rate-limit" : "heuristic";
    await logBlock(req, form, source, heur.reasons.join(",") || "blocked", body);
    return { blocked: true, reason: `${source}:${heur.reasons.join(",")}`, response: silent };
  }

  return { blocked: false, reason: cap.skipped ? "recaptcha-skipped" : "pass", response: silent };
}
