# /fire — Predictive Data Outbound Email Engine — Design

**Date:** 2026-07-20
**Status:** Design for review
**Owner:** Jeff Cline
**Entry point:** teal "⚡ Activate Predictive Data" button on `/dashboard/u65` → `/fire`

## 1. Goal

A full outbound cold-email campaign system on the Core, built on the **existing Zapmail
integration**, that: uploads contact lists (CSV), sends **text-first** email templates in
**multi-step follow-up sequences**, drips them at a controlled **emails-per-hour** pace,
**rotates only warm Zapmail mailboxes** without exceeding a spam-safe **per-mailbox daily cap**,
**alerts the founder to add mailboxes** when capacity is short, and reports **sent / opened /
left / pace** on a dashboard. This is the "full outbound funnel starter" for the medigap campaign.

## 2. Locked decisions
- **Recipient field:** default **`business_email`**; per-campaign selectable (`business` | `personal` | `personal→business fallback`).
- **Per-mailbox daily cap:** **30/mailbox/day** (a Setting, adjustable). Total daily capacity = warm mailboxes × cap.
- **Scope:** build the **full system including sequences** now.
- **Body:** two modes per campaign/step — **Text** (default) and **HTML**. You can do both; pick per campaign.
  - **Text mode (default):** pure plain-text, **no tracking pixel** → best inbox delivery, **no open tracking** (accepted trade-off: inbox > tracking).
  - **HTML mode:** an HTML body with an optional **open-tracking pixel** (per-campaign toggle). Use when you want formatting and/or opens.

## 3. Reused infrastructure (already built — do not rebuild)
| Piece | Where | Use |
|---|---|---|
| Mailbox rotation | `nextMailbox()` in `lib/zapmail.ts` | pick the next warm mailbox round-robin |
| Mailbox pool + counts | `getZapConfig()`, `verifyZapmailApi()`, `refreshMailboxes()` | the warm pool + total mailbox count |
| Send + log + open pixel | `sendEmail(zapmail)` in `lib/email.ts` → `EmailMessage` | actual SMTP send, per-send log, `openToken`/`openedAt` |
| Templates | `EmailTemplate` model | saved default templates |
| Cron pattern | `/api/autonomous` (cron → API endpoint) | mirror for the drip tick |

## 4. Data model (new — additive)
```prisma
model EmailList {
  id        String   @id @default(cuid())
  name      String
  source    String   @default("predictive-data")
  fileName  String   @default("")
  total     Int      @default(0)   // rows in the CSV
  sendable  Int      @default(0)   // rows with a usable email for the chosen field
  createdAt DateTime @default(now())
  contacts  EmailContact[]
}

model EmailContact {
  id        String   @id @default(cuid())
  listId    String
  list      EmailList @relation(fields: [listId], references: [id], onDelete: Cascade)
  email     String   @default("")   // chosen field's value (may be "")
  business  String   @default("")   // business_email
  personal  String   @default("")   // first personal email
  firstName String   @default("")
  lastName  String   @default("")
  company   String   @default("")
  raw       String   @default("{}") // full CSV row as JSON (for future use)
  createdAt DateTime @default(now())
  @@index([listId])
}

model EmailCampaign {
  id         String   @id @default(cuid())
  name       String
  listId     String
  emailField String   @default("business")   // business | personal | personal_business
  perHour    Int      @default(20)            // global send pace
  tracking   Boolean  @default(false)         // open pixel (HTML mode only); text mode never tracks
  status     String   @default("draft")       // draft | running | paused | done
  createdAt  DateTime @default(now())
  startedAt  DateTime?
  steps      EmailSequenceStep[]
}

model EmailSequenceStep {
  id         String  @id @default(cuid())
  campaignId String
  campaign   EmailCampaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  order      Int     @default(0)   // 0 = Day 1
  dayOffset  Int     @default(0)   // days after enrollment (Day 1 = 0)
  mode       String  @default("text") // text | html
  subject    String  @default("")
  body       String  @default("")  // plain-text body (mode=text); supports {{first_name}} {{last_name}} {{company}}
  html       String  @default("")  // HTML body (mode=html); merge tokens supported
  templateId String?               // optional link to a saved EmailTemplate
  @@index([campaignId, order])
}

model CampaignRecipient {
  id         String   @id @default(cuid())
  campaignId String
  contactId  String
  email      String
  firstName  String   @default("")
  status     String   @default("pending") // pending | in_progress | done | bounced | unsub | no_email
  stepIndex  Int      @default(0)          // which sequence step is next
  nextDueAt  DateTime @default(now())      // when the next step should send
  lastSentAt DateTime?
  createdAt  DateTime @default(now())
  @@index([campaignId, status, nextDueAt])
  @@unique([campaignId, contactId])
}
```
`EmailMessage` is reused for the send log; each send sets `batch = campaignId`, `templateName`,
`fromEmail` (the rotating mailbox), and `openToken` for the pixel. **No change to `EmailMessage`.**

## 5. CSV upload + parsing
- Upload on `/fire` (multipart file field) → `POST /api/fire/lists`.
- Parse the **query_run format** (header row present). Extract per row: `first_name`, `last_name`,
  `personal_emails` (first email if comma/semicolon-list), `business_email`, `company_name`.
- Store one `EmailContact` per row (full row in `raw`). **Dedup by email within the list.**
- `sendable` = rows whose chosen `emailField` resolves to a non-empty, plausibly-valid address.
- Same format every upload; a re-upload of the same data is idempotent per (list, email).

