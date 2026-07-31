import { describe, it, expect, vi } from "vitest";
import { responseFromContext } from "./agent-response";

describe("responseFromContext", () => {
  it("returns the AI-phrased reply (stripped of quotes)", async () => {
    const aiReply = vi.fn().mockResolvedValue('"I can text you that info right now."');
    expect(await responseFromContext("offer to text info", "representative", { aiReply })).toBe("I can text you that info right now.");
  });
  it("falls back to the guidance text when the AI is unavailable", async () => {
    const aiReply = vi.fn().mockResolvedValue(null);
    expect(await responseFromContext("Reassure them and offer info.", "help", { aiReply })).toBe("Reassure them and offer info.");
  });
  it("returns empty for empty guidance without calling the AI", async () => {
    const aiReply = vi.fn();
    expect(await responseFromContext("", "hi", { aiReply })).toBe("");
    expect(aiReply).not.toHaveBeenCalled();
  });
});
