// /fire — Predictive Data Outbound Email Engine helpers: default template, CSV parsing,
// email-field selection, and merge-field rendering.

export const DEFAULT_TEMPLATE = {
  name: "1-800-MEDIGAP — Voice Answer Engine",
  subject: "1-800-MEDIGAP America's first voice answer engine",
  body: `The best of GPT plus the power of a Search Engine all conveniently packaged in a toll-free call.

1-800-MEDIGAP is America's first toll-free answer engine.

Call free today and have the whole conversation, or simply say:

I need private health insurance.

Or I'm a business owner looking for medical insurance for my company

Or what color is a fire truck?

You ask, we answer.

Completely complimentary toll-free service offered by your friends.

1-800-MEDIGAP
1-800-633-4427

America's first Voice Answer Engine.

PS If you would like this technology for your business just ask for Jeff Cline the founder or personally text him "I WANT A CUSTOM 1-800-MEDIGAP" to his cell 972-800-6670`,
};

export type EmailField = "business" | "personal" | "personal_business";

export type ParsedContact = {
  email: string; // the chosen field is resolved later; this holds nothing until a campaign runs
  business: string;
  personal: string;
  firstName: string;
  lastName: string;
  company: string;
  phones: string[]; // normalized last-10 digit phones (personal / mobile / direct)
  raw: Record<string, string>;
};

// Normalize a phone to its last 10 digits (US), or "" if not a plausible number.
export const normPhone10 = (s: string) => {
  const d = (s || "").replace(/\D/g, "").slice(-10);
  return d.length === 10 ? d : "";
};

// Minimal robust CSV parser: handles quoted fields, embedded commas/quotes ("" escape),
// and quoted newlines. Returns rows of string cells.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const s = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') { cell += '"'; i++; } else { inQuotes = false; }
      } else cell += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell); cell = "";
    } else if (ch === "\n") {
      row.push(cell); cell = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (cell !== "" || row.length) { row.push(cell); if (row.length > 1 || row[0] !== "") rows.push(row); }
  return rows;
}

const firstEmail = (v: string) => (v || "").split(/[;,]/)[0].trim().toLowerCase();
const looksLikeEmail = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

// Turn the query_run CSV text into contacts. Same header format each time.
export function extractContacts(text: string): { total: number; contacts: ParsedContact[] } {
  const rows = parseCsv(text);
  if (rows.length < 2) return { total: 0, contacts: [] };
  const header = rows[0].map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);
  const iFirst = idx("first_name"), iLast = idx("last_name");
  const iPersonal = idx("personal_emails"), iBiz = idx("business_email"), iCompany = idx("company_name");
  const iPhone = idx("personal_phone"), iMobile = idx("mobile_phone"), iDirect = idx("direct_number");
  const contacts: ParsedContact[] = [];
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    const raw: Record<string, string> = {};
    header.forEach((h, j) => { raw[h] = cells[j] ?? ""; });
    const personal = firstEmail(cells[iPersonal] ?? "");
    const business = firstEmail(cells[iBiz] ?? "");
    const phones = [...new Set([cells[iPhone], cells[iMobile], cells[iDirect]].map((p) => normPhone10(p ?? "")).filter(Boolean))];
    contacts.push({
      email: "",
      business: looksLikeEmail(business) ? business : "",
      personal: looksLikeEmail(personal) ? personal : "",
      firstName: (cells[iFirst] ?? "").trim(),
      lastName: (cells[iLast] ?? "").trim(),
      company: (cells[iCompany] ?? "").trim(),
      phones,
      raw,
    });
  }
  return { total: contacts.length, contacts };
}

// Resolve the sending address for a contact given the campaign's chosen field.
export function pickEmail(c: { business: string; personal: string }, field: EmailField): string {
  if (field === "personal") return c.personal;
  if (field === "personal_business") return c.personal || c.business;
  return c.business; // default
}

// Render merge tokens for a contact.
export function mergeFields(tpl: string, c: { firstName?: string; lastName?: string; company?: string }): string {
  return (tpl || "")
    .replace(/\{\{\s*first_name\s*\}\}/gi, c.firstName || "")
    .replace(/\{\{\s*last_name\s*\}\}/gi, c.lastName || "")
    .replace(/\{\{\s*company\s*\}\}/gi, c.company || "");
}
