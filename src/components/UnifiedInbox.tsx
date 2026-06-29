"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Category emojis. "❓" is the default on synced contacts (until you tag them). "pflame" is a
// custom PURPLE flame (the 🔥 glyph hue-shifted to purple) — rendered via <EmojiIcon/>.
const PFLAME = "pflame";
const EMOJIS = ["❓", "📱", "🔥", PFLAME, "💜", "👤", "💰", "⭐", "🤝", "🏢", "💎", "📞", "❤️", "🆕", "✅", "❌"];
function EmojiIcon({ v, className = "" }: { v: string; className?: string }) {
  if (v === PFLAME) return <span className={className} title="purple flame" style={{ display: "inline-block", filter: "hue-rotate(255deg) saturate(2.4) brightness(1.05)" }}>🔥</span>;
  return <span className={className}>{v}</span>;
}

type RawContact = { name: string; phone: string; email: string };
function parseVCards(text: string): RawContact[] {
  return text.split(/BEGIN:VCARD/i).slice(1).map((c) => ({
    name: (c.match(/\r?\nFN[^:\n]*:(.+)/i)?.[1] || c.match(/\r?\nN[^:\n]*:(.+)/i)?.[1] || "").replace(/;/g, " ").trim(),
    phone: (c.match(/\r?\nTEL[^:\n]*:(.+)/i)?.[1] || "").trim(),
    email: (c.match(/\r?\nEMAIL[^:\n]*:(.+)/i)?.[1] || "").trim(),
  })).filter((c) => c.phone || c.email);
}
function parseCsv(text: string): RawContact[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const cols = lines[0].split(",").map((h) => h.toLowerCase().replace(/"/g, "").trim());
  const idx = (re: RegExp) => cols.findIndex((c) => re.test(c));
  const ni = idx(/^name$|full.?name|first.?name|display/), pi = idx(/phone|mobile|tel/), ei = idx(/e.?mail/);
  if (pi < 0 && ei < 0) return [];
  return lines.slice(1).map((line) => {
    const f = line.split(",").map((x) => x.replace(/^"|"$/g, "").trim());
    return { name: ni >= 0 ? f[ni] || "" : "", phone: pi >= 0 ? f[pi] || "" : "", email: ei >= 0 ? f[ei] || "" : "" };
  }).filter((c) => c.phone || c.email);
}

type Msg = { id: string; channel: "sms" | "email"; direction: string; body: string; subject: string; at: string; emoji: string; read: boolean };
export type Thread = {
  leadId: string; name: string; phone: string; email: string;
  score: number; emoji: string; messages: Msg[]; lastAt: string; unread: number; lastChannel: string;
};
type Contact = { id: string; name: string; phone: string; email: string };

function fmtWhen(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso); const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const yest = new Date(now); yest.setDate(now.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: d.getFullYear() === now.getFullYear() ? undefined : "2-digit" });
}
const fmtPhone = (p: string) => { const x = (p || "").replace(/\D/g, "").slice(-10); return x.length === 10 ? `(${x.slice(0, 3)}) ${x.slice(3, 6)}-${x.slice(6)}` : p; };
const initials = (n: string) => (n || "?").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

async function api(path: string, body: Record<string, unknown>) {
  return fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()).catch(() => ({}));
}

