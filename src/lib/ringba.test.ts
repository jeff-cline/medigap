import { describe, it, expect } from "vitest";
import { matchRingba, RingbaCallRow } from "./ringba";

const base = Date.parse("2026-07-15T15:00:00Z");
const rows: RingbaCallRow[] = [
  { callId: "R1", inboundPhone: "+1 (214) 555-0100", connectedSec: 130, payoutCents: 7500, callAtMs: base + 60_000 },
  { callId: "R2", inboundPhone: "2145550999", connectedSec: 90, payoutCents: 0, callAtMs: base + 40 * 60_000 },
];

describe("matchRingba", () => {
  it("matches by last-10 digits within the time window and flags paid on >120s", () => {
    const out = matchRingba([{ id: "u1", fromNumber: "(214) 555-0100", createdAtMs: base }], rows);
    expect(out).toEqual([{ u65Id: "u1", ringbaCallId: "R1", ringbaSec: 130, ringbaPaid: true }]);
  });
  it("does not match when outside the window", () => {
    const out = matchRingba([{ id: "u2", fromNumber: "2145550999", createdAtMs: base }], rows, 15 * 60_000);
    expect(out).toEqual([]);
  });
  it("marks not paid when connected <=120 and payout 0", () => {
    const near: RingbaCallRow[] = [{ ...rows[1], callAtMs: base + 60_000 }];
    const out = matchRingba([{ id: "u3", fromNumber: "2145550999", createdAtMs: base }], near);
    expect(out[0].ringbaPaid).toBe(false);
  });
});
