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
import { classifyMedicareIntent, classifyMedicareIntentAI, detectYesNo, medicareInterrupt } from "@/lib/static/medicare";
import * as SCRIPT from "@/lib/static/medicare-scripts";
import { medicarePhoneForState, ssPhoneForState } from "@/lib/static/statephones";
import { sendStaticSms } from "@/lib/static/sms";
import { routableIds } from "@/lib/static/routable";
import { matchAgentRule, stuckRule } from "@/lib/static/agent-rules";
import { nextBusinessDayAtMs } from "@/lib/schedule";

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

// Money words that can actually route a call (have active buyers, a custom flow, or a routable
// descendant). Empty placeholder sub-words (e.g. the default "New Sub-Word") are excluded.
async function routableSet(): Promise<Set<string>> {
  const [rows, buyers, flows] = await Promise.all([
    listNodes(),
    db.staticBuyer.findMany({ where: { active: true }, select: { moneyWordId: true } }),
    db.staticMoneyWord.findMany({ where: { NOT: { flowKey: "" } }, select: { id: true } }),
  ]);
  const tree = buildTree(toFlat(rows));
  // seed = nodes that are directly routable (have buyers OR run a custom flow); routableIds bubbles up
  const seed = new Set<string>([...buyers.map((b) => b.moneyWordId), ...flows.map((f) => f.id)]);
  return routableIds(tree as any, seed);
}
// Children of a node that are worth offering — hides unconfigured placeholders so the engine
// never speaks "New Sub-Word" and instead routes the parent ("main word").
async function routableChildMenu(parentId: string): Promise<MenuNode[]> {
  const [kids, rset] = await Promise.all([childMenu(parentId), routableSet()]);
  return kids.filter((k) => rset.has(k.id));
}

