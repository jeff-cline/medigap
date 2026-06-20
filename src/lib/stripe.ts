import { db } from "./db";

// Minimal Stripe REST client (no SDK) — Checkout Sessions for partner upgrades.
const BASE = "https://api.stripe.com/v1";

export async function stripeKey(): Promise<string | null> {
  const row = await db.integration.findUnique({ where: { key: "stripe" } });
  try { const c = row ? JSON.parse(row.config) : {}; return c.secretKey || null; } catch { return null; }
}

async function stripe(path: string, params: Record<string, string>) {
  const key = await stripeKey();
  if (!key) return { ok: false, data: null as unknown, error: "Stripe not connected" };
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { Authorization: "Basic " + Buffer.from(`${key}:`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params),
      signal: AbortSignal.timeout(12000),
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, data, error: res.ok ? "" : (data as { error?: { message?: string } })?.error?.message || `HTTP ${res.status}` };
  } catch (e) { return { ok: false, data: null, error: e instanceof Error ? e.message : "network error" }; }
}

export async function createCheckoutSession(opts: { amountCents: number; name: string; successUrl: string; cancelUrl: string; metadata?: Record<string, string>; customerEmail?: string }) {
  const params: Record<string, string> = {
    mode: "payment",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(opts.amountCents),
    "line_items[0][price_data][product_data][name]": opts.name,
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
  };
  if (opts.customerEmail) params.customer_email = opts.customerEmail;
  for (const [k, v] of Object.entries(opts.metadata || {})) params[`metadata[${k}]`] = v;
  return stripe("/checkout/sessions", params);
}

export async function getCheckoutSession(id: string) {
  const key = await stripeKey();
  if (!key) return { ok: false, data: null as unknown };
  try {
    const res = await fetch(`${BASE}/checkout/sessions/${id}`, { headers: { Authorization: "Basic " + Buffer.from(`${key}:`).toString("base64") } });
    return { ok: res.ok, data: await res.json().catch(() => null) };
  } catch { return { ok: false, data: null }; }
}
