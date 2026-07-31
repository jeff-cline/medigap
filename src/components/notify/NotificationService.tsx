"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Section } from "@/components/ui";

type EventRow = {
  id: string; title: string; message: string; link: string;
  month: number; day: number; hour: number; minute: number;
  annual: boolean; year: number; sendEmail: boolean; active: boolean; lastSentYear: number; createdAt: string;
};
type Member = { id: string; phone: string; email: string; state: string; name: string; source: string; at: string };
type Props = { events: EventRow[]; members: Member[]; enrolledCount: number };

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const hhmm = (h: number, m: number) => `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"} CT`;

export default function NotificationService({ events, members, enrolledCount }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // add-to-calendar form
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [month, setMonth] = useState(10);
  const [day, setDay] = useState(15);
  const [hour, setHour] = useState(9);
  const [annual, setAnnual] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [sendEmail, setSendEmail] = useState(false);

  const post = async (body: unknown) => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/notifications/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Failed (${res.status})`);
      router.refresh();
      return true;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const addEvent = async () => {
    if (!message.trim()) { setErr("Message is required."); return; }
    const ok = await post({ action: "create", title, message, link, month, day, hour, minute: 0, annual, year, sendEmail });
    if (ok) { setTitle(""); setMessage(""); setLink(""); }
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">🚀 Notification Service</h1>
          <p className="text-sm text-[var(--muted)]">
            Scheduled texts to your free-notification signups — <b>{enrolledCount}</b> enrolled. Replies land back in the Unified inbox.
          </p>
        </div>
        <a href="/dashboard/static" className="btn btn-ghost text-sm">← Static dashboard</a>
      </div>

      {err && <div className="rounded border border-[var(--danger)] text-[var(--danger)] text-sm px-3 py-2 mb-4">{err}</div>}

      <Section title="Add to calendar" desc="Schedule a notification. Annual events fire every year on that date; the send goes to everyone enrolled.">
        <div className="card mb-6">
          <div className="grid gap-2 md:grid-cols-2 mb-2">
            <input className="rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-sm" placeholder="Title (internal label)" value={title} onChange={(e) => setTitle(e.target.value)} />
            <input className="rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-sm" placeholder="Link to include (optional, e.g. https://el.ag/medicare-plans)" value={link} onChange={(e) => setLink(e.target.value)} />
          </div>
          <textarea className="w-full rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-2 text-sm min-h-[70px] mb-2" placeholder="Message people will receive…" value={message} onChange={(e) => setMessage(e.target.value)} />
          <div className="flex flex-wrap gap-3 items-center text-sm">
            <label className="flex items-center gap-1">Month
              <select className="rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {MONTHS.slice(1).map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-1">Day
              <input type="number" min={1} max={31} className="w-16 rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1" value={day} onChange={(e) => setDay(Number(e.target.value))} />
            </label>
            <label className="flex items-center gap-1">Hour (CT)
              <input type="number" min={0} max={23} className="w-16 rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1" value={hour} onChange={(e) => setHour(Number(e.target.value))} />
            </label>
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={annual} onChange={(e) => setAnnual(e.target.checked)} /> Every year
            </label>
            {!annual && (
              <label className="flex items-center gap-1">Year
                <input type="number" className="w-24 rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1" value={year} onChange={(e) => setYear(Number(e.target.value))} />
              </label>
            )}
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} /> Also email (members with an email)
            </label>
            <button className="btn ml-auto" disabled={busy || !message.trim()} onClick={addEvent}>+ Add to calendar</button>
          </div>
        </div>
      </Section>

      <Section title="Scheduled notifications" desc="What everyone enrolled will receive, and when.">
        <div className="space-y-2 mb-6">
          {events.length === 0 && <div className="text-sm text-[var(--muted)]">No notifications scheduled yet.</div>}
          {events.map((ev) => (
            <div key={ev.id} className={`rounded border border-[var(--border)] p-3 ${ev.active ? "" : "opacity-60"}`}>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center justify-center rounded bg-[var(--panel2)] px-2 py-1 text-sm font-semibold shrink-0">
                  {MONTHS[ev.month]} {ev.day}
                </span>
                <span className="text-xs text-[var(--muted)]">{ev.annual ? "every year" : ev.year} · {hhmm(ev.hour, ev.minute)}{ev.sendEmail ? " · +email" : ""}</span>
                <span className="font-medium">{ev.title || "(untitled)"}</span>
                <div className="ml-auto flex gap-2">
                  <button className="btn btn-ghost text-xs" disabled={busy} onClick={() => post({ action: "update", ...ev, active: !ev.active })}>{ev.active ? "🟢 On" : "⚪ Off"}</button>
                  <button className="text-xs text-[var(--danger)]" disabled={busy} onClick={() => { if (confirm("Delete this scheduled notification?")) post({ action: "delete", id: ev.id }); }}>Delete</button>
                </div>
              </div>
              <div className="text-sm mt-1.5">{ev.message} {ev.link && <a href={ev.link} target="_blank" rel="noreferrer" className="text-[var(--brand)]">{ev.link}</a>}</div>
              {ev.lastSentYear > 0 && <div className="text-[10px] text-[var(--muted)] mt-1">last sent: {ev.lastSentYear}</div>}
            </div>
          ))}
        </div>
      </Section>

      <Section title={`Enrolled members (${enrolledCount})`} desc="People signed up for the free notification service. Showing the most recent 20.">
        <div className="card !p-0 overflow-hidden">
          <div className="divide-y divide-[var(--border)]">
            {members.length === 0 && <div className="p-4 text-sm text-[var(--muted)]">No signups yet.</div>}
            {members.map((m) => (
              <div key={m.id} className="px-4 py-2 flex items-center gap-3 text-sm">
                <span className="font-medium w-40 truncate">{m.name || m.phone}</span>
                <span className="text-[var(--muted)]">{m.phone}</span>
                {m.state && <span className="text-[var(--muted)]">{m.state}</span>}
                <span className="text-[10px] text-[var(--muted)] ml-auto">{m.source} · {new Date(m.at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
        {enrolledCount > members.length && <div className="text-xs text-[var(--muted)] mt-2">+ {enrolledCount - members.length} more not shown.</div>}
      </Section>
    </>
  );
}
