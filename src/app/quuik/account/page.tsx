import { redirect } from "next/navigation";
import { getSession, isGod } from "@/lib/auth";
import { getProfile, getAllProfiles, keywordsOf, clickStats } from "@/lib/advertiser";
import { readClicks } from "@/lib/network-leads";
import { db } from "@/lib/db";
import AccountPanel from "./AccountPanel";
import GodConsole from "./GodConsole";
import StopImpersonate from "./StopImpersonate";
import { rankFor } from "@/lib/auction";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your account · Quuik", robots: { index: false, follow: false } };
const ORANGE = "#F5821F", INK = "#1c2128", MUT = "#6b7280", LINE = "#eee";
const fmt = (iso: string) => { try { const d = new Date(iso); return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } catch { return iso; } };
const card: React.CSSProperties = { background: "#fff", border: `1px solid ${LINE}`, borderRadius: 14, padding: 18, marginTop: 16 };

export default async function Account() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.mustChangePassword) redirect("/change-password");

  // GOD → full management console
  if (isGod(s)) {
    const profiles = await getAllProfiles();
    const uids = Object.keys(profiles);
    const users = uids.length ? await db.user.findMany({ where: { id: { in: uids } }, select: { id: true, email: true, phone: true, status: true } }).catch(() => []) : [];
    const umap = new Map(users.map((u) => [u.id, u]));
    const rank = (st?: string) => (st === "pending" ? 0 : st === "active" || st === "founding" ? 1 : 2);
    const rows = uids.map((uid) => {
      const p = profiles[uid]; const stats = clickStats(keywordsOf(p));
      return { uid, business: p.business || "—", name: `${p.firstName || ""} ${p.lastName || ""}`.trim(), email: umap.get(uid)?.email || p.email || "", moneyWord: p.moneyWord || "", status: p.status || "pending", baseCpc: p.baseCpc || 0, clicks: stats.total, adjacent: p.adjacent || [], supporting: p.supporting || [] };
    }).sort((a, b) => rank(a.status) - rank(b.status));
    const byWord = new Map<string, number>();
    for (const c of readClicks(100000)) { const k = (c.keyword || "").toLowerCase(); if (k) byWord.set(k, (byWord.get(k) || 0) + 1); }
    const moneyWordStats = [...byWord.entries()].map(([keyword, clicks]) => ({ keyword, clicks })).sort((a, b) => b.clicks - a.clicks).slice(0, 60);
    return <GodConsole email={s.email} rows={rows} moneyWordStats={moneyWordStats} />;
  }

  if (!["advertiser", "moneywords"].includes(s.role) && !s.impersonatorUid) redirect("/login");

  const p = await getProfile(s.uid);
  const kws = p ? keywordsOf(p) : [];
  const stats = clickStats(kws);
  const bid = await db.agentBid.findFirst({ where: { agentId: s.uid }, orderBy: { amountCents: "desc" } }).catch(() => null);
  const rank = p?.moneyWord ? await rankFor(s.uid, p.moneyWord) : null;
  const status = p?.status || "pending";
  const statusColor = status === "active" || status === "founding" ? "#12a150" : status === "paused" ? "#b3261e" : "#b7791f";

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f8", fontFamily: "-apple-system,Segoe UI,Helvetica,Arial,sans-serif", color: INK }}>
      {s.impersonatorUid && <StopImpersonate email={s.impersonatorEmail || ""} />}
      <header style={{ background: "#fff", borderBottom: `1px solid ${LINE}`, padding: "14px 20px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: INK }}><img src="/quuik-assets/logo.png" alt="Quuik" style={{ height: 30 }} /><b>Advertiser</b></a>
          <AccountPanel mode="logout" />
        </div>
      </header>
      <main style={{ maxWidth: 860, margin: "0 auto", padding: "26px 20px 70px" }}>
        <h1 style={{ fontSize: 25, fontWeight: 800, margin: 0 }}>{p?.business || "Your account"}</h1>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 8, background: "#fff", border: `1px solid ${LINE}`, borderRadius: 100, padding: "5px 13px", fontSize: 13, fontWeight: 700, color: statusColor }}>
          <span style={{ width: 8, height: 8, borderRadius: 8, background: statusColor }} />{status === "founding" ? "Founding member" : status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
        {status === "pending" && <p style={{ color: MUT, fontSize: 13.5, marginTop: 8 }}>Your money word is awaiting approval. It goes live across the network once approved.</p>}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
          {[["Clicks (all time)", stats.total], ["Clicks (30 days)", stats.last30], ["Visitors tracked", stats.visitors], ["Base CPC", `$${(p?.baseCpc || 0).toFixed(2)}`]].map(([l, v]) => (
            <div key={l as string} style={{ ...card, marginTop: 0, flex: "1 1 150px" }}>
              <div style={{ fontSize: 26, fontWeight: 800 }}>{v as React.ReactNode}</div>
              <div style={{ fontSize: 12.5, color: MUT, marginTop: 2 }}>{l as string}</div>
            </div>
          ))}
        </div>

        <div style={card}>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 4px" }}>Your keywords &amp; bid</h2>
          <p style={{ color: MUT, fontSize: 13, margin: "0 0 12px" }}>Your money word <b style={{ color: INK }}>{p?.moneyWord || "—"}</b> is fixed. Tune the adjacent &amp; supporting words that also trigger you, and raise your bid to move higher on the stack — the highest bid wins.</p>
          {rank && rank.total > 0 && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: rank.rank === 1 ? "#e8f7ee" : "#fff5ef", border: `1px solid ${rank.rank === 1 ? "#12a15044" : ORANGE + "44"}`, borderRadius: 100, padding: "6px 14px", fontSize: 13, fontWeight: 700, color: rank.rank === 1 ? "#12a150" : INK, marginBottom: 12 }}>
              {rank.rank === 1 ? `🏆 Top bid on “${p?.moneyWord}” at $${(rank.yourCents / 100).toFixed(2)}/click` : `#${rank.rank} of ${rank.total} on “${p?.moneyWord}” — top bid $${(rank.topCents / 100).toFixed(2)}. Raise yours to take the premium spot.`}
            </div>
          )}
          <AccountPanel mode="edit" moneyWord={p?.moneyWord || ""} adjacent={(p?.adjacent || []).join(", ")} supporting={(p?.supporting || []).join(", ")} bidDollars={((bid?.amountCents || Math.round((p?.baseCpc || 0) * 100)) / 100).toFixed(2)} />
        </div>

        <div style={card}>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 10px" }}>Where your clicks come from</h2>
          {stats.sources.length === 0 ? <p style={{ color: MUT, fontSize: 13.5 }}>No clicks yet — they’ll appear here as the network sends traffic to your money word.</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {stats.sources.map(([src, n]) => (
                <div key={src} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 130, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{src}</div>
                  <div style={{ flex: 1, height: 8, background: "#f0f0f2", borderRadius: 6, overflow: "hidden" }}><div style={{ width: `${Math.max(6, (n / stats.sources[0][1]) * 100)}%`, height: "100%", background: ORANGE }} /></div>
                  <div style={{ width: 34, textAlign: "right", fontWeight: 700, fontSize: 13 }}>{n}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={card}>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 4px" }}>Network identity <span style={{ fontSize: 12, fontWeight: 600, color: MUT }}>· names only</span></h2>
          <p style={{ color: MUT, fontSize: 13.5, margin: 0 }}>{stats.visitors} visitor{stats.visitors === 1 ? "" : "s"} tracked to your keywords. As our identity layer matches them, their <b>first &amp; last name</b> will appear here for data purposes. We never share email or phone — please don’t use this to cold-contact anyone.</p>
        </div>

        {stats.recent.length > 0 && (
          <div style={card}>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 10px" }}>Recent clicks</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
              <thead><tr>{["When", "Keyword", "Source"].map((h) => <th key={h} style={{ textAlign: "left", color: MUT, fontSize: 11, textTransform: "uppercase", padding: "6px 10px", borderBottom: `1px solid ${LINE}` }}>{h}</th>)}</tr></thead>
              <tbody>
                {stats.recent.map((c, i) => { let src = "direct"; try { src = c.referer ? new URL(c.referer).hostname.replace(/^www\./, "") : "direct"; } catch {} return (
                  <tr key={i}><td style={{ padding: "7px 10px", borderTop: `1px solid ${LINE}`, color: MUT, whiteSpace: "nowrap" }}>{fmt(c.at)}</td><td style={{ padding: "7px 10px", borderTop: `1px solid ${LINE}` }}>{c.keyword}</td><td style={{ padding: "7px 10px", borderTop: `1px solid ${LINE}` }}>{src}</td></tr>
                ); })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
