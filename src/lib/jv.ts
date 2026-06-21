import { db } from "./db";
import { parseTags } from "./recapture";

// ---------------------------------------------------------------------------
// JV / PE / VC / OP — the founder's PERSONAL deal CRM.
//
// This is Jeff's space to work the top of the business: investors, brand
// takeovers, ZIP/state/national sponsors, and big strategic partners he wants
// to manage personally. Every lead from the 1-800-MEDIGAP partner pages is
// tagged JV_TAG and lives here, separate from the consumer funnel but on the
// same database. Texting flows out through 1-800-MEDIGAP and back into the system.
// ---------------------------------------------------------------------------

export const JV_TAG = "jv-pe-vc-op";

export const FOUNDER = {
  name: "Jeff Cline",
  title: "Founder",
  email: "jeff.cline@me.com",
  cell: "9728006670", // replies + alerts forward here
  calendly: "https://calendly.com/jdcline",
};

export const TOLLFREE_DISPLAY = "1-800-MEDIGAP";
export const TOLLFREE_E164 = "+18006334427";

export type InterestOpt = { key: string; label: string; cta: string; blurb: string };

// Expressed-interest options + their dedicated CTAs / landing slugs.
export const JV_INTERESTS: InterestOpt[] = [
  { key: "sponsor_zip", label: "Sponsor a ZIP code", cta: "Sponsor a ZIP", blurb: "Own the leads from a single ZIP under 1-800-MEDIGAP." },
  { key: "sponsor_city", label: "Sponsor a city", cta: "Sponsor a City", blurb: "Lock a metro market and its inbound calls." },
  { key: "sponsor_state", label: "Sponsor a state", cta: "Sponsor a State", blurb: "Exclusive statewide rights under the vanity brand." },
  { key: "sponsor_national", label: "Sponsor nationwide", cta: "Go Nationwide", blurb: "National sponsorship across the whole network." },
  { key: "lock_zip", label: "Agent — lock in my ZIP", cta: "Lock In Your ZIP", blurb: "Agents: secure your ZIP before someone else does." },
  { key: "brand_takeover", label: "National provider — brand takeover", cta: "Brand Takeover", blurb: "National providers: take over the entire brand." },
  { key: "investor", label: "Investor — explore the opportunity", cta: "Investor Inquiry", blurb: "Come in at the top of a billion-dollar market." },
  { key: "exclusive", label: "Exclusive strategic partner", cta: "Become an Exclusive Partner", blurb: "A small number of exclusive partnerships." },
];

export const interestLabel = (key: string) => JV_INTERESTS.find((i) => i.key === key)?.label || key || "—";

// The account types a prospect could set up across the platform (listed on the hub).
export const ACCOUNT_OPTIONS: { label: string; href: string; availability: string }[] = [
  { label: "Investor", href: "/investors", availability: "By invitation — limited allocation at the top." },
  { label: "Marketing Partner (white-label site)", href: "/onboard", availability: "Open — launch your own branded lead-gen site." },
  { label: "Agent (pay-per-call + ZIP seats)", href: "/agents", availability: "Open — buy a ZIP/state/national seat and bid on calls." },
  { label: "Advertiser (CPC inventory)", href: "/advertise", availability: "Open — prepaid CPC across the network." },
  { label: "Money-Word Partner", href: "/money-words", availability: "Open — own a high-intent keyword and its calls." },
  { label: "Carrier / Risk Partner", href: "/risk-partners", availability: "Selective — carrier sweeps & autonomous risk." },
  { label: "Upsell Vendor", href: "/upsell-vendors", availability: "Open — live upsell to qualified seniors." },
];

export const PRIORITIES = ["high", "medium", "low"] as const;
export const priorityRank = (p: string) => (p === "high" ? 3 : p === "medium" ? 2 : p === "low" ? 1 : 0);

// Find an existing lead by phone/email or create one, then ensure it carries the JV tag.
export async function upsertJvLead(input: {
  name?: string; phone?: string; email?: string; zip?: string; state?: string;
  jvInterest?: string; source?: string; notes?: string;
}) {
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
        jvInterest: input.jvInterest || "", tags: JSON.stringify([JV_TAG]),
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
    lead = await db.lead.update({ where: { id: lead.id }, data });
  }
  if (input.notes && input.notes.trim()) {
    await db.leadNote.create({ data: { leadId: lead.id, authorName: "Intake form", body: input.notes.trim() } }).catch(() => {});
  }
  return lead;
}
