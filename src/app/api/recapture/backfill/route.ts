import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { normalizePhone } from "@/lib/sms";

export const maxDuration = 300;

// Pull EVERY inbound call Twilio has on record for this account — as far back as the
// account goes — and persist each as a Call (+ a Lead by phone) so we have the full
// missed-call dataset to recapture. Idempotent: dedupes by Twilio CallSid.
//
// Captured per call: timestamp (start), duration, cost, status, from number + geo.
// Inbound calls that never connected to a buyer are marked "missed".

type TwilioCall = {
  sid: string; from: string; to: string; direction: string;
  start_time: string | null; date_created: string | null; end_time: string | null;
  duration: string | null; price: string | null; status: string;
  from_city?: string; from_state?: string; from_zip?: string;
};

const CONNECTED = new Set(["completed", "in-progress", "answered"]);

export async function POST(req: NextRequest) {
  const s = await getSession();
  const isGod = s?.role === "god" || !!s?.impersonatorUid;
  if (!s || !isGod) return NextResponse.json({ error: "God only" }, { status: 403 });

  const row = await db.integration.findUnique({ where: { key: "twilio" } });
  let cfg: Record<string, string> = {};
  try { cfg = row ? JSON.parse(row.config) : {}; } catch {}
  if (!cfg.accountSid || !cfg.authToken) {
    return NextResponse.json({ ok: false, error: "Connect Twilio on the Integrations page first." }, { status: 200 });
  }
  const auth = "Basic " + Buffer.from(`${cfg.accountSid}:${cfg.authToken}`).toString("base64");

  const body = await req.json().catch(() => ({}));
  const tag = typeof body.tag === "string" && body.tag.trim() ? String(body.tag).trim() : "";
  const maxPages = Math.min(200, Number(body.maxPages) > 0 ? Number(body.maxPages) : 200); // safety cap (~200k calls)

  let next: string | null = `/2010-04-01/Accounts/${cfg.accountSid}/Calls.json?PageSize=1000`;
  let pages = 0, scanned = 0, inbound = 0, createdCalls = 0, createdLeads = 0, missed = 0;
  let totalCostCents = 0;

  while (next && pages < maxPages) {
    const r: Response = await fetch(`https://api.twilio.com${next}`, {
      headers: { Authorization: auth }, cache: "no-store", signal: AbortSignal.timeout(20000),
    });
    if (!r.ok) {
      if (pages === 0) return NextResponse.json({ ok: false, error: `Twilio rejected the request (HTTP ${r.status}).` }, { status: 200 });
      break;
    }
    const d = await r.json();
    const calls: TwilioCall[] = d.calls || [];
    pages++;
    for (const c of calls) {
      scanned++;
      if (c.direction && !c.direction.toLowerCase().startsWith("inbound")) continue;
      inbound++;

      const fromRaw = c.from || "";
      const last10 = (normalizePhone(fromRaw) || fromRaw).replace(/\D/g, "").slice(-10);
      const costCents = c.price ? Math.round(Math.abs(parseFloat(c.price)) * 100) : 0;
      totalCostCents += costCents;
      const durationSec = c.duration ? parseInt(c.duration, 10) || 0 : 0;
      const when = c.start_time || c.date_created;
      const createdAt = when ? new Date(when) : undefined;
      const connected = CONNECTED.has((c.status || "").toLowerCase()) && durationSec >= 20;
      const status = connected ? "completed" : "missed";
      if (!connected) missed++;

      // Dedupe by CallSid.
      const existing = c.sid ? await db.call.findFirst({ where: { providerSid: c.sid }, select: { id: true } }) : null;
      if (existing) continue;

      // Find or create the lead for this number.
      let lead = last10 ? await db.lead.findFirst({ where: { phone: { contains: last10 } } }) : null;
      if (!lead && fromRaw) {
        lead = await db.lead.create({
          data: {
            phone: normalizePhone(fromRaw) || fromRaw, name: "Inbound caller", source: "house", vertical: "medicare",
            state: c.from_state || "", zip: c.from_zip || "", city: c.from_city || "",
            recaptureStage: "missed",
            ...(tag ? { tags: JSON.stringify([tag]) } : {}),
            ...(createdAt ? { createdAt } : {}),
          },
        });
        createdLeads++;
      } else if (lead && lead.recaptureStage === "") {
        await db.lead.update({ where: { id: lead.id }, data: { recaptureStage: "missed" } }).catch(() => {});
      }

      await db.call.create({
        data: {
          leadId: lead?.id, fromNumber: fromRaw, toNumber: c.to || "",
          zip: c.from_zip || "", state: c.from_state || "",
          durationSec, costCents, direction: "inbound", status, source: "house",
          providerSid: c.sid || "",
          ...(createdAt ? { createdAt } : {}),
        },
      });
      createdCalls++;
    }
    next = d.next_page_uri || null;
  }

  return NextResponse.json({
    ok: true, pages, scanned, inbound, createdCalls, createdLeads, missed,
    twilioCostCents: totalCostCents, reachedCap: pages >= maxPages && !!next,
  });
}
