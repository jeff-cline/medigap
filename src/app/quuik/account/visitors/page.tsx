import { redirect } from "next/navigation";
import { getSession, isGod } from "@/lib/auth";
import { readEvents, type NetEvent } from "@/lib/network-leads";
import { getAppends } from "@/lib/identity";
import ResolveButton from "@/components/elag/ResolveButton";
import PlatformNav, { NAV_WIDTH } from "@/components/elag/PlatformNav";
import AutoRefresh from "@/components/elag/AutoRefresh";

export const dynamic = "force-dynamic";
export const metadata = { title: "Visitors · Quuik God", robots: { index: false, follow: false } };

const ORANGE = "#F5821F", INK = "#0e1524", MUT = "#5b6472", LINE = "#e9ecf1";

function device(ua: string): string {
  const u = (ua || "").toLowerCase();
  const os = /iphone|ipad|ios/.test(u) ? "iOS" : /android/.test(u) ? "Android" : /mac os/.test(u) ? "Mac" : /windows/.test(u) ? "Windows" : /linux/.test(u) ? "Linux" : "—";
  const br = /edg\//.test(u) ? "Edge" : /chrome|crios/.test(u) ? "Chrome" : /firefox|fxios/.test(u) ? "Firefox" : /safari/.test(u) ? "Safari" : "—";
  return `${br} · ${os}${/mobile|iphone|android/.test(u) ? " · mobile" : ""}`;
}
const fmt = (s: string) => { try { return new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); } catch { return s; } };
const consentLabel = (kinds: Set<string>) =>
  kinds.has("pcbar_email_off") ? "Acknowledged · email off"
  : kinds.has("pcbar_email_on") ? "Acknowledged · email on"
  : kinds.has("pcbar_ack") ? "Acknowledged"
  : kinds.has("pcbar_view") ? "Notice shown" : "—";

const wrap: React.CSSProperties = { maxWidth: 1120, margin: "0 auto", padding: "0 20px" };
const card: React.CSSProperties = { background: "#fff", border: `1px solid ${LINE}`, borderRadius: 14, padding: 18, marginTop: 16 };
const th: React.CSSProperties = { textAlign: "left", color: MUT, fontSize: 11, textTransform: "uppercase", padding: "8px 10px", borderBottom: `1px solid ${LINE}`, whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "9px 10px", borderTop: `1px solid ${LINE}`, fontSize: 13 };

