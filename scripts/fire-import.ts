// One-off / CLI list importer — parses a Predictive Data CSV and inserts an EmailList
// + deduped EmailContacts. Reuses the same parser the /fire upload API uses.
// Usage: npx tsx scripts/fire-import.ts <path-to-csv> "<list name>"
import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";
import { extractContacts } from "../src/lib/fire";

const prisma = new PrismaClient();

(async () => {
  const path = process.argv[2];
  const name = process.argv[3] || "Predictive Data list";
  if (!path) throw new Error("usage: fire-import.ts <csv> <name>");
  const text = readFileSync(path, "utf8");
  const { contacts } = extractContacts(text);

  const seen = new Set<string>();
  const unique = contacts.filter((c) => {
    const key = (c.raw["sha256_lc_hem"] || c.business || c.personal || `${c.firstName}|${c.lastName}`).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const sendable = unique.filter((c) => c.business).length;

  const list = await prisma.emailList.create({
    data: { name, fileName: path.split("/").pop() || "", total: unique.length, sendable },
  });
  const rows = unique.map((c) => ({
    listId: list.id, email: "", business: c.business, personal: c.personal,
    firstName: c.firstName, lastName: c.lastName, company: c.company, phones: c.phones.join(","), raw: JSON.stringify(c.raw),
  }));
  for (let i = 0; i < rows.length; i += 500) await prisma.emailContact.createMany({ data: rows.slice(i, i + 500) });

  console.log(`Imported "${name}": ${unique.length} contacts (${sendable} business, ${unique.filter((c) => c.personal).length} personal)`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
