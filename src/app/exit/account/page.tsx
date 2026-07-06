import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { EXIT, exitVars } from "@/lib/exit";
import { CALCULATORS } from "@/lib/calculators";
import { searchPhotos } from "@/lib/pexels";
import ExitNav from "@/components/exit/ExitNav";
import CalculatorSuite from "@/components/exit/CalculatorSuite";
import PartnerPanel from "@/components/exit/PartnerPanel";
import ExitFooter from "@/components/exit/ExitFooter";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: `Your Calculators | ${EXIT.brand}`, robots: { index: false } };
const O = EXIT.colors.orange;
const CATS: [string, string][] = [["service", "Service partners"], ["advertiser", "Featured advertisers"], ["adjacent", "Businesses that can help"]];

export default async function Account() {
  const s = await getSession();
  if (!s) redirect("/login");

  // Partner admins get their ad-management + leads panel instead of the calculators.
  if (s.role === "adpartner") {
    const partner = await db.calcPartner.findFirst({ where: { ownerId: s.uid } });
    const pAds = partner ? await db.calcAd.findMany({ where: { partnerId: partner.id }, include: { _count: { select: { clicks: true } } }, orderBy: { sortOrder: "asc" } }) : [];
    const clickRows = partner ? await db.calcAdClick.findMany({ where: { partnerId: partner.id }, orderBy: { at: "desc" }, take: 200 }) : [];
    const adTitle = new Map(pAds.map((a) => [a.id, a.title]));
    return (
      <div style={exitVars} className="text-white"><div style={{ background: EXIT.colors.bg }}>
        <ExitNav />
        <section className="mx-auto max-w-5xl px-6 py-10">
          <div className="text-xs font-bold uppercase tracking-widest" style={{ color: EXIT.colors.orange3 }}>Partner dashboard</div>
          <h1 className="mt-1 text-4xl font-black tracking-tight">{partner?.name || "Your business"}</h1>
          <p className="mt-2 text-slate-300">Manage your ad, upload an image, and see the leads your ad generates.</p>
          <div className="mt-6"><PartnerPanel partnerName={partner?.name || ""} ads={pAds.map((a) => ({ id: a.id, title: a.title, description: a.description, imageUrl: a.imageUrl, ctaLabel: a.ctaLabel, ctaUrl: a.ctaUrl, active: a.active, clicks: a._count.clicks }))} leads={clickRows.map((c) => ({ name: c.name, email: c.email, phone: c.phone, at: c.at.toISOString(), adTitle: adTitle.get(c.adId) || "" }))} /></div>
        </section>
        <ExitFooter />
      </div></div>
    );
  }

  const [imgs, ads] = await Promise.all([
    Promise.all(CALCULATORS.map((c) => searchPhotos(c.img, 1).then((p) => p[0]?.url || "").catch(() => ""))),
    db.calcAd.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }).catch(() => []),
  ]);
  const images = Object.fromEntries(CALCULATORS.map((c, i) => [c.slug, imgs[i]]));

  return (
    <div style={exitVars} className="text-white"><div style={{ background: EXIT.colors.bg }}>
      <ExitNav />
      <section className="mx-auto max-w-6xl px-6 pt-10 pb-2">
        <div className="text-xs font-bold uppercase tracking-widest" style={{ color: EXIT.colors.orange3 }}>Your account</div>
        <h1 className="mt-1 text-4xl font-black tracking-tight">Welcome{s.email ? `, ${s.email.split("@")[0]}` : ""} — your calculators are unlocked.</h1>
        <p className="mt-2 text-slate-300">Run any of the six calculators with full reports. Below, resources and partners that can help you get to a bigger exit.</p>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-6"><CalculatorSuite images={images} unlocked /></section>

      {/* PARTNER AD BLOCKS — one-for-many */}
      {CATS.map(([cat, label]) => {
        const list = ads.filter((a) => a.category === cat);
        if (list.length === 0) return null;
        return (
          <section key={cat} className="mx-auto max-w-6xl px-6 py-6">
            <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: EXIT.colors.orange3 }}>{label}</div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((a) => (
                <div key={a.id} className="rounded-2xl border overflow-hidden flex flex-col" style={{ borderColor: EXIT.colors.border, background: EXIT.colors.panel }}>
                  {a.imageUrl && /* eslint-disable-next-line @next/next/no-img-element */ <img src={a.imageUrl} alt={a.title} className="h-32 w-full object-cover" />}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="font-black">{a.title}</div>
                    <div className="text-sm text-slate-400 mt-1 flex-1">{a.description}</div>
                    <a href={`/api/calc/click?ad=${a.id}`} target="_blank" rel="noopener" className="mt-3 inline-flex justify-center rounded-md px-4 py-2.5 text-sm font-bold" style={{ background: O, color: EXIT.colors.bg }}>{a.ctaLabel || "Learn more"} →</a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
      {ads.length === 0 && <section className="mx-auto max-w-6xl px-6 py-6"><div className="rounded-xl border p-6 text-slate-400 text-sm" style={{ borderColor: EXIT.colors.border }}>Partner resources are being added — check back soon.</div></section>}

      <ExitFooter />
    </div></div>
  );
}
