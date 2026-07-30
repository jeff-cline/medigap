import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { esc, getVoiceAgent } from "@/lib/voice";
import { normalizePhone } from "@/lib/sms";
import { getSettings } from "@/lib/logic";
import { buildTree } from "@/lib/static/tree";
import { listNodes, toFlat } from "@/lib/static/store";
import { pickBuyerFor, pickBackupNumber, captureCallback } from "@/lib/static/routing";
import { buildMenuPrompt, matchSelection, type MenuNode } from "@/lib/static/voice";

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

export async function staticGreeting(callId: string): Promise<string> {
  const agent = await getVoiceAgent();
  return gather(step("age", callId), agent.voice, "Thanks for calling. In order to serve you better, please tell me your age.");
}

// Build the buyer transfer (caller-ID passthrough), with backup on no-answer via the status action.
async function transfer(callId: string, number: string, voice: string, buyerId: string): Promise<string> {
  const call = await db.call.findUnique({ where: { id: callId } });
  const s = await getSettings();
  const dest = normalizePhone(number) || number;
  const callerId = normalizePhone(call?.fromNumber || "") || s.raw["tollFreeCallerId"] || "+18006334427";
  await db.call.update({ where: { id: callId }, data: { forwardedTo: dest, status: "transferring", disposition: "static" } }).catch(() => {});
  const action = `${BASE}/api/voice/static-step?callId=${callId}&phase=backup&buyer=${buyerId}`;
  return `<Dial timeout="25" callerId="${callerId}" record="record-from-answer-dual" action="${action}"><Number>${dest}</Number></Dial>`;
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const callId = url.searchParams.get("callId") || "";
  const phase = url.searchParams.get("phase") || "age";
  const form = await req.formData().catch(() => null);
  const speech = String(form?.get("SpeechResult") || "").trim();
  const digit = String(form?.get("Digits") || "").trim();
  const dialStatus = String(form?.get("DialCallStatus") || "");

  const call = await db.call.findUnique({ where: { id: callId } });
  const agent = await getVoiceAgent();
  if (!call) return xml(`<Say voice="alice">Sorry, something went wrong. Goodbye.</Say><Hangup/>`);
  const voice = agent.voice;

  // ---- backup: primary dial didn't connect → try the buyer's backup number once ----
  if (phase === "backup") {
    const buyerId = url.searchParams.get("buyer") || "";
    if (dialStatus === "completed") return xml(`<Hangup/>`);
    const backup = await pickBackupNumber(buyerId);
    if (backup) {
      const call2 = await db.call.findUnique({ where: { id: callId } });
      const s = await getSettings();
      const callerId = normalizePhone(call2?.fromNumber || "") || s.raw["tollFreeCallerId"] || "+18006334427";
      const dest = normalizePhone(backup) || backup;
      return xml(`<Dial timeout="25" callerId="${callerId}" record="record-from-answer-dual" action="${BASE}/api/calls/status"><Number>${dest}</Number></Dial>`);
    }
    return xml(`<Say voice="${voice}">We're sorry, our specialist is unavailable. We'll call you right back. Goodbye.</Say><Hangup/>`);
  }

  // ---- age ----
  if (phase === "age") {
    if (!speech) return xml(gather(step("age", callId), voice, "Please tell me your age."));
    if (call.leadId) await db.lead.update({ where: { id: call.leadId }, data: { dob: speech } }).catch(() => {});
    return xml(gather(step("state", callId), voice, "Thank you. What state are you calling from?"));
  }

  // ---- state ----
  if (phase === "state") {
    if (!speech) return xml(gather(step("state", callId), voice, "What state are you calling from?"));
    if (call.leadId) await db.lead.update({ where: { id: call.leadId }, data: { state: speech.slice(0, 40) } }).catch(() => {});
    await db.call.update({ where: { id: callId }, data: { state: speech.slice(0, 40) } }).catch(() => {});
    const menu = await topMenu();
    const line = `Great. Please listen to the options menu in its entirety and select the one that serves you best. ${buildMenuPrompt(menu)}`;
    return xml(gather(step("menu", callId), voice, line));
  }

  // ---- menu (top level) ----
  if (phase === "menu") {
    const menu = await topMenu();
    const hitId = matchSelection(speech, digit, menu);
    if (!hitId) return xml(gather(step("menu", callId), voice, `Sorry, I didn't catch that. ${buildMenuPrompt(menu)}`));
    const kids = await childMenu(hitId);
    if (kids.length > 0) {
      await db.call.update({ where: { id: callId }, data: { moneyWord: hitId } }).catch(() => {});
      return xml(gather(step("submenu", callId), voice, `${buildMenuPrompt(kids)}`));
    }
    return finishLeaf(callId, hitId, voice, call);
  }

  // ---- submenu (children of the selected category) ----
  if (phase === "submenu") {
    const parentId = call.moneyWord || "";
    const kids = await childMenu(parentId);
    const hitId = matchSelection(speech, digit, kids);
    if (!hitId) return xml(gather(step("submenu", callId), voice, `Sorry, I didn't catch that. ${buildMenuPrompt(kids)}`));
    const grand = await childMenu(hitId);
    if (grand.length > 0) {
      await db.call.update({ where: { id: callId }, data: { moneyWord: hitId } }).catch(() => {});
      return xml(gather(step("submenu", callId), voice, `${buildMenuPrompt(grand)}`));
    }
    return finishLeaf(callId, hitId, voice, call);
  }

  // ---- ask: caller heard the leaf's question; now route ----
  if (phase === "ask") {
    const leafId = call.moneyWord || "";
    return routeLeaf(callId, leafId, voice, call);
  }

  return xml(`<Say voice="${voice}">Goodbye.</Say><Hangup/>`);
}

// A leaf was selected: speak its askQuestionPrompt (if any) then route on the next hop.
async function finishLeaf(callId: string, leafId: string, voice: string, call: any) {
  await db.call.update({ where: { id: callId }, data: { moneyWord: leafId } }).catch(() => {});
  const node = await nodeById(leafId);
  const ask = (node?.askQuestionPrompt || "").trim();
  if (ask) return xml(gather(step("ask", callId), voice, ask));
  return routeLeaf(callId, leafId, voice, call);
}

// Route the leaf to a buyer (SWRR) or capture unsold demand.
async function routeLeaf(callId: string, leafId: string, voice: string, call: any) {
  const node = await nodeById(leafId);
  const nowMs = Date.now();
  const res = await pickBuyerFor(leafId, { zip: call.zip || undefined }, nowMs);
  if (!res) {
    await captureCallback({ moneyWordId: leafId, word: node?.word || "", state: call.state || "", zip: call.zip || "", phone: call.fromNumber || "", note: "no buyer in area" });
    await db.call.update({ where: { id: callId }, data: { disposition: "static-nobuyer", moneyWord: node?.word || leafId } }).catch(() => {});
    return xml(`<Say voice="${voice}">We're sorry, but we don't have ${esc(node?.word || "that")} in your area right now. We'll notify you when we do. Goodbye.</Say><Hangup/>`);
  }
  await db.call.update({ where: { id: callId }, data: { moneyWord: node?.word || leafId } }).catch(() => {});
  return xml(await transfer(callId, res.number, voice, res.buyerId));
}
