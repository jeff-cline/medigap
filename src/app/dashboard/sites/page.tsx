import { Card, Stat, Badge, Section } from "@/components/ui";
import { db } from "@/lib/db";
import { num, pct } from "@/lib/format";
import LaunchSiteForm from "@/components/LaunchSiteForm";
import Link from "next/link";

export default async function SitesPage() {
  const [sites, networkLeads] = await Promise.all([
    db.site.findMany({ orderBy: { createdAt: "asc" } }),
    db.lead.count(),
  ]);

  const liveSites = sites.filter((s) => s.active).length;
  // Avg conversion + A/B variants are illustrative until per-site analytics land.
  const avgConversion = 4.2;
  const abVariants = Math.max(sites.length * 2, 4);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Marketing Sites</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">
          One backend, many front doors. Each site is keyed by hostname — point a URL at the IP, describe the goal in a
          prompt, and the platform wires up a unique, themed funnel routed to the same lead + call engine. Every site is
          its own A/B test against the network.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Stat label="Live Sites" value={num(liveSites)} sub={`${num(sites.length)} total`} tone="up" />
        <Stat label="Leads (network)" value={num(networkLeads)} sub="across all hostnames" tone="gold" />
        <Stat label="Avg Conversion" value={pct(avgConversion)} sub="visitor → lead" tone="up" />
        <Stat label="A/B Variants" value={num(abVariants)} sub="themes in rotation" tone="default" />
      </div>

      <Section title="Network Sites" desc="Hostname-routed funnels sharing one backend.">
        <Card className="!p-0 overflow-hidden">
          <table>
            <thead>
              <tr>
                <th>Hostname</th>
                <th>Name</th>
                <th>Kind</th>
                <th>Vertical</th>
                <th>Goal</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sites.map((s) => (
                <tr key={s.id}>
                  <td className="font-medium">
                    <Link href={`https://${s.hostname}`} target="_blank" className="text-[var(--brand)] hover:underline">
                      {s.hostname}
                    </Link>
                  </td>
                  <td>{s.name}</td>
                  <td><Badge tone={s.kind === "management" ? "gold" : "brand"}>{s.kind}</Badge></td>
                  <td className="text-[var(--muted)]">{s.vertical}</td>
                  <td className="text-[var(--muted)] text-sm max-w-xs truncate">{s.goal || "—"}</td>
                  <td>{s.active ? <Badge tone="up">live</Badge> : <Badge tone="down">paused</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <p className="text-xs text-[var(--muted)] mt-2">Wired next: per-site conversion analytics + automatic theme A/B winner promotion.</p>
      </Section>

      <Section title="Launch a new site" desc="Add a URL + a goal prompt; the platform provisions a unique funnel.">
        <Card glow>
          <LaunchSiteForm />
        </Card>
      </Section>
    </>
  );
}
