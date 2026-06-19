import { Card, Stat, Badge, Section, Stars } from "@/components/ui";
import UserActions from "@/components/UserActions";
import CrudForm from "@/components/CrudForm";
import { db } from "@/lib/db";
import { num } from "@/lib/format";

const roleTone: Record<string, "default" | "up" | "down" | "gold" | "brand"> = {
  god: "gold",
  agent: "up",
  advertiser: "brand",
  investor: "gold",
  marketing: "brand",
  accounting: "default",
  moneywords: "brand",
  risk: "down",
  consumer: "default",
};

const statusTone: Record<string, "default" | "up" | "down" | "gold" | "brand"> = {
  active: "up",
  paused: "down",
  pending: "gold",
};

const ROLE_ACCESS: { role: string; sees: string }[] = [
  { role: "god", sees: "Everything — all leads incl. AI journey, money, settings, autonomous logic, and impersonation of any account." },
  { role: "agent", sees: "Own assigned leads (contact basics only), bids, seats, call performance, stars." },
  { role: "advertiser", sees: "Own ad spend, campaigns, attributed calls/leads, ROAS." },
  { role: "investor", sees: "Allocation, waterfall, profit share, payout statements — read-only." },
  { role: "marketing", sees: "Sites, channels, creative, money-words, conversion analytics." },
  { role: "accounting", sees: "Ledger, fees, payouts, reconciliation — no editorial controls." },
];

export default async function UsersPage() {
  const users = await db.user.findMany({ orderBy: { createdAt: "asc" } });

  const total = users.length;
  const agents = users.filter((u) => u.role === "agent").length;
  const advertisers = users.filter((u) => u.role === "advertiser").length;
  const investors = users.filter((u) => u.role === "investor").length;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">
          One account directory powers every role. God can drill into and impersonate any account to see exactly what
          that user sees, approve pending signups, or reset a password to a temp. Everyone else is scoped to their own
          slice — the full visibility matrix is below.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Stat label="Total Users" value={num(total)} sub="all roles" tone="up" />
        <Stat label="Agents" value={num(agents)} sub="role = agent" tone="gold" />
        <Stat label="Advertisers" value={num(advertisers)} sub="role = advertiser" tone="up" />
        <Stat label="Investors" value={num(investors)} sub="role = investor" tone="gold" />
      </div>

      <Section title="All Users" desc="Drill in or impersonate any account; approve pending and reset passwords.">
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
                  <td>
                    <Badge tone={roleTone[u.role] ?? "default"}>{u.role}</Badge>
                  </td>
                  <td>
                    <Badge tone={statusTone[u.status] ?? "default"}>{u.status}</Badge>
                  </td>
                  <td>
                    {u.role === "agent" ? (
                      <span>
                        <Stars n={u.stars} /> <span className="text-xs text-[var(--muted)]">{u.stars.toFixed(1)}</span>
                      </span>
                    ) : (
                      <span className="text-[var(--muted)]">—</span>
                    )}
                  </td>
                  <td className="text-[var(--muted)] text-sm">{u.createdAt.toISOString().slice(0, 10)}</td>
                  <td className="text-right">
                    <UserActions userId={u.id} status={u.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Add a user" desc="Creates an active account with temp password TEMP!234 that must be changed.">
          <Card glow>
            <CrudForm
              endpoint="/api/users"
              submitLabel="Create user"
              successNote="User created with temp password TEMP!234."
              fields={[
                { name: "name", label: "Name", placeholder: "Jane Agent", required: true },
                { name: "email", label: "Email", placeholder: "jane@medigap.plus", required: true },
                {
                  name: "role",
                  label: "Role",
                  type: "select",
                  options: [
                    { value: "agent", label: "Agent" },
                    { value: "advertiser", label: "Advertiser" },
                    { value: "investor", label: "Investor" },
                    { value: "marketing", label: "Marketing" },
                    { value: "accounting", label: "Accounting" },
                    { value: "moneywords", label: "Money Words" },
                    { value: "risk", label: "Risk" },
                  ],
                },
              ]}
            />
          </Card>
        </Section>

        <Section title="Roles & Visibility" desc="What each role can see in the platform.">
          <Card>
            <div className="space-y-3">
              {ROLE_ACCESS.map((r) => (
                <div key={r.role} className="flex items-start gap-3">
                  <div className="w-28 shrink-0">
                    <Badge tone={roleTone[r.role] ?? "default"}>{r.role}</Badge>
                  </div>
                  <p className="text-sm text-[var(--muted)]">{r.sees}</p>
                </div>
              ))}
            </div>
          </Card>
        </Section>
      </div>
    </>
  );
}
