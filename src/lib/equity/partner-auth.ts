import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@/lib/db";

// Partner sessions for equity.direct.
//
// Separate from the Core's staff User table and from any consumer session, for
// the same reason mammo.express keeps its own: a referral partner is not a
// platform user, and one login surface should never be able to expose another.
// Different table, different cookie, different scope.

const COOKIE = "eq_partner";
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET as string);

export type PartnerSession = { id: string; email: string; name: string };

export async function createPartnerSession(s: PartnerSession) {
  const token = await new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getPartnerSession(): Promise<PartnerSession | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.id || !payload.email) return null;
    return {
      id: String(payload.id),
      email: String(payload.email),
      name: String(payload.name ?? ""),
    };
  } catch {
    return null;
  }
}

export async function destroyPartnerSession() {
  (await cookies()).delete(COOKIE);
}

/** Short, unambiguous partner code. No look-alike characters. */
export function partnerCode(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += alphabet[crypto.randomInt(0, alphabet.length)];
  }
  return out;
}

/**
 * Add a partner and mint an invite.
 *
 * The partner row is created immediately with no password, so they exist in
 * reporting from the moment they are added. The invite is what lets them set
 * their own password — we never generate one and email it in clear text.
 */
export async function invitePartner(input: {
  email: string; name?: string; company?: string; phone?: string; vertical?: string;
}) {
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false as const, error: "That email address does not look right." };
  }

  let partner = await db.eqPartner.findUnique({ where: { email } });
  if (!partner) {
    // Retry on the rare code collision; the unique index is the real guarantee.
    let code = partnerCode();
    for (let i = 0; i < 5; i++) {
      const taken = await db.eqPartner.findUnique({ where: { code }, select: { id: true } });
      if (!taken) break;
      code = partnerCode();
    }
    partner = await db.eqPartner.create({
      data: {
        email,
        name: (input.name ?? "").trim().slice(0, 120),
        company: (input.company ?? "").trim().slice(0, 160),
        phone: (input.phone ?? "").trim().slice(0, 40),
        vertical: (input.vertical ?? "").trim().slice(0, 60),
        code,
      },
    });
  }

  const token = crypto.randomBytes(32).toString("base64url");
  await db.eqInvite.create({
    data: {
      token,
      email,
      name: partner.name,
      partnerId: partner.id,
      // Long enough to survive a weekend and a spam folder, short enough that a
      // forwarded link does not stay live indefinitely.
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  return { ok: true as const, partner, token };
}

/** Redeem an invite and set the password. One use only. */
export async function acceptInvite(token: string, password: string) {
  if (password.length < 12) {
    return { ok: false as const, error: "Choose a password of at least 12 characters." };
  }
  const invite = await db.eqInvite.findUnique({ where: { token } });
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return { ok: false as const, error: "That invitation has expired or has already been used." };
  }
  const partner = await db.eqPartner.findUnique({ where: { id: invite.partnerId } });
  if (!partner) return { ok: false as const, error: "That invitation is no longer valid." };

  await db.eqPartner.update({
    where: { id: partner.id },
    data: { passwordHash: await bcrypt.hash(password, 10), active: true },
  });
  await db.eqInvite.update({ where: { id: invite.id }, data: { usedAt: new Date() } });

  return { ok: true as const, partner };
}

export async function verifyPartner(email: string, password: string) {
  const p = await db.eqPartner.findUnique({ where: { email: email.trim().toLowerCase() } });
  // Same message whichever check fails, so the form cannot be used to discover
  // which addresses are registered.
  const no = { ok: false as const, error: "Those details do not match an active account." };
  if (!p || !p.active || !p.passwordHash) return no;
  if (!(await bcrypt.compare(password, p.passwordHash))) return no;

  await db.eqPartner.update({ where: { id: p.id }, data: { lastLoginAt: new Date() } });
  return { ok: true as const, partner: p };
}
