import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// The failure policy is the part of this that can cost real money if it is
// wrong — a mistake here either lets every bot through or blocks every
// customer. These tests pin each branch down.

const cfg = { siteKey: "", secretKey: "", version: "v3", mode: "enforce", minScore: 0.5 };

vi.mock("./db", () => ({
  db: { integration: { findUnique: async () => ({ config: JSON.stringify(cfg) }) } },
}));

const { verifyRecaptcha, recaptchaBreakerState } = await import("./recaptcha");

function googleSays(body: unknown, ok = true, status = 200) {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok, status, json: async () => body }) as unknown as Response));
}

beforeEach(() => {
  Object.assign(cfg, { siteKey: "site", secretKey: "secret", version: "v3", mode: "enforce", minScore: 0.5 });
});
afterEach(() => vi.unstubAllGlobals());

describe("verifyRecaptcha failure policy", () => {
  it("allows everything when no keys are configured", async () => {
    cfg.siteKey = ""; cfg.secretKey = "";
    const r = await verifyRecaptcha("anything");
    expect(r.ok).toBe(true);
    expect(r.skipped).toBe(true);
  });

  it("blocks a missing token once configured — this is what stops direct posts", async () => {
    const r = await verifyRecaptcha("");
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("missing-token");
  });

  it("allows when Google is unreachable — an outage must not cost us leads", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network"); }));
    const r = await verifyRecaptcha("tok");
    expect(r.ok).toBe(true);
    expect(r.skipped).toBe(true);
  });

  // Verified against the live API: a garbage secret, an empty secret and a SITE
  // key pasted into the secret field ALL return `invalid-input-response` — the
  // same code as a genuinely bad token. So a wrong key cannot be detected here,
  // and the protection against it is the circuit breaker below.
  it("cannot tell a wrong secret from a bad token — both are a block", async () => {
    googleSays({ success: false, "error-codes": ["invalid-input-response"] });
    expect((await verifyRecaptcha("tok")).ok).toBe(false);
  });

  it("blocks when Google rejects the token itself", async () => {
    googleSays({ success: false, "error-codes": ["invalid-input-response"] });
    const r = await verifyRecaptcha("tok");
    expect(r.ok).toBe(false);
  });

  it("blocks a v3 score under the floor and allows one above it", async () => {
    googleSays({ success: true, score: 0.1 });
    expect((await verifyRecaptcha("tok")).ok).toBe(false);
    googleSays({ success: true, score: 0.9 });
    expect((await verifyRecaptcha("tok")).ok).toBe(true);
  });

  it("honours a custom score floor", async () => {
    cfg.minScore = 0.8;
    googleSays({ success: true, score: 0.7 });
    expect((await verifyRecaptcha("tok")).ok).toBe(false);
  });

  it("blocks a token minted for a different form", async () => {
    googleSays({ success: true, score: 0.9, action: "other_form" });
    const r = await verifyRecaptcha("tok", { action: "leads" });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("action-mismatch");
  });

  it("v2 passes on success alone — there is no score to judge", async () => {
    cfg.version = "v2";
    googleSays({ success: true });
    expect((await verifyRecaptcha("tok")).ok).toBe(true);
  });

  it("monitor mode still returns the verdict but marks it non-enforcing", async () => {
    cfg.mode = "monitor";
    googleSays({ success: true, score: 0.1 });
    const r = await verifyRecaptcha("tok");
    expect(r.ok).toBe(false);        // the verdict is real
    expect(r.enforcing).toBe(false); // but must not be acted on
  });

  it("enforce mode marks the verdict enforcing", async () => {
    googleSays({ success: true, score: 0.1 });
    const r = await verifyRecaptcha("tok");
    expect(r.enforcing).toBe(true);
  });
});

describe("circuit breaker — the real protection against a wrong secret key", () => {
  it("stops enforcing after a long unbroken run of rejections, and recovers on a pass", async () => {
    // A wrong key rejects everything and is indistinguishable from a bot flood.
    // Enforcing through either is wrong: a broken key costs every lead on the
    // network, and a real flood is still caught by the content heuristics.
    googleSays({ success: false, "error-codes": ["invalid-input-response"] });

    let r = await verifyRecaptcha("tok");
    expect(r.ok).toBe(false);
    expect(r.enforcing).toBe(true);        // early failures still block

    for (let i = 0; i < 25; i++) r = await verifyRecaptcha("tok");
    expect(r.ok).toBe(false);
    expect(r.enforcing).toBe(false);       // breaker open — fail open
    expect(recaptchaBreakerState().open).toBe(true);

    // One genuine pass proves the key works and closes it again.
    googleSays({ success: true, score: 0.9 });
    const good = await verifyRecaptcha("tok");
    expect(good.ok).toBe(true);
    expect(recaptchaBreakerState().open).toBe(false);
  });

  it("a flood of LOW SCORES does not trip it — that is the defence working", async () => {
    googleSays({ success: true, score: 0.9 });
    await verifyRecaptcha("tok");                      // reset from the previous test
    googleSays({ success: true, score: 0.1 });
    for (let i = 0; i < 40; i++) await verifyRecaptcha("tok");
    expect(recaptchaBreakerState().open).toBe(false);
    expect((await verifyRecaptcha("tok")).enforcing).toBe(true);
  });
});
