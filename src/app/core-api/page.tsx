import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { cst } from "@/lib/format";
import CoreKeysManager, { type KeyRow } from "@/components/CoreKeysManager";

export const metadata: Metadata = {
  title: "CORE API & SDK — R0cketShip",
  description: "Build on the R0cketShip Core. Push leads, attribute creators, and plug into the shared CRM/data/comms engine with a simple key-authenticated API + SDK.",
};
export const dynamic = "force-dynamic";

const BASE = "https://medigap.plus";

function Code({ children }: { children: string }) {
  return <pre className="card !p-4 overflow-x-auto text-[13px] leading-relaxed ag-mono whitespace-pre">{children}</pre>;
}

export default async function CoreApiPage() {
  const session = await getSession();
  const isGod = session?.role === "god" || !!session?.impersonatorUid;
  const keys = isGod
    ? (await db.apiKey.findMany({ orderBy: { createdAt: "desc" } })).map((k): KeyRow => ({ id: k.id, name: k.name, keyId: k.keyId, scopes: k.scopes, active: k.active, callCount: k.callCount, lastUsedAt: k.lastUsedAt ? cst(k.lastUsedAt) : null, createdAt: cst(k.createdAt) }))
    : [];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--panel)]/60 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-4xl px-6 h-14 flex items-center justify-between">
          <span className="text-lg font-extrabold text-gradient">R0cketShip CORE API</span>
          <Link href="/dashboard" className="text-sm text-[var(--muted)] hover:text-[var(--text)]">Dashboard →</Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10 space-y-10">
        <section>
          <h1 className="text-3xl md:text-4xl font-bold">Build on the <span className="text-gradient">Core.</span></h1>
          <p className="mt-3 text-[var(--muted)] max-w-2xl leading-relaxed">
            The Core is the shared backend (Mission Control) behind every R0cketShip business — CRM, data append, communications and attribution.
            Push leads in with a key-authenticated API and they flow through the whole network: enriched, tracked, monetized. This is how partners and
            stacked businesses connect.
          </p>
        </section>

        {isGod && (
          <section>
            <h2 className="text-xl font-bold mb-1">🔑 Your API keys</h2>
            <p className="text-sm text-[var(--muted)] mb-4">Issue a key per partner/app. The secret is shown once — copy it then. Revoke anytime.</p>
            <CoreKeysManager keys={keys} />
          </section>
        )}

        <section>
          <h2 className="text-xl font-bold mb-2">Authentication</h2>
          <p className="text-sm text-[var(--muted)] mb-3">Send your key id and secret as headers on every request. Base URL: <code className="text-[var(--brand2)]">{BASE}</code></p>
          <Code>{`x-core-key:    core_pk_xxxxxxxx
x-core-secret: core_sk_xxxxxxxx
content-type:  application/json`}</Code>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">Endpoints</h2>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold"><span className="text-[var(--brand)]">GET</span> /api/core/ping <span className="text-[var(--muted)] font-normal">— verify your key</span></div>
              <Code>{`curl ${BASE}/api/core/ping \\
  -H "x-core-key: core_pk_..." \\
  -H "x-core-secret: core_sk_..."
# → { "ok": true, "authenticated": true, "name": "Acme Partner", "scopes": ["lead:create"] }`}</Code>
            </div>
            <div>
              <div className="text-sm font-semibold"><span className="text-[var(--gold)]">POST</span> /api/core/lead <span className="text-[var(--muted)] font-normal">— push a lead into the Core (scope: lead:create)</span></div>
              <Code>{`curl -X POST ${BASE}/api/core/lead \\
  -H "x-core-key: core_pk_..." \\
  -H "x-core-secret: core_sk_..." \\
  -H "content-type: application/json" \\
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "2145551234",
    "creatorRef": "krystalore",
    "notes": "from my landing page"
  }'
# → { "ok": true, "leadId": "clxxxx" }`}</Code>
              <p className="text-xs text-[var(--muted)] mt-1">The lead lands in the shared CRM, is auto-enriched (data append), tagged to your key&apos;s source, and attributed to <code className="text-[var(--brand2)]">creatorRef</code> if provided — then tracked through the whole network.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">SDK</h2>
          <p className="text-sm text-[var(--muted)] mb-3">A tiny, dependency-free client. <a href="/api/core/sdk" className="text-[var(--brand)] underline">Download core-sdk.js →</a></p>
          <Code>{`import { createCoreClient } from "./core-sdk.js";

const core = createCoreClient({
  keyId:  "core_pk_...",
  secret: "core_sk_...",
});

await core.ping();
const { leadId } = await core.lead.create({
  name: "Jane Doe",
  email: "jane@example.com",
  creatorRef: "krystalore",
});`}</Code>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">Errors</h2>
          <Code>{`401  Invalid or missing CORE API credentials (or missing required scope)
400  Bad request (e.g. no name/email/phone on a lead)
200  { "ok": true, ... }`}</Code>
        </section>

        <footer className="border-t border-[var(--border)] pt-6 text-xs text-[var(--muted)]">
          R0cketShip CORE · Mission Control · keys issued and revoked by the God account · all data lives in and is owned by the Core.
        </footer>
      </main>
    </div>
  );
}
