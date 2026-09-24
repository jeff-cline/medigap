// quuik.com/change-the-world — interactive, real-time pitch deck for the R0cketShip proprietary network.
import { getCloud } from "@/lib/moneycloud";
import { readClicks, readEvents } from "@/lib/network-leads";
import { readQuestions } from "@/lib/quuik";
import Deck from "./Deck";

export const dynamic = "force-dynamic";
const OG = "https://quuik.com/api/quuik/og?t=Change%20the%20World%20%E2%80%94%20The%20R0cketShip%20Network";
export const metadata = {
  title: "Change the World — The R0cketShip Network | Quuik",
  description: "A rising tide lifts all boats. Inside the proprietary network of businesses building the future of the global economy — live and growing.",
  alternates: { canonical: "https://quuik.com/change-the-world" },
  openGraph: { type: "website", url: "https://quuik.com/change-the-world", siteName: "Quuik", title: "Change the World — The R0cketShip Network", description: "A rising tide lifts all boats. The proprietary network powering the future of the global economy.", images: [{ url: OG, width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Change the World — The R0cketShip Network", images: [OG] },
};

export default async function ChangeTheWorld() {
  const cloud = await getCloud();
  const entries = cloud.map((e) => ({ title: e.title, keyword: e.keyword, url: `https://el.ag/${encodeURIComponent(e.keyword)}`, favicon: e.favicon })).sort((a, b) => a.title.localeCompare(b.title));
  let clicks = 0, events = 0, questions = 0;
  try { clicks = readClicks(100000).length; } catch {}
  try { events = readEvents(100000).length; } catch {}
  try { questions = readQuestions(100000).length; } catch {}
  const initial = { businesses: entries.length + 4, networkSites: entries.length, signals: clicks + events + questions, clicks, events, questions, entries };
  return <Deck initial={initial} />;
}
