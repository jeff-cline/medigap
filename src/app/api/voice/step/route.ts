import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { routeCall, getSettings } from "@/lib/logic";
import { normalizePhone } from "@/lib/sms";
import { getVoiceAgent, aiReply, esc, getIntake, firstName, ageFromSpeech, detectMoneyWord, normalizeDob, normalizeDobAI, cleanPersonName, ChatMsg } from "@/lib/voice";
import { loadU65Config } from "@/lib/u65-store";
import { isWithinHours, isStateEnabled, matchesU65Intent } from "@/lib/u65";

const BASE = "https://medigap.plus";
function xml(body: string) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, { headers: { "Content-Type": "text/xml" } });
}
type Turn = { role: "assistant" | "user"; text: string; at: string };
const nowISO = () => new Date().toISOString();

async function loadDialogue(transcript: string | null): Promise<Turn[]> {
  try { const d = JSON.parse(transcript || "[]"); return Array.isArray(d) ? d : []; } catch { return []; }
}
// esc() escapes & → &amp; so the action URL's query string is valid XML (Twilio error 12100 otherwise).
const sayGather = (action: string, voice: string, line: string) => {
  const a = esc(action);
  return `<Gather input="speech" speechTimeout="auto" action="${a}" method="POST"><Say voice="${voice}">${esc(line)}</Say></Gather><Redirect method="POST">${a}</Redirect>`;
};

// Build the <Dial> that bridges the caller to the winning agent or the house number.
async function transfer(callId: string, voice: string, moneyWordId?: string, affiliateWord?: string) {
  const call = await db.call.findUnique({ where: { id: callId } });
  if (!call) return `<Hangup/>`;
  const s = await getSettings();
  // affiliateWord (the actual spoken word) feeds ONLY the QuinStreet vertical resolver, never the auction.
  const r = await routeCall({ zip: call.zip, state: call.state, leadId: call.leadId || undefined, providerSid: call.providerSid, fromNumber: call.fromNumber, source: "house", moneyWord: moneyWordId ? "1" : undefined, affiliateWord: affiliateWord || call.moneyWord || undefined });
  await db.call.update({ where: { id: call.id }, data: { disposition: r.disposition, realized: r.realized, forwardedTo: r.forwardedTo, priceCents: r.priceCents, bidWinnerId: r.winner?.agentId, status: "transferring" } }).catch(() => {});
  const dest = normalizePhone(r.forwardedTo) || r.forwardedTo;
  if (!dest) return `<Say voice="${voice}">All our specialists are busy. We'll call you right back. Goodbye.</Say><Hangup/>`;
  const numberEl = s.callWhisper ? `<Number url="${BASE}/api/calls/whisper">${dest}</Number>` : `<Number>${dest}</Number>`;
  return `<Dial timeout="25" callerId="${s.raw["tollFreeCallerId"] || "+18006334427"}" record="record-from-answer-dual" action="${BASE}/api/calls/status">${numberEl}</Dial>`;
}

// Money-word hot transfer: ring the word's chosen rep/number and book the partner payout.
// Falls back to the normal auction/house route if no destination is set.
async function transferMoneyWord(callId: string, voice: string, mw: { id: string; word: string; partner: string; payoutCents: number; routeUserId: string | null; routeNumber: string }) {
  let dest = mw.routeNumber;
  if (!dest && mw.routeUserId) { const u = await db.user.findUnique({ where: { id: mw.routeUserId } }); dest = u?.phone || ""; }
  dest = normalizePhone(dest) || dest;
  if (!dest) return transfer(callId, voice, mw.id, mw.word); // no destination → auction/house (+ affiliate ping on the word)

  await db.call.update({ where: { id: callId }, data: { disposition: "moneyword", realized: true, forwardedTo: dest, priceCents: mw.payoutCents, moneyWord: mw.word, status: "transferring" } }).catch(() => {});
  await db.ledgerEntry.create({ data: { type: "revenue", category: "moneyword", channel: mw.partner || "partner", amountCents: mw.payoutCents, realized: true, note: `Money word "${mw.word}" → ${dest}` } }).catch(() => {});
  const s = await getSettings();
  const numberEl = s.callWhisper ? `<Number url="${BASE}/api/calls/whisper">${dest}</Number>` : `<Number>${dest}</Number>`;
  return `<Dial timeout="25" callerId="${s.raw["tollFreeCallerId"] || "+18006334427"}" record="record-from-answer-dual" action="${BASE}/api/calls/status">${numberEl}</Dial>`;
}

