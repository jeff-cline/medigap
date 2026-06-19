import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Card } from "@/components/ui";
import { fmtPhone } from "@/lib/format";
import LookupCreate from "@/components/LookupCreate";

// Universal drill-in: ?phone= or ?sid= → resolve to the customer/call record (or offer to create).
export default async function LookupPage({ searchParams }: { searchParams: Promise<{ phone?: string; sid?: string }> }) {
  const sp = await searchParams;

  if (sp.sid) {
    const call = await db.call.findFirst({ where: { providerSid: String(sp.sid) } });
    if (call?.leadId) redirect(`/dashboard/leads/${call.leadId}`);
    if (call) redirect(`/dashboard/calls/${call.id}`);
    // No matching Call for this Twilio SID — fall back to the phone if provided.
  }

  const phone = sp.phone || "";
  if (phone) {
    const last10 = phone.replace(/\D/g, "").slice(-10);
    const lead = last10 ? await db.lead.findFirst({ where: { phone: { contains: last10 } } }) : null;
    if (lead) redirect(`/dashboard/leads/${lead.id}`);

    return (
      <div className="max-w-xl">
        <Link href="/dashboard/calls" className="text-sm text-[var(--muted)] hover:text-[var(--brand)]">← Back</Link>
        <h1 className="text-2xl font-bold mt-2">{fmtPhone(phone)}</h1>
        <Card className="mt-4">
          <p className="text-sm text-[var(--muted)]">No customer record exists for this number yet. Create one and we&apos;ll instantly enrich it with PredictiveData (name, age, address, income) — then you&apos;ll see the full profile, calls, transcript and texts.</p>
          <div className="mt-4"><LookupCreate phone={phone} /></div>
        </Card>
      </div>
    );
  }

  redirect("/dashboard/leads");
}
