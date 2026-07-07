import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your Leads", robots: { index: false } };

// A self-contained portal for a site partner (marketing_partner) — shows ONLY the leads from
// the site(s) they own. Works on any host (reserved in middleware), so it never 404s.
export default async function PartnerPortal() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.mustChangePassword) redirect("/change-password");
  if (s.role !== "marketing_partner" && s.role !== "god") redirect("/dashboard");

  const sites = await db.site.findMany({ where: { ownerId: s.uid }, select: { id: true, name: true, hostname: true } });
  const siteIds = sites.length ? sites.map((x) => x.id) : ["__none__"];
  const where = { siteId: { in: siteIds } };
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const [leads, total, week] = await Promise.all([
    db.lead.findMany({ where, orderBy: { createdAt: "desc" }, take: 300 }),
    db.lead.count({ where }),
    db.lead.count({ where: { ...where, createdAt: { gte: weekAgo } } }),
  ]);
  const siteName = sites.map((x) => x.name).join(" · ") || "Your site";
  const fmt = (d: Date) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div style={{ background: "#f6f8fc", minHeight: "100vh", color: "#0f1a2e", fontFamily: "-apple-system,Helvetica Neue,Arial,sans-serif" }}>
      <header style={{ background: "#0f1a2e", color: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{siteName} — Leads</div>
            {sites[0]?.hostname && <div style={{ fontSize: 12, color: "#93a2bd" }}>{sites.map((x) => x.hostname).join(", ")}</div>}
          </div>
          <a href="/api/auth/logout" style={{ color: "#cbd5e1", fontSize: 13, textDecoration: "none", border: "1px solid #33415c", borderRadius: 8, padding: "6px 12px" }}>Log out</a>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16, marginBottom: 20, maxWidth: 460 }}>
          <div style={{ background: "#fff", border: "1px solid #e4e9f2", borderRadius: 12, padding: 16 }}><div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "#5b6b86" }}>Total leads</div><div style={{ fontSize: 28, fontWeight: 800 }}>{total.toLocaleString()}</div></div>
          <div style={{ background: "#fff", border: "1px solid #e4e9f2", borderRadius: 12, padding: 16 }}><div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "#5b6b86" }}>This week</div><div style={{ fontSize: 28, fontWeight: 800, color: "#1457e6" }}>{week.toLocaleString()}</div></div>
        </div>

        {leads.length === 0 ? (
          <div style={{ background: "#fff", border: "1px solid #e4e9f2", borderRadius: 12, padding: 40, textAlign: "center", color: "#5b6b86" }}>No leads yet — they'll appear here the moment your site generates one.</div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid #e4e9f2", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ textAlign: "left", color: "#5b6b86", fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", borderBottom: "1px solid #e4e9f2" }}>
                <th style={{ padding: "10px 14px" }}>Name</th><th style={{ padding: "10px 14px" }}>Email</th><th style={{ padding: "10px 14px" }}>Phone</th><th style={{ padding: "10px 14px" }}>Location</th><th style={{ padding: "10px 14px" }}>Date</th><th style={{ padding: "10px 14px" }}>Status</th>
              </tr></thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} style={{ borderBottom: "1px solid #eef2f8" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600 }}>{l.name || "—"}</td>
                    <td style={{ padding: "10px 14px" }}>{l.email || "—"}</td>
                    <td style={{ padding: "10px 14px" }}>{l.phone || "—"}</td>
                    <td style={{ padding: "10px 14px", color: "#5b6b86" }}>{[l.city, l.state].filter(Boolean).join(", ") || "—"}</td>
                    <td style={{ padding: "10px 14px", color: "#5b6b86" }}>{fmt(l.createdAt)}</td>
                    <td style={{ padding: "10px 14px" }}><span style={{ fontSize: 11, fontWeight: 700, textTransform: "capitalize", color: l.status === "sold" ? "#0b8a6a" : "#5b6b86" }}>{l.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
