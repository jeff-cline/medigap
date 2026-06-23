import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import TrackingPixels from "@/components/TrackingPixels";
import { getCurrentSite } from "@/lib/site";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

// White-label the page <title>/description per hostname so a launched marketing
// site (e.g. parentingupward.org) shows its own branding in the browser tab and
// link previews — not the flagship medigap.plus name.
export async function generateMetadata(): Promise<Metadata> {
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
    };
  }
  const title = site.name;
  const description = site.heroHeadline || `${site.name} — caring, licensed specialists for every senior need. Call 1-800-MEDIGAP.`;
  return { title, description, openGraph: { title, description } };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Suspense fallback={null}><TrackingPixels /></Suspense>
        {children}
      </body>
    </html>
  );
}
