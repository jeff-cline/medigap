import { describe, it, expect, afterAll } from "vitest";
import { db } from "@/lib/db";
import { getHealthFallbackNumber, setHealthFallbackNumber } from "./settings";

const KEY = "staticHealthFallbackNumber";

afterAll(async () => { await db.setting.delete({ where: { key: KEY } }).catch(() => {}); });

describe("static health fallback number setting", () => {
  it("defaults to empty then round-trips a fallback number", async () => {
    await db.setting.delete({ where: { key: KEY } }).catch(() => {});
    expect(await getHealthFallbackNumber()).toBe("");
    await setHealthFallbackNumber("+15551239999");
    expect(await getHealthFallbackNumber()).toBe("+15551239999");
    await setHealthFallbackNumber("");
    expect(await getHealthFallbackNumber()).toBe("");
  });
});
