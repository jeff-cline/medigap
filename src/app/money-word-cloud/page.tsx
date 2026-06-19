import PublicHeader from "@/components/PublicHeader";
import SiteFooter from "@/components/SiteFooter";
import MoneyWordCloud from "@/components/MoneyWordCloud";
import { db } from "@/lib/db";
import { TOLLFREE_TEL, TOLLFREE } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Money Word Cloud — Live high-intent senior call demand", description: "See the real topics seniors are calling about right now. Bigger words = hotter demand. Claim your area and start receiving live hot-transfer calls." };

export default async function MoneyWordCloudPage() {
  const words = await db.moneyWord.findMany({ where: { active: true }, orderBy: { triggers: "desc" }, select: { word: true, triggers: true } });

  return (
    <>
      <PublicHeader />
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 brand-gradient opacity-[0.06]" />
        <div className="mx-auto max-w-5xl px-6 py-16 text-center relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)]"><span className="live-dot text-[var(--brand)]">●</span> Live demand from real senior calls</div>
          <h1 className="mt-5 text-4xl md:text-5xl font-extrabold">The <span className="text-gradient">Money Word Cloud</span></h1>
          <p className="mt-4 text-lg text-[var(--muted)] max-w-2xl mx-auto">These are the topics seniors are calling about right now on our network. The bigger the word, the more it&apos;s being asked for. Click any word to claim it in your area.</p>
        </div>
        <div className="mx-auto max-w-5xl px-6 pb-12">
          <div className="card p-6 glow">
            <MoneyWordCloud words={words} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12 text-center">
        <h2 className="text-2xl font-bold">Turn a word into live calls</h2>
        <p className="mt-2 text-[var(--muted)] max-w-2xl mx-auto">Pick a money word, claim your ZIP, city, or state, and we&apos;ll hot-transfer matching callers straight to your phone — you only pay for calls you take.</p>
        <a href={`tel:${TOLLFREE_TEL}`} className="btn btn-brand text-base mt-6">📞 Questions? Call {TOLLFREE}</a>
      </section>
      <SiteFooter />
    </>
  );
}
