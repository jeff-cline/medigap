import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "./db";

// Consumer accounts for mammo.express.
//
// Deliberately SEPARATE from the Core's staff/agent User table and its session
// cookie. A woman booking a mammogram is not a platform user, and mixing the
// two would mean a bug in one login surface could expose the other. Different
// table, different cookie, different secret scope.

const COOKIE = "mx_session";
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET as string);

export type MammoSession = { id: string; email: string; firstName: string };

export async function createMammoSession(s: MammoSession) {
  const token = await new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getMammoSession(): Promise<MammoSession | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.id || !payload.email) return null;
    return { id: String(payload.id), email: String(payload.email), firstName: String(payload.firstName ?? "") };
  } catch {
    return null;
  }
}

export async function destroyMammoSession() {
  (await cookies()).delete(COOKIE);
}

export async function registerMammo(input: {
  email: string; password: string; firstName: string; lastName: string;
  phone: string; zip: string; smsOptIn: boolean; smsOptInText: string;
  emailOptIn: boolean; ip: string; outOfArea?: boolean;
}) {
  const email = input.email.trim().toLowerCase();
  const existing = await db.mammoAccount.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists. Try signing in." as const };

  const smsOptIn = Boolean(input.smsOptIn && input.phone.trim());
  const acct = await db.mammoAccount.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(input.password, 12),
      firstName: input.firstName.slice(0, 80),
      lastName: input.lastName.slice(0, 80),
      phone: input.phone.slice(0, 40),
      zip: input.zip.replace(/\D/g, "").slice(0, 5),
      smsOptIn,
      smsOptInAt: smsOptIn ? new Date() : null,
      // The exact wording that was on screen, not a boolean — TCPA consent has
      // to be provable.
      smsOptInText: smsOptIn ? input.smsOptInText : "",
      smsOptInIp: smsOptIn ? input.ip : "",
      emailOptIn: Boolean(input.emailOptIn),
      outOfArea: Boolean(input.outOfArea),
    },
  });
  return { account: acct };
}

export async function loginMammo(email: string, password: string) {
  const acct = await db.mammoAccount.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!acct) return { error: "Invalid email or password." as const };
  if (!(await bcrypt.compare(password, acct.passwordHash))) {
    return { error: "Invalid email or password." as const };
  }
  return { account: acct };
}


// --- manager accounts -------------------------------------------------------
// Managers get their own cookie, separate again from the consumer session.
// Three audiences, three session surfaces: a bug in one cannot expose another.

const MGR_COOKIE = "mx_mgr";

export type ManagerSession = { id: string; email: string; name: string };

export async function createManagerSession(m: ManagerSession) {
  const token = await new SignJWT({ ...m, kind: "manager" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
  (await cookies()).set(MGR_COOKIE, token, {
    httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getManagerSession(): Promise<ManagerSession | null> {
  const token = (await cookies()).get(MGR_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.kind !== "manager" || !payload.id) return null;
    return { id: String(payload.id), email: String(payload.email), name: String(payload.name ?? "") };
  } catch { return null; }
}

export async function destroyManagerSession() {
  (await cookies()).delete(MGR_COOKIE);
}

export async function loginManager(email: string, password: string) {
  const m = await db.mammoManager.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!m || !m.active || !m.passwordHash) return { error: "Invalid email or password." as const };
  if (!(await bcrypt.compare(password, m.passwordHash))) return { error: "Invalid email or password." as const };
  await db.mammoManager.update({ where: { id: m.id }, data: { lastLoginAt: new Date() } }).catch(() => {});
  return { manager: m };
}

export const hashFor = (pw: string) => bcrypt.hash(pw, 12);
