# AI Site Builder — "Engineer New Prompt" → one-shot site generation

**Date:** 2026-06-23
**Status:** Approved design, pre-implementation

## Problem

Launching a marketing site from `/dashboard/sites` only creates a `Site` DB row. It does
NOT build the multi-page resource site the user describes in the launch prompt. The user
wants: give a prompt once, and the platform uses Claude (+ research) to generate a full,
styled, multi-page site in one shot — no back-and-forth.

## Goal (v1 scope)

A **"⚙ Engineer new prompt"** button per site on `/dashboard/sites` that runs:

1. **Engineer** — user types a rough prompt; Claude expands it into a structured **build brief**.
2. **Review** — the brief renders in a panel; user can edit and approve.
3. **Build** — background job generates all pages and publishes them.

Generated site = **homepage + 6–8 resource pages + a 20-question FAQ + ~6 blog posts**, every
page lead-capture wired (form + click-to-call to 1-800-MEDIGAP), 1-800-MEDIGAP as sponsor.

**v2 (explicitly deferred):** interactive calculators, downloadable PDFs.

## Hard constraints

- **Styling:** every generated page reuses the site's OWN homepage styling — same header,
  `theme-light`, brand color tokens — via one shared renderer. No bespoke per-page CSS.
- **Footer:** marketing sites get a SLIM footer (privacy/terms + 1-800-MEDIGAP only). No full
  link list back to medigap.plus.
- **No collisions:** generated pages live at their own slugs (`/faq`, `/resources/<slug>`,
  `/blog/<slug>`) so they never shadow existing network routes (`/medicare`, `/medigap`, …).
- **Never break a build:** if photos or DataForSEO are unavailable, fall back gracefully
  (SVG art; skip keyword data). A missing optional integration must not fail the build.

## Integrations used (all already present except Pexels, now added)

- **Claude (Anthropic)** — `integration key:"claude"`, model `claude-opus-4-8`, via
  `api.anthropic.com/v1/messages` (pattern already in `src/lib/vision.ts`). Writes brief + content.
- **DataForSEO** — `src/lib/dataforseo.ts` `getKeywordCpcCents()` — live keyword CPC for SEO targeting.
- **Pexels** — NEW `integration key:"pexels"` (key stored 2026-06-23, 25k req/mo). Royalty-free
  photos per page. Fallback: existing senior/family SVG art (`src/components/SeniorArt.tsx`).

## Data model

New Prisma model **`SitePage`**:

```
model SitePage {
  id        String   @id @default(cuid())
  siteId    String
  site      Site     @relation(fields: [siteId], references: [id], onDelete: Cascade)
  kind      String   @default("page")   // home | page | faq | blog
  slug      String                       // "" for home, "faq", "resources/taking-the-keys-away", "blog/<slug>"
  title     String   @default("")
  metaDescription String @default("")
  heroHeadline String @default("")
  blocks    String   @default("[]")      // JSON: ordered content blocks (typed) — the page body
  keywords  String   @default("[]")      // JSON: target keywords (+ optional cpc)
  images    String   @default("[]")      // JSON: [{url, alt, photographer, photographerUrl}]
  order     Int      @default(0)
  published Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@unique([siteId, slug])
}
```

Additions to **`Site`**:
- `buildStatus String @default("none")` — none | engineering | brief_ready | building | complete | error
- `buildBrief  String @default("{}")` — the approved/engineered brief JSON
- `buildProgress String @default("{}")` — {done, total, current, error} for the progress UI
- `pages SitePage[]` relation

### Content block types (the typed JSON the renderer understands)
`hero`, `richText` (headed prose), `featureGrid` (cards), `faq` (Q/A list), `cta` (call/form band),
`imageWithText`, `stat`, `quote`. Claude is constrained to emit ONLY these types with a fixed schema
so rendering is deterministic and always matches homepage styling.

## Components & flow

### Brief schema (Claude output, validated)
```
{
  audience: string,
  palette: { brandColor: "#hex" },
  heroHeadline: string,
  pages:   [{ slug, title, intent, keywords: [string] }],   // 6-8 resource pages
  faqs:    [{ q, a? }],                                       // 20 questions (a filled at build)
  blog:    [{ slug, title, intent, keywords: [string] }],    // ~6 posts
  sponsorPhone: "1-800-MEDIGAP"
}
```

### API routes
- `POST /api/sites/engineer` `{ id, prompt }` → Claude expands prompt → brief JSON. Saves
  `buildBrief`, sets `buildStatus="brief_ready"`. Returns brief. God/staff only.
- `POST /api/sites/build` `{ id, brief }` → saves edited brief, sets `buildStatus="building"`,
  kicks off **background** generation (fire-and-forget, like `appendLeadBackground`), returns immediately.
- `GET  /api/sites/[id]/build-status` → `{ buildStatus, buildProgress }` for polling.

### Build worker (`src/lib/sitebuilder.ts`)
For each page/faq/blog item in the brief, sequentially (to respect rate limits):
1. (optional) DataForSEO CPC for the page's primary keyword.
2. Fetch 1–3 Pexels photos for the page topic (fallback: SVG art).
3. Claude generates typed content blocks for that page (schema-constrained, sponsor woven in).
4. Upsert `SitePage` row; update `buildProgress`.
Finally set `buildStatus="complete"`. Any item failure is logged into the page but does not abort
the whole build; a hard failure sets `buildStatus="error"` with a message.

### Rendering
- Shared **`src/components/site/SitePageRenderer.tsx`** — maps blocks → the same visual components/
  tokens as `src/app/page.tsx` (header, `theme-light`, brand color, slim marketing footer).
- Dynamic routes scoped to white-label hosts (resolved via `getCurrentSite()`):
  - `src/app/faq/page.tsx`, `src/app/resources/[slug]/page.tsx`, `src/app/blog/[slug]/page.tsx`,
    `src/app/blog/page.tsx` (index). Each loads the `SitePage` by `(siteId, slug)`; 404 if none.
  - Homepage (`/`): when a published `home` SitePage exists for the current site, render its blocks;
    else fall back to the current default white-label homepage (no regression).
- Generated nav links (header/footer) come from the site's published pages.

### UI (`src/components/LaunchSiteForm.tsx` + new `EngineerSiteModal.tsx`)
Per-site row on `/dashboard/sites` gets **"⚙ Engineer new prompt"**. Opens a modal:
prompt textarea → Engineer (shows brief, editable) → Build (progress bar polling build-status) →
"View site" link on complete.

## Testing / verification

- `npm run build` green (types + lint) after each stage.
- `prisma db push` applies `SitePage` + Site fields to local SQLite.
- Block renderer: unit-render a sample brief's blocks; assert homepage tokens/classes present.
- End-to-end (local): engineer + build a small brief for parentingupward.org with `Host` header;
  assert FAQ/resource/blog pages return 200 and carry the site's branding + slim footer.
- Pexels fallback: temporarily disable the key; assert build still completes with SVG art.
- No-regression: existing network routes (`/medicare`, etc.) and medigap.plus homepage unchanged.

## Deploy (separate, gated)

Code builds/tests locally first. Production rollout (when user approves) = `scripts/deploy.sh`
(rsync → prisma db push → build → pm2 reload) + add the `pexels` integration row to prod Postgres.
parentingupward.org is already live at the nginx/TLS layer (done previously).

## Out of scope (v1)

Calculators, PDF generation, AI image generation, multi-language, scheduled re-builds, editing
generated content in a WYSIWYG (DB-level edits only for now).
