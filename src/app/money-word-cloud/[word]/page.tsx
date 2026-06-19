import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import SiteFooter from "@/components/SiteFooter";
import MoneyWordSignup from "@/components/MoneyWordSignup";
import { db } from "@/lib/db";
import { usd2, fmtPhone } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MoneyWordLanding({ params }: { params: Promise<{ word: string }> }) {
  const { word: raw } = await params;
  const word = decodeURIComponent(raw).toLowerCase();

  const mw = await db.moneyWord.findFirst({ where: { word } });
  // Live CPC comes from DataForSEO once connected; until then use a sensible default.
  const ds = await db.integration.findUnique({ where: { key: "dataforseo" } }).catch(() => null);
  const cpcCents = 1500; // placeholder $15 CPC; replaced by live DataForSEO keyword CPC when connected
  const lowCallValue = cpcCents * 5; // "highest CPC × 5"
  const highCallValue = 7500; // $75 high-intent

  // Free demo lead tied to this money word.
  const demo = await db.lead.findFirst({
    where: { OR: [{ appended: { contains: word } }, { calls: { some: { moneyWord: { contains: word } } } }] },
    orderBy: { createdAt: "desc" },
    include: { calls: { where: { moneyWord: { contains: word } }, take: 1 } },
  });

  return (
    <>
      <PublicHeader />
      <section className="mx-auto max-w-5xl px-6 py-12">
        <Link href="/money-word-cloud" className="text-sm text-[var(--muted)] hover:text-[var(--brand)]">← Back to the cloud</Link>
        <div className="grid lg:grid-cols-2 gap-10 mt-4 items-start">
          <div>
            <div className="text-xs uppercase tracking-wide text-[var(--gold)]">Money Word</div>
            <h1 className="text-5xl font-extrabold text-gradient">{word}</h1>
            <p className="mt-4 text-lg text-[var(--muted)]">Based on our data, <b className="text-[var(--text)]">{word}</b> is a high-value, high-intent topic seniors are calling about{mw && mw.triggers > 0 ? <> — heard <b className="text-[var(--text)]">{mw.triggers}×</b> on our network so far</> : null}.</p>

            <div className="card p-5 mt-6">
              <div className="text-sm font-semibold mb-2">What a call is worth</div>
              <div className="flex items-end gap-6">
                <div><div className="text-3xl font-bold text-[var(--brand)]">{usd2(lowCallValue)}</div><div className="text-xs text-[var(--muted)]">typical (CPC × 5)</div></div>
                <div className="text-2xl text-[var(--muted)]">—</div>
                <div><div className="text-3xl font-bold text-[var(--gold)]">{usd2(highCallValue)}</div><div className="text-xs text-[var(--muted)]">high-intent call</div></div>
              </div>
              <p className="text-xs text-[var(--muted)] mt-3">{ds?.connected ? "Live keyword CPC via DataForSEO." : "CPC modeled — connect DataForSEO in the back office for live, keyword-exact pricing."}</p>
            </div>

            {demo && (
              <div className="card p-5 mt-4 border border-[var(--gold)]/30">
                <div className="text-xs uppercase tracking-wide text-[var(--gold)]">🎁 Free lead — demo</div>
                <div className="mt-1 font-semibold">{demo.name || "Senior caller"} · {[demo.city, demo.state, demo.zip].filter(Boolean).join(", ") || "—"}</div>
                <div className="text-sm text-[var(--muted)] mt-1">{fmtPhone(demo.phone)}</div>
                {demo.calls[0]?.transcript && <p className="text-sm text-[var(--muted)] mt-2 italic">&ldquo;…{(() => { try { const t = JSON.parse(demo.calls[0].transcript || "[]"); return t.filter((x: { role: string }) => x.role === "user").map((x: { text: string }) => x.text).join(" ").slice(0, 140); } catch { return word; } })()}…&rdquo;</p>}
                <p className="text-xs text-[var(--muted)] mt-2">This is what a real {word} lead looks like — claim the word to get the next one live.</p>
              </div>
            )}
          </div>

          <div className="lg:sticky lg:top-24">
            <MoneyWordSignup word={word} />
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
