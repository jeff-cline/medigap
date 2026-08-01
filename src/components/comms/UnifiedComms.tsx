"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Section } from "@/components/ui";
import { highlightKeywords } from "@/lib/highlight";
import type { Thread, CannedRow, OutboundRow } from "@/lib/inbox";
import type { Shortlink } from "@/lib/shorten";

type Props = { threads: Thread[]; numbers: string[]; canned: CannedRow[]; outbound: OutboundRow[]; shortlinks: Shortlink[] };
type View = "needs" | "responded" | "outbound";

function parseKeywords(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export default function UnifiedComms({ threads, numbers, canned, outbound, shortlinks }: Props) {
  const router = useRouter();
  const [view, setView] = useState<View>("needs");
  const [filterNumber, setFilterNumber] = useState("");
  const [selectedSender, setSelectedSender] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [shortenInput, setShortenInput] = useState("");
  const [cannedOpen, setCannedOpen] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState("");

  // All active canned keywords — used to render known keywords green in the messages.
  const activeKeywords = useMemo(
    () => [
      ...new Set(
        canned
          .filter((c) => c.active)
          .flatMap((c) => parseKeywords(c.keywords))
          .map((k) => k.trim().toLowerCase())
          .filter(Boolean),
      ),
    ],
    [canned]
  );

  // Render a message body with any known canned keyword highlighted green.
  const renderBody = (body: string) =>
    highlightKeywords(body, activeKeywords).map((seg, i) =>
      seg.hit ? (
        <mark key={i} className="rounded px-0.5 bg-[#12351f] text-[#3fb950]" title="known keyword — auto-answered">
          {seg.text}
        </mark>
      ) : (
        <span key={i}>{seg.text}</span>
      )
    );

  // Capture a text selection inside the messages pane → candidate canned keyword.
  // Collapse whitespace + cap length so a sloppy multi-line drag can't become a junk keyword
  // (mirrors the server's normalizeKeyword).
  const captureSelection = () => {
    const raw = typeof window !== "undefined" ? window.getSelection()?.toString() ?? "" : "";
    const kw = raw.replace(/\s+/g, " ").trim().slice(0, 60);
    if (kw) setSelectedKeyword(kw);
  };

  const filtered = useMemo(() => {
    let ts = filterNumber ? threads.filter((t) => t.ourNumber === filterNumber) : threads;
    if (view === "needs") ts = ts.filter((t) => t.needsHuman);
    else if (view === "responded") ts = ts.filter((t) => !t.needsHuman);
    return ts;
  }, [threads, filterNumber, view]);

  const filteredOutbound = useMemo(
    () => (filterNumber ? outbound.filter((o) => o.from === filterNumber) : outbound),
    [outbound, filterNumber]
  );

  const selected = useMemo(
    () => filtered.find((t) => t.sender === selectedSender) ?? filtered[0] ?? null,
    [filtered, selectedSender]
  );

  // Reset the composer whenever the selected thread changes (avoid leaking a draft between leads).
  useEffect(() => {
    setReplyBody("");
    setShortenInput("");
    setSelectedKeyword("");
  }, [selected?.sender]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const sendReply = () =>
    run(async () => {
      if (!selected || !replyBody.trim()) return;
      const res = await fetch("/api/inbox/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender: selected.sender, ourNumber: selected.ourNumber, body: replyBody.trim(), leadId: selected.leadId }),
      });
      if (!res.ok) throw new Error(`Send failed (${res.status})`);
      setReplyBody("");
      router.refresh();
    });

  // Save the highlighted text as a canned keyword AND send the reply now.
  const canAndSend = () =>
    run(async () => {
      if (!selected || !replyBody.trim() || !selectedKeyword.trim()) return;
      const res = await fetch("/api/inbox/can-and-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: selected.sender,
          ourNumber: selected.ourNumber,
          body: replyBody.trim(),
          leadId: selected.leadId,
          keyword: selectedKeyword.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Can & Send failed (${res.status})`);
      const kw = selectedKeyword.trim();
      if (!data.saved) {
        setErr(`The reply sent, but "${kw}" could not be saved as a canned answer — add it manually below.`);
      } else if (!data.sent) {
        setErr(`Saved "${kw}" as a canned answer, but the reply could not send from ${selected.ourNumber || "that number"}.`);
      } else {
        setReplyBody("");
      }
      setSelectedKeyword("");
      router.refresh();
    });

  const markHandled = () =>
    run(async () => {
      if (!selected) return;
      const res = await fetch("/api/inbox/handle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender: selected.sender }),
      });
      if (!res.ok) throw new Error(`Mark handled failed (${res.status})`);
      router.refresh();
    });

  const doShorten = () =>
    run(async () => {
      if (!shortenInput.trim()) return;
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: shortenInput.trim() }),
      });
      if (!res.ok) throw new Error(`Shorten failed (${res.status})`);
      const data = await res.json();
      if (data.short) {
        setReplyBody((prev) => (prev ? `${prev} ${data.short}` : data.short));
        setShortenInput("");
      }
    });

  const insertCanned = (id: string) => {
    const c = canned.find((c) => c.id === id);
    if (!c) return;
    setReplyBody((prev) => (prev ? `${prev} ${c.reply}` : c.reply));
  };

  const cannedAction = (body: unknown) =>
    run(async () => {
      const res = await fetch("/api/inbox/canned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      router.refresh();
    });

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Unified — Consumer Texts</h1>
          <p className="text-sm text-[var(--muted)]">One inbox across every number — reply, mark handled, and manage canned answers.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs uppercase text-[var(--muted)]">Number</label>
          <select
            className="rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-sm"
            value={filterNumber}
            onChange={(e) => setFilterNumber(e.target.value)}
          >
            <option value="">All</option>
            {numbers.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-1 mb-4 border-b border-[var(--border)]">
        {([
          ["needs", `Needs response (${threads.filter((t) => t.needsHuman).length})`],
          ["responded", "Responded"],
          ["outbound", `Outbound log (${outbound.length})`],
        ] as [View, string][]).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-2 text-sm font-medium -mb-px border-b-2 ${view === v ? "border-[var(--brand)] text-[var(--text)]" : "border-transparent text-[var(--muted)] hover:text-[var(--text)]"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {err && <div className="rounded border border-[var(--danger)] text-[var(--danger)] text-sm px-3 py-2 mb-4">{err}</div>}

      {view === "outbound" ? (
        <div className="card !p-0 overflow-hidden">
          <div className="max-h-[70vh] overflow-y-auto divide-y divide-[var(--border)]">
            {filteredOutbound.length === 0 && <div className="p-4 text-sm text-[var(--muted)]">No outbound messages yet.</div>}
            {filteredOutbound.map((o) => (
              <div key={o.id} className="px-4 py-2.5">
                <div className="flex items-center justify-between gap-2 text-xs text-[var(--muted)]">
                  <span>to {o.to} · from {o.from || "—"}</span>
                  <span className="flex items-center gap-2">
                    <span className={o.status === "failed" || o.status === "skipped" ? "text-[var(--danger)]" : "text-[color:#3fb950]"}>{o.status}</span>
                    {new Date(o.at).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm mt-0.5 whitespace-pre-wrap">{o.body}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="card !p-0 overflow-hidden">
          <div className="max-h-[70vh] overflow-y-auto divide-y divide-[var(--border)]">
            {filtered.length === 0 && <div className="p-4 text-sm text-[var(--muted)]">{view === "needs" ? "Nothing needs a response right now. 🎉" : "No responded threads yet."}</div>}
            {filtered.map((t) => {
              const active = selected?.sender === t.sender;
              const snippet = t.messages[0]?.body ?? "";
              return (
                <button
                  key={t.sender}
                  onClick={() => setSelectedSender(t.sender)}
                  className={`w-full text-left px-3 py-2.5 hover:bg-[var(--panel2)] ${active ? "bg-[var(--panel2)]" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    {t.needsHuman && <span className="w-2 h-2 rounded-full bg-[var(--danger)] shrink-0" title="needs response" />}
                    <span className="font-medium text-sm truncate">{t.name}</span>
                    {t.tvBadge && <span className="shrink-0 rounded bg-[color:#7c3aed] text-white text-[10px] px-1.5 py-0.5" title="TV campaign caller">📺 {t.tvBadge}</span>}
                    {t.needsHuman && <span className="text-[10px] uppercase text-[var(--danger)] ml-auto shrink-0">needs response</span>}
                  </div>
                  <div className="text-xs text-[var(--muted)] truncate">{t.sender}</div>
                  <div className="text-xs text-[var(--muted)] truncate mt-0.5">{snippet}</div>
                  <div className="text-[10px] text-[var(--muted)] mt-0.5">via {t.ourNumber || "—"}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card flex flex-col">
          {!selected ? (
            <div className="text-sm text-[var(--muted)]">Select a thread.</div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-[var(--border)]">
                <div>
                  <div className="font-semibold">{selected.name}</div>
                  <div className="text-xs text-[var(--muted)]">{selected.sender} · via {selected.ourNumber || "—"}</div>
                </div>
                <button className="btn btn-ghost text-xs" disabled={busy || !selected.needsHuman} onClick={markHandled}>
                  Mark handled
                </button>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[45vh] space-y-2 mb-3" onMouseUp={captureSelection}>
                {[...selected.messages].reverse().map((m) => (
                  <div key={m.id} className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                        m.direction === "outbound" ? "bg-[var(--brand)]/10 text-[var(--text)]" : "bg-[var(--panel2)]"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{renderBody(m.body)}</div>
                      <div className="text-[10px] text-[var(--muted)] mt-1">{new Date(m.at).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-[var(--border)] pt-3 space-y-2">
                <select
                  className="w-full rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-sm"
                  value=""
                  onChange={(e) => e.target.value && insertCanned(e.target.value)}
                >
                  <option value="">— insert canned answer —</option>
                  {canned.filter((c) => c.active).map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>

                <textarea
                  className="w-full rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-2 text-sm min-h-[90px]"
                  placeholder="Type a reply…"
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                />

                <div className="flex gap-2 items-center">
                  <input
                    className="flex-1 rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-sm"
                    placeholder="Paste a URL to shorten…"
                    value={shortenInput}
                    onChange={(e) => setShortenInput(e.target.value)}
                  />
                  <button className="btn btn-ghost text-xs" disabled={busy || !shortenInput.trim()} onClick={doShorten}>
                    Shorten
                  </button>
                </div>

                {selectedKeyword ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[var(--muted)]">Keyword to save:</span>
                    <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-[#12351f] text-[#3fb950]">
                      “{selectedKeyword}”
                      <button className="hover:text-white" title="clear" onClick={() => setSelectedKeyword("")}>✕</button>
                    </span>
                  </div>
                ) : (
                  <div className="text-[11px] text-[var(--muted)]">Tip: highlight a word in a text above, then “Can &amp; Send” to save it as a keyword.</div>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    className="btn btn-ghost"
                    title="Send this reply and save the highlighted keyword as a canned answer"
                    disabled={busy || !replyBody.trim() || !selectedKeyword.trim()}
                    onClick={canAndSend}
                  >
                    Can &amp; Send
                  </button>
                  <button className="btn" disabled={busy || !replyBody.trim()} onClick={sendReply}>
                    Send
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      )}

      <div className="mt-6">
        <button className="text-sm font-semibold text-[var(--muted)] hover:text-[var(--text)]" onClick={() => setCannedOpen((v) => !v)}>
          {cannedOpen ? "▾" : "▸"} Canned answers
        </button>
        {cannedOpen && (
          <div className="mt-3">
            <CannedManager canned={canned} busy={busy} onAction={cannedAction} />
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-[var(--border)]">
        <ShortenerManager shortlinks={shortlinks} />
      </div>
    </>
  );
}

function ShortenerManager({ shortlinks }: { shortlinks: Shortlink[] }) {
  const router = useRouter();
  const [word, setWord] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState("");

  const create = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/shorten/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: word.trim(), url: url.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Failed (${res.status})`);
      setWord("");
      setUrl("");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const copy = (s: string) => {
    navigator.clipboard?.writeText(s).then(() => {
      setCopied(s);
      setTimeout(() => setCopied(""), 1500);
    }).catch(() => {});
  };

  return (
    <Section title="Link shortener" desc="Create a short el.ag link from a word + URL, then reuse it in canned answers.">
      {err && <div className="rounded border border-[var(--danger)] text-[var(--danger)] text-sm px-3 py-2 mb-3">{err}</div>}
      <div className="card mb-3">
        <div className="grid gap-2 md:grid-cols-[180px_1fr_auto] items-center">
          <input className="rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-sm" placeholder="word (e.g. medicare-plans)" value={word} onChange={(e) => setWord(e.target.value)} />
          <input className="rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-sm" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
          <button className="btn" disabled={busy || !word.trim() || !url.trim()} onClick={create}>Create link</button>
        </div>
      </div>
      <div className="space-y-1">
        {shortlinks.length === 0 && <div className="text-sm text-[var(--muted)]">No short links yet.</div>}
        {shortlinks.map((l) => (
          <div key={l.id} className="flex items-center gap-3 rounded border border-[var(--border)] px-3 py-2 text-sm">
            <span className="font-medium w-40 truncate" title={l.word}>{l.word}</span>
            <a href={l.short} target="_blank" rel="noreferrer" className="text-[var(--brand)] truncate flex-1" title={l.url}>{l.short}</a>
            <button className="btn btn-ghost text-xs shrink-0" onClick={() => copy(l.short)}>{copied === l.short ? "Copied!" : "Copy"}</button>
          </div>
        ))}
      </div>
    </Section>
  );
}

function CannedManager({
  canned,
  busy,
  onAction,
}: {
  canned: CannedRow[];
  busy: boolean;
  onAction: (body: unknown) => void;
}) {
  const [label, setLabel] = useState("");
  const [keywordsCsv, setKeywordsCsv] = useState("");
  const [reply, setReply] = useState("");

  const create = () => {
    if (!label.trim() || !reply.trim()) return;
    onAction({
      action: "create",
      label: label.trim(),
      keywords: keywordsCsv.split(",").map((k) => k.trim()).filter(Boolean),
      reply: reply.trim(),
    });
    setLabel("");
    setKeywordsCsv("");
    setReply("");
  };

  return (
    <Section title="Manage canned answers" desc="Quick replies you can insert into the composer, or auto-match on keywords.">
      <div className="card mb-3">
        <div className="grid gap-2 md:grid-cols-3 mb-2">
          <input className="rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-sm" placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
          <input className="rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-sm" placeholder="Keywords (CSV)" value={keywordsCsv} onChange={(e) => setKeywordsCsv(e.target.value)} />
          <input className="rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-sm" placeholder="Reply text" value={reply} onChange={(e) => setReply(e.target.value)} />
        </div>
        <button className="btn" disabled={busy || !label.trim() || !reply.trim()} onClick={create}>+ Add canned answer</button>
      </div>

      <div className="space-y-2">
        {canned.length === 0 && <div className="text-sm text-[var(--muted)]">No canned answers yet.</div>}
        {canned.map((c) => (
          <CannedRowEditor key={c.id} row={c} busy={busy} onAction={onAction} />
        ))}
      </div>
    </Section>
  );
}

function CannedRowEditor({ row, busy, onAction }: { row: CannedRow; busy: boolean; onAction: (body: unknown) => void }) {
  const [reply, setReply] = useState(row.reply);
  const [keywordsCsv, setKeywordsCsv] = useState(parseKeywords(row.keywords).join(", "));

  const save = () =>
    onAction({
      action: "update",
      id: row.id,
      patch: { reply: reply.trim(), keywords: keywordsCsv.split(",").map((k) => k.trim()).filter(Boolean) },
    });

  return (
    <div className={`rounded border border-[var(--border)] p-3 ${row.active ? "" : "opacity-60"}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="font-medium text-sm">{row.label}</div>
        <div className="flex gap-2">
          <button className="btn btn-ghost text-xs" disabled={busy} onClick={() => onAction({ action: "update", id: row.id, patch: { active: !row.active } })}>
            {row.active ? "🟢 On" : "⚪ Off"}
          </button>
          <button className="text-xs text-[var(--danger)]" disabled={busy} onClick={() => { if (confirm(`Delete "${row.label}"?`)) onAction({ action: "delete", id: row.id }); }}>
            Delete
          </button>
        </div>
      </div>
      <input className="w-full rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-sm mb-1" placeholder="Keywords (CSV)" value={keywordsCsv} onChange={(e) => setKeywordsCsv(e.target.value)} />
      <textarea className="w-full rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-sm min-h-[60px] mb-1" value={reply} onChange={(e) => setReply(e.target.value)} />
      <button className="btn btn-ghost text-xs" disabled={busy} onClick={save}>Save</button>
    </div>
  );
}
