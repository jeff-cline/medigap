import { db } from "@/lib/db";
import SettingsForm from "@/components/SettingsForm";

function bool(v: string | undefined, fallback = false) {
  if (v === undefined) return fallback;
  return v === "true" || v === "1";
}

function numv(v: string | undefined, fallback = 0) {
  if (v === undefined) return fallback;
  const n = parseFloat(v);
  return Number.isNaN(n) ? fallback : n;
}

export default async function SettingsPage() {
  const rows = await db.setting.findMany();
  const s: Record<string, string> = {};
  for (const r of rows) s[r.key] = r.value;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">
          God knobs. These drive the auction floor, the investor waterfall, the AI&apos;s autonomy, and signup approvals
          across the entire network.
        </p>
      </div>

      <SettingsForm
        minCallBidCents={numv(s.minCallBidCents, 2500)}
        mgmtFeePct={numv(s.mgmtFeePct, 2)}
        profitSharePct={numv(s.profitSharePct, 50)}
        aiFeePct={numv(s.aiFeePct, 0)}
        futureProofingPct={numv(s.futureProofingPct, 5)}
        investorPct={numv(s.investorPct, 100)}
        arbitrageTarget={numv(s.arbitrageTarget, 3.0)}
        autonomousMode={s.autonomousMode ?? "learning"}
        autoApproveAgent={bool(s.autoApproveAgent, true)}
        autoApproveAdvertiser={bool(s.autoApproveAdvertiser, true)}
        autoApproveInvestor={bool(s.autoApproveInvestor, false)}
        defaultCallPriceCents={numv(s.defaultCallPriceCents, 7744)}
        defaultForwardNumber={s.defaultForwardNumber ?? "9728006670"}
        showUnrealized={bool(s.showUnrealized, true)}
        callWhisper={bool(s.callWhisper, true)}
        leadPriceCents={numv(s.leadPriceCents, 1500)}
        seatZipCents={numv(s.seatZipCents, 9900)}
        seatStateCents={numv(s.seatStateCents, 49900)}
        seatNationalCents={numv(s.seatNationalCents, 199900)}
      />
    </>
  );
}
