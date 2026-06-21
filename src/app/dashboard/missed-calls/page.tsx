import Link from "next/link";
import { Card, Stat, Section } from "@/components/ui";
import FunnelBar from "@/components/FunnelBar";
import RecaptureConsole, { type Row } from "@/components/RecaptureConsole";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { num, cst, usd2 } from "@/lib/format";
import {
  RECAPTURE_WHERE, recaptureFunnel, recaptureEconomics, parseTags, ACCESSIBLE_RECAPTURE_CENTS,
} from "@/lib/recapture";

export const dynamic = "force-dynamic";

export default async function MissedCallsPage() {
  const session = await getSession();
  const isGod = session?.role === "god" || !!session?.impersonatorUid;

  const [leads, funnel, econ] = await Promise.all([
    db.lead.findMany({
      where: RECAPTURE_WHERE,
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        id: true, name: true, phone: true, email: true, zip: true, state: true,
        tags: true, recaptureStage: true, valueCents: true, appended: true,
        calls: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true, status: true, durationSec: true, costCents: true } },
      },
    }),
    recaptureFunnel(),
    recaptureEconomics(),
  ]);

  const rows: Row[] = leads.map((l) => {
    const c = l.calls[0];
    let appended = false;
    try { appended = (JSON.parse(l.appended || "{}") as { appendStatus?: string }).appendStatus === "matched"; } catch {}
    return {
      id: l.id, leadName: l.name, phone: l.phone, email: l.email, zip: l.zip, state: l.state,
      tags: parseTags(l.tags), stage: l.recaptureStage, valueCents: l.valueCents,
      lastCallAt: c ? cst(c.createdAt) : null, lastStatus: c?.status || "", durationSec: c?.durationSec || 0, costCents: c?.costCents || 0,
      appended,
    };
  });

  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Missed-Call Recapture</h1>
          <p className="text-sm text-[var(--muted)] max-w-3xl">
            Every number that ever hit 1-800-MEDIGAP and didn&apos;t monetize — pulled from Twilio with its timestamp,
            length and cost. This was expensive data to make. We work it with cold text + email to bubble these contacts
            back into the funnel: <span className="text-[var(--text)]">missed → engaged → clicked → opted-in → revenue</span>.
            Select, append, tag, and blast from here.
          </p>
        </div>
      </div>

      {/* Top dashboard — value of the list + cost vs. revenue */}
      <div className="grid gap-4 md:grid-cols-5 mb-6">
        <Stat label="Recapture Leads" value={num(econ.leads)} sub="worked from old data" tone="up" />
        <Stat label="Accessible Recapture" value={usd2(econ.accessibleRecaptureCents)} sub={`${usd2(ACCESSIBLE_RECAPTURE_CENTS)} × ${num(econ.leads)} leads`} tone="gold" />
        <Stat label="Revenue Created" value={usd2(econ.revenueCents)} sub="real $ booked on these" tone="up" />
        <Stat label="Cost To Work" value={usd2(econ.totalCostCents)} sub="Twilio + outreach" tone="down" />
        <Stat label="Net / Recoup" value={usd2(econ.netCents)} sub={`${econ.recoupPct}% of cost recouped`} tone={econ.netCents >= 0 ? "up" : "down"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr] items-start mb-8">
        <Section title="Recapture Funnel" desc="How far the old data has moved toward money.">
          <FunnelBar
            stages={[
              { label: "Missed", value: funnel.missed, tone: "var(--danger)" },
              { label: "Engaged", value: funnel.engaged, tone: "var(--gold)" },
              { label: "Clicked", value: funnel.clicked, tone: "var(--brand2)" },
              { label: "Opted in", value: funnel.optedIn, tone: "var(--brand)" },
              { label: "Revenue", value: funnel.revenue, tone: "var(--brand)" },
            ]}
          />
          <Card className="mt-4">
            <p className="text-sm text-[var(--muted)]">
              Goal: drive every missed call rightward. Contacts we don&apos;t convert stay tagged and keep getting
              worked — percolating until they click a CTA, at which point they&apos;re processed as a fresh,
              fully-appended lead. Reach them in bulk below or from{" "}
              <Link href="/dashboard/communications" className="text-[var(--brand)]">Communications</Link>.
            </p>
          </Card>
        </Section>

        <Section title="The List" desc="Search, select all, then append / tag / text / email. Tag a batch (e.g. chapter-1) to blast it as one campaign.">
          <RecaptureConsole rows={rows} isGod={isGod} />
        </Section>
      </div>
    </>
  );
}
