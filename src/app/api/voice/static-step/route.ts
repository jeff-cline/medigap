import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { esc, getVoiceAgent } from "@/lib/voice";
import { normalizePhone } from "@/lib/sms";
import { getSettings } from "@/lib/logic";
import { buildTree } from "@/lib/static/tree";
import { listNodes, toFlat } from "@/lib/static/store";
import { pickBuyerFor, pickBackupNumber, captureCallback } from "@/lib/static/routing";
import { hasActiveBuyers } from "@/lib/static/buyers";
import { buildMenuPrompt, matchSelection, normalizeState, type MenuNode } from "@/lib/static/voice";
import { getHealthFallbackNumber } from "@/lib/static/settings";
import { verifyTwilioRequest } from "@/lib/twilio-verify";

const BASE = "https://medigap.plus";
function xml(body: string) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, { headers: { "Content-Type": "text/xml" } });
}
const step = (phase: string, callId: string, extra = "") => esc(`${BASE}/api/voice/static-step?callId=${callId}&phase=${phase}${extra}`);
function gather(action: string, voice: string, line: string) {
  return `<Gather input="speech dtmf" numDigits="1" speechTimeout="auto" action="${action}" method="POST"><Say voice="${voice}">${esc(line)}</Say></Gather><Redirect method="POST">${action}</Redirect>`;
}

// Top-level menu nodes (enabled top-level, in order) as {id,word}.
async function topMenu(): Promise<MenuNode[]> {
  const tree = buildTree(toFlat(await listNodes()));
  return tree.filter((n) => n.active).map((n) => ({ id: n.id, word: n.word }));
}
async function childMenu(parentId: string): Promise<MenuNode[]> {
  const tree = buildTree(toFlat(await listNodes()));
  const find = (nodes: any[]): any => nodes.reduce((acc, n) => acc || (n.id === parentId ? n : find(n.children)), null);
  const p = find(tree);
  return (p?.children ?? []).filter((n: any) => n.active).map((n: any) => ({ id: n.id, word: n.word }));
}
async function nodeById(id: string) {
  return db.staticMoneyWord.findUnique({ where: { id } });
}

async function logTurn(callId: string, role: "bot" | "caller", text: string) {
  if (!text) return;
  try {
    const c = await db.call.findUnique({ where: { id: callId }, select: { transcript: true } });
    let arr: { role: string; text: string }[] = [];
    try { arr = JSON.parse(c?.transcript || "[]"); } catch { arr = []; }
    arr.push({ role, text });
    await db.call.update({ where: { id: callId }, data: { transcript: JSON.stringify(arr) } }).catch(() => {});
  } catch { /* transcript logging must never break the call */ }
}

export async function staticGreeting(callId: string): Promise<string> {
  const agent = await getVoiceAgent();
  const line = "Thanks for calling. In order to serve you better, please tell me your age.";
  await logTurn(callId, "bot", line);
  return gather(step("age", callId), agent.voice, line);
}

