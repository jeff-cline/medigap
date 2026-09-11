import type { Metadata } from "next";
import { cookies } from "next/headers";
import SiloShell from "@/components/silo/SiloShell";
import { MEDIGAP } from "@/lib/medigap-brand";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private Health Insurance Under 64 — 1-800-MEDIGAP",
  description: "Under 64? Private health insurance help from 1-800-MEDIGAP. Vote for your favorite ad or tell us which ad brought you here, then call the number that fits you best. 1-800-633-4427.",
  alternates: { canonical: `${MEDIGAP.url}/private-health-insurance` },
  openGraph: { title: "Private Health Insurance Under 64 — 1-800-MEDIGAP", description: "Under 64? Private health insurance help from 1-800-MEDIGAP.", url: `${MEDIGAP.url}/private-health-insurance`, type: "website" },
};

// Set to false when the TV campaign months are over — this hides the ad-voting section.
const SHOW_ADS = true;

// The three TV ads, each paired with the tracking number shown in that spot (order matches the
// three campaign numbers: Test A / B / C).
const ADS = [
  { id: "sVPVYAbscyg", tel: "13462203471", display: "(346) 220-3471" },
  { id: "UEjhba0es1E", tel: "18178031723", display: "(817) 803-1723" },
  { id: "Wk0OWf06RrY", tel: "15705325463", display: "(570) 532-5463" },
];

export default async function PrivateHealthInsurance({ searchParams }: { searchParams: Promise<{ voted?: string }> }) {
  const sp = await searchParams;
  const votedCookie = (await cookies()).get("mg_ad_voted")?.value || "";
  const voted = sp.voted || votedCookie; // which ad this visitor voted for (if any)

  return (
    <SiloShell path="private-health-insurance">
      <section className="mx-auto max-w-5xl px-5 py-10 md:py-14 text-center">
        {/* big clickable phone */}
        <a href={`tel:${MEDIGAP.tel}`} className="inline-flex items-center gap-3 text-4xl md:text-6xl font-extrabold tracking-tight" style={{ color: MEDIGAP.colors.brand }}>
          <span aria-hidden>📞</span> 1-800-<span style={{ color: MEDIGAP.colors.gold }}>MEDIGAP</span>
        </a>
        <div className="mt-2 text-lg font-semibold" style={{ color: MEDIGAP.colors.muted }}>{MEDIGAP.telDisplay} · free &amp; no pressure</div>

        {SHOW_ADS ? (
          <div id="ads" className="mt-10">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Please vote for your favorite ad</h1>
            <p className="mt-2 text-lg" style={{ color: MEDIGAP.colors.muted }}>Or tell us which ad brought you here.</p>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {ADS.map((a) => {
                const isVoted = voted === a.id;
                return (
                  <div key={a.id} className="rounded-2xl border border-[var(--border)] bg-white p-3 shadow-lg flex flex-col">
                    <div className="relative w-full overflow-hidden rounded-xl bg-black" style={{ paddingBottom: "56.25%" }}>
                      <iframe
                        className="absolute inset-0 h-full w-full"
                        src={`https://www.youtube.com/embed/${a.id}`}
                        title="1-800-MEDIGAP ad"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                    <a href={`tel:${a.tel}`} className="mt-3 inline-flex items-center justify-center gap-2 rounded-full px-5 py-4 text-xl font-extrabold text-white shadow" style={{ background: "#ea580c" }}>
                      <span aria-hidden>📞</span> {a.display}
                    </a>
                    {isVoted ? (
                      <div className="mt-2 rounded-full px-4 py-2 text-sm font-bold" style={{ color: MEDIGAP.colors.brand2, background: "#e9f7f1" }}>✓ Thanks for voting!</div>
                    ) : (
                      <form action="/api/ad-vote" method="post" className="mt-2">
                        <input type="hidden" name="ad" value={a.id} />
                        <button type="submit" className="w-full rounded-full border-2 px-4 py-2 text-sm font-bold" style={{ borderColor: MEDIGAP.colors.brand, color: MEDIGAP.colors.brand }}>
                          👍 Vote for this ad
                        </button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="mt-8 text-lg md:text-xl font-semibold">Please call the corresponding number to allow us to serve you best!</p>
          </div>
        ) : (
          <p className="mt-10 text-lg" style={{ color: MEDIGAP.colors.muted }}>
            Call <a href={`tel:${MEDIGAP.tel}`} className="font-bold" style={{ color: MEDIGAP.colors.brand }}>{MEDIGAP.telDisplay}</a> and a licensed specialist will help you find the right private health insurance.
          </p>
        )}
      </section>
      {/* Fire a Vibe "call_click" conversion on any tap of a phone number (uses the installed vbpx pixel). */}
      <script dangerouslySetInnerHTML={{ __html: `document.addEventListener('click',function(e){var t=e.target;var a=t&&t.closest?t.closest('a[href^="tel:"]'):null;if(a&&window.vbpx){window.vbpx('event','call_click');}},true);` }} />
    </SiloShell>
  );
}
