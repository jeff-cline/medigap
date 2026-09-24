import QuuikBox from "./QuuikBox";
import SiteFooter from "@/components/quuik/SiteFooter";

export const dynamic = "force-dynamic";
export const viewport = { themeColor: "#F5821F" };
export const metadata = {
  metadataBase: new URL("https://quuik.com"),
  title: "Validated & Trusted GPT Answer Engine · Quuik",
  description: "Quuik Answers is a trusted, validated answer engine that saves time and money — sitting on top of a proprietary network of businesses working together to leverage technology for good. AI that saves time & money across the ecosystem while safeguarding our families and businesses.",
  manifest: "/quuik-assets/manifest.webmanifest",
  icons: { icon: "/quuik-assets/favicon.png", apple: "/quuik-assets/apple-180.png" },
  appleWebApp: { capable: true, title: "Quuik", statusBarStyle: "default" as const },
  openGraph: {
    type: "website",
    url: "https://quuik.com/",
    siteName: "Quuik",
    title: "Quuik Answers — Validated & Trusted GPT Answer Engine",
    description: "A trusted, validated answer engine that saves time and money across a proprietary network of businesses leveraging technology for good.",
    images: [{ url: "/quuik-assets/og-quuik.png", width: 1200, height: 630, alt: "Quuik Answers" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Quuik Answers — Validated & Trusted GPT Answer Engine",
    description: "A trusted, validated answer engine that saves time and money.",
    images: ["/quuik-assets/og-quuik.png"],
  },
};

export default function QuuikHome() {
  return (<><QuuikBox /><SiteFooter variant="stripOnly" /></>);
}
