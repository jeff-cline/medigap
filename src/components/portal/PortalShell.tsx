"use client";
import Link from "next/link";
import ImpersonationBar from "@/components/ImpersonationBar";

export default function PortalShell({
  title,
  email,
  impersonator,
  children,
}: {
  title: string;
  email: string;
  impersonator?: string;
  children: React.ReactNode;
}) {
  async function signOut() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <div className="min-h-screen">
      {impersonator && <ImpersonationBar email={email} impersonator={impersonator} />}
      <header className="border-b border-[var(--border)] bg-[var(--panel)]/60 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3 min-w-0">
            <Link href="/" className="text-lg font-extrabold text-gradient whitespace-nowrap">
              medigap.plus
            </Link>
            <span className="text-[var(--border)]">/</span>
            <span className="text-sm font-medium text-[var(--muted)] truncate">{title}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:inline text-xs text-[var(--muted)] truncate max-w-[180px]">{email}</span>
            <button onClick={signOut} className="btn btn-ghost !py-1.5 text-sm" type="button">
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
