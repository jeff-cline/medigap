"use client";
import { useState } from "react";
import Link from "next/link";
import { usd2 } from "@/lib/format";

export type FlowPing = {
  id: string; vertical: string; status: string; offerCents: number; soldCents: number;
  reportedCents: number; reconciled: boolean; isTest: boolean; externalId: string;
  trackingNumber: string; moneyWord: string; callId: string | null; note: string; createdAt: string;
  qualifySec: number; matchedClient: string; who: string;
  phone: string; callerName: string; callDurationSec: number | null;
};

const STATUS_TONE: Record<string, string> = {
  sold: "text-[var(--brand)]", posted: "text-[var(--gold)]", pinged: "text-[var(--gold)]",
  no_bid: "text-[var(--muted)]", rejected: "text-red-400",
};
const fmtTime = (s: string) => new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit" });
const fmtPhone = (p: string) => { const d = (p || "").replace(/\D/g, "").slice(-10); return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : p; };
function reasonOf(note: string): string {
  if (!note) return "";
  const parts = note.split("·").map((s) => s.trim());
  return (parts[1] || parts[0] || "").slice(0, 50);
}
// Buffer clearing: a ping with a bid only PAYS if the call lasts >= qualifySec ("buffer met").
function buffer(p: FlowPing): { met: boolean | null; label: string } {
  if (!p.offerCents || !p.qualifySec) return { met: null, label: "" };
  if (p.callDurationSec == null) return { met: null, label: `buffer ${p.qualifySec}s · pending` };
  const met = p.callDurationSec >= p.qualifySec;
  return { met, label: `buffer ${p.qualifySec}s · call ${p.callDurationSec}s · ${met ? "✓ met" : "✗ not met"}` };
}
// Did we actually monetize? sold + buffer met = cleared & paid.
function monetized(p: FlowPing): { ok: boolean; label: string } {
  const b = buffer(p);
  if (p.status === "sold") {
    if (b.met === false) return { ok: false, label: "not cleared — buffer not met" };
    if (b.met === true) return { ok: true, label: `monetized · ${usd2(p.soldCents || p.offerCents)}` };
    return { ok: false, label: "awaiting buffer" };
  }
  if (p.offerCents > 0) return { ok: false, label: "accepted (observe) — not posted" };
  return { ok: false, label: "" };
}

