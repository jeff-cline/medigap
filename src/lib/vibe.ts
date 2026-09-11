import { randomUUID } from "crypto";

// Vibe.co server-to-server conversion events. Same account as the installed vbpx pixel
// (aid "zR1fPS" — confirmed from the live pixel; the "M7CcHZ" sample was a different account).
// Sending the visitor's IP lets Vibe attribute site engagement (votes, etc.) back to the household
// that saw the connected-TV ad. Fire-and-forget; never blocks the request.
export const VIBE_AID = "zR1fPS";
const VIBE_S2S = "https://t.vibe.co/s2s-conversion/events";

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") || "";
  return xff.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "";
}

export async function sendVibeEvent(action: string, ip: string): Promise<void> {
  try {
    await fetch(VIBE_S2S, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aid: VIBE_AID, a: action, eid: randomUUID(), ip: ip || "", ts: String(Date.now()) }),
    });
  } catch {
    /* fire-and-forget — tracking must never break the user action */
  }
}
