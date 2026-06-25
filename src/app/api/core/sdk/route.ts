import { NextResponse } from "next/server";

// Downloadable CORE JS/TS SDK — a tiny dependency-free client partners drop into any app.
const SDK = `// R0cketShip CORE SDK — build on the Core.
// const core = createCoreClient({ keyId: "core_pk_...", secret: "core_sk_..." });
// await core.lead.create({ name, email, phone, creatorRef });
export function createCoreClient({ keyId, secret, base = "https://medigap.plus" }) {
  if (!keyId || !secret) throw new Error("createCoreClient needs { keyId, secret }");
  const headers = { "x-core-key": keyId, "x-core-secret": secret, "content-type": "application/json" };
  async function req(path, init) {
    const res = await fetch(base + path, { ...init, headers: { ...headers, ...(init && init.headers) } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || ("CORE API error " + res.status));
    return data;
  }
  return {
    // Verify the key works.
    ping: () => req("/api/core/ping", { method: "GET" }),
    lead: {
      // Push a lead into the Core CRM. Returns { ok, leadId }.
      create: (lead) => req("/api/core/lead", { method: "POST", body: JSON.stringify(lead) }),
    },
  };
}

// CommonJS interop
if (typeof module !== "undefined") module.exports = { createCoreClient };
`;

export function GET() {
  return new NextResponse(SDK, {
    headers: { "Content-Type": "text/javascript; charset=utf-8", "Content-Disposition": 'inline; filename="core-sdk.js"', "Cache-Control": "no-store" },
  });
}
