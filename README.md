# medigap.plus — The Senior Marketing Network (God Platform)

The white-label backend + consumer marketing engine for the entire over-65 product network:
Medicare, Medicare Advantage, Medigap supplements, senior housing, senior care, Alzheimer's care,
life & final expense. One backend (`medigap.plus`) runs unlimited marketing sites by hostname.

**The whole system is designed to push phone calls to 1-800-MEDIGAP (1-800-633-4427)** — the
highest-value asset — and to capture, route, monetize, and re-market every lead.

## Stack
- **Next.js 16** (App Router, React 19, Turbopack) + **Tailwind v4**
- **Prisma** ORM — **SQLite for dev** (zero-install), **Postgres for production** (high volume)
- Custom JWT auth (`jose`) + bcrypt, role-based access, forced first-login password change

## Quick start
```bash
npm install
npm run setup     # generate client, create DB, seed God account + demo data
npm run dev       # http://localhost:3000
```

### God account (set the real password on first login)
- **Email:** `jeff.cline@me.com`
- **Temp password:** `TEMP!234` (forces a password change on first login)
- Demo logins (all `TEMP!234`): `agent@demo.com`, `advertiser@demo.com`, `investor@demo.com`,
  `marketing@demo.com`, `accounting@demo.com`

## What's built (this foundation)
**Consumer side** — flagship homepage, 7 vertical landing pages (Medicare, MA, Medigap, housing,
care, Alzheimer's, life), lead-capture, push-to-call everywhere, partner landing pages, centralized
privacy/terms, network footer.

**God dashboard** (`/dashboard`) — business-unit tabs + left nav, revenue/spend/profit KPIs,
arbitrage-ratio + velocity gauges, live money ticker, pinned autonomous AI questions, full ledger.

**Business units** — Agents (pay-per-call auction, $99/mo seats), Advertisers (CPC), Money Words,
Live Upsells, Autonomous Risk (carrier mode), Investors (profit waterfall), Accounting, Marketing.

**Management** — Leads CRM (with God-only voice-AI journey), Calls, Marketing Sites (white-label
launcher), User management, **Integrations checklist**, Autonomous Logic, Missed Opportunity, Settings.

**External portals** — `/agent`, `/advertiser`, `/investor` (role-gated; God can view all).

**Integrations hub** (`/dashboard/integrations`) — key slots + step-by-step setup for Twilio, Groq,
Klaviyo, Zapmail, Datamoon, Stripe, Google Ads, Meta, Vibe.co (CTV), Claude, affiliate networks.

## Deferred / wired-next (need keys + careful testing with real money)
Live Twilio call routing & whisper · Groq voice intake · real bidding auction execution ·
Stripe charges/ACH sweeps · Klaviyo/Zapmail sends · Datamoon append · Google/Meta spend sync ·
autonomous decision execution. Each page marks these with a "Wired next:" note.

## Production (Postgres)
1. In `prisma/schema.prisma` set `datasource.provider = "postgresql"`.
2. Set `DATABASE_URL` to your Postgres URL and a strong `AUTH_SECRET`.
3. `npm run db:push && npm run db:seed && npm run build && npm start`.

> Not affiliated with or endorsed by the U.S. government or the federal Medicare program.
