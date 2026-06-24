# Founder Communication console — Slice 1

**Date:** 2026-06-24 · **Status:** Approved, building

## Goal
A section on `/dashboard/jv` where the founder (and his assistant, via the existing
persona/impersonation model) personally sends email in his voice, **always choosing
which engine to send from**, with template management, a no-resend guard, and every
message logged to the CRM tagged `FOUNDER COMMUNICATION`.

## Send engines (picker is REQUIRED on every send)
- **Personal (Google)** → `google_workspace` integration (support@1800medigap.com via App Password)
- **Cold (Zapmail)** → `zapmail`
- **SMTP (generic)** → new `smtp` integration key
- **Opted-in (Klaviyo)** → `klaviyo` — blasts only; one-at-a-time sends use the SMTP-based engines.

One-at-a-time only in this console (mass blasts stay on the Communications page / opted-in).

## Data model (additive)
**EmailMessage** — add: `direction` (outbound|inbound, default outbound), `engine`,
`fromEmail`, `templateId?`, `templateName`, `founder` (bool), plus Slice-2 tracking columns
added now to avoid a second migration: `openToken`, `openedAt?`, `repliedAt?`, `messageId`.

**EmailTemplate** (new): id, name (unique), subject, html, text, createdAt, updatedAt.

## Logic (`src/lib/founder.ts`)
- `ENGINES` map (key → label → integration key) + `engineReady(engine)`.
- `sendFounderEmail({leadId, engine, subject, html, text, templateId, templateName})`:
  send via engine → create EmailMessage (founder=true, direction=outbound, engine, fromEmail,
  template, leadId, status) → tag the lead `FOUNDER COMMUNICATION` → return {ok,error}.
- `founderContacts()`: leads tagged founder-comm or JV, each with their sent founder emails
  (template + engine + status + sentAt) for the at-a-glance list.
- **No-resend guard:** block sending (templateId → person) that already went out, UNLESS a
  different engine than the prior send is chosen (deliverability fallback).

## API (god + assistant; impersonator = god)
- `POST /api/founder/email` — `{leadId, engine, subject, html, text, templateId?, templateName?, testTo?}`.
- `GET/POST /api/founder/templates` — list / create-update-delete.

## UI (`src/components/jv/FounderComms.tsx`, added to /dashboard/jv)
- Contact list: name + chips of templates already sent (engine, status). Click → existing deal page.
- Compose modal: recipient, **required engine picker**, template picker (fills subject/HTML/text,
  editable), `{first}` merge, send. No-resend guard enforced client+server.
- Template maker: name + subject + HTML + plain-text, save/edit/delete.
- Founder emails also rendered on the deal page (`JvDeal`) timeline.

## Deferred (later slices)
Slice 2: open/reply tracking (pixel + IMAP), inbound email persistence + person-matching,
"not opened → resend" notifications, fully-merged single timeline. Slice 3: per-user tab/nav access.

## Verify
Build green; prisma db push (SQLite local). Seed a contact + template; send via SMTP-based
engine in dev (or mock); assert EmailMessage row (founder=true, engine, leadId), lead tagged
FOUNDER COMMUNICATION, no-resend blocks same template+engine and allows different engine.
Engines with no integration fail gracefully ("connect <engine> first"). No regression to
existing Communications/SMS send.
