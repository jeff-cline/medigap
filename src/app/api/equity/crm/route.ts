import { NextResponse } from "next/server";
import { getSession, isGod } from "@/lib/auth";
import { db } from "@/lib/db";
import { invitePartner } from "@/lib/equity/partner-auth";
import { sendPartnerInvite } from "@/lib/equity/notify";
import { saveEquitySettings, getEquitySettings } from "@/lib/equity/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// CRM actions for equity.direct. God account only — this is not a public form,
// so it is not in PUBLIC_FORM_ENDPOINTS and does not call guardForm; the
// session check is the gate.
export async function POST(req: Request) {
  const s = await getSession();
  if (!s || !isGod(s)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  // Session carries uid/email/role but no display name, so the email is what
  // goes on the audit trail.
  const who = s.email || "Staff";

  // ── move a lead along ───────────────────────────────────────────────
  if (b.action === "stage") {
    const stage = String(b.stage ?? "");
    const allowed = ["lead", "contacted", "qualified", "submitted", "funded", "declined", "lost"];
    if (!allowed.includes(stage)) {
      return NextResponse.json({ ok: false, error: "Unknown stage." }, { status: 400 });
    }
    const id = String(b.id ?? "");
    const before = await db.eqLead.findUnique({ where: { id }, select: { stage: true } });
    if (!before) return NextResponse.json({ ok: false, error: "No such lead." }, { status: 404 });

    await db.eqLead.update({
      where: { id },
      data: {
        stage,
        // Anything past "lead" means somebody actually made contact.
        lastContact: stage === "lead" ? undefined : new Date(),
      },
    });
    // Stage changes are logged rather than silently applied — a CRM whose
    // history only contains typed notes is missing most of what happened.
    await db.eqLeadNote.create({
      data: {
        leadId: id, kind: "stage_change", authorId: s.uid, authorName: who,
        body: `Stage ${before.stage} → ${stage}`,
      },
    }).catch(() => null);

    return NextResponse.json({ ok: true });
  }

  // ── log an interaction ──────────────────────────────────────────────
  if (b.action === "note") {
    const body = String(b.body ?? "").trim().slice(0, 4000);
    if (!body) return NextResponse.json({ ok: false, error: "Nothing to add." }, { status: 400 });
    const kind = ["note", "call", "email", "sms"].includes(String(b.kind)) ? String(b.kind) : "note";

    await db.eqLeadNote.create({
      data: { leadId: String(b.id ?? ""), kind, body, authorId: s.uid, authorName: who },
    });
    if (kind !== "note") {
      await db.eqLead.update({
        where: { id: String(b.id ?? "") }, data: { lastContact: new Date() },
      }).catch(() => null);
    }
    return NextResponse.json({ ok: true });
  }

  // ── partners ────────────────────────────────────────────────────────
  if (b.action === "invite") {
    const r = await invitePartner({
      email: String(b.email ?? ""),
      name: String(b.name ?? ""),
      company: String(b.company ?? ""),
      vertical: String(b.vertical ?? ""),
    });
    if (!r.ok) return NextResponse.json(r, { status: 400 });
    // Best-effort: a mail failure must not lose the partner record, and the
    // dashboard shows the invite URL so it can always be sent by hand.
    await sendPartnerInvite(r.partner.email, r.partner.name, r.token).catch(() => null);
    return NextResponse.json({ ok: true, code: r.partner.code });
  }

  if (b.action === "reinvite") {
    const p = await db.eqPartner.findUnique({ where: { id: String(b.id ?? "") } });
    if (!p) return NextResponse.json({ ok: false, error: "No such partner." }, { status: 404 });
    const r = await invitePartner({ email: p.email, name: p.name, company: p.company, vertical: p.vertical });
    if (!r.ok) return NextResponse.json(r, { status: 400 });
    await sendPartnerInvite(p.email, p.name, r.token).catch(() => null);
    return NextResponse.json({ ok: true });
  }

  if (b.action === "toggle-partner") {
    await db.eqPartner.update({
      where: { id: String(b.id ?? "") }, data: { active: b.active === true },
    }).catch(() => null);
    return NextResponse.json({ ok: true });
  }

  // ── settings ────────────────────────────────────────────────────────
  if (b.action === "settings") {
    await saveEquitySettings({
      redirectUrl: b.redirectUrl === undefined ? undefined : String(b.redirectUrl),
      redirectDelay: b.redirectDelay === undefined ? undefined : Number(b.redirectDelay),
      phone: b.phone === undefined ? undefined : String(b.phone),
      alertEmails: b.alertEmails === undefined ? undefined : String(b.alertEmails),
    });
    const saved = await getEquitySettings();
    // Echo back what was stored: a redirect URL that failed validation is
    // silently blanked, and the operator needs to see that it did.
    return NextResponse.json({ ok: true, settings: saved });
  }

  return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });
}