// Build the buyer transfer (caller-ID passthrough), with backup on no-answer via the status action.
async function transfer(callId: string, number: string, voice: string, buyerId: string, amountCents: number, billSec: number): Promise<string> {
  const call = await db.call.findUnique({ where: { id: callId } });
  const s = await getSettings();
  const dest = normalizePhone(number) || number;
  const callerId = normalizePhone(call?.fromNumber || "") || s.raw["tollFreeCallerId"] || "+18006334427";
  await db.call.update({ where: { id: callId }, data: { forwardedTo: dest, status: "transferring", disposition: "static", priceCents: 0, realized: false } }).catch(() => {});
  const action = step("backup", callId, `&buyer=${buyerId}&amt=${amountCents}&bill=${billSec}`);
  return `<Dial timeout="25" callerId="${callerId}" record="record-from-answer-dual" action="${action}"><Number>${dest}</Number></Dial>`;
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const callId = url.searchParams.get("callId") || "";
  const phase = url.searchParams.get("phase") || "age";
  const form = await req.formData().catch(() => null);
  const params: Record<string, string> = {};
  if (form) for (const [k, v] of form.entries()) params[k] = String(v);
  if (!(await verifyTwilioRequest(req, params))) {
    return new Response("forbidden", { status: 403 });
  }
  const speech = String(form?.get("SpeechResult") || "").trim();
  const digit = String(form?.get("Digits") || "").trim();
  const dialStatus = String(form?.get("DialCallStatus") || "");

  const call = await db.call.findUnique({ where: { id: callId } });
  const agent = await getVoiceAgent();
  if (!call) return xml(`<Say voice="alice">Sorry, something went wrong. Goodbye.</Say><Hangup/>`);
  const voice = agent.voice;
  if (speech) await logTurn(callId, "caller", speech);

  // ---- backup: primary dial didn't connect → try the buyer's backup number once ----
  if (phase === "backup") {
    const buyerId = url.searchParams.get("buyer") || "";
    const isRetry = url.searchParams.get("retry") === "1";
    const amt = parseInt(url.searchParams.get("amt") || "0", 10) || 0;
    const billSec = parseInt(url.searchParams.get("bill") || "0", 10) || 0;
    const dialDur = parseInt(String(form?.get("DialCallDuration") || "0"), 10) || 0;
    if (dialStatus === "completed") {
      const billed = billSec > 0 && dialDur >= billSec;
      await db.call.update({ where: { id: callId }, data: { connectSec: dialDur, ...(billed ? { priceCents: amt, realized: true } : {}) } }).catch(() => {});
      return xml(`<Hangup/>`);
    }
    // not completed → record whatever connect time (0) then try backup number once (never on a retry)
    if (dialDur > 0) await db.call.update({ where: { id: callId }, data: { connectSec: dialDur } }).catch(() => {});
    const backup = isRetry ? "" : await pickBackupNumber(buyerId);
    if (backup) {
      const call2 = await db.call.findUnique({ where: { id: callId } });
      const s = await getSettings();
      const callerId = normalizePhone(call2?.fromNumber || "") || s.raw["tollFreeCallerId"] || "+18006334427";
      const dest = normalizePhone(backup) || backup;
      const action = step("backup", callId, `&buyer=${buyerId}&amt=${amt}&bill=${billSec}&retry=1`);
      return xml(`<Dial timeout="25" callerId="${callerId}" record="record-from-answer-dual" action="${action}"><Number>${dest}</Number></Dial>`);
    }
    return xml(`<Say voice="${voice}">We're sorry, our specialist is unavailable. We'll call you right back. Goodbye.</Say><Hangup/>`);
  }

  // ---- age ----
  if (phase === "age") {
    if (!speech) {
      const line = "Please tell me your age.";
      await logTurn(callId, "bot", line);
      return xml(gather(step("age", callId), voice, line));
    }
    if (call.leadId) await db.lead.update({ where: { id: call.leadId }, data: { dob: speech } }).catch(() => {});
    const line = "Thank you. What state are you calling from?";
    await logTurn(callId, "bot", line);
    return xml(gather(step("state", callId), voice, line));
  }

  // ---- state ----
  if (phase === "state") {
    if (!speech) {
      const line = "What state are you calling from?";
      await logTurn(callId, "bot", line);
      return xml(gather(step("state", callId), voice, line));
    }
    const code = normalizeState(speech);
    if (code) {
      if (call.leadId) await db.lead.update({ where: { id: call.leadId }, data: { state: code } }).catch(() => {});
      await db.call.update({ where: { id: callId }, data: { state: code } }).catch(() => {});
    }
    const menu = await topMenu();
    const line = `Great. Please listen to the options menu in its entirety and select the one that serves you best. ${buildMenuPrompt(menu)}`;
    await logTurn(callId, "bot", line);
    return xml(gather(step("menu", callId), voice, line));
  }

  // ---- menu (top level) ----
  if (phase === "menu") {
    const menu = await topMenu();
    if (menu.length === 0) return xml(`<Say voice="${voice}">We're sorry, no options are available right now. Goodbye.</Say><Hangup/>`);
    const hitId = matchSelection(speech, digit, menu);
    if (!hitId) {
      const line = `Sorry, I didn't catch that. ${buildMenuPrompt(menu)}`;
      await logTurn(callId, "bot", line);
      return xml(gather(step("menu", callId), voice, line));
    }
    if (await hasActiveBuyers(hitId)) return finishLeaf(callId, hitId, voice, call);
    const kids = await childMenu(hitId);
    if (kids.length > 0) {
      await db.call.update({ where: { id: callId }, data: { moneyWord: hitId } }).catch(() => {});
      const line = `${buildMenuPrompt(kids)}`;
      await logTurn(callId, "bot", line);
      return xml(gather(step("submenu", callId), voice, line));
    }
    return finishLeaf(callId, hitId, voice, call);
  }

  // ---- submenu (children of the selected category) ----
  if (phase === "submenu") {
    const parentId = call.moneyWord || "";
    const kids = await childMenu(parentId);
    if (kids.length === 0) return xml(`<Say voice="${voice}">We're sorry, no options are available right now. Goodbye.</Say><Hangup/>`);
    const hitId = matchSelection(speech, digit, kids);
    if (!hitId) {
      const line = `Sorry, I didn't catch that. ${buildMenuPrompt(kids)}`;
      await logTurn(callId, "bot", line);
      return xml(gather(step("submenu", callId), voice, line));
    }
    if (await hasActiveBuyers(hitId)) return finishLeaf(callId, hitId, voice, call);
    const grand = await childMenu(hitId);
    if (grand.length > 0) {
      await db.call.update({ where: { id: callId }, data: { moneyWord: hitId } }).catch(() => {});
      const line = `${buildMenuPrompt(grand)}`;
      await logTurn(callId, "bot", line);
      return xml(gather(step("submenu", callId), voice, line));
    }
    return finishLeaf(callId, hitId, voice, call);
  }

  // ---- ask: caller heard the leaf's question; now route ----
  if (phase === "ask") {
    const leafId = call.moneyWord || "";
    if (call.leadId && speech) await db.leadAnswer.create({ data: { leadId: call.leadId, question: "static-ask", answer: speech } }).catch(() => {});
    return routeLeaf(callId, leafId, voice, call);
  }

  // ---- offer: no buyer for the chosen leaf; offer the private-health-insurance upgrade ----
  if (phase === "offer") {
    const yes = /\b(yes|yeah|sure|ok|okay|please)\b/i.test(speech) || digit === "1";
    if (!yes) {
      const line = "Sorry, we cannot help. We'll contact you when we have a money word available. Have a great day.";
      await logTurn(callId, "bot", line);
      return xml(`<Say voice="${voice}">${esc(line)}</Say><Hangup/>`);
    }
    const fallback = await getHealthFallbackNumber();
    if (fallback) return xml(await transfer(callId, fallback, voice, "health-fallback", 0, 0));
    // else route into the Private Health Insurance money word's buyers
    const phi = await db.staticMoneyWord.findFirst({ where: { word: "Private Health Insurance", parentId: null } });
    if (phi) {
      const r = await pickBuyerFor(phi.id, { zip: call.zip || undefined, state: call.state || undefined }, Date.now());
      if (r) {
        await db.call.update({ where: { id: callId }, data: { moneyWord: "Private Health Insurance" } }).catch(() => {});
        return xml(await transfer(callId, r.number, voice, r.buyerId, r.payoutCents > 0 ? r.payoutCents : (phi.valueCents || 0), r.billableSeconds));
      }
    }
    const line = "Sorry, we cannot help. We'll contact you when we have a money word available. Have a great day.";
    await logTurn(callId, "bot", line);
    return xml(`<Say voice="${voice}">${esc(line)}</Say><Hangup/>`);
  }

  return xml(`<Say voice="${voice}">Goodbye.</Say><Hangup/>`);
}

