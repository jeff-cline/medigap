// Pure voice-intake helpers for the Static engine. No DB, no Date.now() — time flows in as epoch ms.

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
