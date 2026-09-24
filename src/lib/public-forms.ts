// ---------------------------------------------------------------------------
// THE list of public form endpoints in the Core.
//
// Two things read it:
//   1. RecaptchaProvider (client) — attaches a reCAPTCHA token to POSTs here.
//   2. scripts/check-form-guard.mjs — fails if one of these routes does not
//      call guardForm(), so a new form cannot quietly ship unprotected.
//
// ADDING A FORM? Add its endpoint here and call guardForm() in the route.
// Those two steps are the whole contract.
// ---------------------------------------------------------------------------

export const PUBLIC_FORM_ENDPOINTS = [
  "/api/leads",
  "/api/biz/lead",
  "/api/exit/lead",
  "/api/exit/advertise",
  "/api/exit/partner-signup",
  "/api/jv",
  "/api/onboard",
  "/api/opportunity",
  "/api/rocketship/order",
  "/api/xm/lead",
  "/api/calc/account",
  "/api/money-word-signup",
  "/api/mammo/lead",      // mammo.express — signup step one
  "/api/mammo/register",  // mammo.express — consumer signup
  "/api/mammo/login",     // mammo.express — consumer login
  "/api/mammo/book",      // mammo.express — location hand-off
  "/api/mammo/manager-login", // mammo.express — manager sign-in
  "/api/mammo/invite",        // mammo.express — manager invite acceptance
] as const;

/** Does this URL path point at a public form endpoint? */
export function isPublicFormEndpoint(pathname: string): boolean {
  return PUBLIC_FORM_ENDPOINTS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/** v3 action name for an endpoint — must match what the route passes to guardForm. */
export function actionFor(pathname: string): string {
  return pathname.replace(/^\/api\//, "").replace(/[^a-zA-Z0-9_]/g, "_");
}
