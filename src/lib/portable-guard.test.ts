import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { guardForm, hostAllowed, nameLooksSpammy } from "./portable-guard";

// This file is copied verbatim into nine production apps, so it gets tested
// against the payloads actually hitting the network before it ships.

const REAL_SPAM = [
  "📩 Transfer № B4423 from Coinbase. NEXT ->> graph.org/Bitcoin-Mining-08-27?di7b7",
  "📈 You have A NEW MESSAGE №T6481 READ → graph.org/Bitcoin",
  "💴 You have ONE MESSAGE №H7663 CONTINUE ⇒ graph.org/x",
  "🔐 Transfer # F4489 from Coinbase. GET -> graph.org/a",
];
const REAL_PEOPLE = ["Jeff Cline", "Mary-Jane O'Connor", "Darlin Brown", "José Martínez", "Ng Wai-Yin"];

const req = (h: Record<string, string> = {}) =>
  new Request("https://example.com/api/lead", { method: "POST", headers: { "x-forwarded-for": "1.2.3." + Math.floor(Math.random() * 250), ...h } });

beforeEach(() => {
  process.env.RECAPTCHA_SITE_KEY = "";
  process.env.RECAPTCHA_SECRET_KEY = "";
  process.env.RECAPTCHA_MODE = "monitor";
  process.env.RECAPTCHA_ALLOWED_HOSTS = "";
});
afterEach(() => vi.unstubAllGlobals());

describe("portable guard — the live attack", () => {
  it.each(REAL_SPAM)("blocks %s", async (name) => {
    const g = await guardForm(req(), "lead", {}, { names: [name], email: "x@gmail.com" });
    expect(g.blocked, g.reason).toBe(true);
  });
  it.each(REAL_PEOPLE)("allows %s", async (name) => {
    const g = await guardForm(req(), "lead", {}, { names: [name], email: "a@acme.com", phone: "2145550100" });
    expect(g.blocked, g.reason).toBe(false);
  });
  it("blocks a letters-in-phone submission", async () => {
    const g = await guardForm(req(), "lead", {}, { names: ["Bob Smith"], phone: "awfSTyTvcEhxRwCwF" });
    expect(g.blocked).toBe(true);
  });
  it("blocks a filled honeypot", async () => {
    const g = await guardForm(req(), "lead", {}, { names: ["Bob Smith"], honeypot: "gotcha" });
    expect(g.blocked).toBe(true);
  });
  it("returns a silent ok:true body so the bot learns nothing", async () => {
    const g = await guardForm(req(), "lead", {}, { names: [REAL_SPAM[0]] });
    expect(await g.response.json()).toEqual({ ok: true });
  });
  it("honours a caller-supplied blocked response (classic form POST)", async () => {
    const redirect = new Response(null, { status: 303, headers: { Location: "/thanks" } });
    const g = await guardForm(req(), "lead", {}, { names: [REAL_SPAM[0]], blockedResponse: redirect });
    expect(g.response.status).toBe(303);
  });
  it("a real message containing a link is NOT blocked (texts, not names)", async () => {
    const g = await guardForm(req(), "lead", {}, {
      names: ["Sarah Whitfield"],
      texts: ["My site is https://sarahwhitfield.com — can you review it?"],
      email: "sarah@whitfield.com",
    });
    expect(g.blocked, g.reason).toBe(false);
  });
});

describe("host allowlist", () => {
  const list = ["medigap.plus", "mortgages.plus"];
  it("allows exact and subdomain", () => {
    expect(hostAllowed("mortgages.plus", list)).toBe(true);
    expect(hostAllowed("www.mortgages.plus", list)).toBe(true);
  });
  it("rejects lookalikes", () => {
    expect(hostAllowed("notmortgages.plus", list)).toBe(false);
    expect(hostAllowed("mortgages.plus.evil.com", list)).toBe(false);
  });
});

describe("reCAPTCHA layer", () => {
  it("without keys, nothing captcha-related blocks", async () => {
    const g = await guardForm(req(), "lead", {}, { names: ["Jeff Cline"] });
    expect(g.blocked).toBe(false);
    expect(g.reason).toBe("recaptcha-skipped");
  });
  it("with keys in ENFORCE, a missing token blocks", async () => {
    process.env.RECAPTCHA_SITE_KEY = "site";
    process.env.RECAPTCHA_SECRET_KEY = "secret";
    process.env.RECAPTCHA_MODE = "enforce";
    const g = await guardForm(req(), "lead", {}, { names: ["Jeff Cline"] });
    expect(g.blocked).toBe(true);
    expect(g.reason).toContain("missing-token");
  });
  it("with keys in MONITOR, a missing token does NOT block", async () => {
    process.env.RECAPTCHA_SITE_KEY = "site";
    process.env.RECAPTCHA_SECRET_KEY = "secret";
    process.env.RECAPTCHA_MODE = "monitor";
    const g = await guardForm(req(), "lead", {}, { names: ["Jeff Cline"] });
    expect(g.blocked).toBe(false);
  });
  it("a Google outage does not block real people", async () => {
    process.env.RECAPTCHA_SITE_KEY = "site";
    process.env.RECAPTCHA_SECRET_KEY = "secret";
    process.env.RECAPTCHA_MODE = "enforce";
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network"); }));
    const g = await guardForm(req(), "lead", { recaptchaToken: "tok" }, { names: ["Jeff Cline"] });
    expect(g.blocked).toBe(false);
  });
});

describe("publicGuardConfig — what the browser is told", () => {
  it("reports disabled and no endpoints when unconfigured", async () => {
    process.env.RECAPTCHA_SITE_KEY = "";
    process.env.RECAPTCHA_SECRET_KEY = "";
    process.env.RECAPTCHA_FORM_ENDPOINTS = "";
    const { publicGuardConfig } = await import("./portable-guard");
    const c = publicGuardConfig();
    expect(c.enabled).toBe(false);
    expect(c.endpoints).toEqual([]);
  });
  it("never leaks the secret key", async () => {
    process.env.RECAPTCHA_SITE_KEY = "sitekey";
    process.env.RECAPTCHA_SECRET_KEY = "SUPERSECRET";
    process.env.RECAPTCHA_FORM_ENDPOINTS = "/api/lead, /api/contact";
    const { publicGuardConfig } = await import("./portable-guard");
    const c = publicGuardConfig();
    expect(JSON.stringify(c)).not.toContain("SUPERSECRET");
    expect(c.siteKey).toBe("sitekey");
    expect(c.enabled).toBe(true);
    expect(c.endpoints).toEqual(["/api/lead", "/api/contact"]);
  });
  it("tolerates whitespace and trailing commas in the endpoint list", async () => {
    process.env.RECAPTCHA_FORM_ENDPOINTS = " /api/lead ,, /api/leads,\n/api/opportunity ,";
    const { formEndpoints } = await import("./portable-guard");
    expect(formEndpoints()).toEqual(["/api/lead", "/api/leads", "/api/opportunity"]);
  });
});
