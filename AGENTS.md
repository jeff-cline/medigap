<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Every public form uses the reCAPTCHA guard. No exceptions.

The forms on this network get hammered by bots. Content heuristics alone did not
hold, so Google reCAPTCHA is now the standard and it is enforced by a build check.

## Adding a form — the whole contract is two steps

1. **Route** — call `guardForm()` as the first thing after parsing the body:

   ```ts
   import { guardForm } from "@/lib/form-guard";

   export async function POST(req: NextRequest) {
     const b = await req.json().catch(() => ({}));
     const gate = await guardForm(req, "my_form", b, {
       texts: [b.name, b.company, b.message],   // free text to gibberish-check
       email: b.email, phone: b.phone,
     });
     if (gate.blocked) return gate.response;    // silent { ok: true }
     …
   }
   ```

2. **Register it** — add the endpoint to `PUBLIC_FORM_ENDPOINTS` in
   `src/lib/public-forms.ts`.

`scripts/check-form-guard.mjs` runs in `scripts/deploy.sh` and **fails the
deploy** if a registered endpoint does not call `guardForm()`. Registering the
endpoint is also what makes `RecaptchaProvider` attach a token to it.

## The client needs no work (v3)

`RecaptchaProvider` is mounted in the root layout. It wraps `fetch` and attaches
`recaptchaToken` to any same-origin JSON POST to a registered endpoint — so a
normal `fetch("/api/my-form", { method: "POST", body: JSON.stringify(v) })` is
already protected.

Exceptions that DO need work in the component:
- **`FormData` / classic form POSTs** — the wrapper leaves these alone. Build a
  plain object from the entries and pass it to `guardForm` yourself, and return
  a redirect (not JSON) when blocked, so a bot cannot tell it was dropped. See
  `src/app/api/rocketship/order/route.ts`.
- **reCAPTCHA v2** — needs a visible widget. Use `useRecaptcha()` from
  `src/components/Recaptcha.tsx` and render its `<Checkbox />`.

Put `<RecaptchaNotice />` under the submit button — Google requires the
attribution when the v3 badge is hidden.

## Failure policy — do not "tighten" these without thinking it through

Each branch is chosen so a failure on OUR side never costs a real lead, and is
pinned by tests in `src/lib/recaptcha.test.ts`:

| Situation | Result |
|---|---|
| No keys configured | allow — the keys are the on-switch |
| Google unreachable / 5xx | allow — an outage must not stop lead capture |
| Google rejects the token | **block** |
| v3 score below the floor | **block** |
| Token minted for another form | **block** |
| 20 consecutive rejections | allow — circuit breaker, see below |

**Google cannot tell you that your secret key is wrong.** Verified against the
live API: a garbage secret, an empty secret, and a site key pasted into the
secret field ALL return `invalid-input-response` — byte-identical to a bad
token. So a mistyped key rejects every submission on the network and looks
exactly like a bot flood.

Two things guard against that, and neither should be removed:

- **The circuit breaker** — after 20 consecutive rejections inside 10 minutes,
  enforcement stops and the Form Spam page says so. It closes again on the first
  pass. A flood of *low scores* deliberately does NOT trip it: that is the
  defence working, not a broken key.
- **Monitor mode** — the default after saving keys. With a wrong key you see
  100% failures and lose nothing.

For the same reason, the Integrations "Test connection" button can only check
key *format* and that Google is reachable. It says so rather than going green
and implying more than it knows.

`mode: "monitor"` (the default after saving keys) records every verdict and
blocks nothing. Switch to `"enforce"` only after Dashboard → Form Spam shows
real submissions scoring well.

## Where things are

- `src/lib/recaptcha.ts` — config + siteverify
- `src/lib/form-guard.ts` — the one call routes make (reCAPTCHA + heuristics + log)
- `src/lib/spam-guard.ts` — the content heuristics, still running underneath
- `src/lib/public-forms.ts` — the registry
- `src/components/RecaptchaProvider.tsx` — the client-side token attachment
- `src/app/dashboard/form-spam` — the log, coverage list and review inbox
- Keys go in at Dashboard → Integrations → reCAPTCHA

## Spam that still gets through

`jane@securityup.co` is a Zapmail mailbox **reserved out of the send rotation**
as the spam-review inbox. The founder forwards anything that slips past; read it
at Dashboard → Form Spam, find the form, wire it up. Never send outreach from
that mailbox — `nextMailbox()` skips it and it must stay skipped.
