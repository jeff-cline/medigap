import Link from "next/link";
import { redirect } from "next/navigation";
import { Section } from "@/components/ui";
import DumpsterConsole from "@/components/jv/DumpsterConsole";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { bulkStats, bulkLeads } from "@/lib/dumpster";
import { engineReady } from "@/lib/founder";
import { FOUNDER_ENGINES } from "@/lib/jv";

export const dynamic = "force-dynamic";

export default async function DumpsterPage() {
  const s = await getSession();
  const ok = !!s && (s.role === "god" || s.role === "assistant" || !!s.impersonatorUid);
  if (!ok) redirect("/dashboard/jv");

  const [stats, leads, templates, engines] = await Promise.all([
    bulkStats(),
    bulkLeads(),
    db.emailTemplate.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, subject: true, html: true, text: true } }),
    Promise.all(FOUNDER_ENGINES.map(async (e) => ({ key: e.key, label: e.label, oneToOne: e.oneToOne, ready: await engineReady(e.key) }))),
  ]);

  return (
    <>
      <div className="mb-4">
        <Link href="/dashboard/jv" className="text-sm text-[var(--muted)] hover:text-[var(--brand)]">← Founder Inbox</Link>
        <h1 className="text-2xl font-bold mt-1">🗑 Dumpster → Bulk</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">
          Paste a messy list of emails or phone numbers in any format. They&apos;re cleaned into your <b>Bulk</b> list,
          enriched (appended) automatically, then you can email or text <b>All</b> — or search by email, name, city, state
          or ZIP and reach just that slice.
        </p>
      </div>
      <Section title="Bulk list" desc="Process a list, watch the dashboard, then segment & send.">
        <DumpsterConsole stats={stats} leads={leads} templates={templates} engines={engines} />
      </Section>
    </>
  );
}
