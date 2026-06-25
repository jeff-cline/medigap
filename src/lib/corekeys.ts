import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "./db";

// CORE API key issuance + verification. Partners authenticate with a public key id
// (x-core-key) + a secret (x-core-secret). The secret is only ever shown once, at issuance.

const rnd = (n = 24) => randomBytes(n).toString("base64url");

export async function issueKey(input: { name: string; scopes?: string; ownerId?: string }) {
  const keyId = "core_pk_" + rnd(12);
  const secret = "core_sk_" + rnd(24);
  const row = await db.apiKey.create({
    data: { keyId, secretHash: await bcrypt.hash(secret, 10), name: input.name || "", scopes: input.scopes || "lead:create", ownerId: input.ownerId || "" },
  });
  // secret returned ONCE — never retrievable again.
  return { id: row.id, keyId, secret, scopes: row.scopes };
}

export type VerifiedKey = { id: string; name: string; ownerId: string; scopes: string[] };

// Verify the request's core key/secret headers. Returns the key (with scopes) or null.
export async function verifyCoreKey(req: Request, requiredScope?: string): Promise<VerifiedKey | null> {
  const keyId = req.headers.get("x-core-key") || "";
  const secret = req.headers.get("x-core-secret") || "";
  if (!keyId || !secret) return null;
  const row = await db.apiKey.findUnique({ where: { keyId } });
  if (!row || !row.active || row.revokedAt) return null;
  if (!(await bcrypt.compare(secret, row.secretHash))) return null;
  const scopes = row.scopes.split(",").map((s) => s.trim()).filter(Boolean);
  if (requiredScope && !scopes.includes(requiredScope)) return null;
  await db.apiKey.update({ where: { id: row.id }, data: { lastUsedAt: new Date(), callCount: { increment: 1 } } }).catch(() => {});
  return { id: row.id, name: row.name, ownerId: row.ownerId, scopes };
}
