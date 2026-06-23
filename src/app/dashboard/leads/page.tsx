import Link from "next/link";
import { Fragment } from "react";
import { Card, Stat, Badge, Section, AIButton } from "@/components/ui";
import { AppendedStrip, hasAppended } from "@/components/AppendedData";
import LeadFilters from "@/components/LeadFilters";
import { db } from "@/lib/db";
import { getSession, isRealGod } from "@/lib/auth";
import { usd, num, pct, cst, mmss, fmtPhone, leadRef } from "@/lib/format";
import { ageFromSpeech } from "@/lib/voice";
import type { Prisma } from "@prisma/client";

const sourceTone: Record<string, "default" | "up" | "down" | "gold" | "brand"> = {
  house: "gold",
  google: "brand",
  facebook: "brand",
  organic: "up",
  tv: "default",
  affiliate: "default",
};

const statusTone: Record<string, "default" | "up" | "down" | "gold" | "brand"> = {
  new: "brand",
  contacted: "default",
  sold: "up",
  dead: "down",
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ vertical?: string; source?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const session = await getSession();
  const god = isRealGod(session) || session?.role === "god";

  const where: Prisma.LeadWhereInput = {};
  if (sp.vertical && sp.vertical !== "all") where.vertical = sp.vertical;
  if (sp.source && sp.source !== "all") where.source = sp.source;
  if (sp.status && sp.status !== "all") where.status = sp.status;

  const [leads, total, sold, valueAgg] = await Promise.all([
    db.lead.findMany({ where, orderBy: { createdAt: "desc" }, take: 50, include: { calls: { select: { durationSec: true } } } }),
    db.lead.count({ where }),
    db.lead.count({ where: { ...where, status: "sold" } }),
    db.lead.aggregate({ where, _avg: { valueCents: true } }),
  ]);

  const conversion = total > 0 ? (sold / total) * 100 : 0;
  const avgValue = Math.round(valueAgg._avg.valueCents ?? 0);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Leads CRM</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">
          {god
            ? "God view — every lead across every site, source, and vertical, including the full AI voice-intake journey."
            : "Your assigned leads — contact basics only. The God-only AI intake journey is hidden."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Stat label="Total Leads" value={num(total)} sub="matching filters" tone="up" />
        <Stat label="Sold" value={num(sold)} sub="status = sold" tone="gold" />
        <Stat label="Conversion" value={pct(conversion)} sub={`${num(sold)} of ${num(total)}`} tone="up" />
        <Stat label="Avg Lead Value" value={usd(avgValue)} sub="across matching leads" tone="gold" />
      </div>

      <Section title="Filters" desc="Slice the pipeline by vertical, source, and status." action={<AIButton label="Suggest segment" />}>
        <Card>
          <LeadFilters />
        </Card>
      </Section>

      <Section title="All Leads" desc="Newest first — last 50 matching shown.">
        <Card className="!p-0 overflow-hidden">
          <table>
            <thead>
              <tr>
                <th>Ref #</th>
                <th>Name</th>
                <th>Phone</th>
                <th>DOB / Age</th>
                <th>Zip / State</th>
                <th className="text-right">Talk Time</th>
                <th>Source</th>
                <th>Status</th>
                <th>Created (CT)</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => {
                const talk = l.calls.reduce((s, c) => s + c.durationSec, 0);
                const age = ageFromSpeech(l.dob || "");
                const showAppend = hasAppended(l.appended);
                return (
                  <Fragment key={l.id}>
                  <tr className={showAppend ? "[&>td]:border-b-0" : ""}>
                    <td className="font-mono text-xs text-[var(--muted)]">{leadRef(l.refNum)}</td>
                    <td className="font-medium"><Link href={`/dashboard/leads/${l.id}`} className="text-[var(--brand)] hover:underline">{l.name || "Unnamed"}</Link></td>
                    <td><Link href={`/dashboard/leads/${l.id}`} className="text-[var(--brand)] hover:underline">{fmtPhone(l.phone)}</Link></td>
                    <td className="text-[var(--muted)] text-sm">{l.dob || "—"}{age ? ` · ${age}` : ""}</td>
                    <td className="text-[var(--muted)]">{[l.zip, l.state].filter(Boolean).join(" · ") || "—"}</td>
                    <td className="text-right font-medium">{talk > 0 ? mmss(talk) : "—"}</td>
                    <td><Badge tone={sourceTone[l.source] ?? "default"}>{l.source}</Badge></td>
                    <td><Badge tone={statusTone[l.status] ?? "default"}>{l.status}</Badge></td>
                    <td className="text-[var(--muted)] text-sm">{cst(l.createdAt)}</td>
                  </tr>
                  {showAppend && (
                    <tr>
                      <td colSpan={9} className="!pt-0 !pb-2 pl-3"><AppendedStrip raw={l.appended} /></td>
                    </tr>
                  )}
                  </Fragment>
                );
              })}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-[var(--muted)] py-8">
                    No leads match these filters. Live calls to 1-800-MEDIGAP create leads here automatically.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </Section>
    </>
  );
}
