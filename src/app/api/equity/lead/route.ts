import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardForm } from "@/lib/form-guard";
import { bySlug } from "@/lib/equity";
import { CONSENT_TEXT } from "@/lib/equity/consent";
import { notifyNewLead, sendWelcome } from "@/lib/equity/notify";
import { upsertAccount, createAccountSession } from "@/lib/equity/account";
import { getEquitySettings } from "@/lib/equity/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// equity.direct — the qualification form that appears on all 100 keyword pages.
//
// Two things make this worth more than a generic contact form:
//   • The slug is captured, so we know the stated reason before anyone asks.
//   • Consent wording, time and IP are stored, so a follow-up call is provable.
//
// It is deliberately forgiving about what is required. A homeowner who gives us
// a ZIP and a phone number is a lead; insisting on a full application before we
// know anything about them loses people who would have converted.

const digits = (s: unknown) => String(s ?? "").replace(/\D/g, "");
const clean = (s: unknown, max = 200) => String(s ?? "").trim().slice(0, max);
/** Dollars (string or number) to integer cents, without float drift. */
const toCents = (v: unknown): number => {
  const n = Math.round(Number(String(v ?? "").replace(/[^0-9.]/g, "")) * 100);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

async function nextRef(): Promise<string> {
  const c = await db.counter.upsert({
    where: { name: "eq_lead" },
    update: { value: { increment: 1 } },
    create: { name: "eq_lead", value: 1 },
  });
  return `ED-${String(c.value).padStart(6, "0")}`;
}

export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const gate = await guardForm(req, "equity_lead", b, {
    names: [clean(b.firstName, 80), clean(b.lastName, 80)],
    texts: [clean(b.reasonNote, 2000)],
    email: clean(b.email, 200),
    phone: clean(b.phone, 40),
  });
  if (gate.blocked) return gate.response;

  const email = clean(b.email, 200).toLowerCase();
  const phone = digits(b.phone).slice(0, 15);
  const zip = digits(b.zip).slice(0, 5);

  // One contact method and a ZIP is the floor. Below that there is nothing to
  // follow up and nothing to assess.
  if (!email && !phone) {
    return NextResponse.json(
      { ok: false, error: "Please give us an email address or a phone number." },
      { status: 400 },
    );
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "That email address does not look right." }, { status: 400 });
  }
  if (phone && phone.length < 10) {
    return NextResponse.json({ ok: false, error: "That phone number looks incomplete." }, { status: 400 });
  }
  if (!zip || zip.length !== 5) {
    return NextResponse.json({ ok: false, error: "We need the property ZIP code." }, { status: 400 });
  }

  // Resolve the keyword page so category is recorded from our own data rather
  // than from whatever the client posted.
  const use = bySlug(clean(b.slug, 120));

  // Partner attribution comes from the cookie the middleware set on first
  // touch, never from the posted body — otherwise anyone could assign a lead
  // to any partner by editing a request.
  const refCode = clean(req.cookies.get("eq_ref")?.value, 16).toLowerCase();
  const partner = /^[a-z0-9]{4,16}$/.test(refCode)
    ? await db.eqPartner.findUnique({ where: { code: refCode }, select: { id: true, active: true } })
        .catch(() => null)
    : null;

  const estValue = toCents(b.estValue);
  const mortgageBal = toCents(b.mortgageBal);
  const estEquity = Math.max(0, estValue - mortgageBal);

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") || "";
  const consented = b.consent === true;

  try {
    const lead = await db.eqLead.create({
      data: {
        ref: await nextRef(),
        firstName: clean(b.firstName, 80),
        lastName: clean(b.lastName, 80),
        email, phone, zip,
        propertyType: clean(b.propertyType, 60),
        estValue, mortgageBal, estEquity,
        slug: use?.slug ?? "",
        category: use?.category ?? "",
        reasonNote: clean(b.reasonNote, 2000),
        amountWanted: toCents(b.amountWanted),
        timeline: clean(b.timeline, 60),
        partnerId: partner?.active ? partner.id : "",
        vid: clean(req.cookies.get("rocket_vid")?.value, 60),
        referer: clean(req.headers.get("referer"), 500),
        utm: JSON.stringify(b.utm && typeof b.utm === "object" ? b.utm : {}).slice(0, 1000),
        ip,
        userAgent: clean(req.headers.get("user-agent"), 400),
        // Only stored when they actually ticked it. An unconsented lead can
        // still be emailed, but it must never be called or texted.
        consentText: consented ? CONSENT_TEXT : "",
        consentAt: consented ? new Date() : null,
        consentIp: consented ? ip : "",
      },
      select: { id: true, ref: true },
    });

    await db.eqLeadNote.create({
      data: {
        leadId: lead.id,
        kind: "system",
        authorName: "Website",
        body: use
          ? `Started on ${use.h1} (/${use.category}/${use.slug}).`
          : "Started on the site without a keyword page.",
      },
    }).catch(() => null);

    // They become an account holder here, not in a second step. The form was
    // the signup; asking again would lose most of them.
    const account = email
      ? await upsertAccount({
          email,
          firstName: clean(b.firstName, 80),
          lastName: clean(b.lastName, 80),
          phone, zip, leadId: lead.id,
        })
      : null;

    // Sign them straight in so the account area is available immediately —
    // waiting on an email to arrive before they can use anything is where
    // these flows usually lose people.
    if (account) {
      await createAccountSession({
        id: account.id, email: account.email, firstName: account.firstName,
      }).catch(() => null);
    }

    const settings = await getEquitySettings();

    // Both emails are fired without blocking the response. Every attempt is
    // logged to EqEmailLog, so a broken mailbox shows up in the back office
    // rather than silently swallowing welcome emails.
    void (async () => {
      if (account) {
        await sendWelcome({
          to: account.email,
          firstName: account.firstName,
          ref: lead.ref,
          reason: use?.reason ?? "",
          zip, estEquity,
          token: account.token,
        }).catch(() => null);
      }
      await notifyNewLead({
        ref: lead.ref,
        name: [clean(b.firstName, 80), clean(b.lastName, 80)].filter(Boolean).join(" "),
        email, phone, zip,
        reason: use?.reason ?? "",
        consented, estEquity,
      }).catch(() => null);
    })();

    return NextResponse.json({
      ok: true,
      ref: lead.ref,
      hasAccount: Boolean(account),
      // Where to send them next, and how long to let them read the
      // confirmation first. Blank means stay on the page.
      redirectUrl: settings.redirectUrl,
      redirectDelay: settings.redirectDelay,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Something went wrong saving that. Please try again." },
      { status: 500 },
    );
  }
}
