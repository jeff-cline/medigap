import { Card, Stat, Badge, Section, AIButton } from "@/components/ui";
import { db } from "@/lib/db";
import { usd, num, pct } from "@/lib/format";

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

export default async function LeadsPage() {
  const [leads, total, sold, valueAgg, firstLead] = await Promise.all([
    db.lead.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    db.lead.count(),
    db.lead.count({ where: { status: "sold" } }),
    db.lead.aggregate({ _avg: { valueCents: true } }),
    db.lead.findFirst({ orderBy: { createdAt: "asc" }, include: { answers: { orderBy: { askedAt: "asc" } }, calls: true } }),
  ]);

  const conversion = total > 0 ? (sold / total) * 100 : 0;
  const avgValue = Math.round(valueAgg._avg.valueCents ?? 0);

  const verticals = ["all", "medicare", "housing", "care", "alzheimers"];
  const sources = ["all", "house", "google", "facebook", "organic", "tv", "affiliate"];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Leads CRM</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">
          God view — every lead across every site, source, and vertical, including the full AI voice-intake journey.
          Agents only see contact basics (name, phone, email, DOB, zip); the Q&amp;A journey below is God-only.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Stat label="Total Leads" value={num(total)} sub="all sources" tone="up" />
        <Stat label="Sold" value={num(sold)} sub="status = sold" tone="gold" />
        <Stat label="Conversion" value={pct(conversion)} sub={`${num(sold)} of ${num(total)}`} tone="up" />
        <Stat label="Avg Lead Value" value={usd(avgValue)} sub="across all leads" tone="gold" />
      </div>

      <Section title="Filters" desc="Slice the pipeline by vertical and source.">
        <Card>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-[var(--muted)] w-16">Vertical</span>
              {verticals.map((v) => (
                <button key={v} type="button" className="btn btn-ghost text-xs !py-1 !px-3 capitalize">{v}</button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-[var(--muted)] w-16">Source</span>
              {sources.map((s) => (
                <button key={s} type="button" className="btn btn-ghost text-xs !py-1 !px-3 capitalize">{s}</button>
              ))}
            </div>
          </div>
        </Card>
        <p className="text-xs text-[var(--muted)] mt-2">Wired next: server-side filtering + saved segments.</p>
      </Section>

      {firstLead && (
        <Section
          title="Customer Journey — God-only"
          desc={`Voice-AI intake transcript for ${firstLead.name || "lead"}. Non-God agents never see this Q&A trail.`}
          action={<AIButton label="Summarize journey" />}
        >
          <Card glow>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge tone="brand">{firstLead.vertical}</Badge>
              <Badge tone={sourceTone[firstLead.source] ?? "default"}>{firstLead.source}</Badge>
              <Badge tone={statusTone[firstLead.status] ?? "default"}>{firstLead.status}</Badge>
              <span className="text-xs text-[var(--muted)]">{firstLead.calls.length} call(s) recorded</span>
            </div>
            {firstLead.answers.length > 0 ? (
              <div className="space-y-3">
                {firstLead.answers.map((a) => (
                  <div key={a.id} className="border-l-2 border-[var(--brand)]/40 pl-3">
                    <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{a.question}</div>
                    <div className="text-sm font-medium mt-0.5">{a.answer}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">No intake answers captured for this lead yet.</p>
            )}
            <p className="text-xs text-[var(--muted)] mt-4">Wired next: live transcription stream + sentiment + money-word tagging.</p>
          </Card>
        </Section>
      )}

      <Section title="All Leads" desc="Newest first — last 50 shown.">
        <Card className="!p-0 overflow-hidden">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>DOB</th>
                <th>Zip / State</th>
                <th>Vertical</th>
                <th>Source</th>
                <th>Status</th>
                <th className="text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id}>
                  <td className="font-medium">{l.name || "—"}</td>
                  <td className="text-[var(--muted)]">{l.phone || "—"}</td>
                  <td className="text-[var(--muted)] text-sm">{l.email || "—"}</td>
                  <td className="text-[var(--muted)] text-sm">{l.dob || "—"}</td>
                  <td className="text-[var(--muted)]">{[l.zip, l.state].filter(Boolean).join(" · ") || "—"}</td>
                  <td><Badge tone="brand">{l.vertical}</Badge></td>
                  <td><Badge tone={sourceTone[l.source] ?? "default"}>{l.source}</Badge></td>
                  <td><Badge tone={statusTone[l.status] ?? "default"}>{l.status}</Badge></td>
                  <td className="text-right font-medium text-[var(--brand)]">{l.valueCents > 0 ? usd(l.valueCents) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Section>
    </>
  );
}
