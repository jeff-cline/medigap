import { describe, it, expect } from "vitest";
import { GREETING, PLAN_SS, WHAT_CONTEXT, transferScript } from "./medicare-scripts";

describe("medicare-scripts", () => {
  it("has the greeting asking buy/save/retire", () => {
    expect(GREETING.toLowerCase()).toContain("buy medicare insurance");
    expect(GREETING.toLowerCase()).toContain("retire");
  });
  it("plan script mentions the free notification service and Social Security", () => {
    expect(PLAN_SS.toLowerCase()).toContain("social security");
    expect(PLAN_SS.toLowerCase()).toContain("notification service");
  });
  it("what-context names MEDIGAP GPT", () => {
    expect(WHAT_CONTEXT).toContain("MEDIGAP GPT");
  });
  it("transferScript interpolates the money word twice", () => {
    const s = transferScript("Life Insurance");
    expect(s).toContain("transferring you to a Life Insurance professional");
    expect(s).toContain("who handles Life Insurance");
    expect(s).toContain("1-800-MEDIGAP");
  });
});
