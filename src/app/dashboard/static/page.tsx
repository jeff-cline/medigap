import { redirect } from "next/navigation";
import { getSession, isGod } from "@/lib/auth";
import { listNodes, toFlat } from "@/lib/static/store";
import { buildTree, moneyWordsList } from "@/lib/static/tree";
import { Card, Section } from "@/components/ui";
import StaticControls from "@/components/static/StaticControls";
import { moneyWordCloud } from "@/lib/static/hotlist";
import HotList from "@/components/static/HotList";

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
      <Section title="Static — Money Words">
        <Card>
          <div className="text-sm text-[var(--muted)] mb-2">What the AI speaks (top menu, left→right):</div>
          <div className="font-mono text-[var(--gold)]">
            {spoken.length ? spoken.join(" · ") : "No enabled tabs yet."}
          </div>
        </Card>
      </Section>
      <HotList entries={cloud} />
      <StaticControls rows={rows} selected={node ?? null} />
    </div>
  );
}
