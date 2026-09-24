"use client";

import { useState } from "react";
import Link from "next/link";
import { SMS_CONSENT_TEXT } from "@/lib/mammo";
import { MammoHeader, MammoFooter } from "@/components/mammo/Chrome";

// Two steps, because five fields and a consent block is a long scroll on a
// phone. Step one is captured as a lead the moment it is submitted, so an
// abandoned signup is still someone we can reach.
export default function MammoSignup() {
  const [step, setStep] = useState<1 | 2>(1);
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", phone: "", zip: "", password: "" });
  // Default ON, per Jeff. Unticking is one tap.
  const [smsOptIn, setSms] = useState(true);
  const [emailOptIn, setEmail] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.value });

  async function goToStepTwo(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    // Fire-and-continue: capturing the lead must never block them advancing.
    fetch("/api/mammo/lead", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ firstName: f.firstName, lastName: f.lastName, email: f.email, phone: f.phone, zip: f.zip }),
    }).catch(() => {});
    setBusy(false);
    setStep(2);
  }

  async function finish(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    const res = await fetch("/api/mammo/register", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...f, smsOptIn, emailOptIn }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErr(d?.error ?? "Could not create your account."); return; }
    window.location.assign("/schedule");
  }

  const label = "block text-sm font-black text-[#2E1065] mb-1.5";

  return (
    <>
      <MammoHeader />
      <main className="bg-white text-[#2E1065] min-h-[70vh]">
        <div className="max-w-md mx-auto px-4 py-10 md:py-16">


          {/* progress */}
          <div className="flex items-center gap-3 mb-7">
            {[1, 2].map((n) => (
              <div key={n} className="flex items-center gap-3 flex-1">
                <span className={`w-8 h-8 rounded-full grid place-items-center font-black text-sm shrink-0 ${
                  step >= n ? "bg-[#7C3AED] text-white" : "bg-[#F3EEFF] text-[#7C3AED]"}`}>
                  {n}
                </span>
                <span className={`h-1 rounded-full flex-1 ${step > n ? "bg-[#7C3AED]" : "bg-[#F3EEFF]"}`} />
              </div>
            ))}
          </div>

          {step === 1 ? (
            <>
              <h1 className="text-3xl font-black tracking-tight mb-2">Let&rsquo;s start with you</h1>
              <p className="text-[#2E1065]/70 mb-7">Takes about thirty seconds.</p>

              <form onSubmit={goToStepTwo} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={label} htmlFor="fn">First name</label>
                    <input id="fn" required value={f.firstName} onChange={set("firstName")} autoComplete="given-name" />
                  </div>
                  <div>
                    <label className={label} htmlFor="ln">Last name</label>
                    <input id="ln" required value={f.lastName} onChange={set("lastName")} autoComplete="family-name" />
                  </div>
                </div>
                <div>
                  <label className={label} htmlFor="em">Email</label>
                  <input id="em" type="email" required value={f.email} onChange={set("email")} autoComplete="email" inputMode="email" />
                </div>
                <div>
                  <label className={label} htmlFor="ph">Mobile number</label>
                  <input id="ph" type="tel" required value={f.phone} onChange={set("phone")} autoComplete="tel" inputMode="tel" placeholder="(555) 555-5555" />
                </div>
                <div>
                  <label className={label} htmlFor="zp">ZIP code</label>
                  <input id="zp" inputMode="numeric" maxLength={5} required value={f.zip}
                    onChange={(e) => setF({ ...f, zip: e.target.value.replace(/\D/g, "").slice(0, 5) })}
                    autoComplete="postal-code" />
                  <p className="mt-1.5 text-xs text-[#2E1065]/55">So we can show the closest locations.</p>
                </div>

                <button type="submit" disabled={busy}
                  className="w-full rounded-2xl bg-[#7C3AED] hover:bg-[#5B21B6] disabled:opacity-60 text-white font-black py-4 text-lg transition-colors">
                  Continue →
                </button>
                <p className="text-center text-sm text-[#2E1065]/70">
                  Already have an account? <Link href="/login" className="font-bold text-[#6D28D9] hover:underline">Sign in</Link>
                </p>
              </form>
            </>
          ) : (
            <>
              <button onClick={() => { setStep(1); setErr(null); }}
                className="text-sm font-bold text-[#6D28D9] hover:underline mb-4">← Back</button>
              <h1 className="text-3xl font-black tracking-tight mb-2">Almost there, {f.firstName}</h1>
              <p className="text-[#2E1065]/70 mb-7">Pick a password and choose your reminders.</p>

              <form onSubmit={finish} className="space-y-4">
                {err && <p className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-bold">{err}</p>}

                <div>
                  <label className={label} htmlFor="pw">Password</label>
                  <input id="pw" type="password" required minLength={9} value={f.password}
                    onChange={set("password")} autoComplete="new-password" />
                  <p className="mt-1.5 text-xs text-[#2E1065]/55">At least 9 characters.</p>
                </div>

                <div className="rounded-2xl bg-white border-2 border-[#7C3AED]/35 p-5 space-y-4">
                  <p className="text-sm font-black">Reminders</p>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={smsOptIn} onChange={(e) => setSms(e.target.checked)} />
                    <span className="text-sm text-[#2E1065]/85">
                      Text me my screening reminders and other timely health reminders.
                      <span className="block text-[11px] text-[#2E1065]/60 mt-1 leading-relaxed">{SMS_CONSENT_TEXT}</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={emailOptIn} onChange={(e) => setEmail(e.target.checked)} />
                    <span className="text-sm text-[#2E1065]/85">Email me when my next screening is due.</span>
                  </label>

                  <p className="text-[11px] text-[#2E1065]/50">
                    Untick either one if you would rather not. You can change this any time, and
                    replying STOP to a text stops them immediately.
                  </p>
                </div>

                <button type="submit" disabled={busy}
                  className="w-full rounded-2xl bg-[#7C3AED] hover:bg-[#5B21B6] disabled:opacity-60 text-white font-black py-4 text-lg transition-colors">
                  {busy ? "Creating your account…" : "Create my account →"}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
      <MammoFooter />
    </>
  );
}
