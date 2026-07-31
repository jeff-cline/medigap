import { describe, it, expect } from "vitest";
import { twilioSignature } from "./twilio-verify";

describe("twilioSignature", () => {
  // Twilio-standard algorithm (URL + alphabetically-sorted key+value concat, HMAC-SHA1, base64).
  // Expected value cross-validated by two independent HMAC-SHA1 implementations (node crypto + openssl).
  it("computes the canonical signature", () => {
    const url = "https://mycompany.com/myapp.php?foo=1&bar=2";
    const params = { Digits: "1234", To: "+18005551212", From: "+14158675310", Caller: "+14158675310", CallSid: "CA1234567890ABCDE" };
    expect(twilioSignature("12345", url, params)).toBe("GvWf1cFY/Q7PnoempGyD5oXAezc=");
  });

  it("is deterministic — same inputs produce the same signature", () => {
    const url = "https://medigap.plus/api/voice/static-step?callId=abc&phase=age";
    const params = { SpeechResult: "sixty five", CallSid: "CA0000000000", From: "+14155551212" };
    const token = "test-token-abc123";
    const first = twilioSignature(token, url, params);
    const second = twilioSignature(token, url, params);
    expect(second).toBe(first);
  });
});
