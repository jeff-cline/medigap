import { describe, it, expect, afterAll } from "vitest";
import { db } from "@/lib/db";
import { getActiveEngine, setActiveEngine } from "./engine";

afterAll(async () => { await db.setting.delete({ where: { key: "activeEngine" } }).catch(() => {}); });

describe("engine flag", () => {
  it("defaults to fluid then round-trips static", async () => {
    await db.setting.delete({ where: { key: "activeEngine" } }).catch(() => {});
    expect(await getActiveEngine()).toBe("fluid");
    await setActiveEngine("static");
    expect(await getActiveEngine()).toBe("static");
    await setActiveEngine("fluid");
    expect(await getActiveEngine()).toBe("fluid");
  });
});
