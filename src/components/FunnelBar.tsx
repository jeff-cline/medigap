import { Card } from "@/components/ui";

// Repurposed "Budget Utilization" graphic → the recapture funnel:
// missed → engaged → clicked → opted in → revenue. Each stage shows its count and
// the % of the missed base that reached it.
export default function FunnelBar({ stages }: { stages: { label: string; value: number; tone: string }[] }) {
  const base = Math.max(1, stages[0]?.value || 1);
  return (
    <Card>
      <div className="space-y-3">
        {stages.map((s) => {
          const pct = Math.round((s.value / base) * 100);
          return (
            <div key={s.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--muted)] uppercase tracking-wide">{s.label}</span>
                <span className="font-medium">{s.value.toLocaleString()} <span className="text-[var(--muted)]">· {pct}%</span></span>
              </div>
              <div className="h-2.5 rounded-full bg-[var(--panel2)] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.max(2, pct)}%`, background: s.tone }} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-[var(--muted)] mt-3">
        Cold outreach moves missed calls rightward. Each rightward step is a contact we turned from dead data into pipeline.
      </p>
    </Card>
  );
}
