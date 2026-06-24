import type { Metadata } from "next";
import "./agetech.css";

export const metadata: Metadata = {
  title: "R0cketShip — AgeTech Capital Platform",
  description: "An institutional-grade interactive thesis on monetizing the aging economy: the trusted relationship infrastructure for 10,000 Americans turning 65 every day.",
  openGraph: {
    title: "R0cketShip — AgeTech Capital Platform",
    description: "Building the trusted relationship infrastructure for the aging economy. Every acquisition strengthens the ecosystem.",
  },
};

// Standalone Rocketship-branded shell — intentionally NOT the medigap white-label shell.
export default function AgeTechLayout({ children }: { children: React.ReactNode }) {
  return <div className="ag-root">{children}</div>;
}
