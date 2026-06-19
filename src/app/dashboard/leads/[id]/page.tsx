import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Badge, Section } from "@/components/ui";
import LeadActions from "@/components/LeadActions";
import { db } from "@/lib/db";
import { getSession, isRealGod } from "@/lib/auth";
import { usd } from "@/lib/format";

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

function parseAppended(raw: string): Record<string, unknown> | null {
  try {
    const v = JSON.parse(raw || "{}");
    if (v && typeof v === "object" && Object.keys(v).length > 0) return v as Record<string, unknown>;
  } catch {
    /* ignore */
  }
  return null;
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const god = isRealGod(session) || session?.role === "god";

  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      answers: { orderBy: { askedAt: "asc" } },
      calls: { orderBy: { createdAt: "desc" }, include: { lead: false } },
      agent: true,
    },
  });

  if (!lead) notFound();

  const agents = await db.user.findMany({
    where: { role: "agent" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const appended = parseAppended(lead.appended);

  return (
    <>
      <div className="mb-6">
        <Link href="/dashboard/leads" className="text-sm text-[var(--muted)] hover:text-[var(--brand)]">
          ← Back to Leads
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{lead.name || "Unnamed lead"}</h1>
          <Badge tone="brand">{lead.vertical}</Badge>
          <Badge tone={sourceTone[lead.source] ?? "default"}>{lead.source}</Badge>
          <Badge tone={statusTone[lead.status] ?? "default"}>{lead.status}</Badge>
          {lead.valueCents > 0 && <span className="text-[var(--brand)] font-semibold">{usd(lead.valueCents)}</span>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8 items-start">
        <Section title="Contact">
          <Card>
            <dl className="grid grid-cols-3 gap-y-3 text-sm">
              <dt className="text-[var(--muted)]">Phone</dt>
              <dd className="col-span-2 font-medium">{lead.phone || "—"}</dd>
              <dt className="text-[var(--muted)]">Email</dt>
              <dd className="col-span-2 font-medium">{lead.email || "—"}</dd>
              <dt className="text-[var(--muted)]">DOB</dt>
              <dd className="col-span-2 font-medium">{lead.dob || "—"}</dd>
              <dt className="text-[var(--muted)]">Location</dt>
              <dd className="col-span-2 font-medium">
                {[lead.city, lead.state, lead.zip].filter(Boolean).join(", ") || "—"}
              </dd>
              <dt className="text-[var(--muted)]">Agent</dt>
              <dd className="col-span-2 font-medium">{lead.agent?.name || "Unassigned"}</dd>
              <dt className="text-[var(--muted)]">Created</dt>
              <dd className="col-span-2 font-medium">{lead.createdAt.toISOString().slice(0, 16).replace("T", " ")}</dd>
            </dl>
          </Card>
        </Section>

        <Section title="Manage" desc="Move the lead through the pipeline or assign an agent.">
          <Card>
            <LeadActions leadId={lead.id} status={lead.status} agentId={lead.agentId} agents={agents} />
          </Card>
        </Section>
      </div>

      {god && (
        <Section
          title="Customer Journey — God-only"
          desc="Voice-AI intake transcript. Non-God agents never see this Q&A trail."
        >
          <Card glow>
            {lead.answers.length > 0 ? (
              <ol className="space-y-3">
                {lead.answers.map((a) => (
                  <li key={a.id} className="border-l-2 border-[var(--brand)]/40 pl-3">
                    <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{a.question}</div>
                    <div className="text-sm font-medium mt-0.5">{a.answer}</div>
                    <div className="text-[10px] text-[var(--muted)] mt-0.5">
                      {a.askedAt.toISOString().slice(0, 16).replace("T", " ")}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-[var(--muted)]">No intake answers captured for this lead yet.</p>
            )}
          </Card>
        </Section>
      )}

      <Section title="Calls" desc="Every call tied to this lead.">
        <Card className="!p-0 overflow-hidden">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Zip / State</th>
                <th>Status</th>
                <th>Source</th>
                <th>Money Word</th>
                <th className="text-right">Price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lead.calls.map((c) => {
                const sTone = c.status === "connected" || c.status === "completed" ? "up" : c.status === "missed" ? "down" : "default";
                const srcTone = c.source === "house" ? "gold" : c.source === "paid" ? "brand" : "default";
                return (
                  <tr key={c.id}>
                    <td className="text-[var(--muted)] text-sm">{c.createdAt.toISOString().slice(5, 16).replace("T", " ")}</td>
                    <td className="text-[var(--muted)]">{[c.zip, c.state].filter(Boolean).join(" · ") || "—"}</td>
                    <td><Badge tone={sTone}>{c.status}</Badge></td>
                    <td><Badge tone={srcTone}>{c.source}</Badge></td>
                    <td>{c.moneyWord ? <span className="text-[var(--gold)] text-sm font-medium">{c.moneyWord}</span> : <span className="text-[var(--muted)]">—</span>}</td>
                    <td className="text-right font-medium text-[var(--brand)]">{c.priceCents > 0 ? usd(c.priceCents) : "—"}</td>
                    <td className="text-right">
                      <Link href={`/dashboard/calls/${c.id}`} className="text-[var(--brand)] text-sm font-medium hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {lead.calls.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-[var(--muted)] py-8">
                    No calls recorded for this lead.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </Section>

      <Section title="Appended Data" desc="Datamoon enrichment — household, financial, and contact signals.">
        <Card>
          {appended ? (
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {Object.entries(appended).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-[var(--border)]/50 py-1">
                  <dt className="text-[var(--muted)] capitalize">{k.replace(/_/g, " ")}</dt>
                  <dd className="font-medium text-right">{typeof v === "object" ? JSON.stringify(v) : String(v)}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-[var(--muted)]">No Datamoon append yet.</p>
          )}
        </Card>
      </Section>
    </>
  );
}
