import type { Metadata } from "next";
import Link from "next/link";
import SecretWeapon from "@/components/secret-weapon/SecretWeapon";
import { getCurrentSite } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getCurrentSite();
  const name = site?.name || "R0cketShip";
  const desc = "The little black book behind the empire: private executive advisory + proprietary growth technology, as one package. Built to double your revenue, then double it again. By application only.";
  return {
    title: `The Secret Weapon — ${name}`,
    description: desc,
    // Social share title is just "Secret Weapon".
    openGraph: { title: "Secret Weapon", description: desc },
    twitter: { card: "summary_large_image", title: "Secret Weapon", description: desc },
  };
}

export default async function SecretWeaponPage() {
  const site = await getCurrentSite();
  const brandName = site?.name || "R0cketShip";
  const style = site?.brandColor ? ({ "--brand": site.brandColor } as React.CSSProperties) : undefined;

  return (
    <div style={style} className={site ? "theme-light min-h-screen bg-[var(--bg)]" : "min-h-screen bg-[var(--bg)]"}>
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gradient">{site?.logoUrl ? <img src={site.logoUrl} alt={brandName} className="h-8 w-auto" /> : brandName}</Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/playbook" className="text-[var(--muted)] hover:text-[var(--text)]">← Playbook</Link>
            <a href="#apply" className="btn btn-brand !py-2">Apply</a>
          </div>
        </div>
      </header>

      {/* hero band */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 brand-gradient opacity-[0.06]" />
        <div className="mx-auto max-w-3xl px-6 py-16 text-center relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)]">🗝️ Private · by application only</div>
          <h1 className="mt-6 text-4xl md:text-6xl font-extrabold leading-[1.05]">The <span className="text-gradient">Secret Weapon.</span></h1>
          <p className="mt-5 text-lg text-[var(--muted)]">The little black book behind the empire — executive advisory and proprietary growth technology, as one package. Built to double your revenue, then double it again.</p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-14">
        <SecretWeapon />
      </main>

      <footer className="border-t border-[var(--border)] bg-[var(--panel)]">
        <div className="mx-auto max-w-7xl px-6 py-8 text-xs text-[var(--muted)]">
          © 2026 {brandName} · The Secret Weapon · Krystalore Crews × R0cketShip · powered by the Core. By application only.
        </div>
      </footer>
    </div>
  );
}
