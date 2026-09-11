#!/usr/bin/env node
// Fails if a public form endpoint does not call guardForm().
//
// Runs in the deploy. The point is that "we forgot to put reCAPTCHA on the new
// form" becomes a build failure rather than something discovered from spam.
import { readFileSync, existsSync } from "node:fs";

const list = readFileSync("src/lib/public-forms.ts", "utf8");
const endpoints = [...list.matchAll(/"(\/api\/[^"]+)"/g)].map((m) => m[1]);

const missing = [];
for (const ep of endpoints) {
  const file = `src/app${ep}/route.ts`;
  if (!existsSync(file)) { missing.push(`${ep} — no route file at ${file}`); continue; }
  if (!readFileSync(file, "utf8").includes("guardForm(")) {
    missing.push(`${ep} — route does not call guardForm()`);
  }
}

if (missing.length) {
  console.error("✗ Unprotected public form endpoints:\n" + missing.map((m) => "   " + m).join("\n"));
  console.error("\n  Every endpoint in src/lib/public-forms.ts must call guardForm().");
  process.exit(1);
}
console.log(`✓ form guard: ${endpoints.length} public form endpoints, all guarded`);
