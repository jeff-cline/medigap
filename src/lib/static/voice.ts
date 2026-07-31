// Pure voice-intake helpers for the Static engine. No DB, no Date.now() — time flows in as epoch ms.

const US_STATES: Record<string, string> = {
  // Compound/multi-word names first (longer substrings first to avoid shadowing)
  "district of columbia": "DC",
  "washington dc": "DC",
  "north carolina": "NC",
  "south carolina": "SC",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "rhode island": "RI",
  "south dakota": "SD",
  "north dakota": "ND",
  "west virginia": "WV",
  // Single-word names
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  wisconsin: "WI",
  wyoming: "WY",
};

const VALID_CODES = new Set(Object.values(US_STATES));

export function normalizeState(input: string): string {
  const s = (input || "").toLowerCase().trim();
  if (!s) return "";
  // Try to match a full state name (includes substring search for phrases like "I'm in Texas")
  for (const [name, code] of Object.entries(US_STATES)) {
    if (s.includes(name)) return code;
  }
  // If no name matched, check if it's already a valid 2-letter code
  const two = s.replace(/[^a-z]/g, "").slice(0, 2).toUpperCase();
  return VALID_CODES.has(two) ? two : "";
}

export type MenuNode = { id: string; word: string };

export function buildMenuPrompt(nodes: MenuNode[]): string {
  return nodes
    .map((n, i) => `For ${n.word}, say it or press ${i + 1}.`)
    .join(" ");
}

export function matchSelection(speech: string, digit: string, nodes: MenuNode[]): string | null {
  const d = (digit || "").trim();
  if (/^[0-9]+$/.test(d)) {
    const idx = parseInt(d, 10) - 1;
    return idx >= 0 && idx < nodes.length ? nodes[idx].id : null;
  }
  const s = (speech || "").toLowerCase().trim();
  if (!s) return null;
  for (const n of nodes) if (s.includes(n.word.toLowerCase())) return n.id;
  return null;
}

// CST wall-clock parts for a given epoch (DST-correct via Intl / America/Chicago).
function cstParts(epochMs: number): { weekday: number; minutes: number } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date(epochMs));
  const wd = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const hh = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10) % 24;
  const mm = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { weekday: map[wd] ?? 0, minutes: hh * 60 + mm };
}

export function isAfterHours(
  buyer: { afterHoursDays: string; afterHoursStart: number | null; afterHoursEnd: number | null },
  epochMs: number,
): boolean {
  let days: number[];
  try { days = JSON.parse(buyer.afterHoursDays || "[]"); } catch { days = []; }
  if (!Array.isArray(days) || days.length === 0) return false;
  if (buyer.afterHoursStart == null || buyer.afterHoursEnd == null) return false;
  const { weekday, minutes } = cstParts(epochMs);
  if (!days.includes(weekday)) return false;
  return minutes >= buyer.afterHoursStart && minutes < buyer.afterHoursEnd;
}
