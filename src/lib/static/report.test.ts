import { describe, it, expect, afterEach } from "vitest";
import { db } from "@/lib/db";
import { staticCallReport, durationBand } from "./report";

const createdIds: string[] = [];

afterEach(async () => {
  if (createdIds.length) {
    await db.call.deleteMany({ where: { id: { in: createdIds.splice(0) } } });
  }
});

describe("staticCallReport", () => {
  it("returns only static-disposition calls, newest first, excluding non-static", async () => {
    const short = await db.call.create({ data: { disposition: "static", durationSec: 10, moneyWord: "zzztest-a", state: "TX" } });
    createdIds.push(short.id);
    const mid = await db.call.create({ data: { disposition: "static", durationSec: 60, moneyWord: "zzztest-b", state: "FL" } });
    createdIds.push(mid.id);
    const long = await db.call.create({ data: { disposition: "static", durationSec: 120, moneyWord: "zzztest-c", state: "CA" } });
    createdIds.push(long.id);
    const nonStatic = await db.call.create({ data: { disposition: "u65", durationSec: 45, moneyWord: "zzztest-d", state: "NY" } });
    createdIds.push(nonStatic.id);

    const rows = await staticCallReport();
    const testRows = rows.filter((r) => [short.id, mid.id, long.id, nonStatic.id].includes(r.id));

    expect(testRows.map((r) => r.id)).toEqual([long.id, mid.id, short.id]);
    expect(testRows.some((r) => r.id === nonStatic.id)).toBe(false);
  });
});

describe("durationBand", () => {
  it("bands 0-30s red, 31-90s yellow, 91s+ green", () => {
    expect(durationBand(10)).toBe("red");
    expect(durationBand(60)).toBe("yellow");
    expect(durationBand(120)).toBe("green");
  });
});