// A leaf was selected: speak its askQuestionPrompt (if any) then route on the next hop.
async function finishLeaf(callId: string, leafId: string, voice: string, call: any) {
  await db.call.update({ where: { id: callId }, data: { moneyWord: leafId } }).catch(() => {});
  const node = await nodeById(leafId);
  const ask = (node?.askQuestionPrompt || "").trim();
  if (ask) {
    await logTurn(callId, "bot", ask);
    return xml(gather(step("ask", callId), voice, ask));
  }
  return routeLeaf(callId, leafId, voice, call);
}

// Route the leaf to a buyer (SWRR) or capture unsold demand.
async function routeLeaf(callId: string, leafId: string, voice: string, call: any) {
  const node = await nodeById(leafId);
  const nowMs = Date.now();
  const res = await pickBuyerFor(leafId, { zip: call.zip || undefined, state: call.state || undefined }, nowMs);
  if (!res) {
    await captureCallback({ moneyWordId: leafId, word: node?.word || "", state: call.state || "", zip: call.zip || "", phone: call.fromNumber || "", note: "no buyer in area" });
    await db.call.update({ where: { id: callId }, data: { disposition: "static-nobuyer", moneyWord: node?.word || leafId } }).catch(() => {});
    const line = `We're sorry, we don't have a professional in your area for ${node?.word || "that"}. Would you like to compare private individual health insurance quotes to save time and money while we have you on the line? Say yes or no.`;
    await logTurn(callId, "bot", line);
    return xml(gather(step("offer", callId), voice, line));
  }
  const revenueCents = res.payoutCents > 0 ? res.payoutCents : (node?.valueCents || 0);
  await db.call.update({ where: { id: callId }, data: { moneyWord: node?.word || leafId } }).catch(() => {});
  return xml(await transfer(callId, res.number, voice, res.buyerId, revenueCents, res.billableSeconds));
}
