"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const TEMPLATES: Record<string, { subject: string; body: string }> = {
  "Missed call follow-up": { subject: "We missed your call — let's connect", body: "Hi {first}, we saw you called Medigap.plus about your Medicare options and we missed you. Call 1-800-633-4427 anytime — a licensed specialist is ready to help. (Ref {ref})" },
  "Re-engage": { subject: "Still comparing Medicare options?", body: "Hi {first}, just checking in — we can compare your Medicare plan options in a few minutes, free. Call 1-800-633-4427 when you're ready." },
  "Open enrollment": { subject: "Medicare changes you should know about", body: "Hi {first}, Medicare Open Enrollment is here and you may qualify for a better plan or extra benefits. Call 1-800-633-4427 to review — no cost." },
};

export default function CommComposer({ sites, moneyWords, smtpReady }: { sites: { id: string; name: string }[]; moneyWords: string[]; smtpReady: boolean }) {
  const router = useRouter();
  const [type, setType] = useState("missed");
  const [value, setValue] = useState("");
  const [channel, setChannel] = useState("sms");
  const [subject, setSubject] = useState(TEMPLATES["Missed call follow-up"].subject);
  const [body, setBody] = useState(TEMPLATES["Missed call follow-up"].body);
  const [count, setCount] = useState<number | null>(null);
  const [limit, setLimit] = useState("100");
  const [testTo, setTestTo] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  // import
  const [importText, setImportText] = useState("");
  const [importSource, setImportSource] = useState("predictivedata-upload");

  const filter = { type, value };
  useEffect(() => {
    let live = true;
    fetch("/api/comms/count", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filter }) })
      .then((r) => r.json()).then((d) => { if (live) setCount(d.count ?? null); }).catch(() => {});
    return () => { live = false; };
  }, [type, value]); // eslint-disable-line react-hooks/exhaustive-deps

  const needsValue = ["moneyword", "site", "status", "vertical", "source", "search"].includes(type);

  async function send(test: boolean) {
    setBusy(true); setResult("");
    const payload: Record<string, unknown> = { name: `${type}${value ? `:${value}` : ""}`, channel, subject, body };
    if (test) { payload.testTo = testTo; payload.testEmail = testEmail; }
    else { payload.filter = filter; payload.limit = Number(limit) || 100; }
    const r = await fetch("/api/comms/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (d.error) setResult(`✗ ${d.error}`);
    else if (test) setResult("✓ Test sent.");
    else { setResult(`✓ Sent — ${d.sms} texts, ${d.emails} emails, ${d.failed} failed (audience ${d.audience}).`); router.refresh(); }
  }
  async function doImport() {
    setBusy(true); setResult("");
    const r = await fetch("/api/comms/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: importText, source: importSource }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (d.ok) { setResult(`✓ Imported ${d.created} contacts (${d.skipped} dupes/blank) as source "${d.source}".`); setImportText(""); router.refresh(); }
    else setResult(`✗ ${d.error || "import failed"}`);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card p-5">
        <div className="font-semibold mb-3">1 · Audience</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-[var(--muted)]">Segment</label>
            <select className="mt-1" value={type} onChange={(e) => { setType(e.target.value); setValue(""); }}>
              <option value="missed">Missed calls</option>
              <option value="moneyword">By money word</option>
              <option value="site">By website</option>
              <option value="status">By status</option>
              <option value="vertical">By vertical</option>
              <option value="source">By source</option>
              <option value="search">Search</option>
              <option value="all">Everyone</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--muted)]">Value</label>
            {type === "site" ? (
              <select className="mt-1" value={value} onChange={(e) => setValue(e.target.value)}><option value="">Select site…</option>{sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            ) : type === "moneyword" ? (
              <select className="mt-1" value={value} onChange={(e) => setValue(e.target.value)}><option value="">Select word…</option>{moneyWords.map((w) => <option key={w} value={w}>{w}</option>)}</select>
            ) : type === "status" ? (
              <select className="mt-1" value={value} onChange={(e) => setValue(e.target.value)}><option value="">Any</option><option>new</option><option>contacted</option><option>sold</option><option>dead</option></select>
            ) : type === "vertical" ? (
              <select className="mt-1" value={value} onChange={(e) => setValue(e.target.value)}><option value="">Any</option><option value="medicare">Medicare</option><option value="medicare_advantage">MA</option><option value="supplement">Supplement</option><option value="housing">Housing</option><option value="care">Care</option></select>
            ) : type === "source" ? (
              <select className="mt-1" value={value} onChange={(e) => setValue(e.target.value)}><option value="">Any</option><option>house</option><option>google</option><option>facebook</option><option>tv</option><option>organic</option><option value="predictivedata-upload">uploaded</option></select>
            ) : (
              <input className="mt-1" disabled={!needsValue} value={value} onChange={(e) => setValue(e.target.value)} placeholder={needsValue ? "search name/phone/email/zip" : "—"} />
            )}
          </div>
        </div>
        <div className="mt-3 text-sm">Audience: <b className="text-[var(--brand)]">{count == null ? "…" : count.toLocaleString()}</b> contacts {channel !== "email" ? "· SMS needs a phone" : ""}{channel !== "sms" ? " · email needs an address" : ""}. Opt-outs auto-excluded.</div>
      </div>

      <div className="card p-5">
        <div className="font-semibold mb-3">2 · Channel</div>
        <div className="flex gap-2">
          {["sms", "email", "both"].map((ch) => (
            <button key={ch} onClick={() => setChannel(ch)} className={`btn text-sm !py-1.5 ${channel === ch ? "btn-brand" : "btn-ghost"}`}>{ch === "sms" ? "Text" : ch === "email" ? "Email" : "Both"}</button>
          ))}
        </div>
        {channel !== "sms" && !smtpReady && <div className="mt-2 text-xs text-[var(--gold)]">Email needs Zapmail SMTP connected (Integrations) — texts will still send.</div>}
        <div className="mt-3 text-xs text-[var(--muted)]">Merge fields: <code>{"{first}"}</code> <code>{"{name}"}</code> <code>{"{ref}"}</code> <code>{"{zip}"}</code></div>
      </div>

      <div className="card p-5 lg:col-span-2">
        <div className="font-semibold mb-3">3 · Message</div>
        <label className="text-xs text-[var(--muted)]">Template</label>
        <select className="mb-3 mt-1" onChange={(e) => { const t = TEMPLATES[e.target.value]; if (t) { setSubject(t.subject); setBody(t.body); } }} defaultValue="Missed call follow-up">
          {Object.keys(TEMPLATES).map((t) => <option key={t}>{t}</option>)}
        </select>
        {channel !== "sms" && (<><label className="text-xs text-[var(--muted)]">Email subject</label><input className="mb-3 mt-1" value={subject} onChange={(e) => setSubject(e.target.value)} /></>)}
        <label className="text-xs text-[var(--muted)]">Message</label>
        <textarea className="mt-1" rows={4} value={body} onChange={(e) => setBody(e.target.value)} />

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div><label className="text-xs text-[var(--muted)]">Send up to</label><input className="!w-24 mt-1" value={limit} onChange={(e) => setLimit(e.target.value)} /></div>
          <button disabled={busy} onClick={() => send(false)} className="btn btn-brand text-sm">Send to segment →</button>
          <span className="text-[var(--border)]">|</span>
          <input className="!w-40" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="test text to…" />
          <input className="!w-48" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="test email to…" />
          <button disabled={busy} onClick={() => send(true)} className="btn btn-ghost text-sm">Send test</button>
        </div>
        <p className="mt-2 text-[11px] text-[var(--muted)]">SMS appends &quot;Reply STOP&quot;; emails include an unsubscribe link (TCPA/CAN-SPAM). SMS cost logged to Accounting.</p>
        {result && <div className="mt-3 text-sm" style={{ color: result.startsWith("✓") ? "var(--brand)" : "var(--danger)" }}>{result}</div>}
      </div>

      <div className="card p-5 lg:col-span-2">
        <div className="font-semibold mb-1">Import contacts from PredictiveData</div>
        <p className="text-xs text-[var(--muted)] mb-3">Paste rows (phone, email, name — comma or tab separated). They become a segment by source so you can message them.</p>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
          <textarea className="font-mono text-xs" rows={4} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder={"5551234567, mary@example.com, Mary Smith\n(305) 555-9988, , John Doe"} />
          <div className="flex flex-col gap-2">
            <input value={importSource} onChange={(e) => setImportSource(e.target.value)} placeholder="source tag" />
            <button disabled={busy || !importText.trim()} onClick={doImport} className="btn btn-brand text-sm">Import →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
