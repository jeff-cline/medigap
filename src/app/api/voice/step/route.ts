import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { routeCall, getSettings } from "@/lib/logic";
import { normalizePhone } from "@/lib/sms";
import { getVoiceAgent, aiReply, esc, getIntake, firstName, ageFromSpeech, detectMoneyWord, ChatMsg } from "@/lib/voice";

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
async function transfer(callId: string, voice: string, moneyWordId?: string) {
  const call = await db.call.findUnique({ where: { id: callId } });
  if (!call) return `<Hangup/>`;
  const s = await getSettings();
  const r = await routeCall({ zip: call.zip, state: call.state, leadId: call.leadId || undefined, providerSid: call.providerSid, fromNumber: call.fromNumber, source: "house", moneyWord: moneyWordId ? "1" : undefined });
  await db.call.update({ where: { id: call.id }, data: { disposition: r.disposition, realized: r.realized, forwardedTo: r.forwardedTo, priceCents: r.priceCents, bidWinnerId: r.winner?.agentId, status: "transferring" } }).catch(() => {});
  const dest = normalizePhone(r.forwardedTo) || r.forwardedTo;
  if (!dest) return `<Say voice="${voice}">All our specialists are busy. We'll call you right back. Goodbye.</Say><Hangup/>`;
  const numberEl = s.callWhisper ? `<Number url="${BASE}/api/calls/whisper">${dest}</Number>` : `<Number>${dest}</Number>`;
  return `<Dial timeout="25" callerId="${s.raw["tollFreeCallerId"] || "+18006334427"}" record="record-from-answer-dual" action="${BASE}/api/calls/status">${numberEl}</Dial>`;
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const callId = url.searchParams.get("callId") || "";
  const phase = url.searchParams.get("phase") || "open";
  const idx = parseInt(url.searchParams.get("idx") || "0", 10);
  const turn = parseInt(url.searchParams.get("turn") || "0", 10);
  const form = await req.formData().catch(() => null);
  const speech = String(form?.get("SpeechResult") || "").trim();

  const [call, agent] = await Promise.all([db.call.findUnique({ where: { id: callId }, include: { lead: true } }), getVoiceAgent()]);
  if (!call) return xml(`<Say voice="alice">Sorry, something went wrong. Goodbye.</Say><Hangup/>`);
  const intake = getIntake(agent);
  const dialogue = await loadDialogue(call.transcript);
  if (dialogue.length === 0) dialogue.push({ role: "assistant", text: agent.greeting, at: nowISO() });

  // No speech captured (silence/timeout) → re-prompt the same step.
  if (!speech) {
    const action = phase === "intake" ? `${BASE}/api/voice/step?callId=${call.id}&phase=intake&idx=${idx}` : `${BASE}/api/voice/step?callId=${call.id}&phase=open&turn=${turn}`;
    const line = phase === "intake" ? (intake[idx]?.ask || "Could you repeat that?") : "Sorry, I didn't catch that. How can I help you?";
    return xml(sayGather(action, agent.voice, line));
  }

  dialogue.push({ role: "user", text: speech, at: nowISO() });
  const lastAsk = [...dialogue].reverse().find((d) => d.role === "assistant")?.text || agent.greeting;
  if (call.leadId) await db.leadAnswer.create({ data: { leadId: call.leadId, question: lastAsk, answer: speech } }).catch(() => {});

  // -------- INTAKE PHASE: capture name → zip → dob, then hand to the AI --------
  if (phase === "intake") {
    const step = intake[idx];
    const leadData: Record<string, unknown> = {};
    if (step?.field === "name" && speech) leadData.name = speech;
    if (step?.field === "zip") { const z = speech.replace(/\D/g, "").slice(0, 5); if (z) { leadData.zip = z; } }
    if (step?.field === "dob") { leadData.dob = speech; }
    if (call.leadId && Object.keys(leadData).length) await db.lead.update({ where: { id: call.leadId }, data: leadData }).catch(() => {});

    const next = intake[idx + 1];
    if (next) {
      const action = `${BASE}/api/voice/step?callId=${call.id}&phase=intake&idx=${idx + 1}`;
      dialogue.push({ role: "assistant", text: next.ask, at: nowISO() });
      await db.call.update({ where: { id: call.id }, data: { transcript: JSON.stringify(dialogue) } }).catch(() => {});
      return xml(sayGather(action, agent.voice, next.ask));
    }
    // Intake complete → age readback + open question.
    const lead = call.leadId ? await db.lead.findUnique({ where: { id: call.leadId } }) : null;
    const fn = firstName(lead?.name || "");
    const age = ageFromSpeech(lead?.dob || speech);
    const intro = `${age ? `Thank you. That makes you about ${age}. ` : "Thank you. "}Okay${fn ? " " + fn : ""}, how can I help you today?`;
    const action = `${BASE}/api/voice/step?callId=${call.id}&phase=open&turn=0`;
    dialogue.push({ role: "assistant", text: intro, at: nowISO() });
    await db.call.update({ where: { id: call.id }, data: { transcript: JSON.stringify(dialogue), status: "in-progress" } }).catch(() => {});
    return xml(sayGather(action, agent.voice, intro));
  }

  // -------- OPEN PHASE: AI Q&A + money-word / insurance routing --------
  // 1) Deterministic money-word detection → route to highest bidder for that word.
  const mw = await detectMoneyWord(speech);
  if (mw) {
    if (call.leadId) await db.lead.update({ where: { id: call.leadId }, data: { appended: JSON.stringify({ intent: speech, moneyWord: mw.word }) } }).catch(() => {});
    const line = `I can absolutely help with that. Let me connect you with the right specialist now. One moment.`;
    dialogue.push({ role: "assistant", text: line, at: nowISO() });
    await db.call.update({ where: { id: call.id }, data: { transcript: JSON.stringify(dialogue), moneyWord: mw.word } }).catch(() => {});
    return xml(`<Say voice="${agent.voice}">${esc(line)}</Say>${await transfer(call.id, agent.voice, mw.id)}`);
  }

  // 2) AI converses; it emits [TRANSFER:...] when it decides to route.
  const sys = `${agent.systemPrompt || ""}\n\nTone: ${agent.tone}`;
  const messages: ChatMsg[] = [{ role: "system", content: sys }, ...dialogue.map((d) => ({ role: d.role, content: d.text } as ChatMsg))];
  let reply = await aiReply(messages);
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