export default function RawFlowLog({ pings }: { pings: FlowPing[] }) {
  const [src, setSrc] = useState<"all" | "real" | "test">("all");
  const [status, setStatus] = useState<string>("");
  const [open, setOpen] = useState<string | null>(null);

  const filtered = pings.filter((p) => (src === "all" || (src === "real" ? !p.isTest : p.isTest)) && (!status || p.status === status));
  const statuses = Array.from(new Set(pings.map((p) => p.status)));

  function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return <button onClick={onClick} className={`rounded-full border px-2.5 py-1 text-[11px] ${active ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]" : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"}`}>{children}</button>;
  }

  return (
    <div id="rawflow" className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] p-3">
        <span className="text-sm font-medium mr-1">📡 Raw flow log</span>
        <Chip active={src === "all"} onClick={() => setSrc("all")}>All</Chip>
        <Chip active={src === "real"} onClick={() => setSrc("real")}>Real</Chip>
        <Chip active={src === "test"} onClick={() => setSrc("test")}>Test</Chip>
        <span className="mx-1 text-[var(--border)]">|</span>
        <Chip active={status === ""} onClick={() => setStatus("")}>any status</Chip>
        {statuses.map((s) => <Chip key={s} active={status === s} onClick={() => setStatus(s)}>{s}</Chip>)}
        <span className="ml-auto text-[11px] text-[var(--muted)]">{filtered.length} event{filtered.length === 1 ? "" : "s"}</span>
      </div>

      <div className="max-h-[460px] overflow-y-auto divide-y divide-[var(--border)] font-mono text-xs">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-[var(--muted)] font-sans text-sm">No events yet. Set a partner to Observe and take/simulate a call — each ping shows here.</div>
        ) : filtered.map((p) => {
          const mon = monetized(p);
          const buf = buffer(p);
          return (
            <div key={p.id}>
              <div className="w-full px-3 py-2 hover:bg-[var(--panel2)] flex items-center gap-2.5">
                <span className="text-[var(--muted)] shrink-0">{fmtTime(p.createdAt)}</span>
                {p.isTest && <span className="rounded bg-[var(--gold)]/15 text-[var(--gold)] px-1 text-[9px] shrink-0">TEST</span>}
                {/* phone → drill into the lead (appended + conversation) */}
                {p.phone ? (
                  p.callId
                    ? <Link href={`/dashboard/calls/${p.callId}`} className="text-[var(--brand)] hover:underline shrink-0" title="open lead, appended data & conversation">{fmtPhone(p.phone)}</Link>
                    : <span className="shrink-0">{fmtPhone(p.phone)}</span>
                ) : <span className="text-[var(--muted)] shrink-0">no caller</span>}
                {p.callerName && (p.callId
                  ? <Link href={`/dashboard/calls/${p.callId}`} className="text-[var(--brand)] hover:underline shrink-0 truncate max-w-[120px]" title="open lead, appended data & conversation">{p.callerName}</Link>
                  : <span className="text-[var(--text)] shrink-0 truncate max-w-[120px]">{p.callerName}</span>)}
                <span className="shrink-0">{p.vertical.replace(/_/g, " ")}{/default-vertical/.test(p.note) && <span className="text-[var(--muted)]" title="no auto/home/life word was heard, so it used the default vertical"> (default)</span>}</span>
                {p.moneyWord && <span className="text-[var(--muted)] shrink-0 hidden md:inline">“{p.moneyWord}”</span>}
                <span className={`font-semibold shrink-0 ${STATUS_TONE[p.status] || ""}`}>{p.status}</span>
                {reasonOf(p.note) && <span className="text-[var(--muted)] truncate min-w-0 hidden lg:inline">— {reasonOf(p.note)}</span>}
                <span className="ml-auto shrink-0 flex items-center gap-2">
                  {p.offerCents > 0 && <span className="text-[var(--muted)]">{p.who}</span>}
                  {p.offerCents > 0 && <span className="text-[var(--text)]">bid {usd2(p.offerCents)}</span>}
                  {mon.label && <span className={mon.ok ? "text-[var(--brand)]" : "text-[var(--muted)]"}>{mon.ok ? "💰 monetized" : buf.met === false ? "✗ not cleared" : "•"}</span>}
                  <button onClick={() => setOpen(open === p.id ? null : p.id)} className="text-[var(--muted)]">{open === p.id ? "▾" : "▸"}</button>
                </span>
              </div>
              {open === p.id && (
                <div className="bg-[var(--panel2)] px-3 py-2 text-[11px] space-y-1">
                  <Row k="caller" v={p.phone ? (p.callId ? <Link href={`/dashboard/calls/${p.callId}`} className="text-[var(--brand)] underline">{fmtPhone(p.phone)}{p.callerName ? ` · ${p.callerName}` : ""} — open lead, appended & conversation</Link> : fmtPhone(p.phone)) : "—"} />
                  <Row k="status" v={p.status} />
                  <Row k="monetized by" v={p.offerCents > 0 ? `${p.who}${p.matchedClient ? ` → ${p.matchedClient}` : ""}` : "—"} />
                  <Row k="commission / bid" v={p.offerCents ? usd2(p.offerCents) : "0"} />
                  <Row k="buffer (qualify)" v={p.qualifySec ? `${p.qualifySec}s` : "—"} />
                  <Row k="call duration" v={p.callDurationSec != null ? `${p.callDurationSec}s` : "pending"} />
                  <Row k="buffer met?" v={buf.met == null ? (p.offerCents ? "pending / no bid" : "—") : buf.met ? "✓ yes" : "✗ no"} />
                  <Row k="result" v={<span className={mon.ok ? "text-[var(--brand)]" : "text-[var(--muted)]"}>{mon.ok ? "MONETIZED — cleared & paid" : mon.label || "—"}</span>} />
                  <Row k="we recorded (sold)" v={p.soldCents ? usd2(p.soldCents) : "0"} />
                  <Row k="they reported" v={p.reconciled ? usd2(p.reportedCents) : "pending"} />
                  <Row k="QuinStreet pingId" v={p.externalId || "—"} />
                  <Row k="tracking #" v={p.trackingNumber || "—"} />
                  <Row k="response" v={p.note || "—"} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex gap-2"><span className="text-[var(--muted)] w-40 shrink-0">{k}</span><span className="break-all">{v}</span></div>;
}
