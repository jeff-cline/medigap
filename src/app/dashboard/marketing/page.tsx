import { Card, Stat, Badge, Section, AIButton } from "@/components/ui";
import { db } from "@/lib/db";
import { usd, usd2, num } from "@/lib/format";
import MarketingCampaignForm from "@/components/MarketingCampaignForm";

const channelLabel: Record<string, string> = {
  google: "Google",
  facebook: "Facebook",
  tv: "TV",
  vibe: "Vibe",
  organic: "Organic",
};
const channelTone: Record<string, "default" | "up" | "down" | "gold" | "brand"> = {
  google: "up",
  facebook: "brand",
  tv: "gold",
  vibe: "brand",
  organic: "default",
};

export default async function MarketingPage() {
  const campaigns = await db.campaign.findMany({ orderBy: { createdAt: "desc" } });

  const sumWhere = (ch: string) =>
    campaigns.filter((c) => c.channel === ch).reduce((s, c) => s + c.spendCents, 0);
  const googleSpend = sumWhere("google");
  const fbSpend = sumWhere("facebook");
  const totalSpend = campaigns.reduce((s, c) => s + c.spendCents, 0);
  const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0);
  const totalCalls = campaigns.reduce((s, c) => s + c.calls, 0);
  const blendedCPL = totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0;
  const blendedCPA = totalCalls > 0 ? Math.round(totalSpend / totalCalls) : 0;

  const cplOf = (leads: number, spend: number) => (leads > 0 ? Math.round(spend / leads) : 0);
  // Revenue-less ROAS proxy: leads × notional $25 value ÷ spend (until call revenue attribution lands).
  const NOTIONAL_LEAD_VALUE = 2500; // cents
  const roasOf = (leads: number, spend: number) => (spend > 0 ? (leads * NOTIONAL_LEAD_VALUE) / spend : 0);

  // A/B card: the two variants of "Medigap Search — Brand".
  const abGroup = campaigns
    .filter((c) => c.name === "Medigap Search — Brand")
    .sort((a, b) => a.variant.localeCompare(b.variant));
  const abReady = abGroup.length === 2;
  const abWithCPL = abGroup.map((c) => ({ ...c, cpl: cplOf(c.leads, c.spendCents) }));
  const abWinner =
    abReady && abWithCPL.every((c) => c.cpl > 0)
      ? abWithCPL.reduce((best, c) => (c.cpl < best.cpl ? c : best)).variant
      : null;

  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Marketing</h1>
          <p className="text-sm text-[var(--muted)] max-w-3xl">
            Run Google, Meta, and TV campaigns from one console. You supply seed titles and descriptions; the platform
            auto-inserts call-tracking links, runs A/B tests across creatives, and does keyword→creative matching so the
            highest-converting message reaches each segment — all routing to 1-800-MEDIGAP.
          </p>
        </div>
        <AIButton label="Generate creative" />
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat label="Ad Spend — Google" value={usd(googleSpend)} sub="search + PMax" tone="down" />
        <Stat label="Ad Spend — Facebook" value={usd(fbSpend)} sub="prospecting + retargeting" tone="down" />
        <Stat label="Blended CPL" value={usd2(blendedCPL)} sub={`${num(totalLeads)} leads`} tone="gold" />
        <Stat label="Blended CPA / call" value={usd2(blendedCPA)} sub={`${num(totalCalls)} calls`} tone="gold" />
      </div>

      <Section
        title="Campaigns"
        desc="Live performance across every channel — pulled from the campaign ledger."
        action={<AIButton label="Optimize budgets" />}
      >
        {campaigns.length === 0 ? (
          <Card>
            <p className="text-sm text-[var(--muted)]">No campaigns yet. Add one below to start tracking spend, leads, and calls.</p>
          </Card>
        ) : (
          <Card className="!p-0 overflow-hidden">
            <table>
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Campaign</th>
                  <th>Variant</th>
                  <th className="text-right">Spend</th>
                  <th className="text-right">Clicks</th>
                  <th className="text-right">Leads</th>
                  <th className="text-right">Calls</th>
                  <th className="text-right">CPL</th>
                  <th className="text-right">ROAS</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const roas = roasOf(c.leads, c.spendCents);
                  return (
                    <tr key={c.id} className={c.active ? "" : "opacity-50"}>
                      <td>
                        <Badge tone={channelTone[c.channel] ?? "default"}>{channelLabel[c.channel] ?? c.channel}</Badge>
                      </td>
                      <td className="font-medium">{c.name}</td>
                      <td className="text-[var(--muted)]">{c.variant}</td>
                      <td className="text-right text-[var(--danger)]">−{usd(c.spendCents)}</td>
                      <td className="text-right">{c.clicks ? num(c.clicks) : "—"}</td>
                      <td className="text-right">{num(c.leads)}</td>
                      <td className="text-right">{num(c.calls)}</td>
                      <td className="text-right">{c.leads ? usd2(cplOf(c.leads, c.spendCents)) : "—"}</td>
                      <td className={`text-right font-medium ${roas >= 3 ? "text-[var(--brand)]" : "text-[var(--gold)]"}`}>
                        {roas > 0 ? `${roas.toFixed(1)}x` : "—"}
                      </td>
                      <td>
                        {c.active ? <Badge tone="up">Active</Badge> : <Badge tone="default">Paused</Badge>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
        <p className="text-xs text-[var(--muted)] mt-2">
          Google &amp; Meta spend auto-syncs once OAuth is connected on Integrations. ROAS shown is a lead-value proxy
          ({usd2(NOTIONAL_LEAD_VALUE)}/lead) until per-call revenue attribution lands.
        </p>
      </Section>

      <Section title="A/B Test — Medigap Search · Brand" desc="Two live headline variants; the lower-CPL arm wins.">
        {abReady ? (
          <div className="grid gap-4 md:grid-cols-2">
            {abWithCPL.map((c) => {
              const winning = abWinner === c.variant;
              return (
                <Card key={c.id} glow={winning} className={winning ? "border-[var(--brand)]/40" : ""}>
                  <div className="flex items-center justify-between mb-2">
                    <Badge tone={winning ? "up" : "default"}>
                      Variant {c.variant}{winning ? " · winning" : ""}
                    </Badge>
                    <span className="text-xs text-[var(--muted)]">auto-rotated</span>
                  </div>
                  <div className="text-lg font-semibold">{c.headline || c.name}</div>
                  {c.description && <p className="text-sm text-[var(--muted)] mt-1">{c.description}</p>}
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-[var(--muted)]">CPL</div>
                      <div className={`text-2xl font-bold ${winning ? "text-[var(--brand)]" : "text-[var(--text)]"}`}>
                        {c.leads ? usd2(c.cpl) : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Leads</div>
                      <div className="text-2xl font-bold">{num(c.leads)}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Spend</div>
                      <div className="text-2xl font-bold text-[var(--danger)]">{usd(c.spendCents)}</div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <p className="text-sm text-[var(--muted)]">
              Need two variants of a campaign named “Medigap Search — Brand” to run the head-to-head. Add a Variant A and
              Variant B below.
            </p>
          </Card>
        )}
        {abWinner && (
          <p className="text-xs text-[var(--muted)] mt-2">
            Variant <span className="text-[var(--brand)] font-semibold">{abWinner}</span> is winning on cost-per-lead —
            the platform shifts budget toward it automatically once significance is reached.
          </p>
        )}
      </Section>

      <Section title="Add Campaign" desc="Seed a creative; we wire tracking and start the A/B test.">
        <MarketingCampaignForm />
      </Section>
    </>
  );
}
