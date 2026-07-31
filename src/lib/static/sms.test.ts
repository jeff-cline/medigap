import { describe, it, expect, vi, beforeEach } from "vitest";

const sendSms = vi.fn();
const getTwilioCfg = vi.fn().mockResolvedValue({ accountSid: "AC", authToken: "t", messagingSid: "MG", tollFree: "+18006334427" });
vi.mock("@/lib/sms", () => ({
  sendSms: (...a: any[]) => sendSms(...a),
  getTwilioCfg: () => getTwilioCfg(),
  normalizePhone: (s: string) => s,
}));

import { sendStaticSms } from "./sms";

describe("sendStaticSms", () => {
  beforeEach(() => sendSms.mockReset().mockResolvedValue({ ok: true }));
  it("sends with From forced to the main tollFree (no messagingSid)", async () => {
    const r = await sendStaticSms({ to: "+15551234567", body: "hi" });
    expect(r.ok).toBe(true);
    const arg = sendSms.mock.calls[0][0];
    expect(arg.to).toBe("+15551234567");
    expect(arg.body).toBe("hi");
    expect(arg.cfg.messagingSid).toBe("");
    expect(arg.cfg.tollFree).toBe("+18006334427");
  });
  it("never throws; returns ok:false on failure", async () => {
    sendSms.mockRejectedValueOnce(new Error("boom"));
    const r = await sendStaticSms({ to: "+15551234567", body: "hi" });
    expect(r.ok).toBe(false);
  });
});
