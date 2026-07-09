# CORE — Operating Knowledge (auto-loaded by Claude Code)

You are working on **The Core** — a shared, multi-tenant Next.js platform that powers many of Jeff Cline's
websites from one backend. This file is your memory of how everything fits together. Read it before acting.
Owner/god: **jeff.cline@me.com**. When unsure, ask; prefer additive, reversible changes; commit often.

## This folder
- `/var/www/projects/core` is a clone of **git@github.com:jeff-cline/medigap.git** (the Core repo).
- Make changes here, then use the terminal's **⤓ Sync** (commit + push) and **↻ Pull** buttons.
- Also read `AGENTS.md` — Next.js here has breaking changes; check `node_modules/next/dist/docs/` before writing Next code.

## Infrastructure
- **Server (this box):** Vultr `137.220.56.129`. Live app at `/var/www/medigap`, runs on **port 3020** under
  pm2 process **`medigap`**. nginx reverse-proxies each domain → 3020; SSL via certbot.
- **This terminal itself** (`goterm`) is a separate pm2 app on **:3041**, served at **el.ag/go**.
- **Stack:** Next.js 16 (App Router, Turbopack), React 19, Tailwind v4, Prisma 6 (SQLite in dev, **Postgres in
  prod** — real data: ~13.7k leads / ~24k calls, so be careful), TypeScript.
- **Deploy (normal path):** from Jeff's Mac, `sh scripts/deploy.sh` (rsync repo → server, build on server,
  `pm2 reload medigap`, smoke-test; takes a Postgres backup, blocks destructive schema changes).
  Post-commit hook auto-pushes to GitHub. Verify sync with `git rev-list --left-right --count origin/main...HEAD` = `0 0`.
- **Deploy from THIS box (code-only changes):** `rsync -a --exclude node_modules --exclude .next --exclude .git
  /var/www/projects/core/ /var/www/medigap/ && cd /var/www/medigap && npm run build && pm2 reload medigap`.
  For schema changes, use the repo's deploy.sh guards instead — don't `prisma db push --accept-data-loss` on prod.

## Multi-tenant routing (how white-label sites work)
- `src/middleware.ts` rewrites each hostname to an app segment; shared Core routes (login, dashboard, api,
  _next, etc.) are "reserved" and pass through. Pattern per host: `host === "x.com" → rewrite path to /segment`.
- **Sites on the Core:**
  - `medigap.plus` — main Core (root).
  - `1-800-medigap.com` — senior brand → `/medigap-home` (MEDIGAP always capitalized).
  - `doublewide.ai` → `/doublewide` (micro-influencer media co).
  - `el.ag` → `/medigapp/directory` (SEO/AEO offer site; also hosts this terminal at /go).
  - `medig.app` → `/medigapp` (Rakuten offers). **NOTE: DNS currently points to 69.48.151.143, NOT the Core —
    it is NOT live on this box.** To make it live: repoint A record → 137.220.56.129, then certbot.
  - `experientialmarketing.ai` → `/xm`; its JV CRM/project board is at **/partner** (owner: s@savagexm.com,
    role marketing_partner). Board updates email Jeff + s@savagexm.com via Zapmail.
  - `exitoptimization.com` → `/exit` (SEO/AEO lead-gen + calculators).
  - `healthinsuranceapplication.com` → `/hia` (programmatic health-insurance application repository).
- **Adding a new site:** point DNS A `@`+`www` → 137.220.56.129 → add a host block in `src/middleware.ts` →
  add an nginx server block proxying to :3020 → `certbot --nginx -d domain -d www.domain`. Gotcha: an old
  `whitelabels.bak.*` file in `sites-enabled` can hijack a domain to port 3000 — make sure your dedicated
  block has the `listen 443 ssl` listener and loads first.

## Integrations & how to USE them (all keys live in the DB `Integration` table / env — code loads them for you)
- **Zapmail** = THE cold-email engine (6 seasoned Google mailboxes). Send with
  `sendEmail(to, subject, htmlString, "zapmail", { text })` from `src/lib/email.ts`, OR via the Core API
  `POST /api/core/email {provider:"zapmail"}`. (Raw API uses the `x-auth-zapmail` header; the lib handles it.)
- **Google Workspace** = transactional email; `sendEmail(...)` defaults to `"google_workspace"`.
  ⚠️ `sendEmail`'s 3rd arg is an **HTML string** (not an object).
- **Twilio** = SMS: `sendSms({ to, body })` from `src/lib/sms.ts`, or `POST /api/core/sms`.
- **DataForSEO** = keyword volume/CPC/SERP. The 1-800-medigap SEO plan (15 silos / 128 pages) is at
  `/dashboard/seo-plan` (awaiting approval before build).
- **AdSense** (per-site toggle + pub IDs, reporting), **Rakuten** (medig.app offers), **ElevenLabs** (voice
  clone — Wink voice), **Sync.so** (lip-sync), **Runway** (video), **PredictiveData** (visitor ID + append),
  **Stripe**, **Klaviyo**, **Facebook/Meta**. All configured under `/dashboard/integrations`.

## The Core API (reusable services for OTHER projects — this is how sister apps use Zapmail etc.)
- **Manifest:** `GET https://medigap.plus/api/core` (public, machine-readable). Human docs: `/core-api`.
- **Endpoints (auth: headers `x-core-key` + `x-core-secret`, plus a scope):**
  - `POST /api/core/email` (scope `email:send`) — send via Zapmail/Workspace.
  - `POST /api/core/sms` (scope `sms:send`) — Twilio.
  - `POST /api/core/lead` (scope `lead:create`) — push a lead into the CRM.
  - `GET /api/core/ping` — verify a key.
- Issue/revoke keys at **/core-api** (god only). Verification code: `src/lib/corekeys.ts` (`verifyCoreKey`).

## Auth & roles
- Session cookie `medigap_session` (jose JWT, `AUTH_SECRET`, host-only, 7d). `getSession()`, `login()`,
  `createSession()`, `isRealGod()` in `src/lib/auth.ts`. Passwords: bcryptjs.
- Roles are freeform strings: god | agent | advertiser | investor | marketing | accounting | moneywords |
  risk | marketing_partner | owner | adpartner | consumer. God home = `/unified`; staff = `/dashboard`;
  partners bounce to their portal (agent→/agent, marketing_partner→/partner, owner/adpartner→/account).
- **Founder God rule:** jeff.cline@me.com always has a god account; `ensure-god.ts` runs every deploy.

## Building patterns proven this session
- **SEO/AEO engine** (see `src/app/hia/*` + `src/lib/health*.ts`): dataset-driven pages from a JSON seed;
  per-page metadata (title/desc/canonical/OG/Twitter) + JSON-LD (Organization, WebPage, BreadcrumbList,
  FAQPage, CollectionPage, DigitalDocument); `/sitemap.xml`, `/sitemap.html`, `/robots.txt`, `/aeo-sitemap`;
  a `linkify` helper for internal/external anchor rules; a `/out` redirect that 301s dead links home.
- **Partner CRM scoping** keys off `Site.ownerId` (a site's owner sees only that site's leads).
- Transient build fixes seen: `rm -rf .next` + `npm install jose` when Turbopack throws "parseModule".

## House rules
- MEDIGAP is always capitalized. Every website must live in GitHub and stay pushed (source of truth).
- Prod Postgres has real customer data — back up + drift-check before schema changes; never --accept-data-loss.
- This terminal runs Claude **as root with --dangerously-skip-permissions** (IS_SANDBOX=1). No approval
  prompts — scope work to a project folder and Sync often so you can roll back.
