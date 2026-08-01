import { redirect } from "next/navigation";
import { getSession, isGod } from "@/lib/auth";
import { db } from "@/lib/db";
import TvCampaign from "@/components/static/TvCampaign";

export const dynamic = "force-dynamic";

export default async function TvCampaignPage() {
  const s = await getSession();
  if (!isGod(s)) redirect("/dashboard");

  const numbers = await db.trackingNumber.findMany({ orderBy: { createdAt: "asc" } });
  const nums = numbers.map((n) => n.number);
  const [calls, moneyWords] = await Promise.all([
    nums.length ? db.call.findMany({ where: { toNumber: { in: nums } }, orderBy: { createdAt: "desc" }, take: 300, include: { lead: true } }) : Promise.resolve([]),
    db.staticMoneyWord.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, select: { slug: true, word: true } }),
  ]);

  const billBy = new Map(numbers.map((n) => [n.number, n.billableSeconds || 120]));
  const rows = calls.map((c) => ({
    id: c.id,
    from: c.fromNumber,
    name: c.lead?.name || "",
    state: c.state,
    connectSec: c.connectSec,
    durationSec: c.durationSec,
    disposition: c.disposition,
    moneyWord: c.moneyWord || "",
    at: c.createdAt.toISOString(),
    toNumber: c.toNumber,
    billable: c.connectSec >= (billBy.get(c.toNumber) || 120),
  }));

  return (
    <TvCampaign
      numbers={numbers.map((n) => ({ id: n.id, number: n.number, label: n.label, mode: n.mode, moneyWordSlug: n.moneyWordSlug, thankYouText: n.thankYouText, billableSeconds: n.billableSeconds, active: n.active }))}
      calls={rows}
      moneyWords={moneyWords}
    />
  );
}