## 6. Templates + merge
- Per step, a **mode** (Text or HTML). **Text** = subject + plain-text body editor (default, no tracking). **HTML** = subject + HTML body editor (formatting and/or open tracking).
- Merge tokens in either mode: `{{first_name}}`, `{{last_name}}`, `{{company}}` (blank if missing; sentences degrade gracefully).
- **Default templates:** a "Templates" editor to save/reuse named `EmailTemplate`s (each can hold a subject + text and/or HTML); a sequence step can load from one.

## 7. Sequences (Day 1 + follow-ups)
- A campaign has ordered steps: **Day 1** (dayOffset 0) + **"add another day"** (Day N, arbitrary offsets), each with its own subject/body.
- On enrollment, a `CampaignRecipient` starts at step 0, `nextDueAt = now`.
- After a step sends: if a next step exists, `stepIndex++`, `nextDueAt = enrolledAt + nextStep.dayOffset days`; else `status = done`.
- **A reply or unsubscribe stops the sequence** for that recipient (status `done`/`unsub`) — no more follow-ups.
- **Re-email a list:** create a new campaign over the same list with a different template/sequence.

## 8. Throttle · mailbox rotation · daily caps · capacity alerts
- **Per-campaign `perHour`** sets the global pace.
- **Per-mailbox daily cap** (Setting `firePerMailboxDailyCap`, default 30). Before sending from a mailbox, check its sends **today** (`EmailMessage` where `fromEmail = mb & createdAt >= startOfDay`) < cap; skip if at cap.
- **Warm-only:** send only from mailboxes in the Zapmail pool (`ZapConfig.mailboxes`) — these are the provisioned/seasoned ones. (Future: an explicit per-mailbox "warm" flag; for now the pool = warm.)
- **Capacity + upgrade alert:** daily capacity = `warmMailboxes × cap`. If a running campaign's due queue for the day exceeds capacity, the engine (a) throttles to capacity and (b) **emails the founder once/day** ("Fire: N emails queued, capacity M/day — add mailboxes in Zapmail") and raises a **dashboard banner**.

## 9. Drip engine — `POST /api/fire/tick` (cron every 5 min)
Protected by an env cron key (`FIRE_CRON_KEY`). Each tick:
1. Load running campaigns + the warm mailbox pool + today's per-mailbox counts.
2. **Hourly budget** per campaign = `perHour`; **tick budget** = `ceil(perHour * 5/60)` (with an hour-window ledger so we never exceed perHour/hour).
3. Select due `CampaignRecipient`s (`status in pending/in_progress`, `nextDueAt <= now`), oldest first, up to the tick budget **and** remaining total mailbox capacity.
4. For each: pick `nextMailbox()` (skipping mailboxes at their daily cap), render the current step (merge fields).
   - **Text mode:** send **pure plain-text only** (no HTML part, no pixel) — maximum inbox placement.
   - **HTML mode:** send HTML (+ a plain-text alternative); if the campaign's tracking toggle is on, inject the `openToken` open pixel.
   Then log (`batch = campaignId`), advance the recipient (§7).
5. On send error/bounce → mark recipient `bounced`, keep going.
6. Emit capacity alert if warranted (§8).
Idempotent and safe to run frequently; it simply does nothing when nothing is due.

## 10. `/fire` dashboard (auth-gated, mirrors dashboard chrome)
- **KPIs:** Sent · **Opened + open rate** (HTML-tracked campaigns only; text campaigns show "tracking off — inbox-first") · Left to send · **Pace/day** (rolling) + **projected finish date**.
- **Capacity strip:** warm mailboxes · daily capacity · used today · "add mailboxes" alert if short.
- **Campaigns list:** name, list, status, sent/left, pace; start/pause; drill-in.
- **Compose/sequence builder:** name, pick list, pick email field, per-hour, tracking toggle; **Day 1 + "add another day"** steps each with subject/body (text) and optional "load default template".
- **Lists:** upload CSV, see total/sendable, reuse across campaigns.
- **Templates:** save/edit named default templates.
- **Send log:** recent `EmailMessage`s (to, mailbox, opened, time), filterable by campaign.

## 11. Deployment
- New page `/fire` + `/api/fire/*` routes deploy with the Core (rsync → `prisma db push` for the new models → build → `pm2 restart medigap`).
- **Cron:** add a crontab entry on the box: `*/5 * * * * curl -s -H "x-fire-key: $FIRE_CRON_KEY" https://medigap.plus/api/fire/tick`. `FIRE_CRON_KEY` in server env only.
- Zapmail API key + mailbox pool already configured in the `zapmail` Integration (verify count via `verifyZapmailApi`).

## 12. Non-goals (now)
- No WYSIWYG HTML *builder* — HTML mode is a raw-HTML editor; text mode is plain-text. Text-first for deliverability.
- No list-segmentation/filtering UI (send to the whole list minus no-email/unsub).
- No A/B testing, no reply-content parsing beyond "a reply stops the sequence."

## 13. Success criteria
- Teal button on `/dashboard/u65` opens `/fire`.
- Upload the sample CSV (2,311 rows) → list with total/sendable counts.
- Create a campaign (business_email, Day-1 + a follow-up step, per-hour rate, tracking on).
- Start it → the tick drips emails at the set pace, rotating warm mailboxes, never exceeding 30/mailbox/day, logging each send.
- Dashboard shows sent / opened / left / pace / projected finish, and a capacity/upgrade alert when the queue exceeds daily capacity.
- Follow-up steps send on their day offsets; a reply/unsub stops that recipient.
- Nothing else on the Core is affected.
