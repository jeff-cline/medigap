import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getRecaptchaConfig, isRecaptchaEnabled, recaptchaBreakerState } from "@/lib/recaptcha";
import { PUBLIC_FORM_ENDPOINTS } from "@/lib/public-forms";
import { reviewMailbox, REVIEW_INBOX } from "@/lib/spam-inbox";
import SpamInbox from "@/components/SpamInbox";

export const dynamic = "force-dynamic";

const since = (days: number) => new Date(Date.now() - days * 86_400_000);

export default async function FormSpamPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "god") redirect("/dashboard");

  const cfg = await getRecaptchaConfig();
  const on = isRecaptchaEnabled(cfg);
  const breaker = recaptchaBreakerState();

  const [recent, byForm, bySource, total24, total7] = await Promise.all([
    db.spamBlock.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    db.spamBlock.groupBy({ by: ["form"], _count: { _all: true }, where: { createdAt: { gte: since(7) } } }),
    db.spamBlock.groupBy({ by: ["source"], _count: { _all: true }, where: { createdAt: { gte: since(7) } } }),
    db.spamBlock.count({ where: { createdAt: { gte: since(1) }, source: { not: "recaptcha-pass" } } }),
    db.spamBlock.count({ where: { createdAt: { gte: since(7) }, source: { not: "recaptcha-pass" } } }),
  ]);

  const passes = recent.filter((r) => r.source === "recaptcha-pass" && typeof r.score === "number");
  const blocks = recent.filter((r) => r.source !== "recaptcha-pass");
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const passAvg = avg(passes.map((p) => p.score as number));
  const blockScores = blocks.map((b) => b.score).filter((s): s is number => typeof s === "number");
  const blockAvg = avg(blockScores);

  const seenForms = new Set(byForm.map((f) => f.form));
  const mb = await reviewMailbox();

  return (
    <div className="p-6 max-w-6xl">
      <h1 className="text-2xl font-semibold">Form spam</h1>
      <p className="text-sm text-[var(--muted)] mt-1">
        Every submission the Core refused, and why. If spam is still reaching you, the form it came
        from is missing from the protected list below — forward it to the review inbox and it gets
        wired up.
      </p>

      {/* status */}
      <div className="mt-5 rounded-lg border p-4" style={{ borderColor: on ? "var(--brand)" : "var(--danger)" }}>
        {!on ? (
          <p className="text-sm">
            <b>reCAPTCHA is not configured.</b> Only the content heuristics are running. Add your
            two keys at <a className="underline" href="/dashboard/integrations">Integrations → reCAPTCHA</a>.
          </p>
        ) : cfg.mode === "monitor" ? (
          <p className="text-sm">
            <b>Monitor mode — nothing is being blocked by reCAPTCHA.</b> Verdicts are being recorded
            so you can check them. Real submissions should score well above {cfg.minScore}; bots well
            below. When the numbers look right, switch Enforcement to <b>Enforce</b> in Integrations.
          </p>
        ) : breaker.open ? (
          <p className="text-sm">
            <b>Enforcement suspended automatically.</b> reCAPTCHA has rejected{" "}
            {breaker.consecutiveFails} submissions in a row, which almost always means the SECRET
            KEY is wrong (Google cannot tell us that directly — a wrong key looks identical to a bad
            token). Nothing is being blocked by reCAPTCHA right now, so you are not losing leads.
            Re-check the secret key in{" "}
            <a className="underline" href="/dashboard/integrations">Integrations</a>; it clears
            itself the moment one submission passes.
          </p>
        ) : (
          <p className="text-sm">
            <b>Enforcing.</b> reCAPTCHA {cfg.version} · score floor {cfg.minScore}.
          </p>
        )}
      </div>

      {/* counters */}
      <div className="mt-5 grid gap-4 sm:grid-cols-4">
        {[
          ["Blocked — last 24h", String(total24)],
          ["Blocked — last 7d", String(total7)],
          ["Avg score, passed", passes.length ? passAvg.toFixed(2) : "—"],
          ["Avg score, blocked", blockScores.length ? blockAvg.toFixed(2) : "—"],
        ].map(([label, val]) => (
          <div key={label} className="rounded-lg border border-[var(--line)] p-4">
            <div className="text-2xl font-semibold tabular-nums">{val}</div>
            <div className="text-xs text-[var(--muted)]">{label}</div>
          </div>
        ))}
      </div>

      {/* the forward-it-to-me inbox */}
      <h2 className="mt-8 text-lg font-semibold">Spam review inbox</h2>
      {!mb && (
        <p className="mt-1 text-sm" style={{ color: "var(--danger)" }}>
          {REVIEW_INBOX} is not in the Zapmail mailbox list yet — open Integrations → Zapmail and
          re-sync mailboxes, then reserve it.
        </p>
      )}
      <SpamInbox address={mb?.email ?? REVIEW_INBOX} />

      {/* coverage */}
      <h2 className="mt-8 text-lg font-semibold">Protected forms</h2>
      <p className="text-sm text-[var(--muted)] mt-1">
        These endpoints run the guard. Anything not on this list is unprotected — that is the list
        to check first when spam gets through.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {PUBLIC_FORM_ENDPOINTS.map((e) => {
          const id = e.replace(/^\/api\//, "").replace(/[^a-zA-Z0-9_]/g, "_");
          return (
            <span key={e} className="rounded-full border border-[var(--line)] px-3 py-1 text-xs">
              {e}{seenForms.has(id) ? " ✓" : ""}
            </span>
          );
        })}
      </div>

      {/* breakdown */}
      {byForm.length > 0 && (
        <>
          <h2 className="mt-8 text-lg font-semibold">Last 7 days</h2>
          <div className="mt-3 grid gap-6 sm:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-wide text-[var(--muted)] mb-2">By form</div>
              <ul className="text-sm space-y-1">
                {byForm.sort((a, b) => b._count._all - a._count._all).map((f) => (
                  <li key={f.form} className="flex justify-between gap-4 border-b border-[var(--line)] py-1">
                    <span>{f.form || "—"}</span><span className="tabular-nums">{f._count._all}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-[var(--muted)] mb-2">By reason</div>
              <ul className="text-sm space-y-1">
                {bySource.sort((a, b) => b._count._all - a._count._all).map((f) => (
                  <li key={f.source} className="flex justify-between gap-4 border-b border-[var(--line)] py-1">
                    <span>{f.source || "—"}</span><span className="tabular-nums">{f._count._all}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      {/* log */}
      <h2 className="mt-8 text-lg font-semibold">Most recent</h2>
      {recent.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--muted)]">Nothing recorded yet.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-[var(--muted)]">
              <tr>
                <th className="py-2 pr-4">When</th><th className="py-2 pr-4">Form</th>
                <th className="py-2 pr-4">Verdict</th><th className="py-2 pr-4">Score</th>
                <th className="py-2 pr-4">IP</th><th className="py-2">Submission</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id} className="border-t border-[var(--line)] align-top">
                  <td className="py-2 pr-4 whitespace-nowrap text-[var(--muted)]">
                    {new Date(r.createdAt).toLocaleString("en-US")}
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap">{r.form}</td>
                  <td className="py-2 pr-4">
                    <span style={{ color: r.source === "recaptcha-pass" ? "var(--brand)" : "var(--danger)" }}>
                      {r.source}
                    </span>
                    <div className="text-xs text-[var(--muted)]">{r.reason}</div>
                  </td>
                  <td className="py-2 pr-4 tabular-nums">{typeof r.score === "number" ? r.score.toFixed(2) : "—"}</td>
                  <td className="py-2 pr-4 whitespace-nowrap text-[var(--muted)]">{r.ip || "—"}</td>
                  <td className="py-2 text-xs text-[var(--muted)] break-all max-w-md">{r.payload}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