// Off-menu handling: when a caller's words match no money word, check the trainable AgentRules
// (representative / "what?" / custom triggers), and after 2 unrecognized answers fire the "stuck"
// helper. Speaks the rule's response, optionally texts info from the main number, then re-offers
// the menu to keep qualifying. Returns TwiML or null (null → fall through to the normal re-prompt).
async function agentInterruptOrStuck(callId: string, phase: string, speech: string, voice: string, call: any, menu: MenuNode[], missCount: number): Promise<Response | null> {
  const rules = await db.agentRule.findMany({ where: { active: true } });
  let rule = matchAgentRule(speech, rules as any);
  if (!rule && missCount >= 2) rule = stuckRule(rules as any);
  if (!rule) return null;
  if (rule.sms && call.fromNumber) {
    if (rule.smsWhen === "next_business_day") {
      // schedule for the next business day (sent from the main number by the cron tick)
      const sendAt = new Date(nextBusinessDayAtMs(Date.now(), rule.smsHour ?? 10, rule.smsMinute ?? 0));
      void db.followupText.create({ data: { toNumber: normalizePhone(call.fromNumber) || call.fromNumber, calledNumber: "+18006334427", body: rule.sms, sendAt, callerName: "", state: call.state || "", leadId: call.leadId || null, callId } }).catch(() => {});
    } else {
      void sendStaticSms({ to: call.fromNumber, body: rule.sms, leadId: call.leadId });
    }
  }
  const line = rule.continueMenu ? `${rule.response} ${buildMenuPrompt(menu)}` : rule.response;
  await logTurn(callId, "bot", line);
  if (rule.continueMenu) return xml(gather(step(phase, callId), voice, line)); // fresh gather resets the miss counter
  return xml(`<Say voice="${voice}">${esc(line)}</Say><Hangup/>`);
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
      const miss = parseInt(url.searchParams.get("nm") || "0", 10) + 1;
      const handled = await agentInterruptOrStuck(callId, "menu", speech, voice, call, menu, miss);
      if (handled) return handled;
      const line = `Sorry, I didn't catch that. ${buildMenuPrompt(menu)}`;
      await logTurn(callId, "bot", line);
      return xml(gather(step("menu", callId, `&nm=${miss}`), voice, line));
    }
    const hitNode = await nodeById(hitId);
    if (hitNode?.flowKey === "medicare") {
      await db.call.update({ where: { id: callId }, data: { moneyWord: hitId } }).catch(() => {});
      await logTurn(callId, "bot", SCRIPT.GREETING);
      return xml(gather(step("mcare_intent", callId), voice, SCRIPT.GREETING));
    }
    if (await hasActiveBuyers(hitId)) return finishLeaf(callId, hitId, voice, call);
    const kids = await routableChildMenu(hitId);
    if (kids.length > 0) {
      await db.call.update({ where: { id: callId }, data: { moneyWord: hitId } }).catch(() => {});
      const line = `${buildMenuPrompt(kids)}`;
      await logTurn(callId, "bot", line);
      return xml(gather(step("submenu", callId), voice, line));
    }
    // no real sub-words configured → route the main word itself (never announce a placeholder)
    return finishLeaf(callId, hitId, voice, call);
  }

  // ---- submenu (children of the selected category) ----
  if (phase === "submenu") {
    const parentId = call.moneyWord || "";
    const kids = await routableChildMenu(parentId);
    if (kids.length === 0) return finishLeaf(callId, parentId, voice, call); // placeholders only → route the main word
    const hitId = matchSelection(speech, digit, kids);
    if (!hitId) {
      const miss = parseInt(url.searchParams.get("nm") || "0", 10) + 1;
      const handled = await agentInterruptOrStuck(callId, "submenu", speech, voice, call, kids, miss);
      if (handled) return handled;
      const line = `Sorry, I didn't catch that. ${buildMenuPrompt(kids)}`;
      await logTurn(callId, "bot", line);
      return xml(gather(step("submenu", callId, `&nm=${miss}`), voice, line));
    }
    const hitNode = await nodeById(hitId);
    if (hitNode?.flowKey === "medicare") {
      await db.call.update({ where: { id: callId }, data: { moneyWord: hitId } }).catch(() => {});
      await logTurn(callId, "bot", SCRIPT.GREETING);
      return xml(gather(step("mcare_intent", callId), voice, SCRIPT.GREETING));
    }
    if (await hasActiveBuyers(hitId)) return finishLeaf(callId, hitId, voice, call);
    const grand = await routableChildMenu(hitId);
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
      const want = (call.moneyWord || "").trim();
      const line = want
        ? `Sorry, we can't help with ${want} right now. We'll reach out as soon as we have a ${want} specialist available. Have a great day.`
        : "Sorry, we can't help right now. We'll reach out as soon as we have a specialist in your area. Have a great day.";
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
    const want = (call.moneyWord || "").trim();
    const line = want
      ? `Sorry, we can't help with ${want} right now. We'll reach out as soon as we have a ${want} specialist available. Have a great day.`
      : "Sorry, we can't help right now. We'll reach out as soon as we have a specialist in your area. Have a great day.";
    await logTurn(callId, "bot", line);
    return xml(`<Say voice="${voice}">${esc(line)}</Say><Hangup/>`);
  }

  // ---- Medicare: intent detection (hybrid keyword + AI) ----
  if (phase === "mcare_intent") {
    const intr = medicareInterrupt(speech);
    if (intr) return medicareInterruptReply(callId, voice, "mcare_intent", intr, SCRIPT.GREETING);
    let intent = classifyMedicareIntent(speech);
    if (!intent && speech) intent = await classifyMedicareIntentAI(speech);
    if (!intent) {
      const line = `I can help with three things. ${SCRIPT.GREETING}`;
      await logTurn(callId, "bot", line);
      return xml(gather(step("mcare_intent", callId), voice, line));
    }
    if (intent === "buy") return medicareRouteBySlug(callId, "medicare-insurance", voice, call, "Medicare Insurance");
    if (intent === "plan") {
      await logTurn(callId, "bot", SCRIPT.PLAN_SS);
      return xml(gather(step("mcare_plan", callId), voice, SCRIPT.PLAN_SS));
    }
    // gov
    await logTurn(callId, "bot", SCRIPT.GOV_CONFIRM);
    return xml(gather(step("mcare_gov_confirm", callId), voice, SCRIPT.GOV_CONFIRM));
  }

  // ---- Medicare: GOV confirm → text the state Medicare number, then upsell cascade ----
  if (phase === "mcare_gov_confirm") {
    const intr = medicareInterrupt(speech);
    if (intr) return medicareInterruptReply(callId, voice, "mcare_gov_confirm", intr, SCRIPT.GOV_CONFIRM);
    const yn = detectYesNo(speech, digit);
    if (yn === "no") { await logTurn(callId, "bot", SCRIPT.GOODBYE); return xml(`<Say voice="${voice}">${esc(SCRIPT.GOODBYE)}</Say><Hangup/>`); }
    if (yn !== "yes") { await logTurn(callId, "bot", SCRIPT.GOV_CONFIRM); return xml(gather(step("mcare_gov_confirm", callId), voice, SCRIPT.GOV_CONFIRM)); }
    // yes → text the state Medicare office number (fire-and-forget so a slow Twilio API never dead-airs the call)
    const num = medicarePhoneForState(call.state || "");
    void sendStaticSms({ to: call.fromNumber || "", body: `Thank you for calling 1-800-MEDIGAP. Here is the number you requested: ${num}`, leadId: call.leadId });
    const line = `${SCRIPT.GOV_YES_ACK} ${SCRIPT.LIFE_PITCH}`;
    await logTurn(callId, "bot", line);
    return xml(gather(step("mcare_gov_life", callId), voice, line));
  }

  // ---- Medicare: upsell 1 — Life Insurance ----
  if (phase === "mcare_gov_life") {
    const intr = medicareInterrupt(speech);
    if (intr) return medicareInterruptReply(callId, voice, "mcare_gov_life", intr, SCRIPT.LIFE_PITCH);
    const yn = detectYesNo(speech, digit);
    if (yn === "yes") return medicareRouteBySlug(callId, "life-insurance", voice, call, "Life Insurance");
    const line = yn === "no" ? SCRIPT.PHI_PITCH : SCRIPT.LIFE_PITCH;
    await logTurn(callId, "bot", line);
    return xml(gather(step(yn === "no" ? "mcare_gov_phi" : "mcare_gov_life", callId), voice, line));
  }

  // ---- Medicare: upsell 2 — Private Health Insurance ----
  if (phase === "mcare_gov_phi") {
    const intr = medicareInterrupt(speech);
    if (intr) return medicareInterruptReply(callId, voice, "mcare_gov_phi", intr, SCRIPT.PHI_PITCH);
    const yn = detectYesNo(speech, digit);
    if (yn === "yes") return medicareRouteBySlug(callId, "private-health-insurance", voice, call, "Private Health Insurance");
    const line = yn === "no" ? SCRIPT.REVERSE_PITCH : SCRIPT.PHI_PITCH;
    await logTurn(callId, "bot", line);
    return xml(gather(step(yn === "no" ? "mcare_gov_reverse" : "mcare_gov_phi", callId), voice, line));
  }

  // ---- Medicare: upsell 3 — Reverse Mortgage ----
  if (phase === "mcare_gov_reverse") {
    const intr = medicareInterrupt(speech);
    if (intr) return medicareInterruptReply(callId, voice, "mcare_gov_reverse", intr, SCRIPT.REVERSE_PITCH);
    const yn = detectYesNo(speech, digit);
    if (yn === "yes") return medicareRouteBySlug(callId, "reverse-mortgage", voice, call, "Reverse Mortgage");
    const line = yn === "no" ? SCRIPT.RETIRE_PITCH : SCRIPT.REVERSE_PITCH;
    await logTurn(callId, "bot", line);
    return xml(gather(step(yn === "no" ? "mcare_gov_retire" : "mcare_gov_reverse", callId), voice, line));
  }

  // ---- Medicare: upsell 4 — Retirement Planner ----
  if (phase === "mcare_gov_retire") {
    const intr = medicareInterrupt(speech);
    if (intr) return medicareInterruptReply(callId, voice, "mcare_gov_retire", intr, SCRIPT.RETIRE_PITCH);
    const yn = detectYesNo(speech, digit);
    if (yn === "yes") return medicareRouteBySlug(callId, "retirement-planner", voice, call, "Retirement Planner");
    if (yn === null) { await logTurn(callId, "bot", SCRIPT.RETIRE_PITCH); return xml(gather(step("mcare_gov_retire", callId), voice, SCRIPT.RETIRE_PITCH)); }
    await logTurn(callId, "bot", SCRIPT.GOODBYE);
    return xml(`<Say voice="${voice}">${esc(SCRIPT.GOODBYE)}</Say><Hangup/>`);
  }

  // ---- Medicare: PLAN — Social Security + Educational Program enroll ----
  if (phase === "mcare_plan") {
    const intr = medicareInterrupt(speech);
    if (intr) return medicareInterruptReply(callId, voice, "mcare_plan", intr, SCRIPT.PLAN_SS);
    const yn = detectYesNo(speech, digit);
    const enrolled = yn === "yes";
    // Capture + text are best-effort; never block the TwiML response (avoids voice-webhook timeout).
    db.educationalProgram.create({ data: { phone: call.fromNumber || "", state: call.state || "", source: "medicare-plan", enrolled, leadId: call.leadId } }).catch(() => {});
    const ss = ssPhoneForState(call.state || "");
    const body = enrolled
      ? `Thanks for calling 1-800-MEDIGAP. Here is the Social Security number you requested: ${ss}. You're enrolled in our free notification service — we'll text you timely reminders.`
      : `Thanks for calling 1-800-MEDIGAP. Here is the Social Security number you requested: ${ss}.`;
    void sendStaticSms({ to: call.fromNumber || "", body, leadId: call.leadId });
    const line = `Here is the number for Social Security: ${ss}. ${SCRIPT.GOODBYE}`;
    await logTurn(callId, "bot", line);
    return xml(`<Say voice="${voice}">${esc(line)}</Say><Hangup/>`);
  }

  return xml(`<Say voice="${voice}">Goodbye.</Say><Hangup/>`);
}

