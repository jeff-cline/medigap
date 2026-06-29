import { JV_TAG, FOUNDER_COMM_TAG, BULK_TAG } from "@/lib/jv-constants";

// Helpers for the unified iPhone inbox (/unified) — the founder's PERSONAL JV/business space.
export const UNIFIED_GOD = "jeff.cline@me.com";

// THE WALL — only Jeff (the founder persona) and assistants he designates can see this section.
// It is NOT for consumers/agents/etc. `session` is the active session object.
export function canUnified(s: { email?: string; role?: string } | null | undefined): boolean {
  if (!s) return false;
  if ((s.email || "").toLowerCase() === UNIFIED_GOD) return true;
  return s.role === "assistant";
}

// THE WALL (data) — only JV / partner / dumpster contacts belong here, never consumers.
// A contact is in-scope if tagged with the JV deal tag, the founder-comm tag, or the dumpster (bulk) tag.
export const UNIFIED_TAGS = [JV_TAG, FOUNDER_COMM_TAG, BULK_TAG];
export function inUnifiedScope(tagsJson: string): boolean {
  return UNIFIED_TAGS.some((t) => (tagsJson || "").includes(t));
}

// Strip HTML → plain text for message previews/bubbles.
export function stripHtml(s: string): string {
  return (s || "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>(?=)/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    .replace(/&#?\w+;/g, " ")
    .replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

// Who/where an outbound message was sent from → the attribution emoji.
//  🚀 = sent from Jeff's iPhone (/unified) · 🔥 = sent from the desktop admin by Jeff
//  💎 = sent by anyone else (e.g. Krystalore / an assistant)
export function attribution(direction: string, sentVia: string, sentBy: string): string {
  if (direction !== "outbound") return "";
  const isJeff = (sentBy || "").toLowerCase() === UNIFIED_GOD;
  if (sentBy && !isJeff) return "💎";       // anyone else (e.g. an assistant / Krystalore)
  if (sentVia === "iphone") return "🚀";    // Jeff from his iPhone (/unified)
  if (sentVia === "desktop") return "🔥";   // Jeff from the desktop admin
  return "";
}
