import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "medigap.plus — The Senior Marketing Network",
  description:
    "Medicare, Medicare Advantage, supplements, senior housing, senior care and Alzheimer's care — one trusted network. Call 1-800-MEDIGAP.",
  openGraph: {
    title: "medigap.plus — The Senior Marketing Network",
    description: "One network for every over-65 product. Call 1-800-MEDIGAP.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
