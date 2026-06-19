import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { routeCall, getSettings } from "@/lib/logic";
import { normalizePhone } from "@/lib/sms";
import { getVoiceAgent, aiReply, esc, ChatMsg } from "@/lib/voice";

const BASE = "https://medigap.plus";
function xml(body: string) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, { headers: { "Content-Type": "text/xml" } });
}
type Turn = { role: "assistant" | "user"; text: string };

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const callId = url.searchParams.get("callId") || "";
  const turn = parseInt(url.searchParams.get("turn") || "0", 10);
  const form = await req.formData().catch(() => null);
  const speech = String(form?.get("SpeechResult") || "").trim();

  const [call, agent] = await Promise.all([
    db.call.findUnique({ where: { id: callId }, include: { lead: true } }),
    getVoiceAgent(),
  ]);
  if (!call) return xml(`<Say voice="${agent.voice}">Sorry, something went wrong. Goodbye.</Say><Hangup/>`);

  // Rebuild dialogue from the stored transcript (seed with the greeting).
  let dialogue: Turn[] = [];
  try { dialogue = call.transcript ? JSON.parse(call.transcript) : []; } catch {}
  if (dialogue.length === 0) dialogue.push({ role: "assistant", text: agent.greeting });
  if (speech) {
    dialogue.push({ role: "user", text: speech });
    const lastAsk = [...dialogue].reverse().find((d) => d.role === "assistant")?.text || agent.greeting;
    await db.leadAnswer.create({ data: { leadId: call.leadId!, question: lastAsk, answer: speech } }).catch(() => {});
  }

  // Ask the AI for the next line.
  const wanted = (() => { try { return JSON.parse(agent.questions).map((q: { key: string; ask: string }) => `${q.key}: ${q.ask}`).join("; "); } catch { return ""; } })();
  const messages: ChatMsg[] = [
    { role: "system", content: `${agent.systemPrompt}\n\nInformation to collect: ${wanted}` },
    ...dialogue.map((d) => ({ role: d.role, content: d.text } as ChatMsg)),
  ];
  let reply = await aiReply(messages);
  const lastTurn = turn + 1 >= agent.maxTurns;

  // If the AI is unreachable, transfer rather than dropping the caller.
  if (!reply) {
    await db.call.update({ where: { id: call.id }, data: { transcript: JSON.stringify(dialogue) } }).catch(() => {});
    return forward(call.id, agent.voice);
  }

  const wantsTransfer = /\[TRANSFER\]/i.test(reply) || lastTurn;
  reply = reply.replace(/\[TRANSFER\]/gi, "").trim();
  dialogue.push({ role: "assistant", text: reply });
  await db.call.update({ where: { id: call.id }, data: { transcript: JSON.stringify(dialogue) } }).catch(() => {});

  if (wantsTransfer) {
    return xml(`<Say voice="${agent.voice}">${esc(reply)}</Say>${(await forwardTwiml(call.id, agent.voice))}`);
  }
  const action = `${BASE}/api/voice/step?callId=${call.id}&turn=${turn + 1}`;
  return xml(`<Gather input="speech" speechTimeout="auto" action="${action}" method="POST"><Say voice="${agent.voice}">${esc(reply)}</Say></Gather><Redirect method="POST">${action}</Redirect>`);
}

// Run the auction + return just the <Dial> element (caller already heard the closing line).
async function forwardTwiml(callId: string, voice: string) {
  const call = await db.call.findUnique({ where: { id: callId } });
  if (!call) return `<Hangup/>`;
  const s = await getSettings();
  const r = await routeCall({ zip: call.zip, state: call.state, leadId: call.leadId || undefined, providerSid: call.providerSid, fromNumber: call.fromNumber, source: "house" });
  await db.call.update({ where: { id: call.id }, data: { disposition: r.disposition, realized: r.realized, forwardedTo: r.forwardedTo, priceCents: r.priceCents, bidWinnerId: r.winner?.agentId } }).catch(() => {});
  const dest = normalizePhone(r.forwardedTo) || r.forwardedTo;
  if (!dest) return `<Say voice="${voice}">All specialists are busy. We'll call you right back.</Say><Hangup/>`;
  const numberEl = s.callWhisper ? `<Number url="${BASE}/api/calls/whisper">${dest}</Number>` : `<Number>${dest}</Number>`;
  return `<Dial timeout="25" callerId="${s.raw["tollFreeCallerId"] || "+18006334427"}" record="record-from-answer-dual" action="${BASE}/api/calls/status">${numberEl}</Dial>`;
}
async function forward(callId: string, voice: string) {
  return xml(await forwardTwiml(callId, voice));
}
