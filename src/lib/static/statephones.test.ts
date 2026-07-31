import { describe, it, expect } from "vitest";
import { medicarePhoneForState, ssPhoneForState } from "./statephones";

describe("statephones", () => {
  it("returns the state Medicare office number by code", () => {
    expect(medicarePhoneForState("TX")).toBe("800-252-9240");
    expect(medicarePhoneForState("CA")).toBe("800-434-0222");
    expect(medicarePhoneForState("FL")).toBe("800-963-5337");
  });
  it("is case-insensitive and trims", () => {
    expect(medicarePhoneForState(" tx ")).toBe("800-252-9240");
  });
  it("falls back to national Medicare for unknown/empty", () => {
    expect(medicarePhoneForState("")).toBe("1-800-633-4227");
    expect(medicarePhoneForState("ZZ")).toBe("1-800-633-4227");
  });
  it("Social Security is the national line for every state", () => {
    expect(ssPhoneForState("TX")).toBe("800-772-1213");
    expect(ssPhoneForState("")).toBe("800-772-1213");
  });
});
