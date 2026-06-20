import Link from "next/link";
import { Card, Stat, Badge, Section } from "@/components/ui";
import { ToggleActive } from "@/components/CrudForm";
import LaunchSiteForm from "@/components/LaunchSiteForm";
import PixelManager from "@/components/PixelManager";
import { db } from "@/lib/db";
import { num } from "@/lib/format";

export default async function SitesPage() {
  const [sites, pixels] = await Promise.all([
    db.site.findMany({ orderBy: { createdAt: "asc" } }),
    db.pixel.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  const liveSites = sites.filter((s) => s.active).length;
  const management = sites.filter((s) => s.kind === "management").length;
  const marketing = sites.filter((s) => s.kind === "marketing").length;
  const verticals = new Set(sites.map((s) => s.vertical)).size;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">White-Label Site Engine</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">
          One backend, many front doors. Every site is keyed by hostname and shares the same lead + call + money
          engine. Point a URL at the server IP, describe the goal in a prompt, and the platform wires up a unique,
          themed funnel — each one its own A/B test against the network. Marketing sites are public lead/call funnels;
          management sites are back-office portals.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Stat label="Live Sites" value={num(liveSites)} sub={`${num(sites.length)} total`} tone="up" />
        <Stat label="Management" value={num(management)} sub="back-office portals" tone="gold" />
        <Stat label="Marketing" value={num(marketing)} sub="public funnels" tone="up" />
        <Stat label="Verticals" value={num(verticals)} sub="covered by the network" tone="default" />
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
                <th></th>
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
                  <td>
                    <Badge tone={s.kind === "management" ? "gold" : "brand"}>{s.kind}</Badge>
                  </td>
                  <td className="text-[var(--muted)]">{s.vertical}</td>
                  <td className="text-[var(--muted)] text-sm max-w-xs truncate">{s.goal || "—"}</td>
                  <td>{s.active ? <Badge tone="up">live</Badge> : <Badge tone="down">paused</Badge>}</td>
                  <td className="text-right">
                    <ToggleActive endpoint="/api/sites" id={s.id} active={s.active} />
                  </td>
                </tr>
              ))}
              {sites.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-[var(--muted)] py-8">
                    No sites yet — launch one below.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </Section>

      <Section title="Tracking Pixels" desc="Install pixels/tags into the <head> of your sites — global (all sites) or per-site. Name each by the KPI it tracks.">
        <Card>
          <PixelManager pixels={pixels.map((p) => ({ id: p.id, name: p.name, code: p.code, siteId: p.siteId, active: p.active }))} sites={sites.map((s) => ({ id: s.id, name: s.name, hostname: s.hostname }))} />
        </Card>
      </Section>

      <Section title="Google Tag Manager — track everything as you scale" desc="The cleanest way to manage tracking across many sites.">
        <Card>
          <div className="text-sm text-[var(--muted)] space-y-2">
            <p>For 1–2 pixels, use Add Pixel above. As you launch dozens of sites, <b className="text-[var(--text)]">put one GTM container snippet in as a <span className="text-[var(--gold)]">global</span> pixel here</b>, then manage every tag from GTM&apos;s dashboard — no redeploys.</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>At <span className="text-[var(--brand2)]">tagmanager.google.com</span>, create one container (Web). Copy both snippet halves.</li>
              <li>Add Pixel above → name it &ldquo;Google Tag Manager&rdquo;, scope <b>All sites (global)</b>, paste the <code>&lt;head&gt;</code> snippet.</li>
              <li>In GTM, add your real tags (GA4, Meta Pixel, conversions, etc.) and Publish — they go live on every site instantly.</li>
              <li>Use GTM <b>triggers</b> for your KPIs: lead-form submit, click-to-call, page views — fire each pixel on the event you care about.</li>
            </ol>
            <p className="text-xs">Recommendation: <b className="text-[var(--text)]">GTM is the way to go</b> once you&apos;re past a couple of sites. Keep direct Add-Pixel for one-offs (like the Vibe.co pixel) and route the rest through GTM.</p>
          </div>
        </Card>
      </Section>

      <Section title="Launch a new site" desc="Add a URL + a goal prompt; the platform provisions a unique funnel.">
        <Card glow>
          <LaunchSiteForm />
        </Card>
      </Section>
    </>
  );
}
