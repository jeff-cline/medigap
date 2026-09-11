"use client";

import { useState } from "react";
import Link from "next/link";
import { SMS_CONSENT_TEXT } from "@/lib/mammo";
import { MammoHeader, MammoFooter } from "@/components/mammo/Chrome";

export default function MammoSignup() {
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", phone: "", zip: "", password: "" });
  const [smsOptIn, setSms] = useState(false);
  const [emailOptIn, setEmail] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    const res = await fetch("/api/mammo/register", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...f, smsOptIn, emailOptIn }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErr(d?.error ?? "Could not create your account."); return; }
    window.location.assign("/account");
  }

  const input = "w-full rounded-xl border-2 border-[#2E1065]/15 px-4 py-3 text-[#2E1065] focus:outline-none focus:border-[#7C3AED]";
  const label = "block text-sm font-black text-[#2E1065] mb-1.5";

  return (
    <>
      <MammoHeader />
      <main className="bg-white text-[#2E1065] min-h-[70vh]">
        <div className="max-w-lg mx-auto px-4 py-14 md:py-20">
          <h1 className="text-4xl font-black tracking-tight mb-2">Create your account</h1>
          <p className="text-lg text-[#2E1065]/70 mb-8">
            About a minute. Then pick a location and a time that suits you.
          </p>

          <form onSubmit={submit} className="space-y-5">
            {err && (
              <p className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-bold">
                {err}{" "}
                <Link href="/login" className="underline">Sign in instead</Link>
              </p>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={label} htmlFor="fn">First name</label>
                <input id="fn" required value={f.firstName} onChange={set("firstName")} className={input} autoComplete="given-name" />
              </div>
              <div>
                <label className={label} htmlFor="ln">Last name</label>
                <input id="ln" required value={f.lastName} onChange={set("lastName")} className={input} autoComplete="family-name" />
              </div>
            </div>
            <div>
              <label className={label} htmlFor="em">Email</label>
              <input id="em" type="email" required value={f.email} onChange={set("email")} className={input} autoComplete="email" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={label} htmlFor="ph">Mobile number</label>
                <input id="ph" value={f.phone} onChange={set("phone")} className={input} autoComplete="tel" placeholder="(555) 555-5555" />
              </div>
              <div>
                <label className={label} htmlFor="zp">ZIP code</label>
                <input id="zp" inputMode="numeric" maxLength={5} required value={f.zip}
                  onChange={(e) => setF({ ...f, zip: e.target.value.replace(/\D/g, "").slice(0, 5) })}
                  className={input} autoComplete="postal-code" />
                <p className="mt-1.5 text-xs text-[#2E1065]/55">So we can show the closest locations.</p>
              </div>
            </div>
            <div>
              <label className={label} htmlFor="pw">Password</label>
              <input id="pw" type="password" required minLength={9} value={f.password} onChange={set("password")} className={input} autoComplete="new-password" />
              <p className="mt-1.5 text-xs text-[#2E1065]/55">At least 9 characters.</p>
            </div>

            <div className="rounded-2xl bg-[#F3EEFF] p-5 space-y-4">
              <p className="text-sm font-black">Reminders — entirely your choice</p>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={emailOptIn} onChange={(e) => setEmail(e.target.checked)}
                  className="w-5 h-5 rounded accent-[#7C3AED] mt-0.5 shrink-0" />
                <span className="text-sm text-[#2E1065]/85">Email me when my next screening is due.</span>
              </label>
              {/* Unticked by default and separate from the email box — consent
                  has to be express and unbundled to be worth anything. */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={smsOptIn} onChange={(e) => setSms(e.target.checked)}
                  className="w-5 h-5 rounded accent-[#7C3AED] mt-0.5 shrink-0" />
                <span className="text-sm text-[#2E1065]/85">
                  Text me reminders too.
                  <span className="block text-[11px] text-[#2E1065]/60 mt-1 leading-relaxed">{SMS_CONSENT_TEXT}</span>
                </span>
              </label>
              {smsOptIn && !f.phone && (
                <p className="text-xs font-bold text-[#B8391A]">Add your mobile number above so we can text you.</p>
              )}
            </div>

            <button type="submit" disabled={busy}
              className="w-full rounded-2xl bg-[#7C3AED] hover:bg-[#5B21B6] disabled:opacity-60 text-white font-black py-4 text-lg transition-colors">
              {busy ? "Creating your account…" : "Create my account →"}
            </button>
            <p className="text-center text-sm text-[#2E1065]/70">
              Already have an account? <Link href="/login" className="font-bold text-[#6D28D9] hover:underline">Sign in</Link>
            </p>
          </form>
        </div>
      </main>
      <MammoFooter />
    </>
  );
}
