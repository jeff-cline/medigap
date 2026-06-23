// Appended-data display helpers (PredictiveData enrichment).
// We DISPLAY appended fields alongside the originals — never overwrite — so staff see both.
// Goal: surface any and all appended data we have, labeled "Appended <field>".

// Internal bookkeeping keys we don't show as data rows (rendered separately as a footer).
const META_KEYS = new Set(["appendStatus", "appendedAt"]);

// Friendly labels + preferred display order for known curated keys. Unknown keys fall through.
const LABELS: Record<string, string> = {
  name: "Name",
  email: "Email",
  emails: "Other emails",
  phones: "Phone",
  phonesOnFile: "Phones on file",
  age: "Age",
  birthDate: "DOB",
  gender: "Gender",
  maritalStatus: "Marital status",
  street: "Street",
  city: "City",
  state: "State",
  zip: "Zip",
  householdIncome: "Household income",
  creditRange: "Credit range",
  investmentStatus: "Investments",
  intent: "Captured intent",
};
const ORDER = Object.keys(LABELS);

// Keys that hold phone number(s) — formatted on display.
export const PHONE_KEYS = new Set(["phones"]);

export type AppendedField = { key: string; label: string; value: string };

export function parseAppended(raw?: string | null): Record<string, unknown> {
  try {
    const v = JSON.parse(raw || "{}");
    return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function labelFor(key: string): string {
  return (
    LABELS[key] ||
    key.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase())
  );
}

function valueFor(v: unknown): string {
  if (v == null) return "";
  if (Array.isArray(v)) return v.map((x) => (x && typeof x === "object" ? JSON.stringify(x) : String(x))).filter(Boolean).join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

// All displayable appended fields — known keys first (in order), then any extras. Meta excluded.
export function appendedFields(raw?: string | null): AppendedField[] {
  const obj = parseAppended(raw);
  const keys = Object.keys(obj).filter((k) => !META_KEYS.has(k));
  keys.sort((a, b) => {
    const ia = ORDER.indexOf(a);
    const ib = ORDER.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
  const out: AppendedField[] = [];
  for (const k of keys) {
    const val = valueFor(obj[k]).trim();
    if (val) out.push({ key: k, label: labelFor(k), value: val });
  }
  return out;
}

// Append run status + timestamp (for the small footer / "no match" note).
export function appendMeta(raw?: string | null): { status: string; at: string | null } {
  const obj = parseAppended(raw);
  return {
    status: typeof obj.appendStatus === "string" ? obj.appendStatus : "",
    at: typeof obj.appendedAt === "string" ? obj.appendedAt : null,
  };
}
