import { describe, it, expect } from "vitest";
import { shortenUrl } from "./shorten";
describe("shortenUrl", () => {
  it("returns non-URL input unchanged without any network call", async () => {
    expect(await shortenUrl("hello world")).toBe("hello world");
    expect(await shortenUrl("")).toBe("");
    expect(await shortenUrl("ftp://x")).toBe("ftp://x");
  });
});