export default async function Visitors({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const s = await getSession();
  if (!s) redirect("/login");
  if (!isGod(s)) redirect("/account");
  const sp = await searchParams;

  const events = readEvents(100000);
  const appends = await getAppends();

  // group events into visitors (first-party vid, else IP)
  const byKey = new Map<string, NetEvent[]>();
  for (const e of events) { const k = e.vid || e.ip || "unknown"; if (!byKey.has(k)) byKey.set(k, []); byKey.get(k)!.push(e); }

  // ---------- drill-in ----------
  if (sp.v) {
    // Match by first-party key, OR (from the live map / leads) consolidate ALL events for that IP.
    const raw = byKey.get(sp.v) || events.filter((e) => e.ip === sp.v);
    const evs = raw.slice().sort((a, b) => (a.at < b.at ? 1 : -1));
    if (!evs.length) return <Shell email={s.email}><a href="/account/visitors" style={{ color: ORANGE, textDecoration: "none" }}>← All visitors</a><p style={{ marginTop: 20, color: MUT }}>No visits recorded for that visitor.</p></Shell>;
    const ip = evs.find((e) => e.ip)?.ip || "";
    const a = appends[ip];
    const nm = a?.matched && typeof a.name === "string" ? String(a.name) : "";
    const sites = Array.from(new Set(evs.map((e) => e.site).filter(Boolean)));
    return (
      <Shell email={s.email}>
        <a href="/account/visitors" style={{ color: ORANGE, fontSize: 13, textDecoration: "none" }}>← All visitors</a>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "6px 0 2px" }}>{nm || `Visitor ${sp.v.slice(0, 20)}`}</h1>
        <p style={{ color: MUT, fontSize: 14, margin: 0 }}>{evs.length} visit{evs.length === 1 ? "" : "s"} · {sites.join(", ") || "—"} · {device(evs[0]?.ua || "")} · IP {ip || "—"}</p>

        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: MUT }}>Data Pin append · PredictiveData (reverse-IP)</div>
            {ip ? <ResolveButton ip={ip} label={a ? "Re-resolve" : "Resolve identity"} /> : null}
          </div>
          {a?.matched ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
              {Object.entries(a).filter(([k]) => !["matched", "at"].includes(k)).map(([k, v]) => (
                <div key={k}><div style={{ fontSize: 11, color: MUT }}>{k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}</div><div style={{ fontSize: 14, fontWeight: 600, color: "#12a150" }}>{String(v)}</div></div>
              ))}
            </div>
          ) : a ? <p style={{ color: MUT, fontSize: 13.5, margin: 0 }}>No identity match for this IP.</p> : <p style={{ color: MUT, fontSize: 13.5, margin: 0 }}>Not resolved yet — click “Resolve identity” to append name, location &amp; firmographics from the Data Pin platform.</p>}
        </div>

        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: MUT }}>Journey (newest first)</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={th}>When</th><th style={th}>Site</th><th style={th}>Path</th><th style={th}>Event</th></tr></thead>
              <tbody>{evs.map((e, i) => (<tr key={i}><td style={td}>{fmt(e.at)}</td><td style={td}><b>{e.site || "—"}</b></td><td style={{ ...td, color: MUT, maxWidth: 380, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.path}</td><td style={td}>{e.kind}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
      </Shell>
    );
  }

  // ---------- list ----------
  const allVisitors = Array.from(byKey.entries()).map(([key, evs]) => {
    const last = evs[evs.length - 1], ip = evs.find((e) => e.ip)?.ip || "";
    return {
      key, ip,
      sites: Array.from(new Set(evs.map((e) => e.site).filter(Boolean))),
      visits: evs.length,
      lastSeen: last?.at || "",
      device: device(last?.ua || ""),
      name: appends[ip]?.matched && typeof appends[ip].name === "string" ? String(appends[ip].name) : "",
      consent: consentLabel(new Set(evs.map((e) => e.kind))),
    };
  }).sort((a, b) => (a.lastSeen < b.lastSeen ? 1 : -1));

  const bySite = new Map<string, number>();
  for (const e of events) { const k = e.site || "—"; bySite.set(k, (bySite.get(k) || 0) + 1); }
  const siteRows = [...bySite.entries()].sort((a, b) => b[1] - a[1]);

  // selected site + tab (consolidated when no site)
  const site = sp.site && sp.site !== "all" ? sp.site : "";
  const tab = sp.tab === "leads" ? "leads" : "visitors";
  const scoped = site ? allVisitors.filter((v) => v.sites.includes(site)) : allVisitors;
  // Leads = distinct identified PEOPLE (by IP), consolidated across cookies/domains — matches el.ag/leads.
  // (The raw Visitors tab still lists every first-party visitor row.)
  const seenLeadIp = new Set<string>();
  const list = tab === "leads"
    ? scoped.filter((v) => v.name && v.ip).filter((v) => (seenLeadIp.has(v.ip) ? false : (seenLeadIp.add(v.ip), true)))
    : scoped;

  const visitorCount = scoped.length;
  const visitCount = site ? events.filter((e) => (e.site || "—") === site).length : events.length;
  const leadsCount = new Set(scoped.filter((v) => v.name && v.ip).map((v) => v.ip)).size;
  const leadsHref = site ? `/account/visitors?site=${encodeURIComponent(site)}&tab=leads` : `/account/visitors?tab=leads`;
  const scopeLabel = site ? ` on ${site}` : " across the network";

  return (
    <Shell email={s.email}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 4px" }}>👁 Visitors{site ? <span style={{ color: MUT, fontWeight: 600 }}> · {site}</span> : ""}</h1>
        <AutoRefresh seconds={15} />
      </div>
      <p style={{ color: MUT, fontSize: 14.5, margin: "0 0 10px" }}>Every visitor and all raw activity{scopeLabel} — identified or not, by site and time, live. Click a site below to focus it; click a name (or Drill in) for the Data Pin identity append.</p>

      {/* featured LEADS box + stats */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "stretch", margin: "4px 0 6px" }}>
        <a href={leadsHref} style={{ flex: "2 1 360px", textDecoration: "none", color: "#fff" }}>
          <div style={{ position: "relative", overflow: "hidden", background: "linear-gradient(135deg,#ff9a4d 0%,#F5821F 55%,#e5610d 100%)", borderRadius: 20, padding: "22px 26px", boxShadow: "0 16px 36px rgba(245,130,31,.34)", height: "100%", boxSizing: "border-box" }}>
            <div style={{ position: "absolute", right: 6, top: -18, fontSize: 130, lineHeight: 1, opacity: 0.22, transform: "rotate(18deg)" }}>🚀</div>
            <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase" }}>🚀 Leads</div>
            <div style={{ fontSize: 54, fontWeight: 850, lineHeight: 1.02, margin: "8px 0 2px", fontVariantNumeric: "tabular-nums" }}>{leadsCount.toLocaleString()}</div>
            <div style={{ fontSize: 14.5, opacity: 0.96 }}>visitors resolved to a real person{scopeLabel}</div>
            <span style={{ marginTop: 14, display: "inline-block", background: "rgba(255,255,255,.22)", border: "1px solid rgba(255,255,255,.4)", borderRadius: 100, padding: "8px 18px", fontSize: 13.5, fontWeight: 800 }}>View leads →</span>
          </div>
        </a>
        <div style={{ flex: "1 1 220px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignContent: "start" }}>
          <Stat n={visitorCount} label={site ? "visitors here" : "visitors"} />
          <Stat n={visitCount} label="visits logged" />
          <div style={{ gridColumn: "1 / -1" }}><ResolveButton batch={25} /></div>
        </div>
      </div>

      {/* traffic by site — clickable */}
      <div style={card}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: MUT, marginBottom: 8 }}>Traffic by site <span style={{ textTransform: "none", fontWeight: 500 }}>· click to focus a site</span></div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <a href="/account/visitors" style={{ textDecoration: "none", background: !site ? ORANGE : "#fff2ec", color: !site ? "#fff" : ORANGE, border: `1px solid ${!site ? ORANGE : "#ffd9cb"}`, borderRadius: 100, padding: "5px 13px", fontSize: 12.5, fontWeight: 800 }}>All sites · {allVisitors.length}</a>
          {siteRows.length === 0 ? <span style={{ color: MUT, fontSize: 13, alignSelf: "center" }}>No visits yet — sites appear here as they get their first visitor.</span> :
            siteRows.map(([sName, n]) => {
              const on = site === sName;
              return <a key={sName} href={`/account/visitors?site=${encodeURIComponent(sName)}`} style={{ textDecoration: "none", background: on ? ORANGE : "#fff2ec", color: on ? "#fff" : ORANGE, border: `1px solid ${on ? ORANGE : "#ffd9cb"}`, borderRadius: 100, padding: "5px 13px", fontSize: 12.5, fontWeight: 700 }}>{sName} · {n}</a>;
            })}
        </div>
      </div>

      {/* per-site tabs (only when a site is focused) */}
      {site && (
        <div style={{ display: "flex", gap: 8, margin: "14px 0 0" }}>
          {([["visitors", `Visitors · ${scoped.length}`], ["leads", `Leads · ${leadsCount}`]] as [string, string][]).map(([k, lbl]) => {
            const on = tab === k;
            const href = k === "visitors" ? `/account/visitors?site=${encodeURIComponent(site)}` : `/account/visitors?site=${encodeURIComponent(site)}&tab=leads`;
            return <a key={k} href={href} style={{ textDecoration: "none", fontSize: 13.5, fontWeight: 700, padding: "8px 16px", borderRadius: 100, border: `1px solid ${on ? ORANGE : LINE}`, color: on ? "#fff" : MUT, background: on ? ORANGE : "#fff" }}>{lbl}</a>;
          })}
        </div>
      )}

      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Last seen", "Site(s)", "Visits", "Device", "IP", "Identity", "Consent", ""].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {list.length === 0 ? <tr><td style={td} colSpan={8}><span style={{ color: MUT }}>{tab === "leads" ? "No named leads here yet — click Resolve to append identities." : "No visitors yet — they’ll appear here as traffic hits the network."}</span></td></tr> :
                list.map((v) => {
                  const href = `/account/visitors?v=${encodeURIComponent(v.key)}`;
                  return (
                  <tr key={v.key}>
                    <td style={td}>{fmt(v.lastSeen)}</td>
                    <td style={td}><b>{v.sites.join(", ") || "—"}</b></td>
                    <td style={td}>{v.visits}</td>
                    <td style={{ ...td, color: MUT }}>{v.device}</td>
                    <td style={{ ...td, color: MUT, fontVariantNumeric: "tabular-nums" }}>{v.ip || "—"}</td>
                    <td style={td}>{v.name ? <a href={href} style={{ color: "#12a150", fontWeight: 700, textDecoration: "none", borderBottom: "1px dashed #9ad4b3" }}>{v.name}</a> : <span style={{ color: MUT }}>—</span>}</td>
                    <td style={{ ...td, color: MUT }}>{v.consent}</td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}><a href={href} style={{ background: "#0f1b2d", color: "#fff", textDecoration: "none", borderRadius: 100, padding: "6px 12px", fontSize: 12.5, fontWeight: 700 }}>Drill in →</a></td>
                  </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 12, padding: "10px 16px" }}><div style={{ fontSize: 20, fontWeight: 800, color: INK }}>{n.toLocaleString()}</div><div style={{ fontSize: 11.5, color: MUT }}>{label}</div></div>;
}

function Shell({ email, children }: { email: string; children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "-apple-system,Segoe UI,Helvetica,Arial,sans-serif", color: INK, background: "#f7f8fa", minHeight: "100vh", paddingLeft: NAV_WIDTH }}>
      <PlatformNav active="visitors" email={email} />
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "28px 22px 70px" }}>{children}</section>
    </div>
  );
}
