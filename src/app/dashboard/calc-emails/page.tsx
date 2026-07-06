import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Section } from "@/components/ui";
import CalcEmailsEditor from "@/components/CalcEmailsEditor";

export const dynamic = "force-dynamic";

export default async function CalcEmailsDashboard() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (!(s.role === "god" || s.impersonatorUid)) redirect("/dashboard");
  const emails = await db.calcEmail.findMany({ orderBy: { weekIndex: "asc" } });

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">✉️ Calculator Weekly Emails</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">The weekly drip to exitoptimization.com calculator customers — 10 emails, one every 10 weeks, each with your editable business story on top and rotating advertiser blocks below. Sends via Zapmail.</p>
      </div>
      <Section title="The 10 rotating emails" desc="Edit the story; advertisers rotate automatically.">
        <CalcEmailsEditor emails={emails.map((e) => ({ weekIndex: e.weekIndex, subject: e.subject, storyHeader: e.storyHeader, active: e.active }))} />
      </Section>
    </>
  );
}
