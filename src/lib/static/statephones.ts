// State Medicare (SHIP/SHIBA) office numbers, keyed by 2-letter code (call.state format).
const MEDICARE_BY_CODE: Record<string, string> = {
  AL: "800-243-5463", AK: "800-478-6065", AZ: "800-432-4040", AR: "800-224-6330",
  CA: "800-434-0222", CO: "888-696-7213", CT: "800-994-9422", DE: "800-336-9500",
  FL: "800-963-5337", GA: "866-552-4464", HI: "888-875-9229", ID: "800-247-4422",
  IL: "800-252-8966", IN: "800-452-4800", IA: "800-351-4664", KS: "800-860-5260",
  KY: "877-293-7447", LA: "800-259-5300", ME: "800-262-2232", MD: "800-243-3425",
  MA: "800-243-4636", MI: "800-803-7174", MN: "800-333-2433", MS: "844-822-4622",
  MO: "800-390-3330", MT: "800-551-3191", NE: "800-234-7119", NV: "800-307-4444",
  NH: "866-634-9412", NJ: "800-792-8820", NM: "800-432-2080", NY: "800-701-0501",
  NC: "855-408-1212", ND: "888-575-6611", OH: "800-686-1578", OK: "800-763-2828",
  OR: "800-722-4134", PA: "800-783-7067", RI: "888-884-8721", SC: "800-868-9095",
  SD: "800-536-8197", TN: "877-801-0044", TX: "800-252-9240", UT: "800-541-7735",
  VT: "800-642-5119", VA: "800-552-3402", WA: "800-562-6900", WV: "877-987-4463",
  WI: "800-242-1060", WY: "800-856-4398", DC: "202-727-8370", PR: "877-725-4300",
  VI: "340-774-2991",
};
const MEDICARE_NATIONAL = "1-800-633-4227";
const SS_NATIONAL = "800-772-1213";

export function medicarePhoneForState(code: string): string {
  const c = (code || "").trim().toUpperCase();
  return MEDICARE_BY_CODE[c] || MEDICARE_NATIONAL;
}
export function ssPhoneForState(_code: string): string {
  return SS_NATIONAL; // uniform national line; per-state overrides can be added here later
}
