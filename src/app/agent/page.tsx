import { Card, Stat, Section, Badge, Stars } from "@/components/ui";
import CallToggle from "@/components/portal/CallToggle";
import BidForm from "@/components/portal/BidForm";
import { usd } from "@/lib/format";

// AgentBid + AgentSeat tables are empty — inline sample data for the demo.
const sampleBids = [
  { zip: "78701", scope: "ZIP", bidCents: 4200, winning: true, cap: 10 },
  { zip: "33101", scope: "ZIP", bidCents: 3800, winning: true, cap: 8 },
  { zip: "85001", scope: "County", bidCents: 2900, winning: false, cap: 12 },
  { zip: "—", scope: "State · TX", bidCents: 2500, winning: false, cap: 25 },
];

// Agents see contact fields ONLY — never the AI journey / answers.
const sampleLeads = [
  { name: "Dorothy Hale", phone: "(512) 555-0142", email: "d.hale@example.com", dob: "1956-03-11", zip: "78701" },
  { name: "Earl Jenkins", phone: "(305) 555-0188", email: "earlj@example.com", dob: "1951-09-02", zip: "33101" },
  { name: "Marta Ruiz", phone: "(602) 555-0119", email: "mruiz@example.com", dob: "1958-12-24", zip: "85001" },
  { name: "Walter Boyd", phone: "(214) 555-0177", email: "wboyd@example.com", dob: "1949-06-30", zip: "75201" },
];

export default function AgentPortal() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Agent Portal</h1>
        <p className="text-sm text-[var(--muted)]">Bid for live calls, manage your seat, and work your CRM.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat label="My Calls Today" value="7" sub="3 connected" tone="up" />
        <Stat label="Avg $/Call" value={usd(3850)} sub="paid per connect" tone="gold" />
        <Stat label="Star Rating" value="4.6" sub="routing priority" />
        <Stat label="Seat Status" value="Active" sub="$99/mo · paid thru Jul 1" tone="up" />
      </div>

      <Section title="Availability" desc="Flip on to enter the live-call auction.">
        <div className="grid gap-4 md:grid-cols-2 items-center">
          <CallToggle />
          <Card>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Reputation</span>
              <Stars n={4.6} />
            </div>
            <p className="text-sm text-[var(--muted)] mt-2">
              Higher stars win call ties at equal bids and unlock premium ZIP scopes.
            </p>
          </Card>
        </div>
        <p className="text-xs text-[var(--muted)] mt-2">Wired next: real seat status from AgentSeat + live availability state.</p>
      </Section>

      <Section title="My Bids" desc="Pay-per-call auction. Highest active bid in scope wins the next call.">
        <Card className="!p-0 overflow-hidden">
          <table>
            <thead>
              <tr><th>ZIP</th><th>Scope</th><th className="text-right">My bid</th><th>Status</th><th className="text-right">Daily cap</th></tr>
            </thead>
            <tbody>
              {sampleBids.map((b, i) => (
                <tr key={i}>
                  <td className="font-medium">{b.zip}</td>
                  <td className="text-[var(--muted)]">{b.scope}</td>
                  <td className="text-right font-medium">{usd(b.bidCents)}</td>
                  <td>{b.winning ? <Badge tone="up">Winning</Badge> : <Badge tone="down">Outbid</Badge>}</td>
                  <td className="text-right text-[var(--muted)]">{b.cap}/day</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <p className="text-xs text-[var(--muted)] mt-2">Wired next: AgentBid table (currently empty) + live auction settlement.</p>
      </Section>

      <Section title="Place / Update a Bid" desc="Minimum bid is $25 per call.">
        <BidForm />
      </Section>

      <Section title="My Leads CRM" desc="Your assigned contacts. Appended data is shared after the fact.">
        <Card className="!p-0 overflow-hidden">
          <table>
            <thead>
              <tr><th>Name</th><th>Phone</th><th>Email</th><th>DOB</th><th>ZIP</th></tr>
            </thead>
            <tbody>
              {sampleLeads.map((l, i) => (
                <tr key={i}>
                  <td className="font-medium">{l.name}</td>
                  <td>{l.phone}</td>
                  <td className="text-[var(--muted)]">{l.email}</td>
                  <td className="text-[var(--muted)]">{l.dob}</td>
                  <td>{l.zip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <p className="text-xs text-[var(--muted)] mt-2">
          Agents see contact details only — the AI qualification journey stays internal. Datamoon-appended
          data (income, home value, etc.) is shared back after the call. Wired next: real assigned Leads filtered by agentId.
        </p>
      </Section>
    </>
  );
}
