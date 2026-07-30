import { Card, Section } from "@/components/ui";

type CloudEntry = { word: string; count: number; states: string[]; lastAt: Date | string };

export default function HotList({ entries }: { entries: CloudEntry[] }) {
  if (!entries.length) return null;
  const max = Math.max(...entries.map((e) => e.count));
  return (
    <Section title="Money-Word Cloud — unsold demand">
      <Card>
        <div className="text-sm text-[var(--muted)] mb-3">Callers who wanted a money word we had no buyer for. Bigger = more demand → sell this next.</div>
        <div className="flex flex-wrap gap-3 items-baseline">
          {entries.map((e) => (
            <span key={e.word} title={`${e.count} request(s)${e.states.length ? " · " + e.states.join(", ") : ""}`}
              style={{ fontSize: `${(0.9 + 1.6 * (e.count / max)).toFixed(2)}rem` }}
              className="font-semibold text-[var(--gold)]">
              {e.word}<span className="text-[var(--muted)] text-xs ml-1">×{e.count}</span>
            </span>
          ))}
        </div>
      </Card>
    </Section>
  );
}
