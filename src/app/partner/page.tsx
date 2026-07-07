import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import JvBoard from "@/components/JvBoard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Experiential Marketing — Projects", robots: { index: false } };

// Self-contained JV project-tracking CRM for experientialmarketing.ai. Partner sees only their
// site's leads; God can view them too. Runs on top of the Core but stands alone.
export default async function PartnerPortal() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.mustChangePassword) redirect("/change-password");
  const isGod = s.role === "god" || !!s.impersonatorUid;
  if (!isGod && s.role !== "marketing_partner") redirect("/dashboard");

  // God views the experientialmarketing.ai JV; the partner views the site(s) they own.
  const sites = isGod
    ? await db.site.findMany({ where: { hostname: "experientialmarketing.ai" }, select: { id: true, name: true, hostname: true } })
    : await db.site.findMany({ where: { ownerId: s.uid }, select: { id: true, name: true, hostname: true } });
  const siteIds = sites.length ? sites.map((x) => x.id) : ["__none__"];

  const rows = await db.lead.findMany({ where: { siteId: { in: siteIds } }, orderBy: { createdAt: "desc" }, take: 500, include: { notes: { orderBy: { createdAt: "desc" } } } });
  const projects = await db.jvProject.findMany({ where: { leadId: { in: rows.map((r) => r.id) } } });
  const pByLead = new Map(projects.map((p) => [p.leadId, p]));
  const leads = rows.map((l) => {
    const p = pByLead.get(l.id);
    return {
      id: l.id, name: l.name, email: l.email, phone: l.phone, city: l.city, state: l.state, source: l.source, createdAt: l.createdAt.toISOString(), status: l.status,
      project: { estimate: p?.estimate || "", dateExpected: p?.dateExpected || "", dateDelivered: p?.dateDelivered || "", clientExpectations: p?.clientExpectations || "", stage: p?.stage || "new" },
      notes: l.notes.map((n) => ({ authorName: n.authorName || n.authorId || "system", body: n.body, createdAt: n.createdAt.toISOString() })),
    };
  });
  const siteName = sites[0]?.name?.replace(/\s*\(XM\)\s*/, "") || "Experiential Marketing";

  return (
    <div style={{ background: "#0b0b0d", minHeight: "100vh", color: "#fff", fontFamily: "-apple-system,Helvetica Neue,Arial,sans-serif" }}>
      <header style={{ background: "#0b0b0d", borderBottom: "1px solid #2a2a31" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 30, lineHeight: 1 }}>🚀</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#f97316" }}>{siteName} <span style={{ color: "#e11d2a" }}>· Projects &amp; CRM</span></div>
              <div style={{ fontSize: 12, color: "#9a9aa5" }}>{isGod ? "God view" : "Your leads, projects, and notes"}</div>
            </div>
          </div>
          <a href="/api/auth/logout" style={{ color: "#9a9aa5", fontSize: 13, textDecoration: "none", border: "1px solid #2a2a31", borderRadius: 8, padding: "6px 12px" }}>Log out</a>
        </div>
      </header>
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
        <JvBoard leads={leads} />
      </main>
    </div>
  );
}
