import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession, isGod } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureAgentRules } from "@/lib/static/agent-rules";
import AgentTraining from "@/components/static/AgentTraining";

export const dynamic = "force-dynamic";

export default async function AgentTrainingPage() {
  const s = await getSession();
  if (!isGod(s)) redirect("/dashboard");

  await ensureAgentRules(db);
  const [rows, moneyWordRows] = await Promise.all([
    db.agentRule.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    db.staticMoneyWord.findMany({ where: { active: true }, select: { word: true } }),
  ]);
  const moneyWords = moneyWordRows.map((m) => m.word);
  const rules = rows.map((r) => ({
    id: r.id, kind: r.kind, trigger: r.trigger, label: r.label, response: r.response, sms: r.sms,
    smsWhen: r.smsWhen, smsHour: r.smsHour, smsMinute: r.smsMinute,
    continueMenu: r.continueMenu, active: r.active, builtin: r.builtin, sortOrder: r.sortOrder,
  }));

  return (
    <Suspense>
      <AgentTraining rules={rules} moneyWords={moneyWords} />
    </Suspense>
  );
}
