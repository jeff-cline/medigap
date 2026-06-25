import { db } from "./db";
import { parseTags } from "./recapture";

// Re-export the client-safe constants so existing server imports keep working.
export * from "./jv-constants";
import { JV_TAG } from "./jv-constants";

// ---------------------------------------------------------------------------
// JV / PE / VC / OP — the founder's PERSONAL deal CRM (server helpers).
// Every lead from the 1-800-MEDIGAP partner pages is tagged JV_TAG and lives here.
// ---------------------------------------------------------------------------

// Find an existing lead by phone/email or create one, then ensure it carries the JV tag.
export async function upsertJvLead(input: {
  name?: string; phone?: string; email?: string; zip?: string; state?: string;
  jvInterest?: string; source?: string; notes?: string; creatorRef?: string;
}) {
  const creatorRef = (input.creatorRef || "").trim().slice(0, 60);
  const phone = (input.phone || "").trim();
  const email = (input.email || "").trim().toLowerCase();
  const last10 = phone.replace(/\D/g, "").slice(-10);

  let lead =
    (last10 ? await db.lead.findFirst({ where: { phone: { contains: last10 } } }) : null) ||
    (email ? await db.lead.findFirst({ where: { email } }) : null) ||
    null;

  if (!lead) {
    lead = await db.lead.create({
      data: {
        name: input.name || "", phone, email, zip: input.zip || "", state: input.state || "",
        vertical: "partner", source: input.source || "1-800-MEDIGAP",
        jvInterest: input.jvInterest || "", tags: JSON.stringify([JV_TAG]), creatorRef,
      },
    });
  } else {
    const tags = parseTags(lead.tags);
    if (!tags.includes(JV_TAG)) tags.push(JV_TAG);
    const data: Record<string, unknown> = { tags: JSON.stringify(tags) };
    if (input.name && (!lead.name || lead.name === "Inbound caller" || lead.name === "Unknown caller")) data.name = input.name;
    if (email && !lead.email) data.email = email;
    if (phone && !lead.phone) data.phone = phone;
    if (input.zip && !lead.zip) data.zip = input.zip;
    if (input.state && !lead.state) data.state = input.state;
    if (input.jvInterest) data.jvInterest = input.jvInterest;
    if (creatorRef && !lead.creatorRef) data.creatorRef = creatorRef; // first-touch attribution
    lead = await db.lead.update({ where: { id: lead.id }, data });
  }
  if (input.notes && input.notes.trim()) {
    await db.leadNote.create({ data: { leadId: lead.id, authorName: "Intake form", body: input.notes.trim() } }).catch(() => {});
  }
  return lead;
}