export default function UnifiedInbox({ me, threads: initial, unreached }: { me: string; threads: Thread[]; unreached: Contact[] }) {
  const router = useRouter();
  const [threads, setThreads] = useState(initial);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showUnreached, setShowUnreached] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "score">("recent");
  const [emojiFilter, setEmojiFilter] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [channel, setChannel] = useState<"sms" | "email">("sms");
  const [text, setText] = useState("");
  const [subject, setSubject] = useState("");
  const [sending, setSending] = useState(false);
  const [q, setQ] = useState("");
  const [found, setFound] = useState<{ id: string; name: string; phone: string; email: string }[]>([]);
  const open = threads.find((t) => t.leadId === openId) || null;

  // FIND: search the CRM for any contact to start a new text/email.
  useEffect(() => {
    if (q.trim().length < 2) { setFound([]); return; }
    const t = setTimeout(async () => {
      const r = await fetch(`/api/unified/search?q=${encodeURIComponent(q.trim())}`).then((x) => x.json()).catch(() => ({}));
      setFound(r.leads || []);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  function openLead(l: Contact) {
    const existing = threads.find((t) => t.leadId === l.id);
    if (!existing) {
      setThreads((ts) => [{ leadId: l.id, name: l.name || l.email || l.phone || "Unknown", phone: l.phone || "", email: l.email || "", score: 0, emoji: "", messages: [], lastAt: "", unread: 0, lastChannel: l.phone ? "sms" : "email" }, ...ts]);
    }
    setQ(""); setFound([]); setShowUnreached(false);
    setOpenId(l.id);
    setChannel(l.phone ? "sms" : "email");
  }
  async function setScore(leadId: string, score: number) {
    setThreads((ts) => ts.map((x) => x.leadId === leadId ? { ...x, score } : x));
    await api("/api/unified/score", { leadId, score });
  }
  async function setEmoji(leadId: string, emoji: string) {
    setThreads((ts) => ts.map((x) => x.leadId === leadId ? { ...x, emoji } : x));
    await api("/api/unified/emoji", { leadId, emoji });
  }

  // SYNC MY PHONE — use the browser Contact Picker where supported (Android), else a vCard/CSV upload (iOS).
  async function importContacts(contacts: RawContact[]) {
    if (!contacts.length) { setSyncMsg("No contacts found in that file."); return; }
    setSyncing(true); setSyncMsg(`Importing ${contacts.length}…`);
    const r = await api("/api/unified/import-contacts", { contacts });
    setSyncing(false);
    if (r.ok) { setSyncMsg(`✅ Added ${r.imported}, updated ${r.updated}. Tagged ❓ — find them in Unreached.`); router.refresh(); }
    else setSyncMsg(r.error || "Import failed");
  }
  async function syncPhone() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav: any = typeof navigator !== "undefined" ? navigator : {};
    if (nav.contacts?.select) {
      try {
        const picked = await nav.contacts.select(["name", "tel", "email"], { multiple: true });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const contacts: RawContact[] = picked.map((c: any) => ({ name: (c.name?.[0]) || "", phone: (c.tel?.[0]) || "", email: (c.email?.[0]) || "" }));
        await importContacts(contacts);
        return;
      } catch { /* user cancelled */ return; }
    }
    fileRef.current?.click(); // iOS / unsupported → upload a vCard you export from Contacts
  }
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const text = await file.text();
    const contacts = /BEGIN:VCARD/i.test(text) ? parseVCards(text) : parseCsv(text);
    await importContacts(contacts);
    e.target.value = "";
  }
  const ql = q.trim().toLowerCase();
  let visibleThreads = ql
    ? threads.filter((t) => t.name.toLowerCase().includes(ql) || t.phone.includes(ql) || t.email.toLowerCase().includes(ql) || t.emoji === q.trim() || t.messages.some((m) => m.body.toLowerCase().includes(ql)))
    : threads;
  if (emojiFilter) visibleThreads = visibleThreads.filter((t) => t.emoji === emojiFilter);
  if (sortBy === "score") visibleThreads = [...visibleThreads].sort((a, b) => b.score - a.score || +new Date(b.lastAt) - +new Date(a.lastAt));
  const presentEmojis = [...new Set(threads.map((t) => t.emoji).filter(Boolean))];
  const threadIds = new Set(threads.map((t) => t.leadId));
  const newContacts = ql ? found.filter((l) => !threadIds.has(l.id)) : [];

  async function openThread(t: Thread) {
    setOpenId(t.leadId);
    setChannel(t.phone ? "sms" : "email");
    if (t.unread > 0) {
      setThreads((ts) => ts.map((x) => x.leadId === t.leadId ? { ...x, unread: 0, messages: x.messages.map((m) => ({ ...m, read: true })) } : x));
      await api("/api/unified/read", { leadId: t.leadId });
    }
  }
  async function send() {
    if (!open || !text.trim()) return;
    setSending(true);
    const r = await api("/api/unified/send", { leadId: open.leadId, channel, text, subject });
    setSending(false);
    if (r.ok) {
      const now = new Date().toISOString();
      const msg: Msg = { id: r.id || now, channel, direction: "outbound", body: text, subject, at: now, emoji: "🚀", read: true };
      setThreads((ts) => ts.map((x) => x.leadId === open.leadId ? { ...x, messages: [msg, ...x.messages], lastAt: now } : x).sort((a, b) => +new Date(b.lastAt) - +new Date(a.lastAt)));
      setText(""); setSubject("");
    } else alert(r.error || "Could not send");
  }

  return (
    <div className="min-h-screen bg-black flex justify-center">
      {/* phone frame */}
      <div className="w-full max-w-[440px] min-h-screen bg-[#0b0b0c] text-white flex flex-col relative">
        {/* status bar */}
        <div className="h-10 shrink-0 flex items-center justify-between px-6 text-[11px] text-white/70">
          <span>{new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
          <span>🚀 Unified</span>
          <span>5G ▮▮▮</span>
        </div>

        {!open ? (
          /* ---------- THREAD LIST ---------- */
          <>
            <input ref={fileRef} type="file" accept=".vcf,text/vcard,.csv,text/csv" onChange={onFile} className="hidden" />
            <div className="px-5 pt-1 pb-2">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Unified Communications</h1>
                <Link href="/dashboard" className="text-[12px] text-[var(--brand)]">Show more →</Link>
              </div>
              <div className="flex items-center gap-2 my-2">
                <button onClick={syncPhone} disabled={syncing} className="rounded-full bg-[var(--brand)] text-white text-xs font-semibold px-3 py-1.5">{syncing ? "Syncing…" : "📲 Sync ALL contacts"}</button>
                {syncMsg && <span className="text-[11px] text-white/50 truncate">{syncMsg}</span>}
              </div>
              <div className="flex items-center gap-3 text-[11px] mb-2">
                <span className="text-white/40">🚀 iPhone · 🔥 desktop · 💎 team</span>
                <button onClick={() => { setShowUnreached((v) => !v); setQ(""); }} className={`ml-auto ${showUnreached ? "text-[var(--gold)] font-semibold" : "text-[var(--brand)]"}`}>
                  Unreached{unreached.length ? ` (${unreached.length})` : ""}
                </button>
                <button onClick={() => setSortBy((s) => s === "recent" ? "score" : "recent")} className="text-white/50">
                  Sort: {sortBy === "score" ? "🚀 score" : "recent"}
                </button>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-[#1c1e22] border border-white/10 px-3 py-2">
                <span className="text-white/40">🔎</span>
                <input value={q} onChange={(e) => { setQ(e.target.value); setShowUnreached(false); }} placeholder="Find a contact to text or email…" className="bg-transparent flex-1 text-[15px] text-white outline-none placeholder:text-white/30" />
                {q && <button onClick={() => setQ("")} className="text-white/40 text-lg leading-none">×</button>}
              </div>
              {presentEmojis.length > 0 && (
                <div className="flex items-center gap-1 mt-2 overflow-x-auto">
                  <button onClick={() => setEmojiFilter("")} className={`rounded-full px-2.5 py-1 text-xs shrink-0 ${!emojiFilter ? "bg-[var(--brand)] text-white" : "bg-white/10 text-white/50"}`}>All</button>
                  {presentEmojis.map((e) => (
                    <button key={e} onClick={() => setEmojiFilter(emojiFilter === e ? "" : e)} className={`rounded-full px-2.5 py-1 text-sm shrink-0 ${emojiFilter === e ? "bg-[var(--brand)]" : "bg-white/10"}`}><EmojiIcon v={e} /></button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {/* UNREACHED — dumpster contacts you've never messaged. Tap to start the conversation. */}
              {showUnreached && (
                <div>
                  <div className="px-4 pt-2 pb-1 text-[10px] uppercase tracking-wide text-[var(--gold)]">Not reached yet · {unreached.length} in the dumpster</div>
                  {unreached.length === 0 && <div className="p-8 text-center text-white/40 text-sm">🎉 You&apos;ve reached everyone in the dumpster.</div>}
                  {unreached.map((l) => (
                    <button key={l.id} onClick={() => openLead(l)} className="w-full text-left flex items-center gap-3 px-4 py-2.5 border-b border-white/5">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--gold)]/15 text-xs font-semibold text-[var(--gold)]">{initials(l.name || l.email)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-white/85">{l.name || l.email || fmtPhone(l.phone)}</div>
                        <div className="truncate text-[12px] text-white/40">{[l.phone && fmtPhone(l.phone), l.email].filter(Boolean).join(" · ") || "no contact info"}</div>
                      </div>
                      <span className="text-[var(--brand)] text-lg">＋</span>
                    </button>
                  ))}
                </div>
              )}
              {/* search results — start a NEW conversation with a contact that has no thread yet */}
              {!showUnreached && newContacts.length > 0 && (
                <div className="border-b border-white/5">
                  <div className="px-4 pt-2 pb-1 text-[10px] uppercase tracking-wide text-white/30">Start a conversation</div>
                  {newContacts.map((l) => (
                    <button key={l.id} onClick={() => openLead(l)} className="w-full text-left flex items-center gap-3 px-4 py-2.5">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-semibold text-white/70">{initials(l.name || l.email)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-white/85">{l.name || l.email || fmtPhone(l.phone)}</div>
                        <div className="truncate text-[12px] text-white/40">{[l.phone && fmtPhone(l.phone), l.email].filter(Boolean).join(" · ") || "no contact info"}</div>
                      </div>
                      <span className="text-[var(--brand)] text-lg">＋</span>
                    </button>
                  ))}
                </div>
              )}
              {!showUnreached && visibleThreads.length === 0 && newContacts.length === 0 && <div className="p-10 text-center text-white/40 text-sm">{ql ? "No matches." : "No conversations yet — search above to start one."}</div>}
              {!showUnreached && visibleThreads.map((t) => {
                const last = t.messages[0];
                const un = t.unread > 0;
                return (
                  <button key={t.leadId} onClick={() => openThread(t)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-white/5 ${un ? "bg-[#16181d]" : "bg-transparent"}`}>
                    <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-semibold ${un ? "bg-[var(--brand)] text-white" : "bg-white/10 text-white/70"}`}>{initials(t.name)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {un && <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand)] shrink-0" />}
                        {t.emoji && <EmojiIcon v={t.emoji} className="shrink-0" />}
                        <span className={`truncate ${un ? "font-bold text-white" : "font-medium text-white/80"}`}>{t.name}</span>
                        <span className="text-[13px] shrink-0">{t.lastChannel === "email" ? "✉️" : "💬"}</span>
                        {t.score > 0 && <span className="text-[11px] shrink-0" title={`${t.score}/5`}>{"🚀".repeat(t.score)}</span>}
                        <span className="ml-auto text-[12px] text-white/40 shrink-0">{fmtWhen(t.lastAt)}</span>
                      </div>
                      <div className={`truncate text-[13px] mt-0.5 ${un ? "text-white/80" : "text-white/40"}`}>{last?.direction === "outbound" ? "You: " : ""}{last?.body || last?.subject}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          /* ---------- THREAD DETAIL ---------- */
          <>
            <div className="shrink-0 border-b border-white/10 bg-[#0b0b0c]/95 backdrop-blur px-3 py-2 flex items-center gap-2 sticky top-0">
              <button onClick={() => setOpenId(null)} className="text-[var(--brand)] text-2xl leading-none px-1">‹</button>
              <div className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-xs font-semibold">{initials(open.name)}</div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate leading-tight">{open.name}</div>
                <div className="text-[11px] text-white/40 truncate">{open.phone ? fmtPhone(open.phone) : open.email}</div>
              </div>
              {open.phone && <a href={`tel:${open.phone.replace(/[^\d+]/g, "")}`} className="grid h-9 w-9 place-items-center rounded-full bg-[var(--brand)]/20 text-[var(--brand)] text-lg" title="Call">📞</a>}
              {open.email && <a href={`mailto:${open.email}`} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-lg" title="Email">✉️</a>}
            </div>

            {/* rocket score 1-5 + category emoji dropdown */}
            <div className="shrink-0 flex items-center gap-1 px-3 py-1.5 border-b border-white/5 text-[15px]">
              <span className="text-[11px] text-white/40 mr-1">Score:</span>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setScore(open.leadId, open.score === n ? 0 : n)} title={`${n}/5`} className={`leading-none transition ${n <= open.score ? "" : "grayscale opacity-30"}`}>🚀</button>
              ))}
              {open.score > 0 && <span className="ml-1 text-[11px] text-white/40">{open.score}/5</span>}
              <div className="ml-auto relative">
                <button onClick={() => setEmojiOpen((v) => !v)} className="flex items-center gap-1 bg-[#1c1e22] border border-white/10 rounded-lg px-2 py-1 text-sm text-white">
                  {open.emoji ? <EmojiIcon v={open.emoji} /> : <span className="text-white/40">🏷️</span>} <span className="text-white/40 text-[10px]">▾</span>
                </button>
                {emojiOpen && (
                  <div className="absolute right-0 mt-1 z-30 grid grid-cols-6 gap-1 rounded-xl bg-[#1c1e22] border border-white/15 p-2 shadow-xl">
                    <button onClick={() => { setEmoji(open.leadId, ""); setEmojiOpen(false); }} className="h-8 w-8 grid place-items-center rounded hover:bg-white/10 text-white/40 text-xs">none</button>
                    {EMOJIS.map((e) => (
                      <button key={e} onClick={() => { setEmoji(open.leadId, e); setEmojiOpen(false); }} className={`h-8 w-8 grid place-items-center rounded hover:bg-white/10 ${open.emoji === e ? "bg-[var(--brand)]/30" : ""}`}><EmojiIcon v={e} /></button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* messages — newest at top, oldest at bottom */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 flex flex-col">
              {open.messages.map((m) => {
                const out = m.direction === "outbound";
                return (
                  <div key={m.id} className={`flex ${out ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[78%]">
                      {m.channel === "email" && m.subject && <div className="text-[10px] text-white/40 mb-0.5 px-1">✉️ {m.subject}</div>}
                      <div className={`rounded-2xl px-3.5 py-2 text-[15px] whitespace-pre-wrap break-words ${out ? "bg-[var(--brand)] text-white rounded-br-md" : "bg-[#26282d] text-white rounded-bl-md"}`}>
                        {m.body}
                      </div>
                      <div className={`text-[10px] text-white/35 mt-0.5 px-1 flex gap-1 ${out ? "justify-end" : ""}`}>
                        <span>{fmtWhen(m.at)}</span>
                        {out && m.emoji && <span title="who/where sent">{m.emoji}</span>}
                        <span>{m.channel === "email" ? "email" : "text"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* composer */}
            <div className="shrink-0 border-t border-white/10 p-2.5 bg-[#0b0b0c]">
              <div className="flex gap-2 mb-2">
                {open.phone && <button onClick={() => setChannel("sms")} className={`rounded-full px-3 py-1 text-xs ${channel === "sms" ? "bg-[var(--brand)] text-white" : "bg-white/10 text-white/60"}`}>💬 Text</button>}
                {open.email && <button onClick={() => setChannel("email")} className={`rounded-full px-3 py-1 text-xs ${channel === "email" ? "bg-[var(--brand)] text-white" : "bg-white/10 text-white/60"}`}>✉️ Email</button>}
              </div>
              {channel === "email" && <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="w-full mb-2 rounded-xl bg-[#1c1e22] border border-white/10 px-3 py-2 text-sm text-white" />}
              <div className="flex items-end gap-2">
                <textarea value={text} onChange={(e) => setText(e.target.value)} rows={1} placeholder={channel === "email" ? "Write an email…" : "Text message…"}
                  className="flex-1 resize-none rounded-2xl bg-[#1c1e22] border border-white/10 px-3.5 py-2 text-[15px] text-white max-h-32" />
                <button onClick={send} disabled={sending || !text.trim()} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--brand)] text-white text-lg disabled:opacity-40">{sending ? "…" : "↑"}</button>
              </div>
              <p className="text-[10px] text-white/30 mt-1 text-center">Sent from here is tagged 🚀</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
