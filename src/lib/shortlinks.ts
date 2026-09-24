import { db } from "@/lib/db";
import crypto from "crypto";

// Lightweight URL shortener for el.ag/short. Stores everything in the existing
// key-value Setting table (no schema change): the keyword→URL map under one key,
// and the admin password hash under another.

const LINKS_KEY = "short:links";
const PW_KEY = "short:password";
const DEFAULT_PW = "TEMP1234!";
const SALT = "elag-short-v1";

export type LinkMap = Record<string, string>;

// Keywords that must never be turned into redirects — structural routes and the
// paths el.ag reserves in middleware (they never reach the [slug] route anyway).
export const RESERVED = new Set([
  "short", "directory", "search", "answers", "sitemap.xml", "robots.txt",
  "llms.txt", "api", "login", "change-password", "dashboard", "unified",
  "partner", "agent", "advertiser", "investor", "vos", "ads.txt", "favicon",
  "favicon.ico", "_next",
]);

export function normKeyword(k: string): string {
  return (k || "").trim().toLowerCase().replace(/^\/+|\/+$/g, "");
}

export async function getLinks(): Promise<LinkMap> {
  const row = await db.setting.findUnique({ where: { key: LINKS_KEY } }).catch(() => null);
  if (!row?.value) return {};
  try {
    const parsed = JSON.parse(row.value);
    return parsed && typeof parsed === "object" ? (parsed as LinkMap) : {};
  } catch {
    return {};
  }
}

/** Resolve a keyword to its destination URL (or null). Used by the redirect route. */
export async function shortLinkFor(slug: string): Promise<string | null> {
  const key = normKeyword(slug);
  if (!key) return null;
  const links = await getLinks();
  return links[key] || null;
}

async function saveLinks(links: LinkMap): Promise<void> {
  const value = JSON.stringify(links);
  await db.setting.upsert({
    where: { key: LINKS_KEY },
    update: { value },
    create: { key: LINKS_KEY, value },
  });
}

/** Returns an error string, or null on success. */
export async function setLink(keyword: string, url: string): Promise<string | null> {
  const key = normKeyword(keyword);
  const dest = (url || "").trim();
  if (!key) return "Keyword is required.";
  if (RESERVED.has(key)) return `"${key}" is reserved and can't be used.`;
  if (!/^[a-z0-9][a-z0-9-]*$/.test(key)) return "Keyword may only contain lowercase letters, numbers and dashes.";
  if (!/^https?:\/\/.+/i.test(dest)) return "Destination must be a full URL starting with http:// or https://.";
  const links = await getLinks();
  links[key] = dest;
  await saveLinks(links);
  return null;
}

export async function removeLink(keyword: string): Promise<void> {
  const key = normKeyword(keyword);
  const links = await getLinks();
  if (key in links) {
    delete links[key];
    await saveLinks(links);
  }
  // reset the click counter so a recreated keyword starts fresh
  await db.counter.delete({ where: { name: clickName(key) } }).catch(() => {});
}

// ---- Click tracking (atomic, via the generic Counter table) ----
function clickName(key: string): string {
  return `short:click:${key}`;
}

/** Increment the click counter for a keyword (called from the redirect route). */
export async function incrementClick(keyword: string): Promise<void> {
  const name = clickName(normKeyword(keyword));
  await db.counter.upsert({
    where: { name },
    update: { value: { increment: 1 } },
    create: { name, value: 1 },
  });
}

/** Map of keyword → click count. */
export async function getClicks(): Promise<Record<string, number>> {
  const rows = await db.counter.findMany({ where: { name: { startsWith: "short:click:" } } }).catch(() => []);
  const out: Record<string, number> = {};
  for (const r of rows) out[r.name.slice("short:click:".length)] = r.value;
  return out;
}

function hashPw(pw: string): string {
  return crypto.createHash("sha256").update(SALT + pw).digest("hex");
}

export async function currentPasswordHash(): Promise<string> {
  const row = await db.setting.findUnique({ where: { key: PW_KEY } }).catch(() => null);
  return row?.value || hashPw(DEFAULT_PW); // default password until changed
}

export async function checkPassword(pw: string): Promise<boolean> {
  return hashPw(pw || "") === (await currentPasswordHash());
}

export async function setPassword(pw: string): Promise<string | null> {
  if (!pw || pw.length < 4) return "Password must be at least 4 characters.";
  const value = hashPw(pw);
  await db.setting.upsert({
    where: { key: PW_KEY },
    update: { value },
    create: { key: PW_KEY, value },
  });
  return null;
}

// ---- API key (for the REST API at /api/short) ----
const APIKEY_KEY = "short:apikey";

function newKey(): string {
  return "sk_short_" + crypto.randomBytes(24).toString("hex");
}

export async function getApiKey(): Promise<string | null> {
  const row = await db.setting.findUnique({ where: { key: APIKEY_KEY } }).catch(() => null);
  return row?.value || null;
}

/** Return the API key, creating one on first use. */
export async function ensureApiKey(): Promise<string> {
  const existing = await getApiKey();
  if (existing) return existing;
  const key = newKey();
  await db.setting.upsert({ where: { key: APIKEY_KEY }, update: { value: key }, create: { key: APIKEY_KEY, value: key } });
  return key;
}

export async function regenerateApiKey(): Promise<string> {
  const key = newKey();
  await db.setting.upsert({ where: { key: APIKEY_KEY }, update: { value: key }, create: { key: APIKEY_KEY, value: key } });
  return key;
}

export async function checkApiKey(provided: string | null | undefined): Promise<boolean> {
  const k = await getApiKey();
  return !!k && !!provided && provided === k;
}

// Auth cookie token: HMAC of the current password hash under a per-install secret,
// so the cookie is NOT a publicly-computable constant and rotates when the password changes.
async function cookieSecret(): Promise<string> {
  const row = await db.setting.findUnique({ where: { key: "short:cookiesecret" } }).catch(() => null);
  if (row?.value) return row.value;
  const value = crypto.randomBytes(32).toString("hex");
  await db.setting.upsert({ where: { key: "short:cookiesecret" }, update: { value }, create: { key: "short:cookiesecret", value } });
  return value;
}
export async function sessionToken(): Promise<string> {
  return crypto.createHmac("sha256", await cookieSecret()).update(await currentPasswordHash()).digest("hex");
}
