import { redirect } from "next/navigation";
import { getSession, isGod } from "@/lib/auth";
import { listNodes, toFlat } from "@/lib/static/store";
import { buildTree, moneyWordsList } from "@/lib/static/tree";
import { Card, Section } from "@/components/ui";
import StaticControls from "@/components/static/StaticControls";
import { moneyWordCloud } from "@/lib/static/hotlist";
import HotList from "@/components/static/HotList";
import FallbackNumber from "@/components/static/FallbackNumber";

export const dynamic = "force-dynamic";

export default async function StaticPage({ searchParams }: { searchParams: Promise<{ node?: string }> }) {
  const session = await getSession();
  if (!isGod(session)) redirect("/dashboard");
  const { node } = await searchParams;

  const rows = await listNodes();
  const tree = buildTree(toFlat(rows));
  const spoken = moneyWordsList(tree);
  const cloud = await moneyWordCloud();

  return (
    <div className="space-y-6">
      <div className="flex gap-3 flex-wrap">
        <a href="/dashboard/static/calls" className="inline-block rounded-md bg-[color:#238636] hover:bg-[color:#2ea043] text-white font-semibold px-4 py-2">Call Reports</a>
        <a href="/dashboard/notifications" className="inline-block rounded-md bg-black border border-white text-white font-semibold px-4 py-2 hover:bg-neutral-900">🚀 Notification Service</a>
        <a href="/dashboard/static/training" className="inline-block rounded-md bg-[color:#1f6feb] hover:bg-[color:#388bfd] text-white font-semibold px-4 py-2">🎓 Agent Training</a>
        <a href="/dashboard/tv-campaign" className="inline-block rounded-md bg-[color:#7c3aed] hover:bg-[color:#8b5cf6] text-white font-semibold px-4 py-2">📺 As Seen on TV</a>
      </div>
      <Section title="Static — Money Words">
        <Card>
          <div className="text-sm text-[var(--muted)] mb-2">What the AI speaks (top menu, left→right):</div>
          <div className="font-mono text-[var(--gold)]">
            {spoken.length ? spoken.join(" · ") : "No enabled tabs yet."}
          </div>
        </Card>
      </Section>
      <HotList entries={cloud} />
      <Section title="No-buyer fallback">
        <Card>
          <FallbackNumber />
        </Card>
      </Section>
      <StaticControls rows={rows} selected={node ?? null} />
    </div>
  );
}
