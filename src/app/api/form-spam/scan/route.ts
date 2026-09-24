import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { readReviewInbox } from "@/lib/spam-inbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// ---------------------------------------------------------------------------
// Scans the spam-review inbox on a schedule.
//
// The founder forwards spam that got through to jane@securityup.co. Until now
// nothing read it unless someone opened /dashboard/form-spam, so the forwards
// piled up unprocessed. This route does the reading: it works out which host
// each forward came through, checks whether that host is even registered for
// reCAPTCHA, and reports what it found.
//
//   GET  ?key=<AUTH_SECRET>   server cron
//   POST                      god-only "scan now"
//
// State lives in Setting (a KV table that already exists) rather than a new
// model, so this needs no migration against a live database.
// ---------------------------------------------------------------------------

const SEEN_KEY = "formSpam.lastUid";
const REPORT_KEY = "formSpam.lastScan";
const NOTIFY = process.env.PLUS_NOTIFY_TO || "jeff.cline@me.com";
const FORWARDER = "jeff.cline@me.com";

type Finding = {
  host: string;
  hits: number;
  recaptchaRegistered: boolean;
  guardSeen: boolean; // have we ever logged a guard verdict for this host?
};

type Report = {
  at: string;
  address: string;
  scanned: number;
  newForwards: number;
  findings: Finding[];
  unregistered: string[];
  noGuardEvidence: string[];
};

async function setting(key: string): Promise<string> {
  const r = await db.setting.findUnique({ where: { key } }).catch(() => null);
  return r?.value ?? "";
}
async function putSetting(key: string, value: string) {
  await db.setting
    .upsert({ where: { key }, update: { value }, create: { key, value } })
    .catch(() => null);
}

/** Hosts registered for reCAPTCHA, from the integration config. */
async function allowedHosts(): Promise<string[]> {
  const row = await db.integration.findUnique({ where: { key: "recaptcha" } }).catch(() => null);
  let cfg: Record<string, unknown> = {};
  try { cfg = JSON.parse(row?.config || "{}"); } catch { /* empty config */ }
  return String(cfg.allowedHosts || "")
    .split(/[,\s]+/).map((h) => h.trim().toLowerCase()).filter(Boolean);
}

/** Every host we serve, so we can tell our own domains from the spammer's links. */
async function ourHosts(): Promise<string[]> {
  const sites = await db.site.findMany({ select: { hostname: true } }).catch(() => []);
  const fromSites = sites.map((s) => s.hostname.toLowerCase());
  return [...new Set([...fromSites, ...(await allowedHosts())])];
}

/** Pull candidate hostnames out of a forwarded message. */
function hostsIn(text: string, known: string[]): string[] {
  const found = new Set<string>();
  // Explicit URLs first — the strongest signal of where the form lives.
  for (const m of text.matchAll(/https?:\/\/([a-z0-9.-]+\.[a-z]{2,})/gi)) {
    found.add(m[1].toLowerCase().replace(/^www\./, ""));
  }
  // Then bare mentions of hosts we own, which notification emails often carry.
  const hay = text.toLowerCase();
  for (const h of known) if (hay.includes(h)) found.add(h.replace(/^www\./, ""));
  return [...found];
}

async function scan() {
  const inbox = await readReviewInbox(50);
  if (!inbox.ok) {
    return { ok: false, error: inbox.error || "inbox unreachable", address: inbox.address };
  }

  const lastUid = Number(await setting(SEEN_KEY)) || 0;
  const forwards = inbox.messages.filter(
    (m) => m.from === FORWARDER && m.uid > lastUid,
  );

  const known = await ourHosts();
  const allowed = new Set(await allowedHosts());
  const tally = new Map<string, number>();

  for (const m of forwards) {
    for (const h of hostsIn(`${m.subject}\n${m.body}`, known)) {
      // Ignore link-shorteners and Google's own footers — they are noise, not forms.
      if (/^(google|gstatic|googleapis|schema\.org|w3\.org)\./.test(h)) continue;
      tally.set(h, (tally.get(h) || 0) + 1);
    }
  }

  // A host we serve is interesting; a random spammer domain is not.
  const mine = [...tally.entries()].filter(([h]) => known.some((k) => k === h || k.endsWith("." + h) || h.endsWith("." + k)));

  const findings: Finding[] = [];
  for (const [host, hits] of mine.sort((a, b) => b[1] - a[1])) {
    const guardSeen = (await db.spamBlock.count({ where: { host } }).catch(() => 0)) > 0;
    findings.push({ host, hits, recaptchaRegistered: allowed.has(host), guardSeen });
  }

  const maxUid = forwards.reduce((n, m) => Math.max(n, m.uid), lastUid);
  if (maxUid > lastUid) await putSetting(SEEN_KEY, String(maxUid));

  const report: Report = {
    at: new Date().toISOString(),
    address: inbox.address,
    scanned: inbox.messages.length,
    newForwards: forwards.length,
    findings,
    unregistered: findings.filter((f) => !f.recaptchaRegistered).map((f) => f.host),
    noGuardEvidence: findings.filter((f) => !f.guardSeen).map((f) => f.host),
  };
  await putSetting(REPORT_KEY, JSON.stringify(report));

  if (forwards.length) await notify(report);
  return { ok: true, ...report };
}

async function notify(r: Report) {
  const rows = r.findings
    .map((f) => `<tr>
        <td style="padding:6px 12px 6px 0;font-weight:600">${esc(f.host)}</td>
        <td style="padding:6px 12px 6px 0">${f.hits}</td>
        <td style="padding:6px 12px 6px 0;color:${f.recaptchaRegistered ? "#0a7" : "#c33"}">${f.recaptchaRegistered ? "registered" : "NOT registered"}</td>
        <td style="padding:6px 0;color:${f.guardSeen ? "#0a7" : "#c33"}">${f.guardSeen ? "guard active" : "no guard seen"}</td>
      </tr>`)
    .join("");

  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#0b0e14;padding:24px">
    <div style="max-width:620px;margin:0 auto;background:#fff;border-radius:14px;padding:22px 24px">
      <h2 style="margin:0 0 4px">Form-spam scan</h2>
      <p style="margin:0 0 16px;color:#667">${r.newForwards} new forward(s) from ${esc(r.address)}</p>
      ${rows ? `<table style="border-collapse:collapse;font-size:14px"><tr style="color:#889;font-size:12px;text-transform:uppercase">
        <td style="padding-right:12px">Host</td><td style="padding-right:12px">Hits</td><td style="padding-right:12px">reCAPTCHA</td><td>Guard</td></tr>${rows}</table>`
        : `<p style="color:#667">No host could be identified in these forwards — open /dashboard/form-spam to read them.</p>`}
    </div></body></html>`;

  const sent = await sendEmail(NOTIFY, `[Form spam] ${r.newForwards} new forward(s) reviewed`, html, "google_workspace")
    .catch(() => ({ ok: false as const, error: "send threw" }));
  if (!sent.ok) console.error("form-spam scan: notification failed —", sent.error);
}

function esc(s: string) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") || "";
  if (!process.env.AUTH_SECRET || key !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await scan());
}

export async function POST() {
  const s = await getSession();
  if (!s || s.role !== "god") return NextResponse.json({ error: "God only" }, { status: 403 });
  return NextResponse.json(await scan());
}
