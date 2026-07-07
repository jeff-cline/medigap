import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import { headers } from "next/headers";
import "./globals.css";
import { Suspense } from "react";
import TrackingPixels from "@/components/TrackingPixels";
import { getCurrentSite } from "@/lib/site";
import { adsenseEnabledForHost, adsensePubIdForHost } from "@/lib/adsense";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

// White-label the page <title>/description per hostname so a launched marketing
// site (e.g. parentingupward.org) shows its own branding in the browser tab and
// link previews — not the flagship medigap.plus name.
// Search-engine + service site verification (inherits to every page) for 1-800-medigap.com.
const verification: Metadata["verification"] = { other: {
  "msvalidate.01": "D36F7E15FF2EF906474C38F156CB9E36", // Bing/Microsoft
  "fo-verify": "839e9313-acfc-43b9-9239-18cf69d333a3",
} };

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host") || "";
  const adsPub = (await adsenseEnabledForHost(host)) ? await adsensePubIdForHost(host) : "";
  // google-adsense-account meta = the static verification signal the AdSense crawler reads.
  const ver: Metadata["verification"] = adsPub
    ? { other: { ...(verification!.other as Record<string, string>), "google-adsense-account": adsPub } }
    : verification;
  // 🚀 favicon for exitoptimization.com (R0cketShip brand).
  const icons: Metadata["icons"] = (host.includes("exitoptimization") || host.includes("experientialmarketing"))
    ? { icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%9A%80%3C/text%3E%3C/svg%3E" }
    : undefined;
  const site = await getCurrentSite();
  if (!site) {
    return {
      title: "medigap.plus — The Senior Marketing Network",
      description:
        "Medicare, Medicare Advantage, supplements, senior housing, senior care and Alzheimer's care — one trusted network. Call 1-800-MEDIGAP.",
      openGraph: {
        title: "medigap.plus — The Senior Marketing Network",
        description: "One network for every over-65 product. Call 1-800-MEDIGAP.",
      },
      verification: ver,
      icons,
    };
  }
  const title = site.name;
  const description = site.heroHeadline || `${site.name} — caring, licensed specialists for every senior need. Call 1-800-MEDIGAP.`;
  return { title, description, openGraph: { title, description }, verification: ver, icons };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const host = (await headers()).get("host") || "";
  const showAds = await adsenseEnabledForHost(host);
  const pubId = showAds ? await adsensePubIdForHost(host) : "";
  const pixelId = host.includes("exitoptimization") ? "exit-optimization" : "1-800-medigap";
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {showAds && pubId && (
          <Script id="adsbygoogle-init" async strategy="afterInteractive" crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pubId}`} />
        )}
        {/* PredictiveData visitor pixel — global, identifies/enriches visitors into the Core CRM. */}
        <Script id="predictivedata-pixel" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html:
          `(function(s, p, i, c, e) {
    s[e] = s[e] || function() { (s[e].a = s[e].a || []).push(arguments); };
    s[e].l = 1 * new Date();
    var t = new Date().getTime();
    var k = c.createElement("script"), a = c.getElementsByTagName("script")[0];
    k.async = 1, k.src = p + "?request_id=" + i + "&t=" + t, a.parentNode.insertBefore(k, a);
    s.pixelClientId = i;
})(window, "https://predictivedata.org/script", "${pixelId}", document, "script");` }} />
        <Suspense fallback={null}><TrackingPixels /></Suspense>
        {children}
      </body>
    </html>
  );
}
