import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { loadU65Config } from "@/lib/u65-store";
import { isWithinHours } from "@/lib/u65";
import { normalizePhone } from "@/lib/sms";

const BASE = "https://medigap.plus";
const xml = (body: string) =>
  new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    headers: { "Content-Type": "text/xml" },
  });

// No-AI direct line (346) 220-3471 -> straight to the SET number, tracked + billable.
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const from = String(form?.get("From") || "");
  const state = String(form?.get("FromState") || "");
  const cfg = await loadU65Config();

  const open = isWithinHours(cfg, Date.now());
  const afterHours = !open;
  // The direct line has no AI, so "regular flow" can't apply; after hours -> backup if set, else SET.
  const dest = afterHours ? cfg.backupNumber || cfg.setNumber : cfg.setNumber;

  const billable = dest === cfg.setNumber;
  const rec = await db.u65Call.create({
    data: {
      source: "direct_220", fromNumber: from, state, u65: true,
      answer: afterHours ? "direct · after-hours" : "direct", afterHours, forwardedTo: dest,
    },
  }).catch(() => null);

  const num = normalizePhone(dest) || dest;
  const action = rec ? `${BASE}/api/u65/status?u65=${rec.id}${billable ? "" : "&bill=0"}` : "";
  const actionAttr = action ? ` action="${action}"` : "";
  // Pass the caller's own number as caller ID so the buyer sees the real customer, not the direct line.
  const cid = normalizePhone(from) || from;
  const cidAttr = cid ? ` callerId="${cid}"` : "";
  return xml(`<Dial timeout="30"${cidAttr} record="record-from-answer-dual"${actionAttr}><Number>${num}</Number></Dial>`);
}
