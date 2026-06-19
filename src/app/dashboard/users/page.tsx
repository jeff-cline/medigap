import { Card, Stat, Badge, Section, Stars } from "@/components/ui";
import { db } from "@/lib/db";
import { num } from "@/lib/format";

const roleTone: Record<string, "default" | "up" | "down" | "gold" | "brand"> = {
  god: "gold",
  agent: "up",
  advertiser: "brand",
  investor: "gold",
  marketing: "brand",
  accounting: "default",
};

const statusTone: Record<string, "default" | "up" | "down" | "gold" | "brand"> = {
  active: "up",
  paused: "down",
  pending: "default",
};

const ROLE_ACCESS: { role: string; sees: string }[] = [
  { role: "god", sees: "Everything — all leads incl. AI journey, money, settings, autonomous logic, impersonation." },
  { role: "agent", sees: "Own assigned leads (contact basics only), bids, seats, call performance, stars." },
  { role: "advertiser", sees: "Own ad spend, campaigns, attributed calls/leads, ROAS." },
  { role: "investor", sees: "Allocation, waterfall, profit share, payout statements — read-only." },
  { role: "marketing", sees: "Sites, channels, creative, money-words, conversion analytics." },
  { role: "accounting", sees: "Ledger, fees, payouts, reconciliation — no editorial controls." },
];

export default async function UsersPage() {
  const [users, total, agents, advertisers, investors] = await Promise.all([
    db.user.findMany({ orderBy: { createdAt: "asc" } }),
    db.user.count(),
    db.user.count({ where: { role: "agent" } }),
    db.user.count({ where: { role: "advertiser" } }),
    db.user.count({ where: { role: "investor" } }),
  ]);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">
          God can drill into and impersonate any account to see exactly what that role sees. Each role gets a scoped slice
          of the platform — full matrix below.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Stat label="Total Users" value={num(total)} sub="all roles" tone="up" />
        <Stat label="Agents" value={num(agents)} sub="role = agent" tone="gold" />
        <Stat label="Advertisers" value={num(advertisers)} sub="role = advertiser" tone="default" />
        <Stat label="Investors" value={num(investors)} sub="role = investor" tone="gold" />
      </div>

      <Section title="All Users" desc="Drill in or impersonate any account.">
        <Card className="!p-0 overflow-hidden">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Rating</th>
                <th>Created</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="font-medium">{u.name || "—"}</td>
                  <td className="text-[var(--muted)] text-sm">{u.email}</td>
                  <td><Badge tone={roleTone[u.role] ?? "default"}>{u.role}</Badge></td>
                  <td><Badge tone={statusTone[u.status] ?? "default"}>{u.status}</Badge></td>
                  <td>{u.role === "agent" ? <span><Stars n={u.stars} /> <span className="text-xs text-[var(--muted)]">{u.stars.toFixed(1)}</span></span> : <span className="text-[var(--muted)]">—</span>}</td>
                  <td className="text-[var(--muted)] text-sm">{u.createdAt.toISOString().slice(0, 10)}</td>
                  <td className="text-right">
                    <div className="inline-flex gap-2">
                      <button type="button" className="btn btn-ghost text-xs !py-1 !px-2.5">Impersonate</button>
                      <button type="button" className="btn btn-ghost text-xs !py-1 !px-2.5">Reset password</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <p className="text-xs text-[var(--muted)] mt-2">Wired next: secure impersonation session + password-reset email flow.</p>
      </Section>

      <Section title="Roles & Visibility" desc="What each role can see in the platform.">
        <Card>
          <div className="space-y-3">
            {ROLE_ACCESS.map((r) => (
              <div key={r.role} className="flex items-start gap-3">
                <div className="w-28 shrink-0"><Badge tone={roleTone[r.role] ?? "default"}>{r.role}</Badge></div>
                <p className="text-sm text-[var(--muted)]">{r.sees}</p>
              </div>
            ))}
          </div>
        </Card>
      </Section>
    </>
  );
}
