import { db } from "./db";

// ---------------------------------------------------------------------------
// Arm-Cloud word extraction.
// Pull candidate "money word" content words from CALLER speech across every call,
// stripping commas, punctuation, stop words, intent/connector words and anything
// that's already armed as a money word. What's left is the stuff worth arming.
// (Same filter vocabulary as CallTranscriptTagger so the two views agree.)
// ---------------------------------------------------------------------------

// Intent / connector words — never money words.
const INTENT = new Set(
  "speak talk talking agent agents someone somebody anybody anyone person people help find finding get getting call calling connect connected provider providers supplier suppliers specialist specialists rep reps representative medicare medicaid insurance plan plans coverage option options about some service services free".split(" "),
);
const STOP = new Set(
  "the a an and or but it its is are am was were be been being to of for in on at by with from as i you he she we they me my mine your yours our ours this that these those do does did doing have has had can could would should will shall just really kind sort like so very then than there here now ok okay yeah yes no not one need want would like know think going get got really thing things well right good please thank thanks hello hi hey said say will going gonna wanna lot bit much many call back today tomorrow yesterday looking again maybe cover stuff something anything everything also still even ever never always able sure alright okay actually probably guess mean little more most some any them their what when where which while because been over down". split(" "),
);
const PREP = new Set("for about with of regarding on around to".split(" "));

export const cleanWord = (w: string) => w.toLowerCase().replace(/[^a-z']/g, "");

// Is this token a plausible money-word candidate (content word, not noise)?
function isCandidate(w: string): boolean {
  return w.length >= 4 && !STOP.has(w) && !INTENT.has(w) && !PREP.has(w);
}

// Every candidate word in a single utterance (dupes kept — caller wants frequency).
export function candidateWords(text: string): string[] {
  return text.split(/\s+/).map(cleanWord).filter(isCandidate);
}

export type CloudWord = { word: string; count: number };

// All caller turns are flattened; we count how often each candidate is spoken so the
// cloud can size the hottest words largest.
type Turn = { role?: string; text?: string };
function callerTurns(transcript: string | null): string[] {
  try {
    const d = JSON.parse(transcript || "[]");
    if (!Array.isArray(d)) return [];
    return (d as Turn[]).filter((t) => t.role === "user" && t.text).map((t) => String(t.text));
  } catch {
    return [];
  }
}

// Token set of everything already armed (money word primaries + their alias variants),
// so armed words never clutter the cloud.
export async function armedTokenSet(): Promise<Set<string>> {
  const words = await db.moneyWord.findMany({ select: { word: true, aliases: true } });
  const set = new Set<string>();
  for (const m of words) {
    const all = [m.word];
    try { const al = JSON.parse(m.aliases); if (Array.isArray(al)) all.push(...al.map(String)); } catch {}
    for (const phrase of all) phrase.split(/\s+/).map(cleanWord).forEach((t) => t && set.add(t));
  }
  return set;
}

// Aggregate the cloud across the most recent calls that have a transcript.
export async function buildCloud(limit = 400): Promise<{ words: CloudWord[]; calls: number; armed: number }> {
  const [calls, armed] = await Promise.all([
    db.call.findMany({
      where: { transcript: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 1500,
      select: { transcript: true },
    }),
    armedTokenSet(),
  ]);

  const counts = new Map<string, number>();
  for (const c of calls) {
    for (const text of callerTurns(c.transcript)) {
      for (const w of candidateWords(text)) {
        if (armed.has(w)) continue; // already armed → don't show
        counts.set(w, (counts.get(w) || 0) + 1);
      }
    }
  }

  const words = [...counts.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
    .slice(0, limit);

  return { words, calls: calls.length, armed: armed.size };
}
