import { Card, Stat, Section, Badge } from "@/components/ui";
import { num } from "@/lib/format";
import plan from "@/content/seo-plan.json";

export const dynamic = "force-dynamic";
const usd = (n: number) => `$${Number(n || 0).toFixed(2)}`;
const compTone = (c: string) => (c === "HIGH" ? "down" : c === "LOW" ? "up" : "gold") as "up" | "down" | "gold";

export default function SeoPlanPage() {
  const groups = plan.groups;
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">1-800-MEDIGAP — SEO Silo Plan <span className="text-[var(--muted)] text-base font-normal">(deep research)</span></h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">
          The full keyword map for the flagship rebuild — &ldquo;the trusted toll-free for all things senior.&rdquo; Live
          volume &amp; CPC from DataForSEO across {num(plan.groups.length)} super-categories. Review and approve; then I build a
          pillar per silo + a child page per keyword, deep-interlinked, every page driving to <b className="text-[var(--text)]">{plan.cta}</b>. (MEDIGAP always capitalized.)
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat label="Addressable searches" value={num(plan.totalVolume)} sub="monthly, US" tone="up" />
        <Stat label="Silos" value={num(plan.siloCount)} sub={`in ${plan.groups.length} categories`} tone="gold" />
        <Stat label="Keywords" value={num(plan.keywordCount)} sub="researched" tone="default" />
        <Stat label="Pages planned" value={num(plan.pageCount)} sub="pillars + children" tone="default" />
      </div>

      <Section title="SEO architecture">
        <Card>
          <ul className="text-sm space-y-1.5 text-[var(--muted)]">
            <li><b className="text-[var(--text)]">Pillar page</b> per silo (head term) → <b className="text-[var(--text)]">child page</b> per keyword/long-tail under it.</li>
            <li><b className="text-[var(--text)]">Deep interlinking</b>: child→pillar (up), pillar→children (down), pillar↔related-pillar (lateral, siloed).</li>
            <li><b className="text-[var(--text)]">AEO</b>: quoted &ldquo;quick answer&rdquo; + FAQPage schema on every page for ML / long-tail questions.</li>
            <li><b className="text-[var(--text)]">Sitemaps in the footer</b>: XML, HTML, answer-engine + <code>llms.txt</code>. Royalty-free images. Every CTA → {plan.cta}.</li>
          </ul>
        </Card>
      </Section>

      {groups.map((g) => (
        <Section key={g.group} title={`${g.group} — ${num(g.totalVol)} searches/mo`} desc={`${g.siloCount} silos. Expand a silo to review its keywords, volume, CPC and competition.`}>
          <div className="space-y-2">
            {g.silos.map((s, i) => (
              <details key={s.slug} className="card overflow-hidden" open={i === 0}>
                <summary className="cursor-pointer select-none px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="font-semibold">{s.name}</span>
                  <code className="text-[11px] text-[var(--brand2)]">/{s.slug}</code>
                  <span className="ml-auto text-sm text-[var(--muted)]">{num(s.totalVol)} vol · CPC {usd(s.avgCpc)} · {s.keywords.length} pages</span>
                </summary>
                <div className="border-t border-[var(--border)] overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]">
                        <th className="text-left p-2.5">Keyword</th>
                        <th className="text-right p-2.5">Volume</th>
                        <th className="text-right p-2.5">CPC</th>
                        <th className="text-center p-2.5">Comp.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.keywords.map((k, ki) => (
                        <tr key={k.slug} className="border-b border-[var(--border)] last:border-0">
                          <td className="p-2.5 font-medium">{ki === 0 && <span title="pillar / head term">⭐ </span>}{k.keyword}</td>
                          <td className="p-2.5 text-right tabular-nums">{num(k.vol)}</td>
                          <td className="p-2.5 text-right tabular-nums text-[var(--gold)]">{usd(k.cpc)}</td>
                          <td className="p-2.5 text-center"><Badge tone={compTone(k.comp)}>{(k.comp || "—").toLowerCase()}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            ))}
          </div>
        </Section>
      ))}

      <Card className="mt-6 border-l-4 border-[var(--brand)]">
        <p className="text-sm"><b>Ready to build?</b> Approve (or tell me what to add/cut/re-prioritize), and I&apos;ll generate all {num(plan.pageCount)} interlinked pages with royalty-free images and the sitemaps — the complete senior marketing platform, every call to {plan.cta}.</p>
      </Card>
    </>
  );
}
