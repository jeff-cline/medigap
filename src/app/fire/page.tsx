import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, Stat, Section, Badge } from "@/components/ui";
import { usd2, num } from "@/lib/format";
import { DEFAULT_TEMPLATE } from "@/lib/fire";
import ListUploader from "@/components/fire/ListUploader";
import CampaignBuilder from "@/components/fire/CampaignBuilder";
import CampaignControls from "@/components/fire/CampaignControls";
import VoiceDripCard from "@/components/voicedrip/VoiceDripCard";
import { tvReport, tvAgeReport } from "@/lib/tv";

export const dynamic = "force-dynamic";

const REVENUE_PER_CALL = 7500; // $75.00
const COST_PER_EMAIL = 5;      // $0.05

export default async function FirePage({ searchParams }: { searchParams: Promise<{ tab?: string; ok?: string; date?: string; time?: string; win?: string; anchor?: string; preset?: string; cogs?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const sp = await searchParams;
  const tab = sp.tab === "calls" ? "calls" : sp.tab === "tv" ? "tv" : sp.tab === "tvage" ? "tvage" : "emails";
  const isTvTab = tab === "tv" || tab === "tvage";

  const [lists, campaigns, contactTotal, sentTotal, openedTotal, conversions, dropsSent, dropSpend] = await Promise.all([
    db.emailList.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    db.emailCampaign.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    db.emailContact.count(),
    db.emailMessage.count({ where: { batch: { not: "" }, status: "sent" } }),
    db.emailMessage.count({ where: { batch: { not: "" }, openedAt: { not: null } } }),
    db.campaignRecipient.count({ where: { calledBackAt: { not: null } } }),
    db.voiceDrop.count({ where: { direction: "outbound" } }),
    db.voiceDrop.aggregate({ _sum: { priceCents: true } }),
  ]);

  const revenueCents = conversions * REVENUE_PER_CALL;
  const dropCostCents = dropSpend._sum.priceCents || 0; // real Twilio VoiceDrip cost (COGS)
  const costCents = sentTotal * COST_PER_EMAIL + dropCostCents;
  const roas = costCents > 0 ? revenueCents / costCents : 0;
  const convRate = sentTotal > 0 ? (conversions / sentTotal) * 100 : 0;

  // Tab data
  const convertedRecips = await db.campaignRecipient.findMany({ where: { calledBackAt: { not: null } }, select: { email: true } });
  const convertedSet = new Set(convertedRecips.map((r) => r.email.toLowerCase()));
  const emails = tab === "emails" ? await db.emailMessage.findMany({ where: { batch: { not: "" } }, orderBy: { createdAt: "desc" }, take: 150 }) : [];
  const calls = tab === "calls" ? await db.campaignRecipient.findMany({ where: { calledBackAt: { not: null } }, orderBy: { calledBackAt: "desc" }, take: 150 }) : [];
  // TV report time window (spot attribution) + period KPIs. Times are entered/displayed in CST (UTC−6).
  const CST = 6 * 3600_000;
  const nowMs = Date.now();
  const todayCst = new Date(nowMs - CST).toISOString().slice(0, 10);
  const tvDate = sp.date || "";
  const tvTime = sp.time || "";
  const tvWin = Math.max(0, parseInt(sp.win || "", 10) || 0); // minutes
  const tvAnchor = sp.anchor === "center" ? "center" : "from";
  const preset = sp.preset === "today" || sp.preset === "yesterday" || sp.preset === "wtd" ? sp.preset : "";
  const cogsDollars = sp.cogs || "";
  const cogsCents = Math.max(0, Math.round((parseFloat(cogsDollars) || 0) * 100));
  const hm = (ms: number) => new Date(ms - CST).toISOString().slice(11, 16);
  const md = (ms: number) => new Date(ms - CST).toISOString().slice(0, 10);
  const cstMidnight = (dayOffset: number) => { const c = new Date(nowMs - CST); return Date.UTC(c.getUTCFullYear(), c.getUTCMonth(), c.getUTCDate() + dayOffset, 0, 0, 0) + CST; };
  let tvRange: { start: Date; end: Date } | undefined;
  let windowLabel = "";
  if (isTvTab && preset) {
    let startMs: number, endMs: number;
    if (preset === "today") { startMs = cstMidnight(0); endMs = nowMs; windowLabel = `Today · ${md(startMs)} 00:00 CST → now`; }
    else if (preset === "yesterday") { startMs = cstMidnight(-1); endMs = cstMidnight(0); windowLabel = `Yesterday · ${md(startMs)} CST (full day)`; }
    else { const c = new Date(nowMs - CST); startMs = cstMidnight(-c.getUTCDay()); endMs = nowMs; windowLabel = `Week to date · ${md(startMs)} → now CST`; }
    tvRange = { start: new Date(startMs), end: new Date(endMs) };
  } else if (isTvTab && tvDate && tvTime && tvWin > 0) {
    const baseUtc = Date.parse(`${tvDate}T${tvTime}:00Z`); // wall-clock as if UTC…
    if (!Number.isNaN(baseUtc)) {
      const anchorUtc = baseUtc + CST; // …then shift so it means CST
      const startMs = tvAnchor === "center" ? anchorUtc - (tvWin * 60_000) / 2 : anchorUtc;
      const endMs = tvAnchor === "center" ? anchorUtc + (tvWin * 60_000) / 2 : anchorUtc + tvWin * 60_000;
      tvRange = { start: new Date(startMs), end: new Date(endMs) };
      windowLabel = `${tvDate} · ${hm(startMs)}–${hm(endMs)} CST (${tvWin} min ${tvAnchor === "center" ? "centered" : "window"})`;
    }
  }
  const tv = tab === "tv" ? await tvReport(tvRange) : null;
  const tvAge = tab === "tvage" ? await tvAgeReport(tvRange) : null;
  // Most efficient campaign (highest calls per 1k impressions) — for highlighting.
  const bestTvKey = tv ? tv.stats.filter((s) => s.callsPer1k !== null).sort((a, b) => (b.callsPer1k || 0) - (a.callsPer1k || 0))[0]?.key : undefined;
  const dur = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  // Revenue only counts calls actually delivered to the current U65 "set number" buyer (dynamic).
  const tvRevenueCents = tv ? tv.totals.totalRevCents : 0;
  const tvBillable = Math.round(tvRevenueCents / REVENUE_PER_CALL); // billable calls delivered to the set buyer
  const tvRoas = cogsCents > 0 ? tvRevenueCents / cogsCents : 0;

  const campStats = await Promise.all(campaigns.map(async (camp) => {
    const [sent, left] = await Promise.all([
      db.emailMessage.count({ where: { batch: camp.id, status: "sent" } }),
      db.campaignRecipient.count({ where: { campaignId: camp.id, status: { in: ["pending", "in_progress"] } } }),
    ]);
    return { camp, sent, left };
  }));
  const listOpts = lists.map((l) => ({ id: l.id, name: l.name, total: l.total, sendable: l.sendable }));
  const fmt = (d: Date) => new Date(d.getTime() - 6 * 3600_000).toISOString().slice(5, 16).replace("T", " ");

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">🔥 Fire — Outbound → Inbound Conversion</h1>
            <p className="text-sm text-[var(--muted)] max-w-2xl">Emails go out through warm Zapmail mailboxes. When someone we emailed <b>calls back</b>, we match their number and turn them <span className="text-[#22c55e] font-semibold">green</span> — click in to watch the voice‑AI call. $75/call revenue, $0.05/email cost, ROAS below.</p>
          </div>
          <Link href="/dashboard/u65" className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--text)]">← U65</Link>
        </div>

        {/* Conversion / ROAS KPIs */}
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-6">
          <Stat label="Emails sent" value={num(sentTotal)} sub={`${num(contactTotal)} contacts`} tone="default" />
          <Stat label="Calls back" value={num(conversions)} sub="matched → green" tone="up" />
          <Stat label="Conversion" value={`${convRate.toFixed(1)}%`} sub="calls ÷ emails" tone="gold" />
          <Stat label="Revenue" value={usd2(revenueCents)} sub={`${num(conversions)} × $75`} tone="up" />
          <Stat label="Cost (COGS)" value={usd2(costCents)} sub={`${num(sentTotal)} emails + ${num(dropsSent)} drops`} tone="down" />
          <div className="rounded-2xl border border-[#22c55e]/40 bg-[#22c55e]/5 p-4">
            <div className="text-xs uppercase text-[var(--muted)]">ROAS</div>
            <div className="mt-1 text-3xl font-bold text-[#22c55e]">{roas.toFixed(1)}×</div>
            <div className="text-xs text-[var(--muted)]">revenue ÷ cost</div>
          </div>
        </div>

        {/* Tabs: Outbound emails | Inbound calls */}
        <Section title="Conversion tracker" desc="Every outbound email, and the ones who called back (green). Click a call to watch the voice‑AI conversation.">
          <div className="mb-3 flex gap-2">
            <Link href="/fire?tab=emails" className={`rounded-lg px-3 py-1.5 text-sm border ${tab === "emails" ? "bg-[var(--brand)]/10 text-[var(--brand)] border-[var(--brand)]/40" : "text-[var(--muted)] border-[var(--border)]"}`}>Outbound emails ({num(sentTotal)})</Link>
            <Link href="/fire?tab=calls" className={`rounded-lg px-3 py-1.5 text-sm border ${tab === "calls" ? "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/40" : "text-[var(--muted)] border-[var(--border)]"}`}>Inbound calls — converted ({num(conversions)})</Link>
            <Link href="/fire?tab=tv" className={`rounded-lg px-3 py-1.5 text-sm border ${tab === "tv" ? "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/40" : "text-[var(--muted)] border-[var(--border)]"}`}>📺 TV report</Link>
            <Link href="/fire?tab=tvage" className={`rounded-lg px-3 py-1.5 text-sm border ${tab === "tvage" ? "bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/40" : "text-[var(--muted)] border-[var(--border)]"}`}>📺 Over/Under 65 — combined</Link>
          </div>
          <Card className="!p-0 overflow-hidden">
            {tab === "emails" ? (
              <table className="w-full text-sm">
                <thead><tr className="text-[10px] uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]"><th className="text-left p-3">When</th><th className="text-left p-3">To</th><th className="text-left p-3">Campaign</th><th className="text-left p-3">Opened</th><th className="text-left p-3">Status</th></tr></thead>
                <tbody>
                  {emails.map((m) => {
                    const converted = convertedSet.has((m.to || "").toLowerCase());
                    return (
                      <tr key={m.id} className={`border-b border-[var(--border)] last:border-0 ${converted ? "bg-[#22c55e]/10" : ""}`}>
                        <td className="p-3 text-xs text-[var(--muted)] whitespace-nowrap">{fmt(m.createdAt)}</td>
                        <td className={`p-3 ${converted ? "text-[#22c55e] font-semibold" : ""}`}>{m.to}{converted && " ● called"}</td>
                        <td className="p-3 text-xs text-[var(--muted)]">{m.templateName || "—"}</td>
                        <td className="p-3 text-xs">{m.openedAt ? "✓" : "—"}</td>
                        <td className="p-3 text-xs">{m.status === "sent" ? <span className="text-[var(--brand)]">sent</span> : <span className="text-red-400">{m.status}</span>}</td>
                      </tr>
                    );
                  })}
                  {emails.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-[var(--muted)]">No emails sent yet — launch a campaign below.</td></tr>}
                </tbody>
              </table>
            ) : tab === "calls" ? (
              <table className="w-full text-sm">
                <thead><tr className="text-[10px] uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]"><th className="text-left p-3">Called back</th><th className="text-left p-3">Who (we emailed)</th><th className="text-left p-3">Value</th><th className="text-left p-3">Watch the call</th></tr></thead>
                <tbody>
                  {calls.map((r) => (
                    <tr key={r.id} className="border-b border-[var(--border)] last:border-0 bg-[#22c55e]/10">
                      <td className="p-3 text-xs text-[var(--muted)] whitespace-nowrap">{r.calledBackAt ? fmt(r.calledBackAt) : "—"}</td>
                      <td className="p-3 text-[#22c55e] font-semibold">{r.firstName || r.email}<div className="text-[11px] text-[var(--muted)] font-normal">{r.email}</div></td>
                      <td className="p-3"><Badge tone="brand">$75</Badge></td>
                      <td className="p-3">{r.callId ? <Link href={`/dashboard/calls/${r.callId}`} className="text-[var(--brand)] hover:underline">▶ Watch voice‑AI call</Link> : <span className="text-[var(--muted)] text-xs">—</span>}</td>
                    </tr>
                  ))}
                  {calls.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-[var(--muted)]">No call‑backs yet. When someone we emailed calls in, they turn green here.</td></tr>}
                </tbody>
              </table>
            ) : tab === "tv" ? (
              <div className="p-4">
                <div className="mb-3 text-xs text-[var(--muted)]">Inbound calls by the number that was dialed. <b className="text-[#f59e0b]">Calls / 1k impressions</b> ranks which TV creative is most efficient. Enter Vibe.co impressions per test below to compute it. <span className="text-[var(--muted)]">(Point each Twilio number&rsquo;s Voice webhook at <span className="font-mono">/api/calls/inbound</span> so calls attribute here.)</span></div>

                {/* Period picker: quick presets, or a spot-airing date + CST time + window, plus COGS for the period */}
                <form method="get" action="/fire" className="mb-3 rounded-xl border border-[var(--border)] p-3">
                  <input type="hidden" name="tab" value="tv" />
                  <div className="mb-2 flex flex-wrap gap-2">
                    <button type="submit" name="preset" value="today" className={`rounded-lg border px-3 py-1 text-xs ${preset === "today" ? "border-[#f59e0b] text-[#f59e0b]" : "border-[var(--border)] text-[var(--muted)]"}`}>Today</button>
                    <button type="submit" name="preset" value="yesterday" className={`rounded-lg border px-3 py-1 text-xs ${preset === "yesterday" ? "border-[#f59e0b] text-[#f59e0b]" : "border-[var(--border)] text-[var(--muted)]"}`}>Yesterday</button>
                    <button type="submit" name="preset" value="wtd" className={`rounded-lg border px-3 py-1 text-xs ${preset === "wtd" ? "border-[#f59e0b] text-[#f59e0b]" : "border-[var(--border)] text-[var(--muted)]"}`}>Week to date</button>
                    <span className="self-center text-[11px] text-[var(--muted)]">or a spot window ↓</span>
                  </div>
                  <div className="flex flex-wrap items-end gap-2">
                    <label className="text-[11px] text-[var(--muted)]">Date<input type="date" name="date" defaultValue={tvDate || todayCst} className="mt-1 block rounded-lg border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm text-[var(--text)]" /></label>
                    <label className="text-[11px] text-[var(--muted)]">Time (CST)<input type="time" name="time" defaultValue={tvTime || "09:00"} className="mt-1 block rounded-lg border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm text-[var(--text)]" /></label>
                    <label className="text-[11px] text-[var(--muted)]">Window<select name="win" defaultValue={String(tvWin || 20)} className="mt-1 block rounded-lg border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm text-[var(--text)]"><option value="10">10 min</option><option value="15">15 min</option><option value="20">20 min</option><option value="30">30 min</option><option value="45">45 min</option><option value="60">1 hour</option><option value="120">2 hours</option></select></label>
                    <label className="text-[11px] text-[var(--muted)]">Anchor<select name="anchor" defaultValue={tvAnchor} className="mt-1 block rounded-lg border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm text-[var(--text)]"><option value="from">Starting at</option><option value="center">Centered on</option></select></label>
                    <label className="text-[11px] text-[var(--muted)]">COGS $ (this period)<input type="number" step="0.01" min="0" name="cogs" defaultValue={cogsDollars} placeholder="0.00" className="mt-1 block w-28 rounded-lg border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm text-[var(--text)]" /></label>
                    <button type="submit" className="rounded-lg bg-[#f59e0b] px-4 py-2 text-sm font-semibold text-black">View</button>
                    {(tvRange || cogsCents > 0) && <a href="/fire?tab=tv" className="self-center text-xs text-[var(--muted)] underline">Clear → all time</a>}
                  </div>
                </form>
                {windowLabel
                  ? <div className="mb-2 text-xs"><span className="rounded-full bg-[#f59e0b]/15 px-2 py-1 font-semibold text-[#f59e0b]">📍 {windowLabel}</span> <span className="text-[var(--muted)]">· {num(tv!.totals.total)} attributed call{tv!.totals.total === 1 ? "" : "s"}</span></div>
                  : <div className="mb-2 text-xs text-[var(--muted)]">Showing <b>all time</b>. Pick a preset, or a date + CST time + window, to attribute calls to a specific period/airing.</div>}
                <div className="mb-3 text-[11px] text-[var(--muted)]">Revenue counts <b>only calls delivered to the current set buyer</b> <span className="font-mono text-[var(--text)]">{tv!.setNumber || "(none set)"}</span> — change it on <a href="/dashboard/u65" className="text-[var(--brand)] underline">U65</a>. <b>{num(tv!.enabledStates)}</b> states triggered on; &ldquo;Delivered Target States&rdquo; = share of calls from those states.</div>

                {/* Period KPIs — every attributed call (exact + connected match) is bookable/billable */}
                <div className="mb-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  <Stat label="Calls" value={num(tv!.totals.total)} sub={`${num(tv!.totals.exact)} exact + ${num(tv!.totals.matches)} matches`} tone="default" />
                  <Stat label="Conversions" value={num(tvBillable)} sub="delivered to set buyer" tone="up" />
                  <Stat label="Revenue" value={usd2(tvRevenueCents)} sub={`${usd2(tv!.totals.exactRevCents)} exact + ${usd2(tv!.totals.matchRevCents)} conn`} tone="up" />
                  <Stat label="COGS" value={cogsCents ? usd2(cogsCents) : "—"} sub="this period" tone="down" />
                  <Stat label="ROAS" value={tvRoas ? `${tvRoas.toFixed(1)}×` : "—"} sub="revenue ÷ COGS" tone="gold" />
                </div>

                <table className="w-full text-sm">
                  <thead><tr className="text-[10px] uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]">
                    <th className="text-left p-3">Campaign</th><th className="text-left p-3">Number</th>
                    <th className="text-right p-3">Exact<div className="text-[9px] normal-case font-normal opacity-70">calls · rev</div></th><th className="text-right p-3">Connected Matches<div className="text-[9px] normal-case font-normal opacity-70">calls · rev</div></th><th className="text-right p-3">Total<div className="text-[9px] normal-case font-normal opacity-70">calls · rev</div></th><th className="text-right p-3">Delivered<br />Target States</th><th className="text-right p-3">Avg dur</th>
                    <th className="text-right p-3">Impressions</th><th className="text-right p-3">Calls / 1k impr</th>
                  </tr></thead>
                  <tbody>
                    {tv!.stats.map((s) => (
                      <tr key={s.key} className={`border-b border-[var(--border)] last:border-0 ${s.key === bestTvKey ? "bg-[#f59e0b]/10" : ""}`}>
                        <td className="p-3 font-semibold">{s.label}{s.key === bestTvKey && <span className="ml-2 text-[10px] text-[#f59e0b]">★ most efficient</span>}<div className="text-[11px] text-[var(--muted)] font-normal">{s.note}</div></td>
                        <td className="p-3 font-mono text-xs">{s.display}</td>
                        <td className="p-3 text-right">{num(s.exact)}<div className="text-[10px] text-[var(--muted)]">{usd2(s.exactRevCents)}</div></td>
                        <td className="p-3 text-right text-[#f59e0b]">{num(s.matches)}<div className="text-[10px] text-[#f59e0b]/70">{usd2(s.matchRevCents)}</div></td>
                        <td className="p-3 text-right font-semibold">{num(s.total)}<div className="text-[10px] text-[#22c55e]">{usd2(s.totalRevCents)}</div></td>
                        <td className="p-3 text-right">{s.total ? `${Math.round((s.inTarget / s.total) * 100)}%` : "—"}<div className="text-[10px] text-[var(--muted)]">{num(s.inTarget)}/{num(s.total)}</div></td>
                        <td className="p-3 text-right text-[var(--muted)]">{s.total ? dur(s.avgDurationSec) : "—"}</td>
                        <td className="p-3 text-right text-[var(--muted)]">{s.impressions ? num(s.impressions) : "—"}</td>
                        <td className={`p-3 text-right font-bold ${s.key === bestTvKey ? "text-[#f59e0b]" : ""}`}>{s.callsPer1k !== null ? s.callsPer1k.toFixed(2) : "—"}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-[var(--border)] font-semibold">
                      <td className="p-3" colSpan={2}>Total</td>
                      <td className="p-3 text-right">{num(tv!.totals.exact)}<div className="text-[10px] text-[var(--muted)] font-normal">{usd2(tv!.totals.exactRevCents)}</div></td>
                      <td className="p-3 text-right text-[#f59e0b]">{num(tv!.totals.matches)}<div className="text-[10px] text-[#f59e0b]/70 font-normal">{usd2(tv!.totals.matchRevCents)}</div></td>
                      <td className="p-3 text-right">{num(tv!.totals.total)}<div className="text-[10px] text-[#22c55e] font-normal">{usd2(tv!.totals.totalRevCents)}</div></td>
                      <td className="p-3 text-right">{tv!.totals.total ? `${Math.round((tv!.totals.inTarget / tv!.totals.total) * 100)}%` : "—"}<div className="text-[10px] text-[var(--muted)] font-normal">{num(tv!.totals.inTarget)}/{num(tv!.totals.total)}</div></td>
                      <td className="p-3"></td>
                      <td className="p-3 text-right">{tv!.totals.impressions ? num(tv!.totals.impressions) : "—"}</td>
                      <td className="p-3 text-right">{tv!.totals.impressions ? ((tv!.totals.total / tv!.totals.impressions) * 1000).toFixed(2) : "—"}</td>
                    </tr>
                  </tbody>
                </table>

                {sp.ok && <div className="mt-3 text-xs text-[#22c55e]">✓ Impressions saved.</div>}
                <form action="/api/fire/tv-impressions" method="post" className="mt-4 rounded-xl border border-[var(--border)] p-3">
                  <div className="mb-2 text-xs font-semibold text-[var(--muted)]">Vibe.co impressions delivered (per test) — paste from your Vibe dashboard, then Save:</div>
                  <div className="flex flex-wrap items-end gap-3">
                    {tv!.stats.map((s) => (
                      <label key={s.key} className="text-xs text-[var(--muted)]">{s.label}
                        <input name={`imp_${s.key}`} type="number" min="0" defaultValue={s.impressions || ""} placeholder="0" className="mt-1 block w-32 rounded-lg border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm text-[var(--text)]" />
                      </label>
                    ))}
                    <button type="submit" className="rounded-lg bg-[#f59e0b] px-4 py-2 text-sm font-semibold text-black">Save impressions</button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="p-4">
                <div className="mb-3 text-xs text-[var(--muted)]">Callers matched against your uploaded TV audience (<b>{num(tvAge!.audienceSize)}</b> numbers on file) → <b className="text-[#22c55e]">Under 65</b> vs <b className="text-[#f59e0b]">65+</b>. Unmatched callers (not in the list) show as &ldquo;Unknown.&rdquo;</div>

                <form method="get" action="/fire" className="mb-3 rounded-xl border border-[var(--border)] p-3">
                  <input type="hidden" name="tab" value="tvage" />
                  <div className="mb-2 flex flex-wrap gap-2">
                    <button type="submit" name="preset" value="today" className={`rounded-lg border px-3 py-1 text-xs ${preset === "today" ? "border-[#8b5cf6] text-[#8b5cf6]" : "border-[var(--border)] text-[var(--muted)]"}`}>Today</button>
                    <button type="submit" name="preset" value="yesterday" className={`rounded-lg border px-3 py-1 text-xs ${preset === "yesterday" ? "border-[#8b5cf6] text-[#8b5cf6]" : "border-[var(--border)] text-[var(--muted)]"}`}>Yesterday</button>
                    <button type="submit" name="preset" value="wtd" className={`rounded-lg border px-3 py-1 text-xs ${preset === "wtd" ? "border-[#8b5cf6] text-[#8b5cf6]" : "border-[var(--border)] text-[var(--muted)]"}`}>Week to date</button>
                    <span className="self-center text-[11px] text-[var(--muted)]">or a spot window ↓</span>
                  </div>
                  <div className="flex flex-wrap items-end gap-2">
                    <label className="text-[11px] text-[var(--muted)]">Date<input type="date" name="date" defaultValue={tvDate || todayCst} className="mt-1 block rounded-lg border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm text-[var(--text)]" /></label>
                    <label className="text-[11px] text-[var(--muted)]">Time (CST)<input type="time" name="time" defaultValue={tvTime || "09:00"} className="mt-1 block rounded-lg border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm text-[var(--text)]" /></label>
                    <label className="text-[11px] text-[var(--muted)]">Window<select name="win" defaultValue={String(tvWin || 20)} className="mt-1 block rounded-lg border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm text-[var(--text)]"><option value="10">10 min</option><option value="15">15 min</option><option value="20">20 min</option><option value="30">30 min</option><option value="45">45 min</option><option value="60">1 hour</option><option value="120">2 hours</option></select></label>
                    <label className="text-[11px] text-[var(--muted)]">Anchor<select name="anchor" defaultValue={tvAnchor} className="mt-1 block rounded-lg border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm text-[var(--text)]"><option value="from">Starting at</option><option value="center">Centered on</option></select></label>
                    <button type="submit" className="rounded-lg bg-[#8b5cf6] px-4 py-2 text-sm font-semibold text-white">View</button>
                    {tvRange && <a href="/fire?tab=tvage" className="self-center text-xs text-[var(--muted)] underline">Clear → all time</a>}
                  </div>
                </form>
                {windowLabel
                  ? <div className="mb-3 text-xs"><span className="rounded-full bg-[#8b5cf6]/15 px-2 py-1 font-semibold text-[#8b5cf6]">📍 {windowLabel}</span></div>
                  : <div className="mb-3 text-xs text-[var(--muted)]">Showing <b>all time</b>. Pick a preset or a spot window above to isolate an airing.</div>}

                <div className="mb-4 grid gap-3 sm:grid-cols-4">
                  <Stat label="Under 65" value={num(tvAge!.totals.under)} sub="matched · age under 65" tone="up" />
                  <Stat label="65+" value={num(tvAge!.totals.over)} sub="matched · 65 and older" tone="gold" />
                  <Stat label="Unknown" value={num(tvAge!.totals.unknown)} sub="caller not in the list" tone="default" />
                  <Stat label="Combined" value={num(tvAge!.totals.total)} sub="all calls" tone="default" />
                </div>

                <table className="w-full text-sm">
                  <thead><tr className="text-[10px] uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]">
                    <th className="text-left p-3">Campaign</th><th className="text-left p-3">Number</th>
                    <th className="text-right p-3">Under 65</th><th className="text-right p-3">65+</th><th className="text-right p-3">Unknown</th><th className="text-right p-3">Total</th>
                  </tr></thead>
                  <tbody>
                    {tvAge!.stats.map((s) => (
                      <tr key={s.key} className="border-b border-[var(--border)] last:border-0">
                        <td className="p-3 font-semibold">{s.label}<div className="text-[11px] text-[var(--muted)] font-normal">{s.note}</div></td>
                        <td className="p-3 font-mono text-xs">{s.display}</td>
                        <td className="p-3 text-right text-[#22c55e] font-semibold">{num(s.under)}</td>
                        <td className="p-3 text-right text-[#f59e0b]">{num(s.over)}</td>
                        <td className="p-3 text-right text-[var(--muted)]">{num(s.unknown)}</td>
                        <td className="p-3 text-right font-semibold">{num(s.total)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-[var(--border)] font-semibold">
                      <td className="p-3" colSpan={2}>Total</td>
                      <td className="p-3 text-right text-[#22c55e]">{num(tvAge!.totals.under)}</td>
                      <td className="p-3 text-right text-[#f59e0b]">{num(tvAge!.totals.over)}</td>
                      <td className="p-3 text-right text-[var(--muted)]">{num(tvAge!.totals.unknown)}</td>
                      <td className="p-3 text-right">{num(tvAge!.totals.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </Section>

        <Section title="Campaigns" desc="Build a sequence, set the pace & send window, and Start Send Now.">
          <div className="space-y-3">
            <CampaignBuilder lists={listOpts} defaultSubject={DEFAULT_TEMPLATE.subject} defaultBody={DEFAULT_TEMPLATE.body} />
            <Card className="!p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="text-[10px] uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]"><th className="text-left p-3">Campaign</th><th className="text-left p-3">Status</th><th className="text-left p-3">Sent</th><th className="text-left p-3">Left</th><th className="text-left p-3">Window (CST)</th><th className="text-left p-3"></th></tr></thead>
                <tbody>
                  {campStats.map(({ camp, sent, left }) => (
                    <tr key={camp.id} className="border-b border-[var(--border)] last:border-0">
                      <td className="p-3 font-medium">{camp.name}<div className="text-[11px] text-[var(--muted)]">{camp.emailField} · {num(camp.perHour)}/hr</div></td>
                      <td className="p-3"><Badge tone={camp.status === "running" ? "up" : camp.status === "done" ? "brand" : camp.status === "paused" ? "gold" : "default"}>{camp.status}</Badge></td>
                      <td className="p-3">{num(sent)}</td>
                      <td className="p-3">{num(left)}</td>
                      <td className="p-3 text-xs text-[var(--muted)]">{camp.sendStart}–{camp.sendEnd} · {camp.sendDays.split(",").length}d</td>
                      <td className="p-3"><CampaignControls id={camp.id} status={camp.status} /></td>
                    </tr>
                  ))}
                  {campaigns.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-[var(--muted)]">No campaigns yet — create one above.</td></tr>}
                </tbody>
              </table>
            </Card>
          </div>
        </Section>

        <Section title="VoiceDrip" desc="Automated voicemail drops off each sent email. Default: 11:00 CST next business day — editable below. Callbacks route to U65, turn the lead teal, and book $75.">
          <VoiceDripCard />
        </Section>

        <Section title="Lists" desc="Your Predictive Data audiences.">
          <div className="space-y-3">
            <ListUploader />
            <Card className="!p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="text-[10px] uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]"><th className="text-left p-3">Name</th><th className="text-left p-3">Contacts</th><th className="text-left p-3">Business emails</th><th className="text-left p-3">Uploaded</th></tr></thead>
                <tbody>
                  {lists.map((l) => (
                    <tr key={l.id} className="border-b border-[var(--border)] last:border-0"><td className="p-3 font-medium">{l.name}</td><td className="p-3">{num(l.total)}</td><td className="p-3 text-[var(--muted)]">{num(l.sendable)}</td><td className="p-3 text-xs text-[var(--muted)]">{l.createdAt.toISOString().slice(0, 10)}</td></tr>
                  ))}
                  {lists.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-[var(--muted)]">No lists yet.</td></tr>}
                </tbody>
              </table>
            </Card>
          </div>
        </Section>
      </div>
    </div>
  );
}
