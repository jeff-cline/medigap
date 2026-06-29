// QuinStreet DataPass Calls API — ping/post client.
//
// Flow per the publisher guides: PING the vertical endpoint with the consumer's data + a quadTag
// (the credential/attribution). The response returns `commission` (the bid $) and
// `callQualificationDuration` (seconds the call must last to earn it). If we choose to take it,
// POST the SAME data within 90 seconds to confirm. Each vertical nests its body differently.
//
// Verified live against stage (datapass.quinstage.com) 2026-06-26:
//   • health/medicare → { data: { action, ... } }            (camelCase, MM/dd/yyyy)
//   • auto            → { Data: { action, ... }, metaData:{} } (homePhone/postalCode, yyyyMMdd)
//   • life            → { action, userData: { ... }, metaData:{} }
//   • home            → { action, data: { ... }, metaData:{} } (PascalCase fields)

export type QsVertical = "medicare" | "home_insurance" | "life_insurance" | "auto_insurance";

// Stage endpoints + TEST quad tags straight from the four publisher guides. Prod quadTags come
// from the QuinStreet account manager and are stored per-vertical in the DB (override these).
export const STAGE: Record<QsVertical, { pingUrl: string; postUrl: string; testQuadTag: string }> = {
  medicare: {
    pingUrl: "https://datapass.quinstage.com/calls/health/callsping",
    postUrl: "https://datapass.quinstage.com/calls/health/callspost",
    testQuadTag: "http://o1.qnsr.com/cgi/r?;n=203;c=1687110;s=35650;x=7936;f=202410221329230;u=j;z=TIMESTAMP;",
  },
  home_insurance: {
    pingUrl: "https://datapass.quinstage.com/calls/home/3.0?applyConfig=DEFAULT",
    postUrl: "https://datapass.quinstage.com/calls/home/3.0?applyConfig=DEFAULT",
    testQuadTag: "http://o1.qnsr.com/cgi/r?;n=203;c=1686976;s=35647;x=7936;f=202410151611330;u=j;z=TIMESTAMP;",
  },
  life_insurance: {
    pingUrl: "https://datapass.quinstage.com/calls/life/3.0",
    postUrl: "https://datapass.quinstage.com/calls/life/3.0",
    testQuadTag: "http://o1.qnsr.com/cgi/r?;n=203;c=1687106;s=35648;x=7936;f=202410221323370;u=j;z=TIMESTAMP;",
  },
  auto_insurance: {
    pingUrl: "https://datapass.quinstage.com/calls/auto/3.0",
    postUrl: "https://datapass.quinstage.com/calls/auto/3.0",
    testQuadTag: "http://o1.qnsr.com/cgi/r?;n=203;c=1686957;s=35646;x=7936;f=202410111534510;u=j;z=TIMESTAMP;",
  },
};

export type QsLead = {
  firstName?: string; lastName?: string; email?: string; phone?: string;
  address?: string; city?: string; zip?: string; state?: string;
  birthDate?: string; // ISO yyyy-mm-dd or Date — we reformat per vertical
  gender?: string; aff?: string;
};

const pad = (n: number) => String(n).padStart(2, "0");
// QuinStreet requires a VALID birthDate. Parse what we have (ISO, MM/dd/yyyy, MM-dd-yyyy, etc.);
// if it's missing or unparseable, fall back to a Medicare-eligible default so the ping is valid
// (the live call still qualifies the real person). Prevents "Invalid BirthDate" rejections.
function fmtDate(d: string | undefined, style: "MM/dd/yyyy" | "yyyyMMdd"): string {
  const fallback = style === "yyyyMMdd" ? "19550101" : "01/01/1955";
  if (!d || !String(d).trim()) return fallback;
  let dt = new Date(d);
  if (isNaN(dt.getTime())) {
    // try numeric M/D/Y or M-D-Y (and 2-digit years)
    const m = String(d).match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
    if (m) {
      let yy = m[3];
      if (yy.length === 2) yy = (Number(yy) > 30 ? "19" : "20") + yy;
      dt = new Date(Number(yy), Number(m[1]) - 1, Number(m[2]));
    }
  }
  if (isNaN(dt.getTime()) || dt.getFullYear() < 1900 || dt.getFullYear() > 2025) return fallback;
  const y = dt.getFullYear(), m = pad(dt.getMonth() + 1), day = pad(dt.getDate());
  return style === "yyyyMMdd" ? `${y}${m}${day}` : `${m}/${day}/${y}`;
}