// U65 hot transfer: bridge the caller straight to the buyer's SET number and record
// a U65Call whose status callback captures the 121s billable clock.
async function u65Transfer(callId: string, u65Id: string, dest: string, billable = true) {
  const s = await getSettings();
  const num = normalizePhone(dest) || dest;
  const action = `${BASE}/api/u65/status?u65=${u65Id}${billable ? "" : "&bill=0"}`;
  await db.call.update({ where: { id: callId }, data: { forwardedTo: num, status: "transferring", disposition: "u65" } }).catch(() => {});
  const numberEl = s.callWhisper ? `<Number url="${BASE}/api/calls/whisper">${num}</Number>` : `<Number>${num}</Number>`;
  return `<Dial timeout="30" callerId="${s.raw["tollFreeCallerId"] || "+18006334427"}" record="record-from-answer-dual" action="${action}">${numberEl}</Dial>`;
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const callId = url.searchParams.get("callId") || "";
  const phase = url.searchParams.get("phase") || "open";
  const idx = parseInt(url.searchParams.get("idx") || "0", 10);
  const turn = parseInt(url.searchParams.get("turn") || "0", 10);
  const retry = url.searchParams.get("retry") === "1";
  const form = await req.formData().catch(() => null);
  const speech = String(form?.get("SpeechResult") || "").trim();

  const [call, agent] = await Promise.all([db.call.findUnique({ where: { id: callId }, include: { lead: true } }), getVoiceAgent()]);
  if (!call) return xml(`<Say voice="alice">Sorry, something went wrong. Goodbye.</Say><Hangup/>`);
  const intake = getIntake(agent);
  const dialogue = await loadDialogue(call.transcript);
  if (dialogue.length === 0) dialogue.push({ role: "assistant", text: agent.greeting, at: nowISO() });

  // No speech captured (silence/timeout) → re-prompt the same step.
  if (!speech) {
    const u65Id = url.searchParams.get("u65") || "";
    const action =
      phase === "intake" ? `${BASE}/api/voice/step?callId=${call.id}&phase=intake&idx=${idx}`
      : phase === "u65" ? `${BASE}/api/voice/step?callId=${call.id}&phase=u65&u65=${u65Id}`
      : `${BASE}/api/voice/step?callId=${call.id}&phase=open&turn=${turn}`;
    const line =
      phase === "intake" ? (intake[idx]?.ask || "Could you repeat that?")
      : phase === "u65" ? "Sorry, I didn't catch that. Are you looking for private or individual health insurance?"
      : "Sorry, I didn't catch that. How can I help you?";
    return xml(sayGather(action, agent.voice, line));
  }

  dialogue.push({ role: "user", text: speech, at: nowISO() });
  const lastAsk = [...dialogue].reverse().find((d) => d.role === "assistant")?.text || agent.greeting;
  if (call.leadId) await db.leadAnswer.create({ data: { leadId: call.leadId, question: lastAsk, answer: speech } }).catch(() => {});

  // -------- INTAKE PHASE: capture name → zip → dob, then hand to the AI --------
  if (phase === "intake") {
    const step = intake[idx];
    const leadData: Record<string, unknown> = {};
    // Only store a name that actually looks like a name — never garbage transcription
    // (e.g. "Do the new federal."). If it's junk we leave name empty rather than poison the lead.
    if (step?.field === "name" && speech) { const nm = cleanPersonName(speech); if (nm) leadData.name = nm; }
    if (step?.field === "zip") { const z = speech.replace(/\D/g, "").slice(0, 5); if (z) { leadData.zip = z; } }
    if (step?.field === "dob") {
      // Normalize the spoken DOB to ISO (YYYY-MM-DD) so it's valid for downstream pings. Fast parse
      // first, AI fallback for spelled-out dates. If we still can't get it, re-ask ONCE with a clear
      // format, then accept best-effort (raw) so we never trap the caller.
      let dob = normalizeDob(speech);
      if (!dob) dob = await normalizeDobAI(speech);
      if (dob) {
        leadData.dob = dob;
      } else if (!retry) {
        const ask = "I want to get your date of birth exactly right. Please say it as the month, then the day, then the year — for example, June fifth, nineteen fifty.";
        const action = `${BASE}/api/voice/step?callId=${call.id}&phase=intake&idx=${idx}&retry=1`;
        dialogue.push({ role: "assistant", text: ask, at: nowISO() });
        await db.call.update({ where: { id: call.id }, data: { transcript: JSON.stringify(dialogue) } }).catch(() => {});
        return xml(sayGather(action, agent.voice, ask));
      } else {
        leadData.dob = speech; // couldn't parse after a retry — store raw so it's visible
      }
    }
    if (call.leadId && Object.keys(leadData).length) await db.lead.update({ where: { id: call.leadId }, data: leadData }).catch(() => {});

    const next = intake[idx + 1];
    if (next) {
      const action = `${BASE}/api/voice/step?callId=${call.id}&phase=intake&idx=${idx + 1}`;
      dialogue.push({ role: "assistant", text: next.ask, at: nowISO() });
      await db.call.update({ where: { id: call.id }, data: { transcript: JSON.stringify(dialogue) } }).catch(() => {});
      return xml(sayGather(action, agent.voice, next.ask));
    }
    // Intake complete → decide U65 vs normal open flow.
    const lead = call.leadId ? await db.lead.findUnique({ where: { id: call.leadId } }) : null;
    const fn = firstName(lead?.name || "");
    const age = ageFromSpeech(lead?.dob || speech);
    const cfg = await loadU65Config();
    const u65Eligible = age !== null && age < 65 && isStateEnabled(cfg, call.state);
    const withinHours = isWithinHours(cfg, Date.now());

    if (u65Eligible && withinHours) {
      // Create the U65Call now; the phase=u65 turn fills in the answer + routes.
      const rec = await db.u65Call.create({
        data: { callId: call.id, source: "ai_633", fromNumber: call.fromNumber, name: lead?.name || "", state: call.state, u65: true, age, forwardedTo: cfg.setNumber },
      }).catch(() => null);
      if (rec) {
        const ask = `Thank you${fn ? " " + fn : ""}. Are you looking for private or individual health insurance?`;
        const action = `${BASE}/api/voice/step?callId=${call.id}&phase=u65&u65=${rec.id}`;
        dialogue.push({ role: "assistant", text: ask, at: nowISO() });
        await db.call.update({ where: { id: call.id }, data: { transcript: JSON.stringify(dialogue), status: "in-progress" } }).catch(() => {});
        return xml(sayGather(action, agent.voice, ask));
      }
      // U65 row couldn't be created — fall through to the normal flow below rather than error the live call.
    }

    if (u65Eligible && !withinHours) {
      const useBackup = cfg.afterHoursMode === "backup" && !!cfg.backupNumber;
      const rec = await db.u65Call.create({
        data: { callId: call.id, source: "ai_633", fromNumber: call.fromNumber, name: lead?.name || "", state: call.state, u65: true, age, afterHours: true, forwardedTo: useBackup ? cfg.backupNumber : "", answer: useBackup ? "after-hours · backup" : "after-hours · regular flow" },
      }).catch(() => null);
      if (useBackup && rec) {
        const line = "Thanks for calling. Let me connect you now. One moment.";
        dialogue.push({ role: "assistant", text: line, at: nowISO() });
        await db.call.update({ where: { id: call.id }, data: { transcript: JSON.stringify(dialogue) } }).catch(() => {});
        return xml(`<Say voice="${agent.voice}">${esc(line)}</Say>${await u65Transfer(call.id, rec.id, cfg.backupNumber, false)}`);
      }
      // regular mode (or backup unset / create failed) → fall through to the normal flow below.
    }

    const intro = `${age ? `Thank you. That makes you about ${age}. ` : "Thank you. "}Okay${fn ? " " + fn : ""}, how can I help you today?`;
    const action = `${BASE}/api/voice/step?callId=${call.id}&phase=open&turn=0`;
    dialogue.push({ role: "assistant", text: intro, at: nowISO() });
    await db.call.update({ where: { id: call.id }, data: { transcript: JSON.stringify(dialogue), status: "in-progress" } }).catch(() => {});
    return xml(sayGather(action, agent.voice, intro));
  }

  // -------- U65 PHASE: buyer qualifying question --------
  if (phase === "u65") {
    const u65Id = url.searchParams.get("u65") || "";
    const cfg = await loadU65Config();
    if (matchesU65Intent(speech)) {
      await db.u65Call.update({ where: { id: u65Id }, data: { answer: `yes · ${speech.slice(0, 60)}` } }).catch(() => {});
      const line = "Great — let me connect you now. One moment.";
      dialogue.push({ role: "assistant", text: line, at: nowISO() });
      await db.call.update({ where: { id: call.id }, data: { transcript: JSON.stringify(dialogue) } }).catch(() => {});
      return xml(`<Say voice="${agent.voice}">${esc(line)}</Say>${await u65Transfer(call.id, u65Id, cfg.setNumber)}`);
    }
    // "No" → mark it and resume the normal open flow (ping tree / auction unchanged).
    await db.u65Call.update({ where: { id: u65Id }, data: { answer: `no · ${speech.slice(0, 60)}` } }).catch(() => {});
    const intro = "No problem. How can I help you today?";
    const action = `${BASE}/api/voice/step?callId=${call.id}&phase=open&turn=0`;
    dialogue.push({ role: "assistant", text: intro, at: nowISO() });
    await db.call.update({ where: { id: call.id }, data: { transcript: JSON.stringify(dialogue) } }).catch(() => {});
    return xml(sayGather(action, agent.voice, intro));
  }

  // -------- OPEN PHASE: AI Q&A + money-word / insurance routing --------
  // 1) Deterministic money-word detection → route to highest bidder for that word.
  const mw = await detectMoneyWord(speech);
  if (mw) {
    await db.moneyWord.update({ where: { id: mw.id }, data: { triggers: { increment: 1 } } }).catch(() => {});
    if (call.leadId) await db.lead.update({ where: { id: call.leadId }, data: { appended: JSON.stringify({ intent: speech, moneyWord: mw.word }) } }).catch(() => {});
    const line = `I can absolutely help with that. Let me connect you with the right specialist now. One moment.`;
    dialogue.push({ role: "assistant", text: line, at: nowISO() });
    await db.call.update({ where: { id: call.id }, data: { transcript: JSON.stringify(dialogue), moneyWord: mw.word } }).catch(() => {});
    return xml(`<Say voice="${agent.voice}">${esc(line)}</Say>${await transferMoneyWord(call.id, agent.voice, mw)}`);
  }

  // 2) AI converses; it emits [TRANSFER:...] when it decides to route.
  // Steer toward what we actually monetize: feed it the currently-armed money words.
  const armedWords = await db.moneyWord.findMany({ where: { active: true }, select: { word: true, aliases: true } }).catch(() => []);
  const armedList = armedWords.map((m) => m.word).filter(Boolean);
  // Don't repeat ourselves: collect every line the agent has already said this call.
  const priorAgentLines = dialogue.filter((d) => d.role === "assistant").map((d) => d.text);
  const steer = [
    armedList.length ? `These are the money words we actively help with — if the caller's need maps to any of them, warmly acknowledge and route there: ${armedList.join(", ")}.` : "",
    `Do NOT repeat any wording you've already used. Lines you've already said this call (do not reuse them): ${priorAgentLines.map((l) => `"${l}"`).join(" | ") || "(none yet)"}.`,
    `Reassure them this is a free service in a fresh way each turn; your aim is to get them to a money word or a licensed agent.`,
  ].filter(Boolean).join("\n");
  const sys = `${agent.systemPrompt || ""}\n\nTone: ${agent.tone}\n\n${steer}`;
  const messages: ChatMsg[] = [{ role: "system", content: sys }, ...dialogue.map((d) => ({ role: d.role, content: d.text } as ChatMsg))];
  let reply = await aiReply(messages, { temperature: 0.8, purpose: "voice", callId: call.id });
  const lastTurn = turn + 1 >= agent.maxTurns;
  if (!reply) reply = "Thanks. Let me connect you with a licensed specialist who can help. One moment. [TRANSFER:insurance]";

  const wantsTransfer = /\[TRANSFER/i.test(reply) || lastTurn;
  reply = reply.replace(/\[TRANSFER:[a-z]*\]/gi, "").replace(/\[TRANSFER\]/gi, "").trim();
  dialogue.push({ role: "assistant", text: reply, at: nowISO() });
  if (call.leadId && turn === 0) await db.lead.update({ where: { id: call.leadId }, data: { appended: JSON.stringify({ intent: speech }) } }).catch(() => {});
  await db.call.update({ where: { id: call.id }, data: { transcript: JSON.stringify(dialogue) } }).catch(() => {});

  if (wantsTransfer) return xml(`<Say voice="${agent.voice}">${esc(reply)}</Say>${await transfer(call.id, agent.voice)}`);
  const action = `${BASE}/api/voice/step?callId=${call.id}&phase=open&turn=${turn + 1}`;
  return xml(sayGather(action, agent.voice, reply));
}
