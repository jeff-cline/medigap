import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import crypto from "crypto";
import { db } from "@/lib/db";

// Homeowner accounts for equity.direct.
//
// No password, deliberately. The qualification form IS the signup, and adding a
// password field at that moment costs conversions to protect a set of
// calculators and figures the person typed in themselves. Returning later uses
// a magic-link token.
//
// Separate cookie from the partner session and from the Core's staff session,
// so no one login surface can expose another.

const COOKIE = "eq_account";
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET as string);

export type AccountSession = { id: string; email: string; firstName: string };

export const newToken = () => crypto.randomBytes(32).toString("base64url");
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export async function createAccountSession(s: AccountSession) {
  const token = await new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getAccountSession(): Promise<AccountSession | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.id || !payload.email) return null;
    return {
      id: String(payload.id),
      email: String(payload.email),
      firstName: String(payload.firstName ?? ""),
    };
  } catch {
    return null;
  }
}

export async function destroyAccountSession() {
  (await cookies()).delete(COOKIE);
}

/**
 * Create the account, or refresh the one that already exists.
 *
 * Someone enquiring twice is the same person, not a duplicate — the second
 * submission updates their details and reissues a token rather than failing on
 * a unique constraint and losing the lead.
 */
export async function upsertAccount(input: {
  email: string; firstName: string; lastName: string;
  phone: string; zip: string; leadId: string;
}) {
  const email = input.email.trim().toLowerCase();
  if (!email) return null;

  const token = newToken();
  const tokenExpiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  const base = {
    firstName: input.firstName, lastName: input.lastName,
    phone: input.phone, zip: input.zip, leadId: input.leadId,
    token, tokenExpiresAt,
  };

  return db.eqAccount
    .upsert({ where: { email }, create: { email, ...base }, update: base })
    .catch(() => null);
}

/** Redeem a magic-link token and sign them in. */
export async function signInWithToken(token: string) {
  if (!token) return null;
  const acct = await db.eqAccount.findUnique({ where: { token } }).catch(() => null);
  if (!acct) return null;
  if (acct.tokenExpiresAt && acct.tokenExpiresAt < new Date()) return null;

  await db.eqAccount
    .update({ where: { id: acct.id }, data: { lastLoginAt: new Date() } })
    .catch(() => null);
  await createAccountSession({ id: acct.id, email: acct.email, firstName: acct.firstName });
  return acct;
}

/** Issue a fresh token for someone asking to be let back in. */
export async function issueMagicToken(email: string) {
  const acct = await db.eqAccount
    .findUnique({ where: { email: email.trim().toLowerCase() } })
    .catch(() => null);
  if (!acct) return null;

  const token = newToken();
  await db.eqAccount.update({
    where: { id: acct.id },
    data: { token, tokenExpiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
  });
  return { account: acct, token };
}