// Re-speak a Medicare prompt after a "what"/"customer service" interrupt.
async function medicareMenuLine(): Promise<string> {
  const menu = await topMenu();
  return buildMenuPrompt(menu);
}
async function medicareInterruptReply(callId: string, voice: string, phase: string, kind: "what" | "service", prompt: string): Promise<Response> {
  const ctx = kind === "what" ? SCRIPT.WHAT_CONTEXT : SCRIPT.CUSTOMER_SERVICE_CONTEXT;
  const line = `${ctx} ${await medicareMenuLine()} ${prompt}`;
  await logTurn(callId, "bot", line);
  return xml(gather(step(phase, callId), voice, line));
}

// Speak the transfer script for a target money word (by slug) then route to its buyer, or fall back.
async function medicareRouteBySlug(callId: string, slug: string, voice: string, call: any, label: string): Promise<Response> {
  const node = await db.staticMoneyWord.findFirst({ where: { slug } });
  if (!node) {
    await logTurn(callId, "bot", SCRIPT.GOODBYE);
    return xml(`<Say voice="${voice}">${esc(SCRIPT.GOODBYE)}</Say><Hangup/>`);
  }
  const res = await pickBuyerFor(node.id, { zip: call.zip || undefined, state: call.state || undefined }, Date.now());
  if (!res) {
    await captureCallback({ moneyWordId: node.id, word: node.word, state: call.state || "", zip: call.zip || "", phone: call.fromNumber || "", note: "medicare route: no buyer" });
    await db.call.update({ where: { id: callId }, data: { disposition: "static-nobuyer", moneyWord: node.word } }).catch(() => {});
    const line = `We don't have a ${label} professional available right now, but we have you and will follow up. ${SCRIPT.GOODBYE}`;
    await logTurn(callId, "bot", line);
    return xml(`<Say voice="${voice}">${esc(line)}</Say><Hangup/>`);
  }
  const revenueCents = res.payoutCents > 0 ? res.payoutCents : (node.valueCents || 0);
  await db.call.update({ where: { id: callId }, data: { moneyWord: node.word, disposition: "static" } }).catch(() => {});
  const say = `<Say voice="${voice}">${esc(SCRIPT.transferScript(label))}</Say>`;
  return xml(say + (await transfer(callId, res.number, voice, res.buyerId, revenueCents, res.billableSeconds)));
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
