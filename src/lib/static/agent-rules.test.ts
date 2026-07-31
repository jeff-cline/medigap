import { describe, it, expect } from "vitest";
import { matchAgentRule, stuckRule, type AgentRule } from "./agent-rules";

const rep: AgentRule = { kind: "representative", trigger: "", response: "R", sms: "s", continueMenu: true, active: true };
const what: AgentRule = { kind: "what", trigger: "", response: "W", sms: "", continueMenu: true, active: true };
const stuck: AgentRule = { kind: "stuck", trigger: "", response: "S", sms: "", continueMenu: true, active: true };
const custom: AgentRule = { kind: "custom", trigger: "reverse mortgage, cash out", response: "C", sms: "", continueMenu: true, active: true, sortOrder: 1 };

describe("matchAgentRule", () => {
  it("matches the representative built-in on human-request words", () => {
    expect(matchAgentRule("I need a representative", [rep, what])?.kind).toBe("representative");
    expect(matchAgentRule("give me customer service", [rep])?.kind).toBe("representative");
    expect(matchAgentRule("can I talk to someone", [rep])?.kind).toBe("representative");
  });
  it("matches the what built-in", () => {
    expect(matchAgentRule("what?", [rep, what])?.kind).toBe("what");
    expect(matchAgentRule("wait what", [what])?.kind).toBe("what");
  });
  it("custom trigger wins first and matches any listed phrase", () => {
    expect(matchAgentRule("I want to cash out my home", [rep, custom])?.response).toBe("C");
    expect(matchAgentRule("tell me about a reverse mortgage", [custom])?.response).toBe("C");
  });
  it("returns null when nothing matches (caller likely picked a menu item)", () => {
    expect(matchAgentRule("medicare", [rep, what, custom])).toBeNull();
    expect(matchAgentRule("", [rep])).toBeNull();
  });
  it("ignores inactive rules", () => {
    expect(matchAgentRule("representative", [{ ...rep, active: false }])).toBeNull();
  });
});

describe("stuckRule", () => {
  it("prefers the stuck rule, falls back to representative", () => {
    expect(stuckRule([rep, what, stuck])?.kind).toBe("stuck");
    expect(stuckRule([rep, what])?.kind).toBe("representative");
    expect(stuckRule([what])).toBeNull();
  });
});
