import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAccountSession } from "@/lib/equity/account";
import { getEquitySettings, telHref } from "@/lib/equity/settings";
import SignInForm from "./SignInForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Sign in | Equity Direct",
  robots: { index: false, follow: false },
};

export default async function SignInPage() {
  if (await getAccountSession()) redirect("/account");
  const { phone } = await getEquitySettings();

  return (
    <main className="eq-wrap eq-narrow" style={{ padding: "72px 24px 96px" }}>
      <h1 className="eq-h1" style={{ fontSize: "clamp(1.9rem,4vw,2.6rem)" }}>Sign in</h1>
      <p className="eq-lede" style={{ fontSize: "1rem" }}>
        No password. Give us the email address you used and we will send a link
        that signs you straight in.
      </p>
      <div style={{ marginTop: 32, maxWidth: 440 }}>
        <SignInForm />
      </div>
      <p style={{ marginTop: 26, fontSize: "0.88rem", color: "var(--slate)" }}>
        Not sure which address you used, or the email has not arrived? Call{" "}
        <a href={telHref(phone)} style={{ color: "var(--gold)", textDecoration: "underline" }}>
          {phone}
        </a>{" "}
        and we will sort it out.
      </p>
    </main>
  );
}