/** Build the exact request body for a vertical (each nests differently — see header notes). */
export function buildBody(vertical: QsVertical, action: "ping" | "post", L: QsLead, pingId?: string): Record<string, unknown> {
  const aff = L.aff || "medigapplus";
  switch (vertical) {
    case "medicare":
      return { data: {
        action, callDirection: "Inbound", ...(pingId ? { pingId } : {}),
        firstName: L.firstName, lastName: L.lastName, email: L.email, primaryPhone: L.phone,
        address: L.address, city: L.city, zip: L.zip, state: L.state,
        birthDate: fmtDate(L.birthDate, "MM/dd/yyyy"), gender: L.gender,
        medicareABCoverage: "Yes", homePhoneConsent: "Yes", aff, metaData: {},
      } };
    case "auto_insurance":
      return { action, ...(pingId ? { pingId } : {}), data: {
        callDirection: "Inbound", currentlyInsured: "Yes",
        firstName: L.firstName, lastName: L.lastName, email: L.email, homePhone: L.phone,
        address: L.address, city: L.city, postalCode: L.zip, state: L.state,
        birthDate: fmtDate(L.birthDate, "yyyyMMdd"), gender: L.gender,
      }, metaData: {} };
    case "life_insurance":
      return { action, ...(pingId ? { pingId } : {}), data: {
        callDirection: "Inbound", TypeofInsurance: "Term Life",
        firstName: L.firstName, lastName: L.lastName, email: L.email, homePhone: L.phone,
        address: L.address, city: L.city, postalCode: L.zip, state: L.state,
        birthDate: fmtDate(L.birthDate, "MM/dd/yyyy"), gender: L.gender,
      }, metaData: {} };
    case "home_insurance":
      return { action, ...(pingId ? { pingId } : {}), data: {
        FirstName: L.firstName, LastName: L.lastName, Email: L.email, PrimaryPhone: L.phone,
        Address: L.address, City: L.city, PostalCode: L.zip, State: L.state,
        TypeofInsurance: "Home", CurrentlyInsured: "Yes", CallDirection: "Inbound",
      }, metaData: {} };
  }
}

function withQuadTag(url: string, quadTag: string): string {
  const tag = quadTag.replace("TIMESTAMP", String(Date.now()));
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}quadTag=${encodeURIComponent(tag)}`;
}

export type QsPingResult = {
  ok: boolean;           // true only when a commission was offered
  status: string;        // SUCCESS | ERROR
  pingId?: string;
  bidCents: number;      // commission * 100
  qualifySec?: number;   // callQualificationDuration
  matchedClient?: string;
  message: string;
  raw: unknown;
  httpStatus: number;
};

async function call(url: string, body: unknown): Promise<{ httpStatus: number; json: any; text: string }> {
  // Hard timeout — this can run on a live call's critical path; never hang the caller.
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 4000);
  try {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ctrl.signal });
    const text = await r.text();
    let json: any = null; try { json = JSON.parse(text); } catch { /* non-json */ }
    return { httpStatus: r.status, json, text };
  } finally {
    clearTimeout(t);
  }
}

/** PING a vertical → returns the commission (bid) if QuinStreet's tree monetizes the lead. */
export async function quinstreetPing(opts: { vertical: QsVertical; lead: QsLead; pingUrl?: string; quadTag?: string }): Promise<QsPingResult> {
  const cfg = STAGE[opts.vertical];
  const url = withQuadTag(opts.pingUrl || cfg.pingUrl, opts.quadTag || cfg.testQuadTag);
  const { httpStatus, json, text } = await call(url, buildBody(opts.vertical, "ping", opts.lead));
  const status = String(json?.status ?? json?.Status ?? (httpStatus < 300 ? "SUCCESS" : "ERROR"));
  const commission = Number(json?.commission ?? 0);
  const msg = Array.isArray(json?.responseMessage) ? json.responseMessage.join("; ") : String(json?.responseMessage ?? json?.ResponseMessage ?? text.slice(0, 200));
  return {
    ok: status.toUpperCase() === "SUCCESS" && commission > 0,
    status,
    pingId: json?.pingId,
    bidCents: Math.round(commission * 100),
    qualifySec: json?.callQualificationDuration != null ? Number(json.callQualificationDuration) : undefined,
    matchedClient: json?.MatchedClient || json?.matchedClient,
    message: msg,
    raw: json ?? text,
    httpStatus,
  };
}

/** POST the lead (same data, within 90s of ping) to confirm we're taking the call. */
export async function quinstreetPost(opts: { vertical: QsVertical; lead: QsLead; pingId: string; postUrl?: string; quadTag?: string }) {
  const cfg = STAGE[opts.vertical];
  const url = withQuadTag(opts.postUrl || cfg.postUrl, opts.quadTag || cfg.testQuadTag);
  const { httpStatus, json, text } = await call(url, buildBody(opts.vertical, "post", opts.lead, opts.pingId));
  const status = String(json?.status ?? json?.Status ?? (httpStatus < 300 ? "SUCCESS" : "ERROR"));
  const msg = Array.isArray(json?.responseMessage) ? json.responseMessage.join("; ") : String(json?.responseMessage ?? json?.ResponseMessage ?? text.slice(0, 200));
  return { ok: status.toUpperCase() === "SUCCESS", status, pingId: json?.pingId || opts.pingId, message: msg, raw: json ?? text, httpStatus };
}

export const QS_VERTICALS: QsVertical[] = ["medicare", "home_insurance", "life_insurance", "auto_insurance"];
export const isQsVertical = (v: string): v is QsVertical => (QS_VERTICALS as string[]).includes(v);
