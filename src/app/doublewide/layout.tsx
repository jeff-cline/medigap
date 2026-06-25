import type { Metadata } from "next";
import "./doublewide.css";

export const metadata: Metadata = {
  title: "Doublewide Media — Micro-Influencers, Monetized",
  description: "The media company for the micro-influencer era. Brands reach engaged audiences; creators get paid on every lead and sale across the network. Powered by the R0cketShip Core.",
  openGraph: {
    title: "Doublewide Media — Micro-Influencers, Monetized",
    description: "Brands reach engaged audiences. Creators get paid across the network. Powered by the R0cketShip Core.",
  },
};

export default function DoublewideLayout({ children }: { children: React.ReactNode }) {
  return <div className="dw-root">{children}</div>;
}
