"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const TEMPLATES: Record<string, string> = {
  "Callback reminder": "Hi, it's Medigap.plus — we tried reaching you about your Medicare options. Call 1-800-MEDIGAP (1-800-633-4427) to talk to a licensed specialist. No cost, no obligation.",
  "New lead follow-up": "Thanks for your interest in Medicare help from Medigap.plus! A licensed specialist can compare your plan options now — call 1-800-633-4427.",
  "Open enrollment": "Medicare Open Enrollment is here. You may qualify for a better plan or extra benefits. Call Medigap.plus at 1-800-633-4427 to review — free.",
  "Missed call": "Sorry we missed you! A Medigap.plus specialist is standing by. Call back anytime at 1-800-633-4427.",
};

export default function SmsComposer({ twilioReady, senderLabel }: { twilioReady: boolean; senderLabel: string }) {
  const router = useRouter();
  const [body, setBody] = useState(TEMPLATES["Callback reminder"]);
  const [status, setStatus] = useState("");
  const [vertical, setVertical] = useState("");
  const [source, setSource] = useState("");
  const [testLimit, setTestLimit] = useState("5");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");

  // single test send
  const [testTo, setTestTo] = useState("");
  // import
  const [numbers, setNumbers] = useState("");

  const optoutIncluded = /\bstop\b/i.test(body);
  const charLen = body.length + (optoutIncluded ? 0 : 21);
  const segments = Math.max(1, Math.ceil(charLen / 153));

  async function post(url: string, payload: object) {
    setBusy(true); setResult("");
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await r.json().catch(() => ({}));
    setBusy(false); router.refresh();
    return data;
  }

  async function sendTestOne() {
    if (!testTo) return;
    const d = await post("/api/sms/send", { to: testTo, body });
    setResult(d.ok ? `✓ Sent to ${testTo} (status: ${d.status || "queued"})` : `✗ ${d.error}`);
  }
  async function sendBatch(all: boolean) {
    const payload: Record<string, unknown> = { body, batch: status || "all" };
    if (status) payload.status = status; if (vertical) payload.vertical = vertical; if (source) payload.source = source;
    if (!all) payload.testLimit = Number(testLimit) || 5;
    const d = await post("/api/sms/blast", payload);
    setResult(d.ok ? `✓ Batch "${d.batch}": ${d.sent} sent, ${d.failed} failed (audience ${d.audience})` : `✗ ${d.error}`);
  }
  async function doImport() {
    const d = await post("/api/leads/import", { numbers, vertical: vertical || "medicare", source: "house" });
    setResult(d.ok ? `✓ Imported ${d.created} new numbers (${d.skipped} already existed) of ${d.found} valid` : `✗ ${d.error}`);
    if (d.ok) setNumbers("");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card p-5">
        <div className="font-semibold mb-3">Compose</div>
        {!twilioReady && <div className="mb-3 rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-2 text-xs text-[var(--gold)]">Twilio isn&apos;t verified yet — sends will log as <b>skipped</b> until you connect Twilio &amp; pass toll-free verification. You can still set everything up now.</div>}
        <label className="text-xs text-[var(--muted)]">Template</label>
        <select className="mb-3 mt-1" onChange={(e) => e.target.value && setBody(TEMPLATES[e.target.value])} defaultValue="Callback reminder">
          {Object.keys(TEMPLATES).map((t) => <option key={t}>{t}</option>)}
        </select>
        <label className="text-xs text-[var(--muted)]">Message</label>
        <textarea className="mt-1" rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
        <div className="mt-1 flex justify-between text-xs text-[var(--muted)]">
          <span>{charLen} chars · ~{segments} segment{segments > 1 ? "s" : ""}{!optoutIncluded && " (incl. auto STOP footer)"}</span>
          <span>Sender: {senderLabel || "—"}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <div><label className="text-xs text-[var(--muted)]">Status</label>
            <select className="mt-1" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Any</option><option value="new">New</option><option value="contacted">Contacted</option><option value="sold">Sold</option><option value="dead">Dead</option></select></div>
          <div><label className="text-xs text-[var(--muted)]">Vertical</label>
            <select className="mt-1" value={vertical} onChange={(e) => setVertical(e.target.value)}><option value="">Any</option><option value="medicare">Medicare</option><option value="medicare_advantage">MA</option><option value="supplement">Supplement</option><option value="housing">Housing</option><option value="care">Care</option></select></div>
          <div><label className="text-xs text-[var(--muted)]">Source</label>
            <select className="mt-1" value={source} onChange={(e) => setSource(e.target.value)}><option value="">Any</option><option value="house">House</option><option value="google">Google</option><option value="facebook">Facebook</option><option value="tv">TV</option><option value="organic">Organic</option></select></div>
        </div>

        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <input className="!w-20" value={testLimit} onChange={(e) => setTestLimit(e.target.value)} placeholder="5" />
          <button disabled={busy} onClick={() => sendBatch(false)} className="btn btn-ghost text-sm !py-1.5">Send test batch</button>
          <button disabled={busy} onClick={() => sendBatch(true)} className="btn btn-brand text-sm !py-1.5">Send to all matching →</button>
        </div>
        <p className="mt-2 text-[11px] text-[var(--muted)]">Opt-outs are auto-excluded. &quot;Reply STOP&quot; is appended automatically (TCPA). Cost is logged to Accounting.</p>

        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <label className="text-xs text-[var(--muted)]">Quick single test send</label>
          <div className="flex gap-2 mt-1">
            <input placeholder="+1 555 123 4567" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
            <button disabled={busy} onClick={sendTestOne} className="btn btn-ghost text-sm !py-1.5 shrink-0">Send 1</button>
          </div>
        </div>

        {result && <div className="mt-3 text-sm" style={{ color: result.startsWith("✓") ? "var(--brand)" : "var(--danger)" }}>{result}</div>}
      </div>

      <div className="card p-5">
        <div className="font-semibold mb-1">Import past numbers</div>
        <p className="text-xs text-[var(--muted)] mb-3">Paste your past lead phone numbers (one per line or comma-separated). They&apos;ll appear in the Leads CRM as house leads, deduped, ready to text or call.</p>
        <textarea className="font-mono text-sm" rows={10} value={numbers} onChange={(e) => setNumbers(e.target.value)} placeholder={"5551234567\n(305) 555-9988\n+1 480 555 2211"} />
        <button disabled={busy || !numbers.trim()} onClick={doImport} className="btn btn-brand text-sm !py-1.5 mt-3">Import numbers →</button>
        <p className="mt-2 text-[11px] text-[var(--muted)]">Next: bulk CSV upload + Datamoon append to fill in names/emails.</p>
      </div>
    </div>
  );
}
