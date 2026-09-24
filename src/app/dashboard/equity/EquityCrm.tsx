"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";

type Note = { id: string; kind: string; body: string; author: string; createdAt: string };
type Lead = {
  id: string; ref: string; name: string; email: string; phone: string; zip: string;
  slug: string; reason: string; category: string;
  estValue: number; mortgageBal: number; estEquity: number;
  amountWanted: number; timeline: string; reasonNote: string;
  stage: string; partner: string;
  consented: boolean; consentAt: string | null;
  nextFollowUp: string | null; lastContact: string | null; createdAt: string;
  notes: Note[];
};
type Partner = {
  id: string; email: string; name: string; company: string; code: string;
  vertical: string; active: boolean; hasPassword: boolean;
  referrals: number; createdAt: string;
};
type Invite = { id: string; email: string; expiresAt: string; url: string };

const STAGES = ["lead", "contacted", "qualified", "submitted", "funded", "declined", "lost"] as const;
const money = (c: number) =>
  c > 0 ? `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—";
const DAY = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const day = (s: string | null) => (s ? DAY.format(new Date(s)) : "—");

export default function EquityCrm({
  leads, partners, pendingInvites, topPages, byCategory,
}: {
  leads: Lead[]; partners: Partner[]; pendingInvites: Invite[];
  topPages: { slug: string; n: number; reason: string }[];
  byCategory: { key: string; label: string; n: number }[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"leads" | "partners" | "pages">("leads");
  const [open, setOpen] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function post(body: Record<string, unknown>, key: string, ok?: string) {
    setBusy(key); setMsg(null);
    try {
      const r = await fetch("/api/equity/crm", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => ({}));
      if (!j.ok) { setMsg(j.error || "That did not work."); return null; }
      if (ok) setMsg(ok);
      router.refresh();
      return j;
    } catch { setMsg("That did not work."); return null; } finally { setBusy(null); }
  }

  const filtered = leads.filter((l) => {
    if (stageFilter && l.stage !== stageFilter) return false;
    if (!q) return true;
    const hay = `${l.ref} ${l.name} ${l.email} ${l.phone} ${l.zip} ${l.reason}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  const count = (s: string) => leads.filter((l) => l.stage === s).length;

  return (
    <div>
      {/* counts */}
      <div className="grid gap-3 sm:grid-cols-4 mb-6">
        {[
          ["Total leads", leads.length],
          ["New", count("lead")],
          ["Qualified", count("qualified")],
          ["Funded", count("funded")],
        ].map(([label, n]) => (
          <div key={String(label)} className="rounded-xl border border-border bg-panel p-4">
            <p className="text-[11px] uppercase tracking-widest text-muted font-bold">{label as string}</p>
            <p className="mt-1 text-2xl font-black text-text tabular-nums">{n as number}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-5">
        {(["leads", "partners", "pages"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
                  className={`rounded-lg px-4 py-2 text-sm font-bold ${
                    tab === t ? "bg-brand text-bg" : "bg-panel text-muted border border-border"}`}>
            {t === "leads" ? "Leads" : t === "partners" ? "Partners" : "Page performance"}
          </button>
        ))}
      </div>

      {msg && <p className="mb-4 rounded-lg bg-panel2 border border-border px-4 py-2 text-sm text-text">{msg}</p>}

      {/* ── leads ─────────────────────────────────────────────────── */}
      {tab === "leads" && (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            <input value={q} onChange={(e) => setQ(e.target.value)}
                   placeholder="Search name, email, phone, reference…"
                   className="flex-1 min-w-[220px] rounded-lg border border-border bg-panel px-3 py-2 text-sm text-text" />
            <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}
                    className="rounded-lg border border-border bg-panel px-3 py-2 text-sm text-text">
              <option value="">All stages</option>
              {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-panel2 text-left">
                <tr>
                  {["Ref", "Name", "Contact", "Reason", "Equity", "Stage", "Consent", "Added", ""].map((h) => (
                    <th key={h} className="px-4 py-2 text-[11px] uppercase tracking-wide text-muted font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-muted">No leads match.</td></tr>
                )}
                {filtered.map((l) => (
                  // Fragment carries the key — a row plus its expanded detail
                  // row are one logical item.
                  <Fragment key={l.id}>
                    <tr className="border-t border-border">
                      <td className="px-4 py-3 font-mono text-xs text-brand">{l.ref}</td>
                      <td className="px-4 py-3 font-semibold text-text">{l.name}</td>
                      <td className="px-4 py-3 text-muted text-xs">
                        {l.email && <div>{l.email}</div>}
                        {l.phone && <div>{l.phone}</div>}
                        {l.zip && <div className="opacity-60">ZIP {l.zip}</div>}
                      </td>
                      <td className="px-4 py-3 text-muted text-xs">
                        {l.reason || "—"}
                        {l.partner && <div className="opacity-70">via {l.partner}</div>}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-text text-xs">
                        {money(l.estEquity)}
                        {l.amountWanted > 0 && (
                          <div className="text-muted">wants {money(l.amountWanted)}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <select value={l.stage} disabled={busy !== null}
                                onChange={(e) => post(
                                  { action: "stage", id: l.id, stage: e.target.value },
                                  `s-${l.id}`, `${l.ref} → ${e.target.value}`)}
                                className="rounded border border-border bg-panel px-2 py-1 text-xs text-text">
                          {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          l.consented ? "bg-brand/15 text-brand" : "bg-danger/15 text-danger"}`}
                              title={l.consented
                                ? `Agreed ${day(l.consentAt)} — calls and texts permitted`
                                : "No consent on file — email only, do not call or text"}>
                          {l.consented ? "call ok" : "email only"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted text-xs">{day(l.createdAt)}</td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => setOpen(open === l.id ? null : l.id)}
                                className="text-xs font-bold text-brand hover:underline">
                          {open === l.id ? "close" : "open"}
                        </button>
                      </td>
                    </tr>
                    {open === l.id && (
                      <tr className="border-t border-border bg-panel">
                        <td colSpan={9} className="px-4 py-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <p className="text-[11px] uppercase tracking-wide text-muted font-bold mb-2">Details</p>
                              <dl className="text-xs text-muted grid grid-cols-2 gap-y-1">
                                <dt>Property value</dt><dd className="text-text">{money(l.estValue)}</dd>
                                <dt>Mortgage balance</dt><dd className="text-text">{money(l.mortgageBal)}</dd>
                                <dt>Estimated equity</dt><dd className="text-text">{money(l.estEquity)}</dd>
                                <dt>Timeline</dt><dd className="text-text">{l.timeline || "—"}</dd>
                                <dt>Last contact</dt><dd className="text-text">{day(l.lastContact)}</dd>
                              </dl>
                              {l.reasonNote && (
                                <p className="mt-3 rounded-lg bg-panel2 p-3 text-xs text-text whitespace-pre-wrap">
                                  {l.reasonNote}
                                </p>
                              )}
                              <form className="mt-3 flex gap-2"
                                    onSubmit={async (e) => {
                                      e.preventDefault();
                                      const f = new FormData(e.currentTarget);
                                      const body = String(f.get("body") ?? "").trim();
                                      if (!body) return;
                                      const r = await post(
                                        { action: "note", id: l.id, kind: f.get("kind"), body },
                                        `n-${l.id}`, "Note added.");
                                      if (r) (e.target as HTMLFormElement).reset();
                                    }}>
                                <select name="kind" defaultValue="note"
                                        className="rounded border border-border bg-panel px-2 py-1 text-xs text-text">
                                  <option value="note">Note</option>
                                  <option value="call">Call</option>
                                  <option value="email">Email</option>
                                  <option value="sms">Text</option>
                                </select>
                                <input name="body" placeholder="What happened…"
                                       className="flex-1 rounded border border-border bg-panel px-2 py-1 text-xs text-text" />
                                <button className="rounded bg-brand px-3 py-1 text-xs font-bold text-bg">Add</button>
                              </form>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-wide text-muted font-bold mb-2">
                                History ({l.notes.length})
                              </p>
                              <ul className="space-y-2 max-h-64 overflow-y-auto">
                                {l.notes.length === 0 && <li className="text-xs text-muted">Nothing yet.</li>}
                                {l.notes.map((n) => (
                                  <li key={n.id} className="rounded-lg bg-panel2 p-2.5">
                                    <div className="flex justify-between gap-2 text-[10px] text-muted">
                                      <span className="uppercase font-bold">{n.kind}</span>
                                      <span>{day(n.createdAt)}{n.author ? ` · ${n.author}` : ""}</span>
                                    </div>
                                    <p className="mt-1 text-xs text-text whitespace-pre-wrap">{n.body}</p>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── partners ──────────────────────────────────────────────── */}
      {tab === "partners" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="bg-panel2 text-left">
                <tr>
                  {["Partner", "Code", "Vertical", "Referrals", "Status", ""].map((h) => (
                    <th key={h} className="px-4 py-2 text-[11px] uppercase tracking-wide text-muted font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {partners.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">No partners yet.</td></tr>
                )}
                {partners.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-text">{p.name || "—"}</div>
                      <div className="text-xs text-muted">{p.email}</div>
                      {p.company && <div className="text-xs text-muted opacity-70">{p.company}</div>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-brand">{p.code}</td>
                    <td className="px-4 py-3 text-xs text-muted">{p.vertical || "—"}</td>
                    <td className="px-4 py-3 tabular-nums text-text">{p.referrals}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        !p.active ? "bg-danger/15 text-danger"
                          : p.hasPassword ? "bg-brand/15 text-brand" : "bg-gold/15 text-gold"}`}>
                        {!p.active ? "disabled" : p.hasPassword ? "active" : "invited"}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <button type="button" disabled={busy !== null}
                              onClick={() => post({ action: "reinvite", id: p.id }, `r-${p.id}`,
                                                  "Invitation sent.")}
                              className="text-xs font-bold text-brand hover:underline">
                        re-invite
                      </button>
                      <button type="button" disabled={busy !== null}
                              onClick={() => post({ action: "toggle-partner", id: p.id, active: !p.active },
                                                  `t-${p.id}`)}
                              className="text-xs font-bold text-muted hover:underline">
                        {p.active ? "disable" : "enable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <form className="rounded-xl border border-border bg-panel p-5"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    const r = await post({
                      action: "invite",
                      email: f.get("email"), name: f.get("name"),
                      company: f.get("company"), vertical: f.get("vertical"),
                    }, "invite", "Partner added and invitation sent.");
                    if (r) (e.target as HTMLFormElement).reset();
                  }}>
              <h2 className="font-black text-text">Add a partner</h2>
              <p className="mt-1 text-xs text-muted">
                They get an emailed invitation and choose their own password. We never
                send a password in clear text.
              </p>
              <div className="mt-4 grid gap-3">
                <input name="email" type="email" required placeholder="Email"
                       className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text" />
                <input name="name" placeholder="Name"
                       className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text" />
                <input name="company" placeholder="Company"
                       className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text" />
                <input name="vertical" placeholder="Vertical (e.g. contractor, realtor)"
                       className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text" />
                <button disabled={busy === "invite"}
                        className="rounded-lg bg-brand px-4 py-2 font-bold text-bg disabled:opacity-50">
                  {busy === "invite" ? "Sending…" : "Add and send invitation"}
                </button>
              </div>
            </form>

            {pendingInvites.length > 0 && (
              <div className="mt-4 rounded-xl border border-border bg-panel p-5">
                <h3 className="font-bold text-text text-sm">Pending invitations</h3>
                <ul className="mt-3 space-y-3">
                  {pendingInvites.map((i) => (
                    <li key={i.id} className="text-xs">
                      <div className="text-text font-semibold">{i.email}</div>
                      <div className="text-muted">expires {day(i.expiresAt)}</div>
                      <code className="mt-1 block break-all text-[10px] text-muted opacity-70">{i.url}</code>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[11px] text-muted">
                  Links shown so you can resend one by hand if an email does not arrive.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── page performance ──────────────────────────────────────── */}
      {tab === "pages" && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-panel p-5">
            <h2 className="font-black text-text">Pages producing leads</h2>
            <p className="mt-1 text-xs text-muted">
              Which of the hundred keywords actually convert. This is where content
              effort should go next.
            </p>
            <ul className="mt-4 space-y-2">
              {topPages.length === 0 && <li className="text-sm text-muted">No leads yet.</li>}
              {topPages.map((p) => (
                <li key={p.slug} className="flex justify-between gap-3 text-sm">
                  <span className="text-text">{p.reason}</span>
                  <span className="tabular-nums text-brand font-bold">{p.n}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-panel p-5">
            <h2 className="font-black text-text">By category</h2>
            <ul className="mt-4 space-y-2">
              {byCategory.map((c) => (
                <li key={c.key} className="flex justify-between gap-3 text-sm">
                  <span className="text-text">{c.label}</span>
                  <span className="tabular-nums text-muted">{c.n}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
