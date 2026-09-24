import type { Metadata } from "next";
import PlusNetwork from "@/components/plus/PlusNetwork";

export const metadata: Metadata = {
  title: "The Plus Network — a predictive-data roll-up anchored by 1-800-MEDIGAP",
  description:
    "One company consolidating R0cketShip's IP, a portfolio of top-of-funnel portals and controlled joint ventures — sitting in front of ~$9.8 trillion of U.S. demand. Raising $12M at $60M post.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "The Plus Network — powered by R0cketShip",
    description:
      "A predictive-data roll-up anchored by 1-800-MEDIGAP. ~$9.8T of demand, already revenue-positive.",
    type: "website",
  },
};

export default function PlusPage() {
  return <PlusNetwork />;
}
