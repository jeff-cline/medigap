import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "./db";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-secret-change-in-prod"
);
const COOKIE = "medigap_session";

export type Session = {
  uid: string;
  email: string;
  role: string;
  mustChangePassword: boolean;
  // Set when the God account is impersonating another user ("drill into any account").
  impersonatorUid?: string;
  impersonatorEmail?: string;
};

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function createSession(s: Session) {
  const token = await new SignJWT(s as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(secret);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function login(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return { error: "No account with that email." };
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return { error: "Incorrect password." };
  await createSession({
    uid: user.id,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  });
  return { ok: true, mustChangePassword: user.mustChangePassword, role: user.role };
}

// God can impersonate anyone — "drill into any account"
export const isGod = (s: Session | null) => s?.role === "god";
// True god means actually god and not currently impersonating someone else.
export const isRealGod = (s: Session | null) => s?.role === "god" || !!s?.impersonatorUid;

export async function startImpersonation(targetUserId: string) {
  const session = await getSession();
  if (!session || session.role !== "god") return { error: "Only the God account can impersonate." };
  const target = await db.user.findUnique({ where: { id: targetUserId } });
  if (!target) return { error: "User not found." };
  await createSession({
    uid: target.id, email: target.email, role: target.role, mustChangePassword: false,
    impersonatorUid: session.uid, impersonatorEmail: session.email,
  });
  return { ok: true, role: target.role };
}

export async function stopImpersonation() {
  const session = await getSession();
  if (!session?.impersonatorUid) return { error: "Not impersonating." };
  const god = await db.user.findUnique({ where: { id: session.impersonatorUid } });
  if (!god) return { error: "Original account missing." };
  await createSession({ uid: god.id, email: god.email, role: god.role, mustChangePassword: false });
  return { ok: true };
}
