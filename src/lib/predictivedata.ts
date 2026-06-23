import { db } from "./db";

// PredictiveData.org append (white-label). Upstream provider host kept server-side only.
const HOST = "https://app.retargetiq.com/api/v2";

export async function getPDConfig(): Promise<{ apiKey: string; website: string } | null> {
  const row = await db.integration.findUnique({ where: { key: "predictivedata" } });
  if (!row) return null;
  try { const c = JSON.parse(row.config); if (c.apiKey) return { apiKey: c.apiKey, website: c.website || "" }; } catch {}
  return null;
}

type Identity = Record<string, unknown> & {
  firstName?: string; lastName?: string; age?: number | string; birthDate?: string; gender?: string; maritalStatus?: string;
  address?: { street?: string; city?: string; state?: string; zip?: string };
  city?: string; state?: string; zip?: string;
  emails?: { email?: string }[] | string[]; phones?: unknown[];
  householdIncome?: string; creditRange?: string; investmentStatus?: string;
  interests?: unknown;
};

async function lookup(path: string, body: Record<string, string>): Promise<Identity | null> {
  const cfg = await getPDConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(`${HOST}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: cfg.apiKey, website: cfg.website, ...body }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    if (!data || data.success === false) return null;
    const identities = data?.data?.identities;
    return Array.isArray(identities) && identities.length ? (identities[0] as Identity) : null;
  } catch { return null; }
}

export async function lookupByPhone(phone: string) {
  const d = phone.replace(/\D/g, "").slice(-10);
  return d ? lookup("GetDataByPhone", { phone: d }) : null;
}
export async function lookupByEmail(email: string) {
  return email ? lookup("GetDataByEmail", { email }) : null;
}

// Pull every email out of the upstream identity (it may be string[] or {email}[]).
function extractEmails(emails: Identity["emails"]): string[] {
  if (!Array.isArray(emails)) return [];
  const seen = new Set<string>();
  for (const e of emails) {
    const v = (typeof e === "string" ? e : (e as { email?: string })?.email)?.trim();
    if (v) seen.add(v);
  }
  return [...seen];
}
// Pull every phone number out of the upstream identity (string | number | {phone|number|value}).
function extractPhones(phones: unknown): string[] {
  if (!Array.isArray(phones)) return [];
  const seen = new Set<string>();
  for (const p of phones) {
    let v = "";
    if (typeof p === "string" || typeof p === "number") v = String(p);
    else if (p && typeof p === "object") { const o = p as Record<string, unknown>; v = String(o.phone ?? o.number ?? o.value ?? ""); }
    v = v.trim();
    if (v) seen.add(v);
  }
  return [...seen];
}

// Flatten the upstream identity into a tidy append object for the CRM.
// We keep ALL data we can (every email + every phone) — staff want maximum visibility.
function curate(id: Identity): Record<string, string> {
  const addr = id.address || {};
  const emails = extractEmails(id.emails);
  const phones = extractPhones(id.phones);
  const out: Record<string, string> = {};
  const put = (k: string, v: unknown) => { if (v !== undefined && v !== null && String(v).trim()) out[k] = String(v); };
  put("name", [id.firstName, id.lastName].filter(Boolean).join(" "));
  put("age", id.age);
  put("birthDate", id.birthDate);
  put("gender", id.gender);
  put("maritalStatus", id.maritalStatus);
  put("street", addr.street);
  put("city", addr.city || id.city);
  put("state", addr.state || id.state);
  put("zip", addr.zip || id.zip);
  put("householdIncome", id.householdIncome);
  put("creditRange", id.creditRange);
  put("investmentStatus", id.investmentStatus);
  put("email", emails[0]);                                   // primary appended email
  if (emails.length > 1) put("emails", emails.join(", "));   // all other emails on file
  if (phones.length) put("phones", phones.join(", "));       // every phone number on file
  if (id.phones) put("phonesOnFile", Array.isArray(id.phones) ? String(id.phones.length) : String(id.phones));
  return out;
}

// Enrich a lead: look up by phone (then email), fill EMPTY lead fields, store the append.
export async function appendLead(leadId: string): Promise<{ ok: boolean; matched: boolean }> {
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return { ok: false, matched: false };
  const id = (lead.phone && (await lookupByPhone(lead.phone))) || (lead.email && (await lookupByEmail(lead.email))) || null;
  if (!id) {
    const prev = safeJson(lead.appended);
    await db.lead.update({ where: { id: leadId }, data: { appended: JSON.stringify({ ...prev, appendStatus: "no match", appendedAt: new Date().toISOString() }) } }).catch(() => {});
    return { ok: true, matched: false };
  }
  const c = curate(id);
  const prev = safeJson(lead.appended);
  const fill: Record<string, unknown> = {};
  const empty = (v: string) => !v || v === "Inbound caller";
  if (empty(lead.name) && c.name) fill.name = c.name;
  if (!lead.email && c.email) fill.email = c.email;
  if (!lead.dob && c.birthDate) fill.dob = c.birthDate;
  if (!lead.city && c.city) fill.city = c.city;
  if (!lead.state && c.state) fill.state = c.state;
  if (!lead.zip && c.zip) fill.zip = c.zip;
  fill.appended = JSON.stringify({ ...prev, ...c, appendStatus: "matched", appendedAt: new Date().toISOString() });
  await db.lead.update({ where: { id: leadId }, data: fill }).catch(() => {});
  return { ok: true, matched: true };
}

function safeJson(s: string): Record<string, unknown> { try { const v = JSON.parse(s || "{}"); return v && typeof v === "object" ? v : {}; } catch { return {}; } }

// Fire-and-forget on a long-running Node server (does not block the caller / TwiML response).
export function appendLeadBackground(leadId: string) {
  appendLead(leadId).catch(() => {});
}
